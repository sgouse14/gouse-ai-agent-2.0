import { signOut } from 'firebase/auth';
import { firebaseAuth } from './firebase';

const PROJECT_SCOPED_API_PATHS = new Set([
  '/api/chat',
  '/api/intelligence',
  '/api/boq/generate',
  '/api/architecture/render-prompt',
  '/api/architecture/analyze-image',
  '/api/enquiries/live-quote',
  '/api/materials/parse-pdf-specs',
]);

/** Attach a Firebase ID token; the server independently checks any project ID. */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  projectId?: string,
): Promise<Response> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error('Sign in before using the Gouse AI API.');

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', 'Bearer ' + token);

  let path: string;
  try {
    const value = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    path = new URL(value, window.location.origin).pathname;
  } catch {
    throw new Error('Invalid API request URL.');
  }

  if (PROJECT_SCOPED_API_PATHS.has(path)) {
    let activeProjectId = projectId;
    if (!activeProjectId) {
      try {
        activeProjectId = window.localStorage.getItem('gouse_ai_active_project_id') || undefined;
      } catch {
        activeProjectId = undefined;
      }
    }
    if (activeProjectId) headers.set('X-Project-ID', activeProjectId);
  } else if (projectId) {
    headers.set('X-Project-ID', projectId);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    // Never retry protected requests with a rejected session.
    await signOut(firebaseAuth).catch(() => undefined);
  }
  return response;
}
