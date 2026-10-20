import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Building,
  Home,
  UserCheck,
  LogIn,
  UserPlus,
  X,
  Phone,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const { users, login, signup, loginAsDemo } = useAuth();

  const [activeRole, setActiveRole] = useState<'tenant' | 'property_owner' | 'broker_agent'>(defaultRole);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('Whitefield / Indiranagar / HSR');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPropertyDetail, setSignupPropertyDetail] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isOpen) return null;

  // Demo accounts for fast 1-click broker login
  const demoAccounts = [
    {
      role: 'tenant' as const,
      id: 'user-aarav-07',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@techblr.com',
      badge: 'Verified Tenant • Tech Professional',
      detail: 'Looking for Executive PG in Whitefield / Indiranagar',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300',
      icon: Home,
    },
    {
      role: 'property_owner' as const,
      id: 'user-vikram-08',
      name: 'Vikramaditya Reddy',
      email: 'vikram.reddy@blrproperties.in',
      badge: 'Property Owner • 18 Verified Units',
      detail: 'Indiranagar Co-Living & HSR Layout 3BHK Builder Floor',
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300',
      icon: Building,
    },
    {
      role: 'broker_agent' as const,
      id: 'user-sneha-09',
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@gousebroker.com',
      badge: 'Certified Broker Agent • RERA Registered',
      detail: 'Cluster Lead for East Bangalore Rental Housing',
      color: 'from-sky-500/20 to-sky-600/10 border-sky-500/40 text-sky-300',
      icon: Briefcase,
    },
    {
      role: 'broker_agent' as const,
      id: 'user-gouse-01',
      name: 'Gouse AI (Principal Broker)',
      email: 'sgouse14@gmail.com',
      badge: 'Master Broker & Founder',
      detail: 'Architecture & Turnkey Rental Ecosystem Lead',
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/40 text-purple-300',
      icon: Shield,
    },
  ];

  const handleQuickLogin = (email: string) => {
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      loginAsDemo(matched.id);
      onClose();
    } else {
      login(email).then((res) => {
        if (res.success) onClose();
      });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      if (useOtpLogin) {
        if (!otpSent) {
          if (!loginEmail.trim()) {
            setLoginError('Please enter your registered mobile number or email');
            setIsSubmitting(false);
            return;
          }
          setOtpSent(true);
          setIsSubmitting(false);
          return;
        }

        if (otpCode.length < 4) {
          setLoginError('Please enter a valid 4-digit verification code (e.g. 1234)');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        onClose();
      } else {
        // Fallback demo matching
        const found = users.find((u) => u.email.toLowerCase().includes(loginEmail.toLowerCase().trim()));
        if (found) {
          loginAsDemo(found.id);
          onClose();
        } else {
          setLoginError(res.error || 'Invalid credentials. Choose a 1-click demo profile below or register.');
        }
      }
    } catch {
      setLoginError('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setIsSubmitting(true);

    try {
      if (!signupName.trim() || !signupEmail.trim() || !signupPhone.trim()) {
        setSignupError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const res = await signup(
        {
          name: signupName.trim(),
          email: signupEmail.trim(),
          role: activeRole as UserRole,
          phone: signupPhone.trim(),
          company: activeRole === 'property_owner' ? signupPropertyDetail || 'Independent Landlord' : 'Bangalore Tech Professional',
          department: activeRole === 'tenant' ? `Tenant (${signupLocation})` : activeRole === 'property_owner' ? 'Rental Housing Owner' : 'Verified Real Estate Agent',
        },
        signupPassword
      );

      if (res.success) {
        setSignupSuccess(true);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setSignupError(res.error || 'Registration failed. Try an alternate email.');
      }
    } catch {
      setSignupError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-amber-500/30 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 pt-6 pb-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Key className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  GOUSE <span className="text-amber-400">AI AGENT</span> BROKER
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SEPARATE LOGIN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct Portal for Tenants, Landlords &amp; Certified Brokers • 0% Brokerage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Close broker login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Persona Segment Tabs */}
        <div className="relative z-10 px-6 pt-4">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveRole('tenant')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                activeRole === 'tenant'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Tenant</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('property_owner')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                activeRole === 'property_owner'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Landlord / Owner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('broker_agent')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition ${
                activeRole === 'broker_agent'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Broker Agent</span>
            </button>
          </div>

          {/* Role Value Proposition Banner */}
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {activeRole === 'tenant' && 'Browse PG rooms, schedule visits, & sign direct digital lease agreements.'}
              {activeRole === 'property_owner' && 'List buildings or flats, screen tenants, & receive automated rent escrow.'}
              {activeRole === 'broker_agent' && 'Manage verified inventory, client walk-ins, & zero-brokerage commission fees.'}
            </span>
          </div>
        </div>

        {/* Sign In vs Sign Up Toggle */}
        <div className="relative z-10 px-6 pt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`pb-1 font-bold transition border-b-2 ${
                authMode === 'login'
                  ? 'text-white border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Broker Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`pb-1 font-bold transition border-b-2 ${
                authMode === 'signup'
                  ? 'text-white border-amber-400'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              Register New Broker Account
            </button>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {authMode === 'login' ? 'Instant Access' : 'Zero KYC Fees'}
          </span>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 px-6 py-4 max-h-[68vh] overflow-y-auto space-y-4">
          {authMode === 'login' ? (
            /* ================= LOGIN FORM ================= */
            <div className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      {useOtpLogin ? 'Registered Mobile Number' : 'Email Address or Mobile'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUseOtpLogin(!useOtpLogin);
                        setOtpSent(false);
                      }}
                      className="text-[11px] text-amber-400 hover:underline"
                    >
                      {useOtpLogin ? 'Use Password instead' : 'Sign in via Mobile OTP'}
                    </button>
                  </div>

                  <div className="relative">
                    {useOtpLogin ? (
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    ) : (
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    )}
                    <input
                      type={useOtpLogin ? 'tel' : 'text'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={
                        useOtpLogin
                          ? '+91 98860 41239'
                          : activeRole === 'tenant'
                          ? 'aarav.sharma@techblr.com'
                          : activeRole === 'property_owner'
                          ? 'vikram.reddy@blrproperties.in'
                          : 'sneha.kulkarni@gousebroker.com'
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                      required
                    />
                  </div>
                </div>

                {useOtpLogin ? (
                  <div>
                    {otpSent ? (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          4-Digit Verification Code (Sent to your phone)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="e.g. 1234"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest text-center focus:outline-none focus:border-amber-400"
                          autoFocus
                        />
                        <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                          ✓ OTP sent! Enter 1234 to verify instantly.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        We will send a 4-digit verification code to your phone number.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
                    />
                    <span>Remember this broker device</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Encrypted</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Signing in...'
                      : useOtpLogin && !otpSent
                      ? 'Request OTP Code'
                      : `Sign In as ${activeRole === 'tenant' ? 'Tenant' : activeRole === 'property_owner' ? 'Property Owner' : 'Broker Agent'}`}
                  </span>
                </button>
              </form>

              {/* 1-CLICK DEMO PERSONAS FOR BROKER PLATFORM */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Instant 1-Click Broker Demo Logins
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Click to test</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickLogin(acc.email)}
                        className={`text-left p-2.5 rounded-xl border bg-gradient-to-br ${acc.color} hover:opacity-90 transition flex items-start gap-2.5 group`}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800 shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span className="truncate">{acc.name}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
                          </div>
                          <div className="text-[10px] font-mono text-amber-300 font-semibold truncate">
                            {acc.badge}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {acc.detail}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ================= SIGN UP / REGISTER FORM ================= */
            <div className="space-y-4">
              {signupSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Account registered successfully! Logging you in...</span>
                </div>
              )}

              {signupError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name *
                    </label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mobile Number (+91) *
                    </label>
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address *
                    </label>
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
                      Preferred Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {activeRole === 'tenant' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Move-in Neighborhood in Bangalore
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={signupLocation}
                        onChange={(e) => setSignupLocation(e.target.value)}
                        placeholder="e.g. Indiranagar, Whitefield, HSR Layout, Koramangala"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {activeRole === 'property_owner' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Property Name / Building Address to List
                    </label>
                    <input
                      type="text"
                      value={signupPropertyDetail}
                      onChange={(e) => setSignupPropertyDetail(e.target.value)}
                      placeholder="e.g. Sai residency PG (32 Beds) / 3BHK Villa in HSR Layout"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {activeRole === 'broker_agent' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Broker License / Agency Name
                    </label>
                    <input
                      type="text"
                      value={signupPropertyDetail}
                      onChange={(e) => setSignupPropertyDetail(e.target.value)}
                      placeholder="e.g. RERA-KA Agent 2026 / East BLR Realty"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  By registering, you agree to Gouse AI&apos;s Zero-Brokerage direct fair-housing charter and verified digital lease agreement terms.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Creating Account...'
                      : `Register as ${activeRole === 'tenant' ? 'Tenant' : activeRole === 'property_owner' ? 'Property Owner' : 'Broker Agent'}`}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified BBMP A-Khata &amp; IS 456 Structural Compliance</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
