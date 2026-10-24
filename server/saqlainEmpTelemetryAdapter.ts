import { constants } from 'node:fs';
import { open, realpath } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import {
  assessEmpResilience,
  type EmpProtectionAssessment,
  type EmpSignalSnapshot,
} from './saqlainEmpAttackProtector.ts';

const MAX_TELEMETRY_FILE_BYTES = 32 * 1024;
const MAX_ALLOWED_SOURCES = 1000;
const SOURCE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SNAPSHOT_KEYS = new Set([
  'sourceId',
  'observedAt',
  'sourceHealth',
  'explicitEmpAlarm',
  'powerQualityAlarmCount',
  'unexpectedRestartCount',
  'networkInterfaceFlapCount',
  'clockDriftMs',
  'telemetryGapCount',
]);

export interface SaqlainEmpTelemetryReaderOptions {
  /** Owner-configured local file written by a trusted server-side collector. */
  filePath: string;
  /** Exact telemetry source IDs approved by the deployment owner. */
  allowedSourceIds: readonly string[];
  now?: () => Date;
  maxBytes?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateSnapshot(value: unknown): EmpSignalSnapshot {
  if (!isRecord(value)) throw new Error('EMP telemetry snapshot must be a JSON object.');
  const keys = Object.keys(value);
  if (keys.length !== SNAPSHOT_KEYS.size || keys.some(key => !SNAPSHOT_KEYS.has(key))) {
    throw new Error('EMP telemetry snapshot has missing or unexpected fields.');
  }
  // The domain helper performs strict validation of each typed signal.
  return value as unknown as EmpSignalSnapshot;
}

function validateOptions(options: SaqlainEmpTelemetryReaderOptions): {
  filePath: string;
  allowedSourceIds: readonly string[];
  maxBytes: number;
} {
  if (!options || typeof options.filePath !== 'string' || !isAbsolute(options.filePath.trim())) {
    throw new Error('EMP telemetry file path must be an absolute path.');
  }
  if (!Array.isArray(options.allowedSourceIds) || options.allowedSourceIds.length < 1 ||
      options.allowedSourceIds.length > MAX_ALLOWED_SOURCES ||
      options.allowedSourceIds.some(sourceId => typeof sourceId !== 'string' || !SOURCE_ID_PATTERN.test(sourceId))) {
    throw new Error('An exact, non-empty EMP telemetry source allowlist is required.');
  }
  const maxBytes = options.maxBytes ?? MAX_TELEMETRY_FILE_BYTES;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_TELEMETRY_FILE_BYTES) {
    throw new Error('EMP telemetry file size limit must be between 1 and 32768 bytes.');
  }
  return {
    filePath: resolve(options.filePath.trim()),
    allowedSourceIds: Object.freeze([...new Set(options.allowedSourceIds)]),
    maxBytes,
  };
}

/**
 * Reads telemetry from an owner-provisioned local file, never from a public HTTP
 * request. It rejects symlinks, unsafe write permissions, unexpected schemas,
 * oversized data, and stale/unapproved source observations. The external collector
 * must independently authenticate its sources; a JSON sourceId is not proof itself.
 */
export function createSaqlainEmpTelemetryFileReader(options: SaqlainEmpTelemetryReaderOptions) {
  const config = validateOptions(options);
  const now = options.now ?? (() => new Date());

  async function read(): Promise<EmpProtectionAssessment> {
    let canonicalPath: string;
    try {
      canonicalPath = await realpath(config.filePath);
    } catch {
      throw new Error('Configured EMP telemetry file is unavailable.');
    }
    if (canonicalPath !== config.filePath) {
      throw new Error('EMP telemetry path must not contain symbolic-link path components.');
    }

    let handle: Awaited<ReturnType<typeof open>> | undefined;
    try {
      const noFollow = constants.O_NOFOLLOW;
      if (typeof noFollow !== 'number') {
        throw new Error('Platform does not support no-follow file opens for EMP telemetry.');
      }
      handle = await open(config.filePath, constants.O_RDONLY | noFollow);
      const info = await handle.stat();
      if (!info.isFile()) throw new Error('EMP telemetry path must be a regular file.');
      if (info.size < 1 || info.size > config.maxBytes) {
        throw new Error('EMP telemetry file is empty or exceeds its size limit.');
      }
      // Prevent an untrusted local group/world writer from changing the signal file.
      if ((info.mode & 0o022) !== 0) {
        throw new Error('EMP telemetry file must not be group-writable or world-writable.');
      }
      const bytes = await handle.readFile();
      if (bytes.byteLength > config.maxBytes) {
        throw new Error('EMP telemetry file grew beyond its size limit during read.');
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(bytes.toString('utf8')) as unknown;
      } catch {
        throw new Error('EMP telemetry file is not valid JSON.');
      }
      const snapshot = validateSnapshot(parsed);
      return assessEmpResilience(snapshot, {
        allowedSourceIds: config.allowedSourceIds,
        now,
      });
    } finally {
      await handle?.close().catch(() => undefined);
    }
  }

  return Object.freeze({ read, filePath: config.filePath });
}
