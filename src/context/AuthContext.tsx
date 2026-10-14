import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-gouse-01',
    name: 'Gouse AI',
    email: 'sgouse14@gmail.com',
    role: 'owner',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    company: 'Patel BuildTech Turnkey EPC',
    department: 'Civil Construction & Site Execution',
    phone: '+91 94250 55667',
    licenseNumber: 'PWD/CLASS-1/BLR/941',
    isVerified: true,
    createdAt: '2024-04-05T11:00:00Z',
    lastLoginAt: '2024-10-10T08:30:00Z',
  },
];

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  users: UserProfile[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (userId: string) => void;
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
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  openLoginModal: () => void;
  openSignUpModal: () => void;
  isProfileEditorOpen: boolean;
  setIsProfileEditorOpen: (open: boolean) => void;
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

  // Current active user - defaults to null so unauthenticated users see the Client Page first
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const storedUserId = localStorage.getItem('gouse_ai_current_user_id');
      if (storedUserId) {
        const found = users.find((u) => u.id === storedUserId);
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState<boolean>(false);

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

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignUpModal = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: 'Please enter your email address' };
    }

    const matched = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!matched) {
      return {
        success: false,
        error: `No account found with ${trimmed}. Please check the email or create a new account in Sign Up.`,
      };
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
    _password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedName = data.name.trim();

    if (!trimmedName) {
      return { success: false, error: 'Full Name is required' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: `An account already exists with ${trimmedEmail}. Please use Sign In instead.`,
      };
    }

    const roleAvatars: Record<UserRole, string> = {
      owner: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      architect: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      structural_engineer: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
      mep_engineer: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      quantity_surveyor: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
      contractor: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
      client: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    };

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

    setUsers((prev) => [newUser, ...prev]);
    setUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gouse_ai_current_user_id');
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      const updated = { ...target, lastLoginAt: new Date().toISOString() };
      setUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...updates };
    setUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  const loginAsDemo = (userId: string) => {
    const target = users.find((u) => u.id === userId) || INITIAL_USERS.find((u) => u.id === userId);
    if (target) {
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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        users,
        login,
        loginAsDemo,
        signup,
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
