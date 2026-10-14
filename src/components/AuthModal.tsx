import React, { useState } from 'react';
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
  Sparkles,
  ArrowRight,
  Compass,
  Briefcase,
  Award,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const {
    user,
    users,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
  } = useAuth();
  const { currentTheme } = useTheme();

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentSuccess, setForgotSentSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmittingLogin(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Failed to sign in. Please verify credentials.');
      } else {
        // Reset
        setLoginEmail('');
        setLoginPassword('');
      }
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'An unexpected error occurred during login');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (signupPassword && signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }

    if (signupPassword && signupConfirmPassword && signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setSignupError('Please agree to the Professional Code of Practice');
      return;
    }

    setIsSubmittingSignup(true);

    try {
      const res = await signup(
        {
          name: signupName,
          email: signupEmail,
          role: signupRole,
          company: signupCompany,
          department: signupDepartment,
          phone: signupPhone,
          licenseNumber: signupLicense,
        },
        signupPassword
      );

      if (!res.success) {
        setSignupError(res.error || 'Registration failed');
      } else {
        setSignupName('');
        setSignupEmail('');
        setSignupCompany('');
        setSignupPhone('');
        setSignupLicense('');
        setSignupPassword('');
        setSignupConfirmPassword('');
      }
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : 'An error occurred during account registration');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setLoginError(null);
    setLoginEmail(email);
    setLoginPassword('••••••••');
    setIsSubmittingLogin(true);
    try {
      await login(email);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      return;
    }
    setForgotSentSuccess(true);
  };

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    owner: { label: 'Principal Architect & Owner', desc: 'Full authority & studio leadership' },
    architect: { label: 'Consulting Architect', desc: 'Architectural planning, CAD & BIM specifications' },
    structural_engineer: { label: 'Structural Engineer', desc: 'RCC, Steel, IS Codes & structural validation' },
    quantity_surveyor: { label: 'Quantity Surveyor (QS)', desc: 'Cost engineering, BOQ audits & rate matrices' },
    contractor: { label: 'Turnkey Contractor', desc: 'Site execution, material procurement & scheduling' },
    client: { label: 'Client / Property Owner', desc: 'Project oversight, approvals & progress tracking' },
    mep_engineer: { label: 'MEP Engineer', desc: 'Mechanical, Electrical & Plumbing systems' },
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsAuthModalOpen(false);
        }
      }}
    >
      <div
        id="auth-modal-container"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
              style={{
                backgroundColor: `rgba(${currentTheme.rgb}, 0.15)`,
                border: `1px solid rgba(${currentTheme.rgb}, 0.4)`,
                color: currentTheme.colors['400'],
              }}
            >
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Gouse AI Workspace
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-semibold border"
                  style={{
                    backgroundColor: `rgba(${currentTheme.rgb}, 0.12)`,
                    borderColor: `rgba(${currentTheme.rgb}, 0.3)`,
                    color: currentTheme.colors['300'],
                  }}
                >
                  Authentication
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in to your architecture &amp; engineering workspace
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={() => setIsAuthModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/40 shrink-0 text-sm font-semibold">
          <button
            id="tab-auth-login"
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setShowForgotPassword(false);
              setLoginError(null);
            }}
            className={`py-3 px-4 text-center transition-all flex items-center justify-center gap-2 border-b-2 ${
              authModalMode === 'login' && !showForgotPassword
                ? 'border-amber-400 text-white bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In</span>
          </button>

          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => {
              setAuthModalMode('signup');
              setShowForgotPassword(false);
              setSignupError(null);
            }}
            className={`py-3 px-4 text-center transition-all flex items-center justify-center gap-2 border-b-2 ${
              authModalMode === 'signup' && !showForgotPassword
                ? 'border-amber-400 text-white bg-slate-800/40 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Create Account (Sign Up)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {/* FORGOT PASSWORD VIEW */}
          {showForgotPassword ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                <KeyRound className="w-4 h-4" />
                <span>Reset Account Password</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered professional work email address to receive a secure password recovery code and workspace access link.
              </p>

              {forgotSentSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Password Reset Link Dispatched</span>
                  </div>
                  <p>
                    A secure recovery link has been simulated for <strong>{forgotEmail}</strong>.
                    You can also log in immediately using the quick-preset options below.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotSentSuccess(false);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/40 hover:bg-emerald-700/60 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Professional Email Address
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      ← Back to Sign In
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                    >
                      <span>Send Recovery Instructions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : authModalMode === 'login' ? (
            /* SIGN IN VIEW */
            <div className="space-y-5 animate-in fade-in duration-150">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{loginError}</p>
                    <p className="text-[11px] text-rose-400">
                      Tip: You can click any of the one-click demo personas below to log in instantly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="input-login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. sgouse14@gmail.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setForgotEmail(loginEmail || 'sgouse14@gmail.com');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="input-login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:outline-none"
                    />
                    <span>Remember this workspace device</span>
                  </label>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg text-slate-950 hover:opacity-95"
                  style={{
                    backgroundColor: currentTheme.colors['400'],
                  }}
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingLogin ? 'Signing In...' : 'Sign In to Workspace'}</span>
                </button>
              </form>

              {/* QUICK ONE-CLICK LOGIN PERSONAS */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Instant Demo Login (Choose Persona)
                  </span>
                  <span className="text-[10px] text-slate-500">Click to switch</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {users.slice(0, 4).map((p) => {
                    const isSelected = user?.email.toLowerCase() === p.email.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleQuickLogin(p.email)}
                        className={`text-left p-2.5 rounded-xl border transition flex items-center gap-2.5 group ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate flex items-center gap-1">
                            <span>{p.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate capitalize">
                            {roleLabels[p.role]?.label || p.role}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Switch to Sign Up */}
              <div className="pt-2 text-center text-xs text-slate-400">
                Don&apos;t have an architectural account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signup');
                    setSignupError(null);
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  Create an account
                </button>
              </div>
            </div>
          ) : (
            /* CREATE ACCOUNT / SIGN UP VIEW */
            <div className="space-y-4 animate-in fade-in duration-150">
              {signupError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{signupError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
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
                        placeholder="e.g. Ar. Gouse Mohiuddin"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Work Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-email"
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@studio.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Role Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Discipline / Professional Role *
                  </label>
                  <select
                    id="select-signup-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="owner">Principal Architect &amp; Studio Director</option>
                    <option value="architect">Project Architect / Designer</option>
                    <option value="structural_engineer">Structural / Civil Engineer</option>
                    <option value="quantity_surveyor">Quantity Surveyor &amp; BOQ Estimator</option>
                    <option value="contractor">Turnkey General Contractor / Builder</option>
                    <option value="client">Client / Property Developer</option>
                    <option value="mep_engineer">MEP &amp; HVAC Consultant</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Firm / Company Name
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-company"
                        type="text"
                        value={signupCompany}
                        onChange={(e) => setSignupCompany(e.target.value)}
                        placeholder="e.g. Gouse Architecture"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      COA / License / Registration ID
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-license"
                        type="text"
                        value={signupLicense}
                        onChange={(e) => setSignupLicense(e.target.value)}
                        placeholder="e.g. CA/2024/99120"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
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
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Department / Specialization
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-department"
                        type="text"
                        value={signupDepartment}
                        onChange={(e) => setSignupDepartment(e.target.value)}
                        placeholder="e.g. High-Rise Planning"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password (min 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        id="input-signup-confirm-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
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
                    I agree to the Gouse AI Professional Practice Code, National Building Code (NBC) adherence standards, and workspace data confidentiality terms.
                  </span>
                </label>

                <button
                  id="btn-submit-signup"
                  type="submit"
                  disabled={isSubmittingSignup}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg text-slate-950 hover:opacity-95 mt-2"
                  style={{
                    backgroundColor: currentTheme.colors['400'],
                  }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingSignup ? 'Creating Account...' : 'Complete Registration & Sign In'}</span>
                </button>
              </form>

              {/* Switch to Sign In */}
              <div className="pt-2 text-center text-xs text-slate-400">
                Already registered with an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setLoginError(null);
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
