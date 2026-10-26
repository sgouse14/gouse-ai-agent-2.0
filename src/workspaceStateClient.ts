import { apiFetch } from './apiClient';

export type WorkspaceDomain = 'projects' | 'boqItems' | 'professionals' | 'enquiries' | 'preferences';
export interface WorkspaceSnapshot<T = unknown> { data: T; version: string; }

export class WorkspaceApiError extends Error {
  constructor(public readonly code: 'not_found' | 'conflict' | 'unauthorized' | 'unavailable' | 'invalid', message: string) {
    super(message);
    this.name = 'WorkspaceApiError';
  }
}

export async function readWorkspaceDomain<T>(domain: WorkspaceDomain): Promise<WorkspaceSnapshot<T> | null> {
  let response: Response;
  try { response = await apiFetch('/api/workspace-state/' + encodeURIComponent(domain)); }
  catch { throw new WorkspaceApiError('unavailable', 'Could not reach shared workspace storage.'); }
  if (response.status === 404) return null;
  if (response.status === 401 || response.status === 403) throw new WorkspaceApiError('unauthorized', 'Sign-in or workspace access is required.');
  if (!response.ok) throw new WorkspaceApiError('unavailable', 'Shared workspace storage is unavailable.');
  const body = await response.json() as { data?: T; version?: string };
  if (!Object.prototype.hasOwnProperty.call(body, 'data') || typeof body.version !== 'string') {
    throw new WorkspaceApiError('unavailable', 'Shared workspace response was invalid.');
  }
  return { data: body.data as T, version: body.version };
}

export async function writeWorkspaceDomain<T>(
  domain: WorkspaceDomain,
  data: T,
  expectedVersion: string | null,
): Promise<{ version: string }> {
  let response: Response;
  try {
    response = await apiFetch('/api/workspace-state/' + encodeURIComponent(domain), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, expectedVersion }),
    });
  } catch {
    throw new WorkspaceApiError('unavailable', 'Could not reach shared workspace storage.');
  }
  if (response.status === 409) throw new WorkspaceApiError('conflict', 'Workspace changed in another session. Reload shared data before continuing.');
  if (response.status === 401 || response.status === 403) throw new WorkspaceApiError('unauthorized', 'Sign-in or workspace access is required.');
  if (response.status === 400 || response.status === 413) throw new WorkspaceApiError('invalid', 'Workspace data was rejected. Export your local data before retrying.');
  if (!response.ok) throw new WorkspaceApiError('unavailable', 'Shared workspace storage is unavailable.');
  const body = await response.json() as { version?: string };
  if (typeof body.version !== 'string') throw new WorkspaceApiError('unavailable', 'Shared workspace response was invalid.');
  return { version: body.version };
}
