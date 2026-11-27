import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Compass,
  Briefcase,
  Award,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Users,
  Home,
  Crown,
  MapPin,
  Edit3,
  LogOut,
} from 'lucide-react';
import {
  useAuth,
  isFreeProfile,
  isZeroBrokerRole,
  isClientRole,
  ZERO_BROKER_ROLES,
} from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export interface AuthModalProps {
  onSelectUnauthView?: (view: 'client_page' | 'client_dashboard' | 'broker') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSelectUnauthView }) => {
  const {
    user,
    users,
    hasPaidLicense,
    hasBoqAccess,
    getTrialStatus,
    canAccessProfile,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    quickSignIn,
    signup,
    logout,
    setIsProfileEditorOpen,
    openSubscriptionModal,
  } = useAuth();
  const { currentTheme } = useTheme();

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginRequiresUpgrade, setLoginRequiresUpgrade] = useState(false);
  const [loginUseClientPortal, setLoginUseClientPortal] = useState(false);
  const [loginUseZeroBrokerPortal, setLoginUseZeroBrokerPortal] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [profileGroupFilter, setProfileGroupFilter] = useState<'studio' | 'all' | 'zero_broker'>('studio');

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('architect');
  const [signupCompany, setSignupCompany] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLicense, setSignupLicense] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupRequiresUpgrade, setSignupRequiresUpgrade] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentSuccess, setForgotSentSuccess] = useState(false);

  // Escape-to-close accessibility
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    owner: { label: 'Principal Architect & Owner', desc: 'Full authority & studio leadership' },
    architect: { label: 'Consulting Architect', desc: 'Architectural planning, CAD & BIM specifications' },
    structural_engineer: { label: 'Structural Engineer', desc: 'RCC, Steel, IS Codes & structural validation' },
    quantity_surveyor: { label: 'Quantity Surveyor (QS)', desc: 'Cost engineering, BOQ audits & rate matrices' },
    contractor: { label: 'Turnkey Contractor', desc: 'Site execution, material procurement & scheduling' },
    client: { label: 'Client (Separate Login)', desc: 'Client-only portal login' },
    mep_engineer: { label: 'MEP Engineer', desc: 'Mechanical, Electrical & Plumbing systems' },
    property_owner: { label: 'Property Owner · Coming 2028', desc: 'Zero-Broker launches 2028' },
    tenant: { label: 'Tenant · Coming 2028', desc: 'Zero-Broker launches 2028' },
    broker_agent: { label: 'Zero-Broker · Coming 2028', desc: 'Zero-Broker launches 2028' },
  };

  const studioProfiles = useMemo(
    () => users.filter((u) => !ZERO_BROKER_ROLES.includes(u.role) && !isClientRole(u.role)),
    [users]
  );

  const filteredProfiles = useMemo(() => {
    if (profileGroupFilter === 'zero_broker') {
      return users.filter((u) => ZERO_BROKER_ROLES.includes(u.role));
    }
    if (profileGroupFilter === 'studio') {
      return studioProfiles;
    }
    return users;
  }, [users, studioProfiles, profileGroupFilter]);

  const passwordStrength = useMemo(() => {
    const pw = signupPassword;
    if (!pw) return { score: 0, label: '', colorClass: 'bg-slate-800' };
    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 10) score += 1;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', colorClass: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', colorClass: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', colorClass: 'bg-emerald-500' };
    return { score: 4, label: 'Strong', colorClass: 'bg-emerald-400' };
  }, [signupPassword]);

  if (!isAuthModalOpen) return null;

  const isZeroBrokerRoleSelected = ZERO_BROKER_ROLES.includes(signupRole);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginRequiresUpgrade(false);
    setLoginUseClientPortal(false);
    setLoginUseZeroBrokerPortal(false);
    setIsSubmittingLogin(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Failed to sign in. Please verify your credentials.');
        setLoginRequiresUpgrade(Boolean(res.requiresUpgrade));
        setLoginUseClientPortal(Boolean(res.useClientPortal));
        setLoginUseZeroBrokerPortal(Boolean(res.useZeroBrokerPortal));
      } else {
        setLoginEmail('');
        setLoginPassword('');
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'An unexpected error occurred during sign in.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupRequiresUpgrade(false);

    if (signupPassword.trim().length < 6) {
      setSignupError('Please choose a password with at least 6 characters.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setSignupError('Please agree to the Professional Practice & Zero-Brokerage Charter.');
      return;
    }

    setIsSubmittingSignup(true);

    try {
      const res = await signup(
        {
          name: signupName,
          email: signupEmail,
          role: signupRole,
          company:
            signupCompany ||
            (signupRole === 'property_owner'
              ? 'Direct Owner Portfolio (0% Fee)'
              : signupRole === 'tenant'
              ? 'Verified Home Seeker'
              : undefined),
          department:
            signupDepartment ||
            (signupRole === 'property_owner'
              ? 'Zero-Broker Owner Listing & Direct Lease'
              : signupRole === 'tenant'
              ? 'Zero-Broker Direct Rental Resident'
              : undefined),
          phone: signupPhone,
          licenseNumber: signupLicense,
        },
        signupPassword
      );

      if (!res.success) {
        setSignupError(res.error || 'Registration failed.');
        setSignupRequiresUpgrade(Boolean(res.requiresUpgrade));
      } else {
        setSignupName('');
        setSignupEmail('');
        setSignupCompany('');
        setSignupDepartment('');
        setSignupPhone('');
        setSignupLicense('');
        setSignupPassword('');
        setSignupConfirmPassword('');
      }
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'An error occurred during account registration.');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleQuickLogin = (userId: string) => {
    setLoginError(null);
    setLoginRequiresUpgrade(false);
    setLoginUseClientPortal(false);
    setLoginUseZeroBrokerPortal(false);
    const res = quickSignIn(userId);
    if (!res.success) {
      setLoginError(res.error || 'Unable to sign in with this profile.');
      setLoginRequiresUpgrade(Boolean(res.requiresUpgrade));
      setLoginUseClientPortal(Boolean(res.useClientPortal));
      setLoginUseZeroBrokerPortal(Boolean(res.useZeroBrokerPortal));
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      return;
    }
    setForgotSentSuccess(true);
  };

  return (
    <div
      id="auth-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAuthModalOpen(false);
        }
      }}
    >
      <div
        id="auth-modal-container"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 mt-0.5 border"
              style={{
                backgroundColor: `rgba(${currentTheme.rgb}, 0.14)`,
                borderColor: `rgba(${currentTheme.rgb}, 0.35)`,
                color: currentTheme.colors['400'],
              }}
            >
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                Gouse AI Studio Login
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong className="text-emerald-400">Gouse AI</strong> is Lifetime Free (incl. BOQ &amp; Estimate). Other studio roles get a <strong>6-Month Free Trial</strong> (BOQ &amp; Estimate paid).
              </p>
              {onSelectUnauthView && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-2 text-[11px]">
                  <span className="text-slate-500">Portals:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      onSelectUnauthView('client_page');
                    }}
                    className="text-amber-300 hover:text-amber-200 hover:underline font-semibold whitespace-nowrap"
                  >
                    Separate Client Login →
                  </button>
                  <span className="text-slate-700" aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      onSelectUnauthView('broker');
                    }}
                    className="text-slate-400 hover:text-slate-200 hover:underline font-medium whitespace-nowrap"
                  >
                    Zero-Broker (Coming 2028)
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close sign in dialog"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/50 shrink-0 text-xs sm:text-sm font-semibold">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setShowForgotPassword(false);
              setLoginError(null);
              setLoginRequiresUpgrade(false);
            }}
            className={`py-3 px-4 text-center transition-colors flex items-center justify-center gap-2 border-b-2 whitespace-nowrap ${
              authModalMode === 'login' && !showForgotPassword
                ? 'border-amber-400 text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Sign In</span>
          </button>

          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setAuthModalMode('signup');
              setShowForgotPassword(false);
              setSignupError(null);
              setSignupRequiresUpgrade(false);
            }}
            className={`py-3 px-4 text-center transition-colors flex items-center justify-center gap-2 border-b-2 whitespace-nowrap ${
              authModalMode === 'signup' && !showForgotPassword
                ? 'border-amber-400 text-white bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 scrollbar-thin">
          {/* WHERE YOUR PROFILE IS DISPLAYED / ACTIVE PROFILE CARD */}
          {user ? (
            <div
              id="panel-active-profile-location"
              className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">{user.name}</span>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          isFreeProfile(user)
                            ? 'text-emerald-400'
                            : hasBoqAccess(user)
                            ? 'text-amber-300'
                            : 'text-sky-400'
                        }`}
                      >
                        · {getTrialStatus(user).statusLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {roleLabels[user.role]?.label || user.role} · {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsProfileEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors whitespace-nowrap"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-200">Where your profile is shown:</strong> Top-Right Header bar (click your name chip anytime) and the Bottom-Left Sidebar account card.
                </span>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Profile Location:</strong> Once signed in, your active profile card appears in the <strong className="text-slate-200">Top-Right Header bar</strong> and the <strong className="text-slate-200">Bottom-Left Sidebar menu</strong>.
              </span>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>Account Recovery</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered work or Zero-Broker email address to request access recovery, or sign in freely with Gouse AI.
              </p>

              {forgotSentSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Recovery Request Recorded</span>
                  </div>
                  <p>
                    Recovery instructions have been prepared for <strong>{forgotEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotSentSuccess(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/40 hover:bg-emerald-700/60 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="input-forgot-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. sgouse14@gmail.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : authModalMode === 'login' ? (
            /* SIGN IN VIEW */
            <div className="space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-200 text-xs space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">{loginError}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-6">
                    {loginUseClientPortal && onSelectUnauthView && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAuthModalOpen(false);
                          onSelectUnauthView('client_page');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Open Separate Client Login</span>
                      </button>
                    )}

                    {loginUseZeroBrokerPortal && onSelectUnauthView && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAuthModalOpen(false);
                          onSelectUnauthView('broker');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Open Separate Zero-Broker Login</span>
                      </button>
                    )}

                    {loginRequiresUpgrade && (
                      <button
                        type="button"
                        onClick={openSubscriptionModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Unlock BOQ &amp; Pro (₹1,500/yr)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('user-gouse-01')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sign in as Gouse AI (Lifetime Free)</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="input-login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="sgouse14@gmail.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="input-login-password" className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotEmail(loginEmail || '');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:outline-none"
                    />
                    <span>Keep me signed in on this browser</span>
                  </label>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Gouse AI: Lifetime Free · Others: 6-Mo Trial (BOQ Paid)
                  </span>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-opacity text-slate-950 hover:opacity-95 disabled:opacity-50"
                  style={{
                    backgroundColor: currentTheme.colors['400'],
                  }}
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingLogin ? 'Signing In...' : 'Sign In with Email'}</span>
                </button>
              </form>

              {/* STUDIO PROFILES & ACCESS TIERS */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Workspace Profiles</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setProfileGroupFilter('studio')}
                      className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        profileGroupFilter === 'studio'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Studio ({studioProfiles.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileGroupFilter('zero_broker')}
                      className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        profileGroupFilter === 'zero_broker'
                          ? 'bg-slate-800 text-amber-300 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Zero-Broker (2028)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileGroupFilter('all')}
                      className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap ${
                        profileGroupFilter === 'all'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({users.length})
                    </button>
                  </div>
                </div>

                {!hasPaidLicense && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                    <span>
                      <strong>Gouse AI</strong> gets Lifetime Free (all features). Other studio accounts get a <strong>6-Month Free Trial</strong> (BOQ &amp; Estimation paid).
                    </span>
                    <button
                      type="button"
                      onClick={openSubscriptionModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors whitespace-nowrap"
                    >
                      <Crown className="w-3 h-3" />
                      <span>Unlock BOQ (₹1,500/yr)</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {filteredProfiles.map((p) => {
                    const isSelected = user?.id === p.id;
                    const free = isFreeProfile(p);
                    const zeroBroker2028 = isZeroBrokerRole(p.role);
                    const clientOnly = isClientRole(p.role);
                    const unlocked = canAccessProfile(p);
                    const trialInfo = getTrialStatus(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (clientOnly && onSelectUnauthView) {
                            setIsAuthModalOpen(false);
                            onSelectUnauthView('client_page');
                            return;
                          }
                          if (zeroBroker2028 && onSelectUnauthView) {
                            setIsAuthModalOpen(false);
                            onSelectUnauthView('broker');
                            return;
                          }
                          handleQuickLogin(p.id);
                        }}
                        className={`text-left p-2.5 rounded-xl border transition-colors flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                            : free
                            ? 'bg-emerald-950/35 border-emerald-500/45 hover:border-emerald-400 text-white'
                            : zeroBroker2028
                            ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                            : clientOnly
                            ? 'bg-slate-950/60 border-amber-500/25 hover:border-amber-400 text-slate-200'
                            : unlocked
                            ? 'bg-slate-950/60 border-slate-700 hover:border-sky-400/50 text-slate-200 hover:text-white'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-amber-500/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className={`w-8 h-8 rounded-lg object-cover border shrink-0 ${
                            unlocked && !zeroBroker2028 ? 'border-slate-700' : 'border-slate-800 opacity-65'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate flex items-center justify-between gap-1.5">
                            <span className="truncate">{p.name}</span>
                            {isSelected ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : free ? (
                              <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                                Lifetime Free
                              </span>
                            ) : zeroBroker2028 ? (
                              <span className="text-[10px] font-mono text-amber-400 shrink-0">
                                Soon · 2028
                              </span>
                            ) : clientOnly ? (
                              <span className="text-[10px] font-mono text-amber-300 shrink-0">
                                Client Login →
                              </span>
                            ) : hasBoqAccess(p) ? (
                              <span className="text-[10px] font-mono text-amber-300 shrink-0">
                                Pro + BOQ
                              </span>
                            ) : trialInfo.isActive ? (
                              <span className="text-[10px] font-mono text-sky-400 shrink-0">
                                6-Mo Free
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 shrink-0">
                                <Lock className="w-3 h-3" />
                                <span>Pro</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {roleLabels[p.role]?.label || p.role}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Switch to Sign Up */}
              <div className="pt-1 text-center text-xs text-slate-400">
                New property owner, tenant, or studio partner?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setSignupError(null);
                    setSignupRequiresUpgrade(false);
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Create an account
                </button>
              </div>
            </div>
          ) : (
            /* CREATE ACCOUNT / SIGN UP VIEW */
            <div className="space-y-4">
              {signupError && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-200 text-xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{signupError}</span>
                  </div>
                  {signupRequiresUpgrade && (
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <button
                        type="button"
                        onClick={openSubscriptionModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Activate Pro License (₹1,500/yr)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 flex items-center gap-2.5 text-xs text-sky-200">
                <Home className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  New Studio accounts start with a <strong>6-Month Free Trial</strong> (BOQ &amp; Estimation paid · ₹1,500/yr). Clients have a Separate Client Login, and Zero-Broker launches in 2028.
                </span>
              </div>

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input-signup-name" className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-name"
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder={isZeroBrokerRoleSelected ? 'e.g. Karthik Rao' : 'e.g. Ar. Gouse Mohiuddin'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-signup-email" className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-email"
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@domain.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Studio Account Role Selection (Clients register on Separate Client Portal; Zero-Broker opens 2028) */}
                <div>
                  <label htmlFor="select-signup-role" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Studio Account Role *
                  </label>
                  <select
                    id="select-signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="architect">Project Architect / Designer (6-Mo Free Trial)</option>
                    <option value="structural_engineer">Structural / Civil Engineer (6-Mo Free Trial)</option>
                    <option value="quantity_surveyor">Quantity Surveyor &amp; Cost Consultant (6-Mo Free Trial)</option>
                    <option value="contractor">Turnkey General Contractor / Builder (6-Mo Free Trial)</option>
                    <option value="mep_engineer">MEP &amp; HVAC Consultant (6-Mo Free Trial)</option>
                    <option value="owner">Principal Architect &amp; Studio Partner (6-Mo Free Trial)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input-signup-company" className="block text-xs font-medium text-slate-300 mb-1">
                      {signupRole === 'property_owner'
                        ? 'Property / Building Name'
                        : signupRole === 'tenant'
                        ? 'Employer / Preferred Locality'
                        : 'Firm / Company Name'}
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-company"
                        type="text"
                        value={signupCompany}
                        onChange={(e) => setSignupCompany(e.target.value)}
                        placeholder={
                          signupRole === 'property_owner'
                            ? 'e.g. GreenGlen Residency HSR'
                            : signupRole === 'tenant'
                            ? 'e.g. HSR Layout / Bellandur'
                            : 'e.g. Gouse Architecture'
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-signup-license" className="block text-xs font-medium text-slate-300 mb-1">
                      {isZeroBrokerRoleSelected
                        ? 'Khata / KYC Reference (Optional)'
                        : 'COA / License ID (Optional)'}
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-license"
                        type="text"
                        value={signupLicense}
                        onChange={(e) => setSignupLicense(e.target.value)}
                        placeholder={isZeroBrokerRoleSelected ? 'e.g. BBMP A-Khata / KYC Verified' : 'e.g. CA/2024/99120'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="input-signup-phone" className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-phone"
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="input-signup-department" className="block text-xs font-medium text-slate-300 mb-1">
                      {isZeroBrokerRoleSelected ? 'City / Tech Corridor' : 'Department / Specialization'}
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-department"
                        type="text"
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        placeholder={isZeroBrokerRoleSelected ? 'e.g. Bangalore · Indiranagar / HSR' : 'e.g. High-Rise Planning'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="input-signup-password" className="block text-xs font-medium text-slate-300">
                        Password * (min 6 chars)
                      </label>
                      {signupPassword && (
                        <span className="text-[10px] font-mono text-slate-300">
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupPassword && (
                      <div className="grid grid-cols-4 gap-1 mt-1.5" aria-hidden="true">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full transition-colors ${
                              passwordStrength.score >= step ? passwordStrength.colorClass : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="input-signup-confirm-password" className="block text-xs font-medium text-slate-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-confirm-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    {signupConfirmPassword && signupPassword !== signupConfirmPassword && (
                      <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 leading-snug">
                    I agree to the Gouse AI Professional Practice Standards and Zero-Brokerage Direct Housing Charter (0% middleman commission).
                  </span>
                </label>

                <button
                  id="btn-submit-signup"
                  type="submit"
                  disabled={isSubmittingSignup}
                  className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-opacity text-slate-950 hover:opacity-95 disabled:opacity-50"
                  style={{
                    backgroundColor: currentTheme.colors['400'],
                  }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingSignup ? 'Creating Account...' : 'Create Account & Sign In'}</span>
                </button>
              </form>

              {/* Switch to Sign In */}
              <div className="pt-2 text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setLoginError(null);
                    setLoginRequiresUpgrade(false);
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
