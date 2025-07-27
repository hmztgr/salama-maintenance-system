'use client';

import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '@/types/auth';
import { SafeStorage } from '@/lib/storage';

// === PHASE 5: SIMPLE DATE REPLACEMENT ===
// Bypassing problematic date-handler with minimal solution

// Simple date replacement - no imports needed
const getSimpleDate = (): string => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = now.getDate().toString().padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
};

interface SimpleUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface SimpleAuthState {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SimpleAuthContext {
  authState: SimpleAuthState;
  login: (credentials: {username: string, password: string}) => Promise<boolean>;
  logout: () => void;
  updateProfile: () => Promise<boolean>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

// Hardcoded users with simple date replacement
const DEFAULT_USERS: SimpleUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@salamasaudi.com',
    role: 'admin',
    name: 'مدير النظام',
    isActive: true,
    createdAt: '01-Jan-2024',
    updatedAt: '01-Jan-2024'
  },
  {
    id: '2',
    username: 'operations_manager',
    email: 'operations@salamasaudi.com',
    role: 'operations_manager',
    name: 'مدير العمليات',
    isActive: true,
    createdAt: '01-Jan-2024',
    updatedAt: '01-Jan-2024'
  },
  {
    id: '3',
    username: 'supervisor',
    email: 'supervisor@salamasaudi.com',
    role: 'supervisor',
    name: 'مشرف الصيانة',
    isActive: true,
    createdAt: '01-Jan-2024',
    updatedAt: '01-Jan-2024'
  },
  {
    id: '4',
    username: 'viewer',
    email: 'viewer@salamasaudi.com',
    role: 'viewer',
    name: 'فني الصيانة',
    isActive: true,
    createdAt: '01-Jan-2024',
    updatedAt: '01-Jan-2024'
  }
];

// Initial state
const initialAuthState: SimpleAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create context
const AuthContext = createContext<SimpleAuthContext | undefined>(undefined);

// Zero-import AuthProvider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<SimpleAuthState>(initialAuthState);

  // Direct localStorage login - no SafeStorage
  const login = async (credentials: {username: string, password: string}): Promise<boolean> => {
    try {
      const user = DEFAULT_USERS.find(u => u.username === credentials.username);
      if (!user || credentials.password.length < 3) {
        return false;
      }

      // Update user with login timestamp using simple date
      const updatedUser = {
        ...user,
        lastLoginAt: getSimpleDate(),
        updatedAt: getSimpleDate(),
      };

      // SafeStorage test - does this break like date-handler?
      SafeStorage.set('currentUser', updatedUser);

      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Simple logout
  const logout = () => {
    try {
      SafeStorage.remove('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
    }

    setAuthState(initialAuthState);
  };

  // Dummy profile update
  const updateProfile = async (): Promise<boolean> => {
    return true;
  };

  // Simple permission check
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!authState.user) return false;

    const roleHierarchy = { viewer: 1, supervisor: 2, operations_manager: 3, admin: 4 };
    const userLevel = roleHierarchy[authState.user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  // Check for existing session on mount - SafeStorage test
  React.useEffect(() => {
    try {
      const savedUser = SafeStorage.get<SimpleUser | null>('currentUser', null);
      if (savedUser) {
        setAuthState({
          user: savedUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Session restore error:', error);
      SafeStorage.remove('currentUser');
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      authState,
      login,
      logout,
      updateProfile,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): SimpleAuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
