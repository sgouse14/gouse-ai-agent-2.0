import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  Building,
  Home,
  LogIn,
  UserPlus,
  X,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  ArrowRight,
  Shield,
  Users,
  Crown,
} from 'lucide-react';
import { useAuth, isFreeProfile } from '../context/AuthContext';
import { UserRole } from '../types';

export interface BrokerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'tenant' | 'property_owner' | 'broker_agent';
}

export const BrokerAuthModal: React.FC<BrokerAuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'tenant',
}) => {
  const { users, hasPaidLicense, canAccessProfile, login, signup, quickSignIn, openSubscriptionModal } = useAuth();

  const [activeRole, setActiveRole] = useState<'tenant' | 'property_owner' | 'broker_agent'>(defaultRole);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginRequiresUpgrade, setLoginRequiresUpgrade] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('Whitefield / Indiranagar / HSR');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPropertyDetail, setSignupPropertyDetail] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupRequiresUpgrade, setSignupRequiresUpgrade] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveRole(defaultRole);
      setLoginError(null);
      setLoginRequiresUpgrade(false);
      setSignupError(null);
      setSignupRequiresUpgrade(false);
    }
  }, [isOpen, defaultRole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Verified Zero-Broker accounts: Gouse AI is Free Login; all other accounts require Pro License
  const quickAccounts = [
    {
      role: 'broker_agent' as const,
      id: 'user-gouse-01',
      name: 'Gouse AI (Studio Lead)',
      email: 'sgouse14@gmail.com',
      subtitle: 'Principal Architect · Free Login',
      detail: 'Architecture & Zero-Broker Rental Ecosystem',
      borderClass: 'border-emerald-500/40 bg-emerald-950/25 hover:border-emerald-400',
      icon: Shield,
    },
    {
      role: 'tenant' as const,
      id: 'user-aarav-07',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@techblr.com',
      subtitle: 'Verified Tenant · 0% Brokerage',
      detail: 'Seeking Executive PG in Whitefield / Indiranagar',
      borderClass: 'border-slate-700 bg-slate-950/60 hover:border-amber-500/50',
      icon: Home,
    },
    {
      role: 'property_owner' as const,
      id: 'user-vikram-08',
      name: 'Vikramaditya Reddy',
      email: 'vikram.reddy@blrproperties.in',
      subtitle: 'Direct Property Owner · 18 Units',
      detail: 'Indiranagar Co-Living & HSR Layout 3BHK Floor',
      borderClass: 'border-slate-700 bg-slate-950/60 hover:border-amber-500/50',
      icon: Building,
    },
    {
      role: 'broker_agent' as const,
      id: 'user-sneha-09',
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@gousebroker.com',
      subtitle: 'Zero-Broker Advisor · 0% Fee',
      detail: 'East Bangalore Direct Owner Inspection Desk',
      borderClass: 'border-slate-700 bg-slate-950/60 hover:border-amber-500/50',
      icon: Briefcase,
    },
  ];

  const handleQuickLogin = (accountId: string, email: string) => {
    setLoginError(null);
    setLoginRequiresUpgrade(false);
    const matched = users.find((u) => u.id === accountId || u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      const res = quickSignIn(matched.id);
      if (res.success) {
        onClose();
      } else {
        setLoginError(res.error || 'Paid Workspace Pro License required for this profile.');
        setLoginRequiresUpgrade(Boolean(res.requiresUpgrade));
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginRequiresUpgrade(false);
    setIsSubmitting(true);

    try {
      if (useOtpLogin) {
        if (!otpSent) {
          if (!loginEmail.trim()) {
            setLoginError('Please enter your registered mobile number or email.');
            setIsSubmitting(false);
            return;
          }
          setOtpSent(true);
          setIsSubmitting(false);
          return;
        }

        if (otpCode.trim().length < 4) {
          setLoginError('Please enter a valid 4-digit verification code.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await login(loginEmail, useOtpLogin ? undefined : loginPassword);
      if (res.success) {
        onClose();
      } else {
        setLoginError(res.error || 'Invalid credentials. Verify your email/password or unlock Pro profiles.');
        setLoginRequiresUpgrade(Boolean(res.requiresUpgrade));
      }
    } catch {
      setLoginError('An error occurred during sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupRequiresUpgrade(false);

    if (!signupName.trim() || !signupEmail.trim() || !signupPhone.trim()) {
      setSignupError('Please fill in your full name, email, and mobile number.');
      return;
    }

    if (signupPassword.trim().length < 6) {
      setSignupError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signup(
        {
          name: signupName.trim(),
          email: signupEmail.trim(),
          role: activeRole as UserRole,
          phone: signupPhone.trim(),
          company:
            activeRole === 'property_owner'
              ? signupPropertyDetail || 'Direct Property Owner (0% Fee)'
              : activeRole === 'tenant'
              ? 'Verified Home Seeker'
              : signupPropertyDetail || 'Zero-Broker Direct Advisor',
          department:
            activeRole === 'tenant'
              ? `Tenant · ${signupLocation}`
              : activeRole === 'property_owner'
              ? 'Owner-Direct Listing (0% Brokerage)'
              : 'Zero-Broker Advisory Desk (0% Fee)',
        },
        signupPassword
      );

      if (res.success) {
        setSignupSuccess(true);
        setTimeout(() => {
          setSignupSuccess(false);
          onClose();
        }, 700);
      } else {
        setSignupError(res.error || 'Registration failed. Try an alternate email.');
        setSignupRequiresUpgrade(Boolean(res.requiresUpgrade));
      }
    } catch {
      setSignupError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="zero-broker-auth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 id="zero-broker-auth-title" className="font-bold text-white text-base sm:text-lg tracking-tight">
                Zero-Broker Direct Portal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                <strong>Gouse AI</strong> signs in free. Other Owner, Tenant &amp; Advisor profiles require Pro access (₹1,500/yr).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
            aria-label="Close Zero-Broker login dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Persona Segment Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveRole('tenant')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors whitespace-nowrap ${
                activeRole === 'tenant'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Tenant (0% Fee)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('property_owner')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors whitespace-nowrap ${
                activeRole === 'property_owner'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span>Owner / Landlord</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('broker_agent')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-colors whitespace-nowrap ${
                activeRole === 'broker_agent'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span>Direct Advisor</span>
            </button>
          </div>

          <div className="mt-2.5 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Your active profile is shown in the Top-Right Header &amp; Bottom-Left Sidebar once signed in.
            </span>
          </div>
        </div>

        {/* Sign In vs Sign Up Toggle */}
        <div className="px-6 pt-3 flex items-center justify-between text-xs border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`pb-2.5 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                authMode === 'login'
                  ? 'text-white border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`pb-2.5 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                authMode === 'signup'
                  ? 'text-white border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Create Zero-Broker Account
            </button>
          </div>

          <span className="text-[11px] text-emerald-400 font-medium pb-2">
            0% Commission Guarantee
          </span>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 max-h-[64vh] overflow-y-auto space-y-4 scrollbar-thin">
          {authMode === 'login' ? (
            <div className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                  {loginRequiresUpgrade && (
                    <div className="flex flex-wrap items-center gap-2 pl-6">
                      <button
                        type="button"
                        onClick={openSubscriptionModal}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Unlock Paid Profiles (₹1,500/yr)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('user-gouse-01', 'sgouse14@gmail.com')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
                      >
                        <span>Sign in as Gouse AI (Free)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      {useOtpLogin ? 'Registered Mobile Number or Email' : 'Email Address'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUseOtpLogin(!useOtpLogin);
                        setOtpSent(false);
                      }}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      {useOtpLogin ? 'Use Password instead' : 'Verify via 4-digit OTP'}
                    </button>
                  </div>

                  <div className="relative">
                    {useOtpLogin ? (
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    ) : (
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    )}
                    <input
                      type={useOtpLogin ? 'text' : 'email'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="sgouse14@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>

                {useOtpLogin ? (
                  <div>
                    {otpSent ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          4-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 4-digit code"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-amber-400"
                          autoFocus
                        />
                        <p className="text-[11px] text-emerald-400 mt-1">
                          Verification code ready for {loginEmail}.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Request a quick 4-digit verification step for passwordless access.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
                )}

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                    />
                    <span>Remember this device</span>
                  </label>
                  <span className="text-[11px] text-emerald-400">Gouse AI Free · Others Pro</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Signing in...'
                      : useOtpLogin && !otpSent
                      ? 'Request Verification Code'
                      : `Sign In as ${
                          activeRole === 'tenant'
                            ? 'Tenant (0% Fee)'
                            : activeRole === 'property_owner'
                            ? 'Property Owner'
                            : 'Zero-Broker Advisor'
                        }`}
                  </span>
                </button>
              </form>

              {/* Verified Zero-Broker Quick Switcher */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Zero-Broker Profiles</span>
                  </span>
                  {!hasPaidLicense && (
                    <button
                      type="button"
                      onClick={openSubscriptionModal}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline font-medium"
                    >
                      <Crown className="w-3 h-3" />
                      <span>Unlock Other Profiles</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickAccounts.map((acc) => {
                    const Icon = acc.icon;
                    const free = isFreeProfile({ id: acc.id, email: acc.email });
                    const unlocked = canAccessProfile({ id: acc.id, email: acc.email });
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickLogin(acc.id, acc.email)}
                        className={`text-left p-2.5 rounded-xl border transition-colors flex items-start gap-2.5 group ${acc.borderClass}`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 shrink-0 mt-0.5 text-slate-200">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white flex items-center justify-between gap-1">
                            <span className="truncate">{acc.name}</span>
                            {free ? (
                              <span className="text-[10px] font-mono text-emerald-400 shrink-0">Free</span>
                            ) : unlocked ? (
                              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-amber-400 shrink-0">
                                <Lock className="w-3 h-3" />
                                <span>Paid</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-emerald-300 truncate">{acc.subtitle}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{acc.detail}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {signupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero-Broker account created! Opening workspace...</span>
                </div>
              )}

              {signupError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                  {signupRequiresUpgrade && (
                    <div className="pl-6">
                      <button
                        type="button"
                        onClick={openSubscriptionModal}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Activate Pro License (₹1,500/yr)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Rahul Nambiar"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (+91) *</label>
                    <input
                      type="tel"
                      required
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="rahul@domain.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password * (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {activeRole === 'tenant' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Preferred Neighborhood
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={signupLocation}
                        onChange={(e) => setSignupLocation(e.target.value)}
                        placeholder="e.g. Indiranagar, Whitefield, HSR Layout"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'property_owner' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Property Name / Building Location
                    </label>
                    <input
                      type="text"
                      value={signupPropertyDetail}
                      onChange={(e) => setSignupPropertyDetail(e.target.value)}
                      placeholder="e.g. Sai Residency PG (32 Beds) or 3BHK Floor in HSR"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {activeRole === 'broker_agent' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Advisory Cluster / Verification ID
                    </label>
                    <input
                      type="text"
                      value={signupPropertyDetail}
                      onChange={(e) => setSignupPropertyDetail(e.target.value)}
                      placeholder="e.g. East Bangalore Zero-Broker Desk"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  Zero-Brokerage Charter: Direct owner/tenant connection with ₹0 middleman commission. Non-Gouse-AI accounts require a Workspace Pro License (₹1,500/yr).
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Creating Account...'
                      : `Register as ${
                          activeRole === 'tenant'
                            ? 'Tenant (0% Fee)'
                            : activeRole === 'property_owner'
                            ? 'Property Owner (0% Fee)'
                            : 'Zero-Broker Advisor'
                        }`}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>BBMP A-Khata &amp; Direct Owner Verification</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
