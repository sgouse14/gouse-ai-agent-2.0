import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { AVATARS } from '../utils/mediaAssets';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-gouse-01',
    name: 'Gouse AI',
    email: 'sgouse14@gmail.com',
    role: 'owner',
    avatarUrl: AVATARS.principal,
    company: 'Gouse Architecture & Construction Intelligence',
    department: 'Executive Leadership & Principal Architecture',
    phone: '+91 80739 47241',
    licenseNumber: 'CA/2018/94821 (Council of Architecture)',
    isVerified: true,
    createdAt: '2024-01-15T08:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user-priya-02',
    name: 'Ar. Priya Sharma',
    email: 'priya.sharma@gouseai.com',
    role: 'architect',
    avatarUrl: AVATARS.seniorArchitect,
    company: 'Studio Vellum & Associates',
    department: 'Architectural Planning & Sustainability (LEED AP)',
    phone: '+91 98450 12890',
    licenseNumber: 'CA/2020/11820',
    isVerified: true,
    createdAt: '2024-02-10T10:30:00Z',
    lastLoginAt: '2024-10-12T14:20:00Z',
  },
  {
    id: 'user-rajesh-03',
    name: 'Er. Rajesh Kumar',
    email: 'rajesh.kumar@gouseai.com',
    role: 'structural_engineer',
    avatarUrl: AVATARS.structuralEngineer,
    company: 'Apex Structural Consultants',
    department: 'RCC & Steel Structural Engineering (IS 456 / IS 1893)',
    phone: '+91 80412 89001',
    licenseNumber: 'ISSE/CONS/7821',
    isVerified: true,
    createdAt: '2024-02-18T09:15:00Z',
    lastLoginAt: '2024-10-13T11:45:00Z',
  },
  {
    id: 'user-amit-04',
    name: 'Amit Verma (QS)',
    email: 'amit.verma@gouseai.com',
    role: 'quantity_surveyor',
    avatarUrl: AVATARS.qsDirector,
    company: 'Precision Cost Engineers',
    department: 'BOQ Audits, CPWD Schedule of Rates & Cost Optimization',
    phone: '+91 98112 34567',
    licenseNumber: 'MRICS/QS/30291',
    isVerified: true,
    createdAt: '2024-03-01T12:00:00Z',
    lastLoginAt: '2024-10-11T16:10:00Z',
  },
  {
    id: 'user-sameer-05',
    name: 'Sameer Khan',
    email: 'sameer.khan@prestigeheights.com',
    role: 'client',
    avatarUrl: AVATARS.principal,
    company: 'Prestige Urban Ventures Pvt Ltd',
    department: 'Property Development & Asset Investment',
    phone: '+91 99001 88234',
    licenseNumber: 'CIN: U70102KA2021PTC149802',
    isVerified: true,
    createdAt: '2024-03-15T15:40:00Z',
    lastLoginAt: '2024-10-14T07:15:00Z',
  },
  {
    id: 'user-arun-06',
    name: 'Arun Patel',
    email: 'arun.patel@patelbuildtech.com',
    role: 'contractor',
    avatarUrl: AVATARS.structuralEngineer,
    company: 'Patel BuildTech Turnkey EPC',
    department: 'Civil Construction & Site Execution',
    phone: '+91 94250 55667',
    licenseNumber: 'PWD/CLASS-1/BLR/941',
    isVerified: true,
    createdAt: '2024-04-05T11:00:00Z',
    lastLoginAt: '2024-10-10T08:30:00Z',
  },
  {
    id: 'user-aarav-07',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@techblr.com',
    role: 'tenant',
    avatarUrl: AVATARS.seniorArchitect,
    company: 'Fintech Solutions Bangalore',
    department: 'Software Engineer • Prospective PG / Rental Tenant',
    phone: '+91 98860 41239',
    licenseNumber: 'KYC-BLR-AADHAAR-8902',
    isVerified: true,
    createdAt: '2024-05-10T09:00:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user-vikram-08',
    name: 'Vikramaditya Reddy',
    email: 'vikram.reddy@blrproperties.in',
    role: 'property_owner',
    avatarUrl: AVATARS.structuralEngineer,
    company: 'Reddy Living & Estates',
    department: 'Property Owner / Landlord (Indiranagar & HSR Layout)',
    phone: '+91 98440 22319',
    licenseNumber: 'BBMP/PROP/OWNER-4412',
    isVerified: true,
    createdAt: '2024-05-12T14:30:00Z',
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user-sneha-09',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@gousebroker.com',
    role: 'broker_agent',
    avatarUrl: AVATARS.qsDirector,
    company: 'Zero-Broker Direct Estates',
    department: 'Zero-Broker Advisor (0% Commission) · East Bangalore',
    phone: '+91 99801 77654',
    licenseNumber: 'RERA-KA-ZERO-FEE-2023-081',
    isVerified: true,
    createdAt: '2024-05-15T11:20:00Z',
    lastLoginAt: new Date().toISOString(),
  },
];

const CREDENTIAL_HASH_STORAGE_KEY = 'gouse_ai_credential_hashes_v1';

async function hashCredentialSecret(secret: string, email: string): Promise<string> {
  const normalized = `${email.trim().toLowerCase()}::${secret}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic digest if Web Crypto subtle is unavailable in non-secure test contexts
  let h1 = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    h1 ^= normalized.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
  }
  return `fnv1a_${(h1 >>> 0).toString(16)}`;
}

function loadCredentialHashes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CREDENTIAL_HASH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveCredentialHash(email: string, hash: string): void {
  try {
    const existing = loadCredentialHashes();
    existing[email.trim().toLowerCase()] = hash;
    localStorage.setItem(CREDENTIAL_HASH_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

export const FREE_PROFILE_ID = 'user-gouse-01';
export const TRIAL_DAYS = 180; // 6-month free trial for non-Gouse studio members (BOQ excluded)
export const TRIAL_STORAGE_KEY = 'gouse_ai_trial_starts_v1';
export const ZERO_BROKER_ROLES: UserRole[] = ['property_owner', 'tenant', 'broker_agent'];

export function isFreeProfile(profile?: Pick<UserProfile, 'id' | 'email'> | null): boolean {
  if (!profile) return false;
  return profile.id === FREE_PROFILE_ID || profile.email.toLowerCase() === 'sgouse14@gmail.com';
}

export function isZeroBrokerRole(role?: UserRole | null): boolean {
  if (!role) return false;
  return ZERO_BROKER_ROLES.includes(role);
}

export function isClientRole(role?: UserRole | null): boolean {
  return role === 'client';
}

function loadTrialStarts(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function ensureTrialStart(userId: string): string {
  const existing = loadTrialStarts();
  if (existing[userId]) return existing[userId];
  const nowIso = new Date().toISOString();
  try {
    existing[userId] = nowIso;
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
  return nowIso;
}

function readPaidLicenseStatus(): boolean {
  try {
    const raw = localStorage.getItem('gouse_bim_boq_subscription');
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed?.isSubscribed);
    }
  } catch {
    // ignore storage errors
  }
  return false;
}

export interface TrialStatusInfo {
  isLifetimeFree: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  endsAt: string | null;
  statusLabel: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requiresUpgrade?: boolean;
  useClientPortal?: boolean;
  useZeroBrokerPortal?: boolean;
  isWrongPortal?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hasPaidLicense: boolean;
  users: UserProfile[];
  canAccessProfile: (profile: Pick<UserProfile, 'id' | 'email'> & { role?: UserRole }) => boolean;
  hasBoqAccess: (profile?: Pick<UserProfile, 'id' | 'email' | 'role'> | null) => boolean;
  getTrialStatus: (profile?: Pick<UserProfile, 'id' | 'email' | 'role'> | null) => TrialStatusInfo;
  login: (email: string, password?: string) => Promise<AuthActionResult>;
  quickSignIn: (userId: string) => AuthActionResult;
  signup: (
    data: {
      name: string;
      email: string;
      role: UserRole;
      company?: string;
      department?: string;
      phone?: string;
      licenseNumber?: string;
    },
    password?: string
  ) => Promise<AuthActionResult>;
  loginClientOnly: (email: string, password?: string) => Promise<AuthActionResult>;
  quickSignInClient: (userId: string) => AuthActionResult;
  signupClientOnly: (
    data: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
    },
    password?: string
  ) => Promise<AuthActionResult>;
  loginZeroBrokerOnly: (email: string, password?: string) => Promise<AuthActionResult>;
  quickSignInZeroBroker: (userId: string) => AuthActionResult;
  signupZeroBrokerOnly: (
    data: {
      name: string;
      email: string;
      role: 'property_owner' | 'tenant' | 'broker_agent';
      company?: string;
      phone?: string;
    },
    password?: string
  ) => Promise<AuthActionResult>;
  logout: () => void;
  switchUser: (userId: string) => AuthActionResult;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  openLoginModal: () => void;
  openSignUpModal: () => void;
  isProfileEditorOpen: boolean;
  setIsProfileEditorOpen: (open: boolean) => void;
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  openSubscriptionModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // All registered users (defaults + new sign-ups)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('gouse_ai_registered_users');
      if (stored) {
        const parsed: UserProfile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map((u) => u.id));
          const missingDefaults = INITIAL_USERS.filter((u) => !storedIds.has(u.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  });

  const [hasPaidLicense, setHasPaidLicense] = useState<boolean>(() => readPaidLicenseStatus());

  // Seed 6-month trial start dates for existing studio users if not yet recorded
  useEffect(() => {
    users.forEach((u) => {
      if (!isFreeProfile(u) && !isZeroBrokerRole(u.role) && !isClientRole(u.role)) {
        ensureTrialStart(u.id);
      }
    });
  }, [users]);

  const getTrialStatus = (
    profile?: Pick<UserProfile, 'id' | 'email' | 'role'> | null
  ): TrialStatusInfo => {
    if (!profile) {
      return {
        isLifetimeFree: false,
        isActive: false,
        isExpired: false,
        daysRemaining: 0,
        endsAt: null,
        statusLabel: 'Guest Preview',
      };
    }

    if (isFreeProfile(profile)) {
      return {
        isLifetimeFree: true,
        isActive: true,
        isExpired: false,
        daysRemaining: Infinity,
        endsAt: null,
        statusLabel: 'Lifetime Free',
      };
    }

    if (isZeroBrokerRole(profile.role)) {
      return {
        isLifetimeFree: false,
        isActive: false,
        isExpired: false,
        daysRemaining: 0,
        endsAt: null,
        statusLabel: 'Coming Soon (2028)',
      };
    }

    if (isClientRole(profile.role)) {
      return {
        isLifetimeFree: false,
        isActive: true,
        isExpired: false,
        daysRemaining: TRIAL_DAYS,
        endsAt: null,
        statusLabel: 'Separate Client Portal',
      };
    }

    const startIso = ensureTrialStart(profile.id);
    const startMs = new Date(startIso).getTime();
    const safeStartMs = Number.isNaN(startMs) ? Date.now() : startMs;
    const endMs = safeStartMs + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const msLeft = endMs - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const isTrialActive = daysRemaining > 0;

    if (hasPaidLicense) {
      return {
        isLifetimeFree: false,
        isActive: true,
        isExpired: false,
        daysRemaining: daysRemaining || 365,
        endsAt: new Date(endMs).toISOString(),
        statusLabel: 'Pro & BOQ Active',
      };
    }

    return {
      isLifetimeFree: false,
      isActive: isTrialActive,
      isExpired: !isTrialActive,
      daysRemaining,
      endsAt: new Date(endMs).toISOString(),
      statusLabel: isTrialActive ? `6-Mo Trial (${daysRemaining}d left)` : 'Trial Ended',
    };
  };

  // BOQ & Estimation is NEVER free for non-Gouse accounts unless Pro License is purchased
  const hasBoqAccess = (profile?: Pick<UserProfile, 'id' | 'email' | 'role'> | null): boolean => {
    if (!profile) return false;
    return isFreeProfile(profile) || hasPaidLicense;
  };

  // Current active user - defaults to null until explicitly signed in
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const storedUserId = localStorage.getItem('gouse_ai_current_user_id');
      if (storedUserId) {
        const found = users.find((u) => u.id === storedUserId);
        if (found) {
          if (
            isFreeProfile(found) ||
            isClientRole(found.role) ||
            isZeroBrokerRole(found.role) ||
            readPaidLicenseStatus()
          ) {
            return found;
          }
          const starts = loadTrialStarts();
          const startIso = starts[found.id];
          if (!startIso) {
            return found;
          }
          const endMs = new Date(startIso).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
          if (endMs > Date.now()) {
            return found;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  // Sync subscription state when changed via BimBoqSubscriptionModal or another tab
  useEffect(() => {
    const syncLicense = () => {
      setHasPaidLicense(readPaidLicenseStatus());
    };
    window.addEventListener('gouse_subscription_updated', syncLicense);
    window.addEventListener('storage', syncLicense);
    return () => {
      window.removeEventListener('gouse_subscription_updated', syncLicense);
      window.removeEventListener('storage', syncLicense);
    };
  }, []);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_registered_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // Sync active user ID to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('gouse_ai_current_user_id', user.id);
      } else {
        localStorage.removeItem('gouse_ai_current_user_id');
      }
    } catch {
      // ignore
    }
  }, [user]);

  const canAccessProfile = (profile: Pick<UserProfile, 'id' | 'email'> & { role?: UserRole }): boolean => {
    if (isFreeProfile(profile)) return true;
    if (isClientRole(profile.role)) return true;
    if (isZeroBrokerRole(profile.role)) return true;
    return hasPaidLicense || getTrialStatus({ ...profile, role: profile.role || 'architect' }).isActive;
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignUpModal = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const openSubscriptionModal = () => {
    setIsSubscriptionModalOpen(true);
  };

  const login = async (email: string, password?: string): Promise<AuthActionResult> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter your email address.' };
    }

    const matched = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      return {
        success: false,
        error: `No account found with ${trimmed}. Please verify your email or create a new Studio account.`,
      };
    }

    if (isZeroBrokerRole(matched.role)) {
      return {
        success: false,
        useZeroBrokerPortal: true,
        error:
          'Zero-Broker accounts have a dedicated Separate Zero-Broker Login. Please sign in from Zero-Broker Access (Gouse AI enters without login).',
      };
    }

    if (isClientRole(matched.role)) {
      return {
        success: false,
        useClientPortal: true,
        error:
          'Clients have a dedicated Separate Client Login Portal. Please sign in from the Client Portal (other roles cannot enter Client Login).',
      };
    }

    if (!canAccessProfile(matched)) {
      return {
        success: false,
        requiresUpgrade: true,
        error: `Your 6-month free trial for ${matched.name} has ended. Activate Pro License (₹1,500/yr) or sign in as Gouse AI (Lifetime Free).`,
      };
    }

    const storedHashes = loadCredentialHashes();
    const expectedHash = storedHashes[trimmed];
    if (expectedHash) {
      if (!password) {
        return {
          success: false,
          error: 'Please enter your password to sign in to this account.',
        };
      }
      const providedHash = await hashCredentialSecret(password, trimmed);
      if (providedHash !== expectedHash) {
        return {
          success: false,
          error: 'Incorrect password. Please re-enter your password or reset it.',
        };
      }
    }

    if (!isFreeProfile(matched)) {
      ensureTrialStart(matched.id);
    }

    const updatedUser = {
      ...matched,
      lastLoginAt: new Date().toISOString(),
    };

    setUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const signup = async (
    data: {
      name: string;
      email: string;
      role: UserRole;
      company?: string;
      department?: string;
      phone?: string;
      licenseNumber?: string;
    },
    password?: string
  ): Promise<AuthActionResult> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Full Name is required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (isZeroBrokerRole(data.role)) {
      return {
        success: false,
        useZeroBrokerPortal: true,
        error: 'Zero-Broker accounts must register and sign in through Separate Zero-Broker Login.',
      };
    }
    if (isClientRole(data.role)) {
      return {
        success: false,
        useClientPortal: true,
        error: 'Client accounts must register and sign in through the Separate Client Login Portal.',
      };
    }
    if (password !== undefined && password.trim().length > 0 && password.trim().length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: `An account already exists with ${trimmedEmail}. Please use Sign In instead.`,
      };
    }

    if (password && password.trim().length >= 6) {
      const hash = await hashCredentialSecret(password, trimmedEmail);
      saveCredentialHash(trimmedEmail, hash);
    }

    const roleAvatars: Record<UserRole, string> = {
      owner: AVATARS.principal,
      architect: AVATARS.seniorArchitect,
      structural_engineer: AVATARS.structuralEngineer,
      mep_engineer: AVATARS.seniorArchitect,
      quantity_surveyor: AVATARS.qsDirector,
      contractor: AVATARS.structuralEngineer,
      client: AVATARS.principal,
      broker_agent: AVATARS.qsDirector,
      property_owner: AVATARS.structuralEngineer,
      tenant: AVATARS.seniorArchitect,
    };

    const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newUser: UserProfile = {
      id: newId,
      name: trimmedName,
      email: trimmedEmail,
      role: data.role,
      company: data.company?.trim() || 'Independent Practice',
      department: data.department?.trim() || 'Architecture & Construction',
      phone: data.phone?.trim() || '+91 90000 00000',
      licenseNumber: data.licenseNumber?.trim(),
      avatarUrl: roleAvatars[data.role] || roleAvatars.architect,
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    ensureTrialStart(newId);
    setUsers((prev) => [newUser, ...prev]);
    setUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  // STRICT CLIENT-ONLY SEPARATE LOGIN
  const loginClientOnly = async (email: string, password?: string): Promise<AuthActionResult> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter your Client email address.' };
    }

    const matched = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      return {
        success: false,
        error: `No Client account found for ${trimmed}. Create a Client account below or verify your email.`,
      };
    }

    if (!isClientRole(matched.role)) {
      return {
        success: false,
        isWrongPortal: true,
        error: `Access Denied: Client Access is strictly for Client accounts only. ${
          isFreeProfile(matched) ? 'Gouse AI (sgouse14@gmail.com)' : `${matched.name} (${matched.role.replace('_', ' ')})`
        } cannot log into Client Access—use Studio Login instead.`,
      };
    }

    const storedHashes = loadCredentialHashes();
    const expectedHash = storedHashes[trimmed];
    if (expectedHash) {
      if (!password) {
        return {
          success: false,
          error: 'Please enter your Client password to continue.',
        };
      }
      const providedHash = await hashCredentialSecret(password, trimmed);
      if (providedHash !== expectedHash) {
        return {
          success: false,
          error: 'Incorrect password for this Client account.',
        };
      }
    }

    const updatedClient = {
      ...matched,
      lastLoginAt: new Date().toISOString(),
    };
    setUser(updatedClient);
    setUsers((prev) => prev.map((u) => (u.id === updatedClient.id ? updatedClient : u)));
    return { success: true };
  };

  const quickSignInClient = (userId: string): AuthActionResult => {
    const target = users.find((u) => u.id === userId) || INITIAL_USERS.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Client profile not found.' };
    }
    if (!isClientRole(target.role)) {
      return {
        success: false,
        isWrongPortal: true,
        error: 'Separate Client Login is restricted strictly to Client profiles. Other roles cannot log in here.',
      };
    }
    const updated = { ...target, lastLoginAt: new Date().toISOString() };
    setUser(updated);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      return exists ? prev.map((u) => (u.id === updated.id ? updated : u)) : [...prev, updated];
    });
    return { success: true };
  };

  const signupClientOnly = async (
    data: {
      name: string;
      email: string;
      company?: string;
      phone?: string;
    },
    password?: string
  ): Promise<AuthActionResult> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Full Name is required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid Client email address is required.' };
    }
    if (!password || password.trim().length < 6) {
      return { success: false, error: 'Please enter a password with at least 6 characters.' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      if (!isClientRole(existing.role)) {
        return {
          success: false,
          isWrongPortal: true,
          error: 'This email belongs to a Studio Team account. Studio roles cannot register on Separate Client Login.',
        };
      }
      return {
        success: false,
        error: `A Client account already exists for ${trimmedEmail}. Please use Client Sign In.`,
      };
    }

    const hash = await hashCredentialSecret(password, trimmedEmail);
    saveCredentialHash(trimmedEmail, hash);

    const newClient: UserProfile = {
      id: `user-client-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: 'client',
      company: data.company?.trim() || 'Private Client Commission',
      department: 'Client Stakeholder Portal',
      phone: data.phone?.trim() || '+91 99001 00000',
      avatarUrl: AVATARS.principal,
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => [newClient, ...prev]);
    setUser(newClient);
    return { success: true };
  };

  // STRICT ZERO-BROKER SEPARATE LOGIN (Gouse AI accesses Zero-Broker without login)
  const loginZeroBrokerOnly = async (
    email: string,
    password?: string
  ): Promise<AuthActionResult> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter your Zero-Broker email address.' };
    }

    const matched = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      return {
        success: false,
        error: `No Zero-Broker account found for ${trimmed}. Create a Zero-Broker account below or use Gouse AI Owner Access without login.`,
      };
    }

    if (!isZeroBrokerRole(matched.role)) {
      return {
        success: false,
        isWrongPortal: true,
        error: isFreeProfile(matched)
          ? 'Gouse AI (sgouse14@gmail.com) does not need to log in here — click "Gouse AI Owner Access · Enter Without Login" above.'
          : `Access Denied: Separate Zero-Broker Login is strictly for Zero-Broker accounts (Property Owner, Tenant, Zero-Broker Advisor). ${matched.name} (${matched.role.replace('_', ' ')}) cannot log in here.`,
      };
    }

    const storedHashes = loadCredentialHashes();
    const expectedHash = storedHashes[trimmed];
    if (expectedHash) {
      if (!password) {
        return {
          success: false,
          error: 'Please enter your Zero-Broker password to continue.',
        };
      }
      const providedHash = await hashCredentialSecret(password, trimmed);
      if (providedHash !== expectedHash) {
        return {
          success: false,
          error: 'Incorrect password for this Zero-Broker account.',
        };
      }
    }

    const updatedZb = {
      ...matched,
      lastLoginAt: new Date().toISOString(),
    };
    setUser(updatedZb);
    setUsers((prev) => prev.map((u) => (u.id === updatedZb.id ? updatedZb : u)));
    return { success: true };
  };

  const quickSignInZeroBroker = (userId: string): AuthActionResult => {
    const target = users.find((u) => u.id === userId) || INITIAL_USERS.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Zero-Broker profile not found.' };
    }
    if (!isZeroBrokerRole(target.role)) {
      return {
        success: false,
        isWrongPortal: true,
        error: 'Separate Zero-Broker Login is restricted strictly to Zero-Broker accounts.',
      };
    }
    const updated = { ...target, lastLoginAt: new Date().toISOString() };
    setUser(updated);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      return exists ? prev.map((u) => (u.id === updated.id ? updated : u)) : [...prev, updated];
    });
    return { success: true };
  };

  const signupZeroBrokerOnly = async (
    data: {
      name: string;
      email: string;
      role: 'property_owner' | 'tenant' | 'broker_agent';
      company?: string;
      phone?: string;
    },
    password?: string
  ): Promise<AuthActionResult> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Full Name is required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (!isZeroBrokerRole(data.role)) {
      return {
        success: false,
        isWrongPortal: true,
        error: 'Only Property Owner, Tenant, or Zero-Broker Advisor roles can register here.',
      };
    }
    if (!password || password.trim().length < 6) {
      return { success: false, error: 'Please enter a password with at least 6 characters.' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      if (!isZeroBrokerRole(existing.role)) {
        return {
          success: false,
          isWrongPortal: true,
          error: 'This email belongs to a Studio or Client account and cannot register on Separate Zero-Broker Login.',
        };
      }
      return {
        success: false,
        error: `A Zero-Broker account already exists for ${trimmedEmail}. Please use Zero-Broker Sign In.`,
      };
    }

    const hash = await hashCredentialSecret(password, trimmedEmail);
    saveCredentialHash(trimmedEmail, hash);

    const zbAvatars: Record<'property_owner' | 'tenant' | 'broker_agent', string> = {
      property_owner: AVATARS.structuralEngineer,
      tenant: AVATARS.seniorArchitect,
      broker_agent: AVATARS.qsDirector,
    };

    const newZbUser: UserProfile = {
      id: `user-zb-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      role: data.role,
      company:
        data.company?.trim() ||
        (data.role === 'property_owner'
          ? 'Direct Owner Portfolio (0% Fee)'
          : data.role === 'tenant'
          ? 'Verified Home Seeker'
          : 'Zero-Broker Property Desk'),
      department: 'Zero-Broker Direct Portal (Launching 2028)',
      phone: data.phone?.trim() || '+91 98000 00000',
      avatarUrl: zbAvatars[data.role],
      isVerified: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUsers((prev) => [newZbUser, ...prev]);
    setUser(newZbUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gouse_ai_current_user_id');
  };

  const switchUser = (userId: string): AuthActionResult => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Profile not found.' };
    }
    if (isZeroBrokerRole(target.role)) {
      return {
        success: false,
        useZeroBrokerPortal: true,
        error: 'Zero-Broker accounts sign in via Separate Zero-Broker Login only.',
      };
    }
    if (isClientRole(target.role)) {
      return {
        success: false,
        useClientPortal: true,
        error: 'Clients use the Separate Client Login Portal.',
      };
    }
    if (!canAccessProfile(target)) {
      return {
        success: false,
        requiresUpgrade: true,
        error: `${target.name}'s 6-month trial ended. Activate Pro License (₹1,500/yr) or use Gouse AI (Lifetime Free).`,
      };
    }
    if (!isFreeProfile(target)) {
      ensureTrialStart(target.id);
    }
    const updated = { ...target, lastLoginAt: new Date().toISOString() };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    return { success: true };
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...updates };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const quickSignIn = (userId: string): AuthActionResult => {
    const target = users.find((u) => u.id === userId) || INITIAL_USERS.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Profile not found.' };
    }
    if (isZeroBrokerRole(target.role)) {
      return {
        success: false,
        useZeroBrokerPortal: true,
        error: 'Zero-Broker accounts sign in via Separate Zero-Broker Login only.',
      };
    }
    if (isClientRole(target.role)) {
      return {
        success: false,
        useClientPortal: true,
        error: 'Clients sign in via the Separate Client Login Portal only.',
      };
    }
    if (!canAccessProfile(target)) {
      return {
        success: false,
        requiresUpgrade: true,
        error: `${target.name}'s 6-month free trial ended. Activate Pro License (₹1,500/yr) or sign in as Gouse AI (Lifetime Free).`,
      };
    }
    if (!isFreeProfile(target)) {
      ensureTrialStart(target.id);
    }
    const updated = { ...target, lastLoginAt: new Date().toISOString() };
    setUser(updated);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updated.id);
      if (exists) {
        return prev.map((u) => (u.id === updated.id ? updated : u));
      }
      return [...prev, updated];
    });
    setIsAuthModalOpen(false);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        hasPaidLicense,
        users,
        canAccessProfile,
        hasBoqAccess,
        getTrialStatus,
        login,
        quickSignIn,
        signup,
        loginClientOnly,
        quickSignInClient,
        signupClientOnly,
        loginZeroBrokerOnly,
        quickSignInZeroBroker,
        signupZeroBrokerOnly,
        logout,
        switchUser,
        updateProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openSignUpModal,
        isProfileEditorOpen,
        setIsProfileEditorOpen,
        isSubscriptionModalOpen,
        setIsSubscriptionModalOpen,
        openSubscriptionModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
