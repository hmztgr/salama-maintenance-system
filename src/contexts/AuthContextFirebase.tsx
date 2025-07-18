'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  signInUser,
  signOutUser,
  resetUserPassword,
  getUserProfile,
  updateUserProfile,
  hasRequiredRole,
  FirebaseUserProfile,
} from '@/lib/firebase/auth';
import { UserRole } from '@/types/auth';

interface AuthState {
  user: FirebaseUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<FirebaseUserProfile>) => Promise<boolean>;
  hasPermission: (requiredRole: UserRole) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      try {
        if (firebaseUser) {
          console.log('🔐 User authenticated, loading profile...');

          // Get user profile from Firestore
          const userProfile = await getUserProfile(firebaseUser.uid);

          setAuthState({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('✅ User profile loaded:', userProfile.displayName);
        } else {
          console.log('🔓 User not authenticated');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'حدث خطأ في التحقق من المصادقة',
        });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🔐 Attempting login for:', email);
      const userProfile = await signInUser(email, password);

      console.log('✅ Login successful:', userProfile.displayName);
      return true;

    } catch (error: any) {
      console.error('❌ Login failed:', error);

      let errorMessage = 'فشل تسجيل الدخول';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'البريد الإلكتروني غير مسجل';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'تنسيق البريد الإلكتروني غير صحيح';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'تم تعطيل هذا الحساب';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'محاولات كثيرة جداً، حاول مرة أخرى لاحقاً';
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔓 Logging out user...');
      await signOutUser();
      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'فشل تسجيل الخروج'
      }));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      console.log('📧 Sending password reset email to:', email);
      await resetUserPassword(email);
      console.log('✅ Password reset email sent');

    } catch (error: any) {
      console.error('❌ Password reset failed:', error);

      let errorMessage = 'فشل إرسال رابط استعادة كلمة المرور';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'البريد الإلكتروني غير مسجل';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'تنسيق البريد الإلكتروني غير صحيح';
      }

      throw new Error(errorMessage);
    }
  };

  const updateProfile = async (updates: Partial<FirebaseUserProfile>): Promise<boolean> => {
    try {
      if (!authState.user) {
        throw new Error('لا يوجد مستخدم مسجل دخول');
      }

      console.log('👤 Updating user profile...');
      await updateUserProfile(authState.user.uid, updates);

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));

      console.log('✅ Profile updated successfully');
      return true;

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'فشل تحديث الملف الشخصي'
      }));
      return false;
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!authState.user || !authState.isAuthenticated) {
      return false;
    }

    return hasRequiredRole(authState.user.role, requiredRole);
  };

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    authState,
    login,
    logout,
    resetPassword,
    updateProfile,
    hasPermission,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
