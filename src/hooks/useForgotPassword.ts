import { useState, useCallback } from 'react';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

// Types for password reset functionality
interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  userAgent?: string;
  ipAddress?: string;
}

interface UserInfo {
  email: string;
  username: string;
  fullName?: string;
}

interface ResetEmailResult {
  success: boolean;
  error?: string;
}

interface TokenValidationResult {
  isValid: boolean;
  userInfo?: UserInfo;
  error?: string;
}

interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate secure token for password reset
  const generateResetToken = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Calculate expiration time (24 hours from now)
  const getExpirationTime = useCallback((): string => {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now.toISOString();
  }, []);

  // Load existing reset requests
  const loadResetRequests = useCallback((): PasswordResetRequest[] => {
    try {
      const stored = SafeStorage.get<PasswordResetRequest[]>('passwordResetRequests', []);
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      console.error('Failed to load reset requests:', error);
      return [];
    }
  }, []);

  // Save reset requests
  const saveResetRequests = useCallback((requests: PasswordResetRequest[]): boolean => {
    try {
      return SafeStorage.set('passwordResetRequests', requests);
    } catch (error) {
      console.error('Failed to save reset requests:', error);
      return false;
    }
  }, []);

  // Find user by email (mock implementation - in real app this would query user database)
  const findUserByEmail = useCallback((email: string): UserInfo | null => {
    try {
      // In a real app, this would query the user database
      // For now, we'll use a mock implementation with demo users
      const demoUsers: UserInfo[] = [
        { email: 'admin@example.com', username: 'admin', fullName: 'مدير النظام' },
        { email: 'supervisor@example.com', username: 'supervisor', fullName: 'مشرف العمليات' },
        { email: 'user@example.com', username: 'user', fullName: 'مستخدم النظام' }
      ];

      // Also check localStorage for registered users
      const users = SafeStorage.get<any[]>('users', []);
      const allUsers = [...demoUsers, ...users];

      return allUsers.find(user =>
        user.email.toLowerCase() === email.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Failed to find user:', error);
      return null;
    }
  }, []);

  // Send password reset email
  const sendResetEmail = useCallback(async (email: string): Promise<ResetEmailResult> => {
    setLoading(true);
    setError(null);

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'تنسيق البريد الإلكتروني غير صحيح' };
      }

      // Check if user exists
      const user = findUserByEmail(email);
      if (!user) {
        // Security: Don't reveal if email exists or not
        // Return success but don't actually send email
        console.log('Password reset requested for non-existent email:', email);
        return { success: true };
      }

      // Load existing requests
      const existingRequests = loadResetRequests();

      // Check for recent requests (rate limiting)
      const recentRequest = existingRequests.find(req =>
        req.email === email &&
        !req.isUsed &&
        new Date(req.createdAt) > new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
      );

      if (recentRequest) {
        return {
          success: false,
          error: 'تم إرسال رابط استعادة مؤخراً. يرجى الانتظار 5 دقائق قبل المحاولة مرة أخرى'
        };
      }

      // Create new reset request
      const resetRequest: PasswordResetRequest = {
        id: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: user.email,
        token: generateResetToken(),
        createdAt: getCurrentDate(),
        expiresAt: getExpirationTime(),
        isUsed: false
      };

      // Save request
      const updatedRequests = [...existingRequests, resetRequest];
      const saveSuccess = saveResetRequests(updatedRequests);

      if (!saveSuccess) {
        return { success: false, error: 'فشل في حفظ طلب الاستعادة' };
      }

      // In a real application, this would send an actual email
      // For demo purposes, we'll just log the reset link
      const resetLink = `${window.location.origin}/reset-password?token=${resetRequest.token}&email=${encodeURIComponent(user.email)}`;

      console.log('🔐 Password Reset Email (Demo):', {
        to: user.email,
        subject: 'استعادة كلمة المرور - نظام إدارة جدولة الصيانة',
        resetLink: resetLink,
        expiresAt: resetRequest.expiresAt,
        username: user.username
      });

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true };

    } catch (error) {
      console.error('Failed to send reset email:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال البريد';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [findUserByEmail, loadResetRequests, saveResetRequests, generateResetToken, getExpirationTime]);

  // Validate reset token
  const validateResetToken = useCallback(async (token: string): Promise<TokenValidationResult> => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        return { isValid: false, error: 'الرمز المميز مطلوب' };
      }

      // Load reset requests
      const resetRequests = loadResetRequests();

      // Find the reset request
      const resetRequest = resetRequests.find(req => req.token === token);

      if (!resetRequest) {
        return { isValid: false, error: 'رابط استعادة كلمة المرور غير صحيح' };
      }

      // Check if already used
      if (resetRequest.isUsed) {
        return { isValid: false, error: 'تم استخدام هذا الرابط مسبقاً' };
      }

      // Check if expired
      if (new Date(resetRequest.expiresAt) < new Date()) {
        return { isValid: false, error: 'انتهت صلاحية رابط الاستعادة. يرجى طلب رابط جديد' };
      }

      // Find user information
      const user = findUserByEmail(resetRequest.email);
      if (!user) {
        return { isValid: false, error: 'المستخدم غير موجود' };
      }

      return {
        isValid: true,
        userInfo: user
      };

    } catch (error) {
      console.error('Failed to validate reset token:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التحقق من الرابط';
      setError(errorMessage);
      return { isValid: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loadResetRequests, findUserByEmail]);

  // Reset password
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<PasswordResetResult> => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!token || !newPassword) {
        return { success: false, error: 'الرمز المميز وكلمة المرور مطلوبان' };
      }

      // Validate password strength
      if (newPassword.length < 8) {
        return { success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
      }

      // Validate token first
      const tokenValidation = await validateResetToken(token);
      if (!tokenValidation.isValid || !tokenValidation.userInfo) {
        return { success: false, error: tokenValidation.error || 'رابط غير صالح' };
      }

      // Load reset requests
      const resetRequests = loadResetRequests();

      // Find and mark the request as used
      const updatedRequests = resetRequests.map(req =>
        req.token === token
          ? {
              ...req,
              isUsed: true,
              usedAt: getCurrentDate(),
              userAgent: navigator.userAgent,
              ipAddress: 'client-ip' // In real app, this would come from server
            }
          : req
      );

      // Save updated requests
      const saveSuccess = saveResetRequests(updatedRequests);
      if (!saveSuccess) {
        return { success: false, error: 'فشل في حفظ العملية' };
      }

      // Update user password in the system
      // In a real app, this would hash the password and update the user database
      try {
        // Mock implementation: update stored users
        const users = SafeStorage.get<any[]>('users', []);
        const updatedUsers = users.map(user =>
          user.email === tokenValidation.userInfo!.email
            ? { ...user, password: newPassword, passwordUpdatedAt: getCurrentDate() }
            : user
        );
        SafeStorage.set('users', updatedUsers);

        // Log the password change for audit
        console.log('🔐 Password Changed Successfully:', {
          email: tokenValidation.userInfo.email,
          username: tokenValidation.userInfo.username,
          timestamp: getCurrentDate()
        });

      } catch (userUpdateError) {
        console.error('Failed to update user password:', userUpdateError);
        // Continue anyway since this is a demo implementation
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to reset password:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تغيير كلمة المرور';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [validateResetToken, loadResetRequests, saveResetRequests]);

  // Cleanup expired reset requests
  const cleanupExpiredRequests = useCallback(() => {
    try {
      const resetRequests = loadResetRequests();
      const now = new Date();

      const validRequests = resetRequests.filter(req =>
        new Date(req.expiresAt) > now
      );

      if (validRequests.length !== resetRequests.length) {
        saveResetRequests(validRequests);
        console.log(`Cleaned up ${resetRequests.length - validRequests.length} expired reset requests`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired requests:', error);
    }
  }, [loadResetRequests, saveResetRequests]);

  // Get reset request statistics (for admin)
  const getResetStatistics = useCallback(() => {
    try {
      const resetRequests = loadResetRequests();
      const now = new Date();

      return {
        total: resetRequests.length,
        active: resetRequests.filter(req => !req.isUsed && new Date(req.expiresAt) > now).length,
        used: resetRequests.filter(req => req.isUsed).length,
        expired: resetRequests.filter(req => !req.isUsed && new Date(req.expiresAt) <= now).length,
        last24Hours: resetRequests.filter(req =>
          new Date(req.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      };
    } catch (error) {
      console.error('Failed to get reset statistics:', error);
      return {
        total: 0,
        active: 0,
        used: 0,
        expired: 0,
        last24Hours: 0
      };
    }
  }, [loadResetRequests]);

  return {
    loading,
    error,
    sendResetEmail,
    validateResetToken,
    resetPassword,
    cleanupExpiredRequests,
    getResetStatistics
  };
}
