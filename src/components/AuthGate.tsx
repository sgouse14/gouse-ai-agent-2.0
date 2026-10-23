import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../firebase';

interface AuthGateProps { children: React.ReactNode; }

const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID,
);

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebaseConfigured) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(
      firebaseAuth,
      currentUser => {
        setUser(currentUser);
        setReady(true);
        setError('');
      },
      () => {
        setError('Firebase sign-in status could not be verified. Check the Firebase configuration.');
        setReady(true);
      },
    );
  }, []);

  async function handleSignIn(): Promise<void> {
    setBusy(true);
    setError('');
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut(): Promise<void> {
    setBusy(true);
    try {
      await signOut(firebaseAuth);
      setUser(null);
    } catch {
      setError('Sign-out failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
        <div className="text-center" role="status">
          <div className="text-amber-400 font-semibold">Saqlain Cyber Agent</div>
          <p className="mt-2 text-sm text-slate-400">Checking your sign-in session…</p>
        </div>
      </main>
    );
  }

  if (!firebaseConfigured) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900 p-6">
          <h1 className="text-xl font-semibold text-amber-300">Firebase sign-in is not configured</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN and VITE_FIREBASE_PROJECT_ID.
            The server also requires FIREBASE_PROJECT_ID and FIREBASE_WEB_API_KEY for the same Firebase project.
          </p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
        <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Gouse AI · Security boundary</div>
          <h1 className="mt-3 text-2xl font-bold">Sign in to continue</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Application APIs require an active Firebase identity. Project operations also require a server-managed project membership.
          </p>
          {error && <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{error}</p>}
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-amber-400 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Project-specific AI requests require an operator-configured UID/project membership. If access is denied, contact the workspace operator.
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400">
        <span className="min-w-0 truncate">Signed in as {user.email || user.uid}</span>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={busy}
          className="shrink-0 rounded-md border border-slate-700 px-3 py-1.5 hover:border-amber-400 hover:text-amber-300 disabled:opacity-50"
        >
          Sign out
        </button>
      </div>
      {error && <p className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs text-rose-200" role="alert">{error}</p>}
      {children}
    </>
  );
};
