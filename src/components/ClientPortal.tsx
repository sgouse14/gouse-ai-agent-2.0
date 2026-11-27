import React, { useState } from 'react';
import {
  Compass,
  Lock,
  LogIn,
  LogOut,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Mail,
  Building2,
  Phone,
  User,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, isFreeProfile } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';

interface ClientPortalProps {
  projects?: Project[];
  currency?: CurrencyCode;
  isClientRestricted?: boolean;
  onEnquirySubmitted?: (enquiryData: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    projectType: string;
    location: string;
    budget: string;
    notes: string;
  }) => void;
  onReturnToWorkspace?: () => void;
  onOpenClientDashboard?: () => void;
  isPreviewMode?: boolean;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  isClientRestricted = false,
  onReturnToWorkspace,
  onOpenClientDashboard,
}) => {
  const { user, users, logout, loginClientOnly, quickSignInClient, signupClientOnly } = useAuth();
  const { currentTheme } = useTheme();

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClientSignedIn = user?.role === 'client';
  const isNonClientSignedIn = Boolean(user && user.role !== 'client');
  const clientProfiles = users.filter((u) => u.role === 'client');

  const handleClientSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await loginClientOnly(email, password);
      if (!res.success) {
        setErrorMsg(
          res.error ||
            'Access Denied: Only verified Client accounts can log into Client Access.'
        );
      } else {
        setEmail('');
        setPassword('');
        onOpenClientDashboard?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await signupClientOnly(
        {
          name: signupName,
          email,
          company: signupCompany,
          phone: signupPhone,
        },
        signupPassword
      );
      if (!res.success) {
        setErrorMsg(res.error || 'Unable to register Client account.');
      } else {
        setSignupName('');
        setSignupCompany('');
        setSignupPhone('');
        setSignupPassword('');
        setEmail('');
        onOpenClientDashboard?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Minimal Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Compass className="w-5 h-5 shrink-0" style={{ color: currentTheme.colors['400'] }} />
            <span className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
              Gouse AI · Separate Client Portal
            </span>
          </div>

          {!isClientRestricted && onReturnToWorkspace && (
            <button
              id="btn-client-gate-back-studio"
              type="button"
              onClick={onReturnToWorkspace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio Workspace</span>
            </button>
          )}
        </div>
      </header>

      {/* Centered Strict Client-Only Authentication Gate */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Client Access — Separate Login
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Exclusively for <strong className="text-white">Client</strong> accounts. Architects, engineers, contractors, guests, and <strong className="text-amber-300">Gouse AI (sgouse14@gmail.com)</strong> cannot log into Client Access.
            </p>
          </div>

          {/* Case 1: Authenticated Client */}
          {isClientSignedIn && user ? (
            <div className="p-5 rounded-xl bg-slate-950 border border-emerald-500/35 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-xs font-mono text-emerald-400 font-semibold">
                    Verified Client Session
                  </div>
                  <div className="text-base font-bold text-white truncate">{user.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {user.email} · {user.company || 'Client Stakeholder'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {onOpenClientDashboard && (
                  <button
                    id="btn-portal-open-workspace"
                    type="button"
                    onClick={onOpenClientDashboard}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <span>Enter Client Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : isNonClientSignedIn && user ? (
            /* Case 2: Non-Client Role (including Gouse AI / Owner) — Strictly Blocked */
            <div
              id="client-access-denied-non-client"
              className="p-5 rounded-xl bg-rose-950/35 border border-rose-500/45 space-y-4"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-rose-200">
                    Access Denied for {isFreeProfile(user) ? 'Gouse AI (Owner)' : user.name}
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    You are currently signed in as <strong>{user.name}</strong> ({user.email}). Client Access is strictly isolated—<strong>only Client accounts can log in or view Client Workspace</strong>. Studio members and Gouse AI cannot access this portal.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {onReturnToWorkspace && (
                  <button
                    type="button"
                    onClick={onReturnToWorkspace}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Studio Workspace</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/50 text-rose-200 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Studio Session</span>
                </button>
              </div>
            </div>
          ) : (
            /* Case 3: Unauthenticated — Separate Client Login & Client Registration Form ONLY */
            <div id="client-separate-login-card" className="space-y-5">
              <div className="grid grid-cols-2 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                <button
                  id="tab-client-signin"
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg transition-colors ${
                    authTab === 'signin'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Client Sign In
                </button>
                <button
                  id="tab-client-signup"
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setErrorMsg(null);
                  }}
                  className={`py-2 rounded-lg transition-colors ${
                    authTab === 'signup'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register Client Account
                </button>
              </div>

              {errorMsg && (
                <div
                  id="client-login-error-banner"
                  className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/45 text-xs text-rose-200 flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {authTab === 'signin' ? (
                <form onSubmit={handleClientSignIn} className="space-y-3.5 text-xs">
                  <div>
                    <label htmlFor="client-login-email" className="block text-slate-300 font-medium mb-1">
                      Client Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="client-login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. sameer.khan@prestigeheights.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="client-login-password" className="block text-slate-300 font-medium mb-1">
                      Client Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="client-login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (if registered with one)"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-submit-client-login"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Verifying Client...' : 'Sign In to Client Access'}</span>
                  </button>

                  {/* Registered Client Profiles Quick Access */}
                  {clientProfiles.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] text-slate-400 font-medium">
                        Registered Client Accounts (Clients Only)
                      </div>
                      <div className="space-y-1.5">
                        {clientProfiles.map((cp) => (
                          <button
                            key={cp.id}
                            id={`btn-client-quick-${cp.id}`}
                            type="button"
                            onClick={() => {
                              setErrorMsg(null);
                              const res = quickSignInClient(cp.id);
                              if (!res.success) {
                                setErrorMsg(res.error || 'Client login unavailable.');
                              } else {
                                onOpenClientDashboard?.();
                              }
                            }}
                            className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {cp.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {cp.email}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-amber-300 shrink-0">
                              Client →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleClientSignup} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Sameer Khan"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Client Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="client@company.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Company / Project</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={signupCompany}
                          onChange={(e) => setSignupCompany(e.target.value)}
                          placeholder="Optional"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          placeholder="+91 99001..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Password * (min 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create Client password"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-submit-client-signup"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? 'Creating Client Account...' : 'Create Client Account & Enter'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
