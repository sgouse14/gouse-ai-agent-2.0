import React, { useState } from 'react';
import {
  Building,
  Home,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  FileText,
  Clock,
  Bell,
  Lock,
  Unlock,
  Calendar,
  ArrowLeft,
  LogIn,
  LogOut,
  Mail,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  Compass,
  UserCheck,
} from 'lucide-react';
import { Project } from '../types';
import { CurrencyCode } from '../utils/formatters';
import {
  useAuth,
  isFreeProfile,
  isZeroBrokerRole,
  ZERO_BROKER_ROLES,
} from '../context/AuthContext';

interface GouseAiAgentBrokerViewProps {
  project?: Project;
  onUpdateProject?: (updated: Project) => void;
  currency?: CurrencyCode;
  initialSubTab?:
    | 'all'
    | 'pg'
    | 'rent_house'
    | 'buy_house'
    | 'land_plot'
    | 'sell_property'
    | 'matchmaker'
    | 'agreement'
    | 'analytics';
  isOutsidePlatform?: boolean;
  onReturnToWorkspace?: () => void;
}

const WAITLIST_2028_STORAGE_KEY = 'gouse_zero_broker_2028_waitlist_v1';

interface WaitlistEntry {
  id: string;
  name: string;
  contact: string;
  interest: 'tenant' | 'owner' | 'buyer';
  createdAt: string;
}

export const GouseAiAgentBrokerView: React.FC<GouseAiAgentBrokerViewProps> = ({
  initialSubTab = 'all',
  isOutsidePlatform = false,
  onReturnToWorkspace,
}) => {
  const {
    user,
    users,
    logout,
    loginZeroBrokerOnly,
    quickSignInZeroBroker,
    signupZeroBrokerOnly,
  } = useAuth();

  // Direct owner entry without login (only allowed when unauthenticated; Gouse AI signed-in auto-unlocks)
  const [gouseDirectBypass, setGouseDirectBypass] = useState(false);

  // Separate Zero-Broker Login form state
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'property_owner' | 'tenant' | 'broker_agent'>('tenant');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // 2028 Launch Waitlist state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [interest, setInterest] = useState<'tenant' | 'owner' | 'buyer'>('tenant');
  const [entries, setEntries] = useState<WaitlistEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(WAITLIST_2028_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [submittedNote, setSubmittedNote] = useState<string | null>(null);

  const isOwnerSignedIn = isFreeProfile(user);
  const isZeroBrokerMember = isZeroBrokerRole(user?.role);
  const isOtherRoleSignedIn = Boolean(user && !isOwnerSignedIn && !isZeroBrokerMember);
  const hasZeroBrokerAccess =
    isOwnerSignedIn || isZeroBrokerMember || (!user && gouseDirectBypass);

  const zeroBrokerProfiles = users.filter((u) => ZERO_BROKER_ROLES.includes(u.role));

  const formatZeroBrokerRole = (role: string) => {
    switch (role) {
      case 'property_owner':
        return 'Property Owner';
      case 'tenant':
        return 'Verified Tenant';
      case 'broker_agent':
        return 'Zero-Broker Advisor';
      default:
        return role;
    }
  };

  const handleZeroBrokerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      const res = await loginZeroBrokerOnly(loginEmail, loginPassword);
      if (!res.success) {
        setAuthError(
          res.error ||
            'Access Denied: Only Zero-Broker accounts can sign in here.'
        );
      } else {
        setLoginEmail('');
        setLoginPassword('');
        setGouseDirectBypass(false);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleZeroBrokerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);
    try {
      const res = await signupZeroBrokerOnly(
        {
          name: signupName,
          email: loginEmail,
          role: signupRole,
          company: signupCompany,
          phone: signupPhone,
        },
        signupPassword
      );
      if (!res.success) {
        setAuthError(res.error || 'Unable to register Zero-Broker account.');
      } else {
        setSignupName('');
        setSignupCompany('');
        setSignupPhone('');
        setSignupPassword('');
        setLoginEmail('');
        setGouseDirectBypass(false);
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanContact = contact.trim();
    if (!cleanName || !cleanContact) return;

    const newEntry: WaitlistEntry = {
      id: `zb2028-${Date.now()}`,
      name: cleanName,
      contact: cleanContact,
      interest,
      createdAt: new Date().toISOString(),
    };
    const next = [newEntry, ...entries];
    setEntries(next);
    try {
      window.localStorage.setItem(WAITLIST_2028_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setSubmittedNote(
      `Registered ${cleanName} for the Zero-Broker Property 2028 launch notification.`
    );
    setName('');
    setContact('');
  };

  const sectionLabel =
    initialSubTab === 'pg'
      ? 'PG & Co-Living Direct Rentals'
      : initialSubTab === 'rent_house'
      ? 'Owner-Direct House Rentals'
      : 'Zero-Broker Direct Property Hub';

  // GATE VIEW: Separate Zero-Broker Login Required (Gouse AI enters without login)
  if (!hasZeroBrokerAccess) {
    return (
      <div
        id="zero-broker-separate-login-gate"
        className={`${
          isOutsidePlatform
            ? 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans'
            : ''
        }`}
      >
        <div className="max-w-xl mx-auto w-full px-4 py-10 sm:py-14">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="space-y-2.5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono font-semibold">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>SEPARATE ZERO-BROKER LOGIN · LAUNCHING 2028</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {sectionLabel}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Zero-Broker Access uses a <strong className="text-white">Separate Zero-Broker Login</strong> for Property Owners, Tenants, and Zero-Broker Advisors.{' '}
                <strong className="text-emerald-400">Gouse AI (sgouse14@gmail.com)</strong> can access directly without logging in.
              </p>
            </div>

            {isOtherRoleSignedIn && user ? (
              /* Signed in as non-Gouse Studio role or Client -> Strictly Blocked from bypass */
              <div
                id="zero-broker-access-denied-other-role"
                className="p-5 rounded-xl bg-rose-950/35 border border-rose-500/45 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-rose-200">
                      Separate Zero-Broker Login Required
                    </div>
                    <p className="text-xs text-rose-200/90 leading-relaxed">
                      You are signed in as <strong>{user.name}</strong> ({user.email}). Studio and Client accounts cannot access Zero-Broker directly—please sign out and use a Zero-Broker account (only <strong>Gouse AI</strong> accesses without login).
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
                    id="btn-zb-signout-other-role"
                    type="button"
                    onClick={() => {
                      logout();
                      setAuthError(null);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/50 text-rose-200 text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out to Use Zero-Broker Login</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guest / Unauthenticated: Direct Gouse AI Owner Access (No Login) + Separate Zero-Broker Login */
              <div id="zero-broker-separate-login-card" className="space-y-5">
                {/* Gouse AI Direct Owner Access Without Login */}
                <div className="p-4 rounded-xl bg-emerald-950/35 border border-emerald-500/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Gouse AI Owner Access (No Login Needed)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Founder / Owner (<span className="font-mono text-emerald-300">sgouse14@gmail.com</span>) can open Zero-Broker immediately without entering credentials.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-gouse-zero-broker-no-login"
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setGouseDirectBypass(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                  >
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span>Gouse AI Owner · Enter Without Login</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span>OTHERS · SEPARATE ZERO-BROKER LOGIN ONLY</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>

                {/* Sign In / Register Switch */}
                <div className="grid grid-cols-2 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-semibold">
                  <button
                    id="tab-zb-signin"
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setAuthError(null);
                    }}
                    className={`py-2 rounded-lg transition-colors ${
                      authTab === 'signin'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Zero-Broker Sign In
                  </button>
                  <button
                    id="tab-zb-signup"
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      setAuthError(null);
                    }}
                    className={`py-2 rounded-lg transition-colors ${
                      authTab === 'signup'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Register Zero-Broker
                  </button>
                </div>

                {authError && (
                  <div
                    id="zb-login-error-banner"
                    className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/45 text-xs text-rose-200 flex items-start gap-2.5"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authTab === 'signin' ? (
                  <form onSubmit={handleZeroBrokerSignIn} className="space-y-3.5 text-xs">
                    <div>
                      <label htmlFor="zb-login-email" className="block text-slate-300 font-medium mb-1">
                        Zero-Broker Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          id="zb-login-email"
                          type="email"
                          required
                          autoComplete="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. aarav.sharma@techmail.in"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="zb-login-password" className="block text-slate-300 font-medium mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          id="zb-login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
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
                      id="btn-submit-zb-login"
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>
                        {isSubmittingAuth ? 'Verifying Zero-Broker...' : 'Sign In to Zero-Broker'}
                      </span>
                    </button>

                    {zeroBrokerProfiles.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="text-[11px] text-slate-400 font-medium">
                          Registered Zero-Broker Accounts (Owner / Tenant / Advisor)
                        </div>
                        <div className="space-y-1.5">
                          {zeroBrokerProfiles.map((zp) => (
                            <button
                              key={zp.id}
                              id={`btn-zb-quick-${zp.id}`}
                              type="button"
                              onClick={() => {
                                setAuthError(null);
                                const res = quickSignInZeroBroker(zp.id);
                                if (!res.success) {
                                  setAuthError(res.error || 'Zero-Broker sign-in unavailable.');
                                } else {
                                  setGouseDirectBypass(false);
                                }
                              }}
                              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 text-left transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-white truncate">
                                    {zp.name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {zp.email} · {formatZeroBrokerRole(zp.role)}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-amber-300 shrink-0">
                                Zero-Broker →
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleZeroBrokerSignup} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="e.g. Vikramaditya Reddy"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="owner@domain.in"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Zero-Broker Role *</label>
                        <select
                          value={signupRole}
                          onChange={(e) =>
                            setSignupRole(e.target.value as 'property_owner' | 'tenant' | 'broker_agent')
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="tenant">Tenant / Home Seeker</option>
                          <option value="property_owner">Property Owner</option>
                          <option value="broker_agent">Zero-Broker Advisor</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-medium mb-1">Company / Residence</label>
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
                            placeholder="+91 98000..."
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
                          placeholder="Create Zero-Broker password"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-submit-zb-signup"
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-60"
                    >
                      {isSubmittingAuth
                        ? 'Creating Zero-Broker Account...'
                        : 'Create Zero-Broker Account & Enter'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {onReturnToWorkspace && !isOtherRoleSignedIn && (
              <div className="pt-2 border-t border-slate-800/80 flex justify-center">
                <button
                  type="button"
                  onClick={onReturnToWorkspace}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Studio Workspace</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED ZERO-BROKER PORTAL (Preserves Coming Soon 2028 status)
  return (
    <div
      id="zero-broker-coming-soon-2028"
      className={`${
        isOutsidePlatform
          ? 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16'
          : ''
      }`}
    >
      {isOutsidePlatform && (
        <header className="border-b border-slate-800 bg-slate-950/95">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-sm font-bold text-white truncate">
                Gouse AI · Separate Zero-Broker Portal
              </span>
            </div>
            {user && (
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:inline text-xs text-slate-300 font-medium">
                  {user.name} · {formatZeroBrokerRole(user.role)}
                </span>
                <button
                  id="btn-zb-outside-logout"
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 py-8 sm:py-12 space-y-6">
        {/* Session Access Strip */}
        <div
          id="zero-broker-access-banner"
          className="rounded-xl bg-slate-900 border border-emerald-500/35 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            {isOwnerSignedIn || (!user && gouseDirectBypass) ? (
              <span className="text-slate-200">
                <strong className="text-emerald-400">Gouse AI Owner Access</strong> — Unlocked directly{' '}
                <strong>without Zero-Broker login</strong> (sgouse14@gmail.com)
              </span>
            ) : (
              <span className="text-slate-200">
                <strong className="text-amber-300">Separate Zero-Broker Session:</strong>{' '}
                {user?.name} ({user?.email})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!user && gouseDirectBypass && (
              <button
                id="btn-zb-lock-owner-preview"
                type="button"
                onClick={() => setGouseDirectBypass(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Show Separate Login Gate</span>
              </button>
            )}
            {isZeroBrokerMember && (
              <button
                id="btn-zb-member-logout"
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/35 bg-rose-950/40 hover:bg-rose-900/50 text-[11px] font-medium text-rose-200 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out Zero-Broker</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Coming Soon Banner */}
        <div className="rounded-2xl bg-slate-900 border border-amber-500/35 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>COMING SOON · LAUNCHING 2028</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Public Listings Closed Until 2028</span>
            </div>
          </div>

          <div className="space-y-2.5 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {sectionLabel} — <span className="text-amber-400">Opening in 2028</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gouse AI&apos;s Zero-Broker Property platform (PG &amp; Co-Living, Owner-Direct Rental Houses, Verified Villas, Land &amp; Plots, and Digital e-Stamp Agreements) is scheduled to launch in{' '}
              <strong className="text-white">2028</strong>. Public bookings and listings remain closed until 2028.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Scheduled Launch</div>
              <div className="text-base font-bold text-amber-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>2028</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Not open for transactions before 2028</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Brokerage Policy</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">0% Commission</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Owner-direct verification model</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Legal Standard</div>
              <div className="text-base font-bold text-white mt-0.5">A-Khata &amp; RERA</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Digital KYC &amp; Karnataka e-Stamp</div>
            </div>
          </div>

          {onReturnToWorkspace && !isZeroBrokerMember && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onReturnToWorkspace}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Studio Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* 2028 Launch Roadmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Owner-Direct House &amp; PG Rentals</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">2028</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified 2BHK/3BHK builder floors and executive PG suites directly from owners with zero middleman brokerage.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Building className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Clear-Title Villas, Land &amp; Plots</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">2028</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              BDA, DTCP, and BBMP A-Khata direct buyer-to-owner transfers backed by architectural and structural due diligence.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Digital Karnataka e-Stamp Desk</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">2028</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized 11-month tenancy agreements, automated stamp duty calculations, and transparent deposit protection.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>AI Zero-Fee Corridor Matchmaker</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400">2028</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Commute-aware matching across Bangalore tech corridors paired directly with Gouse AI turnkey fit-out intelligence.
            </p>
          </div>
        </div>

        {/* Optional 2028 Notify Me Form */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Get Notified for the 2028 Zero-Broker Launch</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Leave your details to receive an invitation when Zero-Broker Property opens in 2028.
              </p>
            </div>
            {entries.length > 0 && (
              <span className="text-xs font-mono text-emerald-400">
                {entries.length} registered on this device
              </span>
            )}
          </div>

          {submittedNote && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{submittedNote}</span>
            </div>
          )}

          <form onSubmit={handleJoinWaitlist} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="sm:col-span-4 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <input
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or Phone (+91...)"
              className="sm:col-span-4 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value as 'tenant' | 'owner' | 'buyer')}
              className="sm:col-span-2 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
            >
              <option value="tenant">Rent / PG (2028)</option>
              <option value="owner">Property Owner</option>
              <option value="buyer">Plot / Villa Buyer</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors whitespace-nowrap"
            >
              Notify Me (2028)
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Studio Projects, Interior, Materials &amp; Gouse AI remain live now</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Bangalore Launch Corridor · 2028</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GouseAiAgentBrokerView;
