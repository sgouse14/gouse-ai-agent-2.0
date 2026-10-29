import { access, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readVerifiedAuditLog } from './saqlainAuditLog.ts';
import { SaqlainFirestoreRestClient } from './saqlainFirestoreRest.ts';
import { SaqlainFirestoreAuditLog } from './saqlainFirestoreAuditLog.ts';

export type SaqlainReadinessResult =
  | { ready: true }
  | { ready: false; dependency: 'configuration' | 'audit_storage_configuration' | 'durable_storage' };

export interface SaqlainReadinessOptions {
  env?: NodeJS.ProcessEnv;
  firestoreProbe?: () => Promise<void>;
  fileAuditProbe?: (path: string) => Promise<unknown>;
}

/**
 * Checks the configured Saqlain audit persistence path without returning
 * credential or infrastructure details. This is not a claim that all client
 * workspace data has been migrated off localStorage.
 */
export async function checkSaqlainReadiness(
  options: SaqlainReadinessOptions = {},
): Promise<SaqlainReadinessResult> {
  const env = options.env ?? process.env;
  const mode = env.SAQLAIN_AUDIT_BACKEND?.trim().toLowerCase() || 'file';

  if (mode !== 'file' && mode !== 'firestore') {
    return { ready: false, dependency: 'configuration' };
  }

  if (mode === 'firestore') {
    const projectId = env.GOOGLE_CLOUD_PROJECT?.trim() || env.FIREBASE_PROJECT_ID?.trim();
    if (!projectId) return { ready: false, dependency: 'durable_storage' };
    try {
      if (options.firestoreProbe) {
        await options.firestoreProbe();
      } else {
        const client = new SaqlainFirestoreRestClient({
          projectId,
          databaseId: env.FIRESTORE_DATABASE_ID?.trim() || '(default)',
        });
        // An absent probe document is acceptable; authentication, API, and
        // permission failures are surfaced as unavailable readiness.
        await client.getDocument('saqlainReadinessChecks', 'probe');
        await new SaqlainFirestoreAuditLog({ client }).readVerified();
      }
      return { ready: true };
    } catch {
      return { ready: false, dependency: 'durable_storage' };
    }
  }

  const auditPath = env.SAQLAIN_AUDIT_FILE?.trim();
  if (!auditPath) return { ready: false, dependency: 'audit_storage_configuration' };

  try {
    const resolved = resolve(auditPath);
    // Confirm the parent exists and is writable even before the first audit
    // event creates the file. Existing audit files must be readable/writable
    // and must pass hash-chain verification before the instance is ready.
    await access(dirname(resolved), constants.W_OK);
    try {
      const info = await stat(resolved);
      if (!info.isFile()) throw new Error('Audit path is not a regular file.');
      await access(resolved, constants.R_OK | constants.W_OK);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await (options.fileAuditProbe ?? readVerifiedAuditLog)(resolved);
    return { ready: true };
  } catch {
    return { ready: false, dependency: 'durable_storage' };
  }
}
