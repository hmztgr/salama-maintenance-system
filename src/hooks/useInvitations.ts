import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserInvitation,
  InvitationFormData,
  InvitationStats,
  InvitationValidation,
  InvitationRegistration,
  InvitationActions,
  InvitationType,
  InvitationStatus,
  UserRole
} from '@/types/invitation';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

export function useInvitations(): {
  invitations: UserInvitation[];
  loading: boolean;
  error: string | null;
  stats: InvitationStats;
  actions: InvitationActions;
  refreshInvitations: () => void;
} {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load invitations from storage
  const loadInvitations = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<UserInvitation[]>('invitations', []);
      const invitationArray = Array.isArray(stored) ? stored : [];
      setInvitations(invitationArray);
      setError(null);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      setInvitations([]);
      setError('فشل في تحميل الدعوات');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save invitations to storage
  const saveInvitations = useCallback((newInvitations: UserInvitation[]): boolean => {
    try {
      const success = SafeStorage.set('invitations', newInvitations);
      if (success) {
        setInvitations(newInvitations);
        setError(null);
        return true;
      } else {
        setError('فشل في حفظ الدعوات');
        return false;
      }
    } catch (err) {
      console.error('Failed to save invitations:', err);
      setError('فشل في حفظ الدعوات');
      return false;
    }
  }, []);

  // Generate secure token for invitations
  const generateToken = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Calculate expiration date
  const getExpirationDate = useCallback((days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }, []);

  // Check if invitation is expired
  const isExpired = useCallback((invitation: UserInvitation): boolean => {
    return new Date(invitation.expiresAt) < new Date();
  }, []);

  // Update invitation status automatically
  const updateExpiredInvitations = useCallback(() => {
    const updated = invitations.map(inv => {
      if (inv.status === 'pending' || inv.status === 'sent' || inv.status === 'opened') {
        if (isExpired(inv)) {
          return { ...inv, status: 'expired' as InvitationStatus };
        }
      }
      return inv;
    });

    // Only save if there were changes
    const hasChanges = updated.some((inv, index) => inv.status !== invitations[index].status);
    if (hasChanges) {
      saveInvitations(updated);
    }
  }, [invitations, isExpired, saveInvitations]);

  // Create email invitation
  const createEmailInvitation = useCallback(async (data: Omit<InvitationFormData, 'type'> & { email: string }) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return { success: false, error: 'تنسيق البريد الإلكتروني غير صحيح' };
      }

      // Check if user already exists (would need user management system)
      // For now, just check if there's already a pending invitation for this email
      const existingInvitation = invitations.find(inv =>
        inv.email === data.email &&
        (inv.status === 'pending' || inv.status === 'sent' || inv.status === 'opened')
      );

      if (existingInvitation) {
        return { success: false, error: 'يوجد دعوة مرسلة بالفعل لهذا البريد الإلكتروني' };
      }

      const invitation: UserInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'email',
        email: data.email,
        role: data.role || 'viewer',
        permissionGroups: data.permissionGroups || [],
        invitedBy: 'current-user-id', // Would get from auth context
        invitedByName: 'المستخدم الحالي', // Would get from auth context
        customMessage: data.customMessage,
        linkToken: generateToken(),
        status: 'pending',
        createdAt: getCurrentDate(),
        expiresAt: getExpirationDate(data.expirationDays),
        usageCount: 0,
        invitationLink: `${window.location.origin}/invitation?token=${generateToken()}`
      };

      const updatedInvitations = [...invitations, invitation];
      const saveSuccess = saveInvitations(updatedInvitations);

      if (saveSuccess) {
        // In a real app, this would send an actual email
        console.log('📧 Email invitation created:', {
          to: data.email,
          role: data.role,
          link: invitation.invitationLink,
          expires: invitation.expiresAt
        });

        // Simulate email sending
        setTimeout(() => {
          const sent = updatedInvitations.map(inv =>
            inv.id === invitation.id
              ? { ...inv, status: 'sent' as InvitationStatus, sentAt: getCurrentDate() }
              : inv
          );
          saveInvitations(sent);
        }, 1000);

        return { success: true, invitation };
      } else {
        return { success: false, error: 'فشل في حفظ الدعوة' };
      }
    } catch (err) {
      console.error('Failed to create email invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء إنشاء الدعوة' };
    }
  }, [invitations, generateToken, getExpirationDate, saveInvitations]);

  // Create link invitation
  const createLinkInvitation = useCallback(async (data: Omit<InvitationFormData, 'type' | 'email'>) => {
    try {
      const token = generateToken();
      const invitation: UserInvitation = {
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'link',
        role: data.role || 'viewer',
        permissionGroups: data.permissionGroups || [],
        invitedBy: 'current-user-id', // Would get from auth context
        invitedByName: 'المستخدم الحالي', // Would get from auth context
        customMessage: data.customMessage,
        linkToken: token,
        status: 'pending',
        createdAt: getCurrentDate(),
        expiresAt: getExpirationDate(data.expirationDays),
        usageLimit: data.usageLimit || 1,
        usageCount: 0,
        allowedDomains: data.allowedDomains,
        invitationLink: `${window.location.origin}/invitation?token=${token}`
      };

      const updatedInvitations = [...invitations, invitation];
      const saveSuccess = saveInvitations(updatedInvitations);

      if (saveSuccess) {
        console.log('🔗 Link invitation created:', {
          role: data.role,
          link: invitation.invitationLink,
          expires: invitation.expiresAt,
          usageLimit: invitation.usageLimit
        });

        return { success: true, invitation };
      } else {
        return { success: false, error: 'فشل في حفظ الدعوة' };
      }
    } catch (err) {
      console.error('Failed to create link invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء إنشاء الدعوة' };
    }
  }, [invitations, generateToken, getExpirationDate, saveInvitations]);

  // Revoke invitation
  const revokeInvitation = useCallback(async (invitationId: string) => {
    try {
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId
          ? {
              ...inv,
              status: 'revoked' as InvitationStatus,
              revokedAt: getCurrentDate()
            }
          : inv
      );

      const saveSuccess = saveInvitations(updatedInvitations);
      return { success: saveSuccess, error: saveSuccess ? undefined : 'فشل في إلغاء الدعوة' };
    } catch (err) {
      console.error('Failed to revoke invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء إلغاء الدعوة' };
    }
  }, [invitations, saveInvitations]);

  // Resend invitation (for email invitations)
  const resendInvitation = useCallback(async (invitationId: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);

      if (!invitation) {
        return { success: false, error: 'الدعوة غير موجودة' };
      }

      if (invitation.type !== 'email') {
        return { success: false, error: 'لا يمكن إعادة إرسال دعوات الروابط' };
      }

      if (invitation.status === 'accepted') {
        return { success: false, error: 'لا يمكن إعادة إرسال دعوة مقبولة' };
      }

      // Update invitation with new token and reset status
      const newToken = generateToken();
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId
          ? {
              ...inv,
              linkToken: newToken,
              status: 'pending' as InvitationStatus,
              sentAt: undefined,
              openedAt: undefined,
              invitationLink: `${window.location.origin}/invitation/${newToken}`
            }
          : inv
      );

      const saveSuccess = saveInvitations(updatedInvitations);

      if (saveSuccess) {
        // Simulate email sending
        setTimeout(() => {
          const sent = updatedInvitations.map(inv =>
            inv.id === invitationId
              ? { ...inv, status: 'sent' as InvitationStatus, sentAt: getCurrentDate() }
              : inv
          );
          saveInvitations(sent);
        }, 1000);

        return { success: true };
      } else {
        return { success: false, error: 'فشل في إعادة إرسال الدعوة' };
      }
    } catch (err) {
      console.error('Failed to resend invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء إعادة إرسال الدعوة' };
    }
  }, [invitations, generateToken, saveInvitations]);

  // Update invitation
  const updateInvitation = useCallback(async (invitationId: string, updates: Partial<UserInvitation>) => {
    try {
      const updatedInvitations = invitations.map(inv =>
        inv.id === invitationId ? { ...inv, ...updates } : inv
      );

      const saveSuccess = saveInvitations(updatedInvitations);
      return { success: saveSuccess, error: saveSuccess ? undefined : 'فشل في تحديث الدعوة' };
    } catch (err) {
      console.error('Failed to update invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء تحديث الدعوة' };
    }
  }, [invitations, saveInvitations]);

  // Validate invitation by token
  const validateInvitation = useCallback(async (token: string): Promise<InvitationValidation> => {
    try {
      const invitation = invitations.find(inv => inv.linkToken === token);

      if (!invitation) {
        return { isValid: false, error: 'الدعوة غير موجودة', errorCode: 'NOT_FOUND' };
      }

      if (invitation.status === 'revoked') {
        return { isValid: false, error: 'تم إلغاء هذه الدعوة', errorCode: 'REVOKED' };
      }

      if (invitation.status === 'accepted') {
        return { isValid: false, error: 'تم قبول هذه الدعوة مسبقاً', errorCode: 'USAGE_EXCEEDED' };
      }

      if (isExpired(invitation)) {
        return { isValid: false, error: 'انتهت صلاحية هذه الدعوة', errorCode: 'EXPIRED' };
      }

      if (invitation.usageLimit && invitation.usageCount >= invitation.usageLimit) {
        return { isValid: false, error: 'تجاوزت هذه الدعوة حد الاستخدام', errorCode: 'USAGE_EXCEEDED' };
      }

      return { isValid: true, invitation };
    } catch (err) {
      console.error('Failed to validate invitation:', err);
      return { isValid: false, error: 'حدث خطأ أثناء التحقق من الدعوة' };
    }
  }, [invitations, isExpired]);

  // Track invitation opened
  const trackInvitationOpened = useCallback(async (token: string, metadata?: { userAgent?: string; ipAddress?: string }) => {
    try {
      const updatedInvitations = invitations.map(inv =>
        inv.linkToken === token && inv.status === 'sent'
          ? {
              ...inv,
              status: 'opened' as InvitationStatus,
              openedAt: getCurrentDate(),
              userAgent: metadata?.userAgent,
              ipAddress: metadata?.ipAddress,
              lastActivity: getCurrentDate()
            }
          : inv
      );

      saveInvitations(updatedInvitations);
    } catch (err) {
      console.error('Failed to track invitation opened:', err);
    }
  }, [invitations, saveInvitations]);

  // Accept invitation and create user account
  const acceptInvitation = useCallback(async (registrationData: InvitationRegistration) => {
    try {
      const validation = await validateInvitation(registrationData.invitationToken);

      if (!validation.isValid || !validation.invitation) {
        return { success: false, error: validation.error };
      }

      // Check domain restrictions for link invitations
      if (validation.invitation.type === 'link' && validation.invitation.allowedDomains?.length) {
        const emailDomain = registrationData.email.split('@')[1];
        if (!validation.invitation.allowedDomains.includes(emailDomain)) {
          return { success: false, error: 'نطاق البريد الإلكتروني غير مسموح لهذه الدعوة' };
        }
      }

      // Create user account (this would integrate with actual user management)
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: registrationData.username,
        email: registrationData.email,
        fullName: registrationData.fullName,
        phone: registrationData.phone,
        role: validation.invitation.role,
        permissionGroups: validation.invitation.permissionGroups || [],
        customPermissions: [],
        deniedPermissions: [],
        isActive: true,
        createdAt: getCurrentDate(),
        invitationId: validation.invitation.id
      };

      // Update invitation status
      const updatedInvitations = invitations.map(inv =>
        inv.id === validation.invitation!.id
          ? {
              ...inv,
              status: 'accepted' as InvitationStatus,
              acceptedAt: getCurrentDate(),
              usageCount: inv.usageCount + 1
            }
          : inv
      );

      const saveSuccess = saveInvitations(updatedInvitations);

      if (saveSuccess) {
        // Here you would save the user to the user management system
        console.log('✅ User account created from invitation:', newUser);
        return { success: true, user: newUser };
      } else {
        return { success: false, error: 'فشل في حفظ بيانات المستخدم' };
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      return { success: false, error: 'حدث خطأ أثناء قبول الدعوة' };
    }
  }, [invitations, validateInvitation, saveInvitations]);

  // Get filtered invitations
  const getInvitations = useCallback((filters?: Partial<{ status: InvitationStatus; type: InvitationType; role: UserRole }>) => {
    if (!filters) return invitations;

    return invitations.filter(inv => {
      if (filters.status && inv.status !== filters.status) return false;
      if (filters.type && inv.type !== filters.type) return false;
      if (filters.role && inv.role !== filters.role) return false;
      return true;
    });
  }, [invitations]);

  // Get invitation by ID
  const getInvitationById = useCallback((id: string) => {
    return invitations.find(inv => inv.id === id) || null;
  }, [invitations]);

  // Get invitation by token
  const getInvitationByToken = useCallback((token: string) => {
    return invitations.find(inv => inv.linkToken === token) || null;
  }, [invitations]);

  // Calculate invitation statistics
  const stats = useMemo((): InvitationStats => {
    const total = invitations.length;
    const pending = invitations.filter(inv => inv.status === 'pending').length;
    const sent = invitations.filter(inv => inv.status === 'sent').length;
    const opened = invitations.filter(inv => inv.status === 'opened').length;
    const accepted = invitations.filter(inv => inv.status === 'accepted').length;
    const expired = invitations.filter(inv => inv.status === 'expired').length;
    const revoked = invitations.filter(inv => inv.status === 'revoked').length;

    const byRole = invitations.reduce((acc, inv) => {
      acc[inv.role] = (acc[inv.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    const byType = invitations.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + 1;
      return acc;
    }, {} as Record<InvitationType, number>);

    return {
      total,
      pending,
      sent,
      opened,
      accepted,
      expired,
      revoked,
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      byRole,
      byType
    };
  }, [invitations]);

  // Actions object implementing InvitationActions interface
  const actions: InvitationActions = {
    createEmailInvitation,
    createLinkInvitation,
    revokeInvitation,
    resendInvitation,
    updateInvitation,
    validateInvitation,
    acceptInvitation,
    trackInvitationOpened,
    getInvitations,
    getInvitationById,
    getInvitationByToken,
    getInvitationStats: () => stats
  };

  // Load invitations on mount
  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  // Update expired invitations periodically
  useEffect(() => {
    const interval = setInterval(updateExpiredInvitations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [updateExpiredInvitations]);

  return {
    invitations,
    loading,
    error,
    stats,
    actions,
    refreshInvitations: loadInvitations
  };
}
