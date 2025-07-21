import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { emailService, EmailService } from '@/lib/email/emailService';
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
import { getCurrentDate } from '@/lib/date-handler';

export function useInvitationsFirebase() {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert Firestore timestamp to date string
  const convertTimestamp = (timestamp: any): string => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).replace(/ /g, '-');
    }
    return getCurrentDate();
  };

  // Convert Firestore document to Invitation object
  const convertDocToInvitation = (doc: any): UserInvitation => {
    const data = doc.data();
    return {
      id: doc.id,
      type: data.type,
      email: data.email,
      role: data.role,
      invitedBy: data.invitedBy,
      invitedByName: data.invitedByName,
      customMessage: data.customMessage,
      invitationLink: data.invitationLink,
      linkToken: data.linkToken,
      status: data.status,
      createdAt: convertTimestamp(data.createdAt),
      expiresAt: convertTimestamp(data.expiresAt),
      sentAt: data.sentAt ? convertTimestamp(data.sentAt) : undefined,
      openedAt: data.openedAt ? convertTimestamp(data.openedAt) : undefined,
      acceptedAt: data.acceptedAt ? convertTimestamp(data.acceptedAt) : undefined,
      revokedAt: data.revokedAt ? convertTimestamp(data.revokedAt) : undefined,
      usageLimit: data.usageLimit,
      usageCount: data.usageCount || 0,
      allowedDomains: data.allowedDomains || [],
      lastActivity: data.lastActivity ? convertTimestamp(data.lastActivity) : undefined,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    };
  };

  // Real-time listener for invitations
  useEffect(() => {
    console.log('🔥 Setting up Firebase real-time listener for invitations...');
    setLoading(true);

    const invitationsQuery = query(
      collection(db, 'invitations'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      invitationsQuery,
      (snapshot) => {
        try {
          console.log('🔥 Firebase invitations snapshot received:', snapshot.size, 'documents');
          
          const invitationsData = snapshot.docs.map(convertDocToInvitation);
          
          console.log('📊 Processed invitations data:', invitationsData.length, 'invitations');
          setInvitations(invitationsData);
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error('❌ Error processing invitations snapshot:', err);
          setError('فشل في تحميل بيانات الدعوات');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Firebase invitations listener error:', err);
        setError('فشل في الاتصال بقاعدة البيانات');
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase invitations listener');
      unsubscribe();
    };
  }, []);

  // Generate secure invitation token
  const generateInvitationToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate invitation link
  const generateInvitationLink = (token: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitation?token=${token}`;
  };

  // Calculate expiry date
  const calculateExpiryDate = (days: number): Date => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate;
  };

  // Create email invitation
  const createEmailInvitation = useCallback(
    async (data: Omit<InvitationFormData, 'type'> & { email: string }): Promise<{ success: boolean; invitation?: UserInvitation; error?: string }> => {
      try {
        console.log('📧 Creating email invitation for:', data.email);

        if (!data.email) {
          throw new Error('البريد الإلكتروني مطلوب');
        }

        // Check if email already has pending invitation
        const existingInvitation = invitations.find(
          inv => inv.email === data.email && inv.status === 'pending'
        );

        if (existingInvitation) {
          throw new Error('يوجد دعوة مرسلة مسبقاً لهذا البريد الإلكتروني');
        }

        const token = generateInvitationToken();
        const invitationLink = generateInvitationLink(token);
        const expiryDate = calculateExpiryDate(data.expirationDays);

        const invitationData = {
          type: 'email' as InvitationType,
          email: data.email,
          role: data.role || 'viewer',
          permissionGroups: data.permissionGroups || [],
          invitedBy: 'current-user', // Should come from auth context
          invitedByName: 'النظام', // Should come from auth context
          customMessage: data.customMessage || '',
          invitationLink,
          linkToken: token,
          status: 'pending' as InvitationStatus,
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiryDate),
          usageLimit: 1,
          usageCount: 0,
          allowedDomains: [],
        };

        // Save to Firebase first
        const docRef = await addDoc(collection(db, 'invitations'), invitationData);
        console.log('✅ Invitation saved to Firebase with ID:', docRef.id);

        // Send email
        const emailTemplate = EmailService.generateInvitationContent(
          data.email,
          'النظام',
          data.role || 'viewer',
          invitationLink,
          expiryDate.toLocaleDateString('ar-SA'),
          data.customMessage
        );

        const emailResult = await emailService.sendInvitationEmail(emailTemplate);

        if (emailResult.success) {
          // Update invitation status to 'sent'
          await updateDoc(doc(db, 'invitations', docRef.id), {
            status: 'sent',
            sentAt: serverTimestamp()
          });

          console.log('✅ Email invitation sent successfully');

          const newInvitation: UserInvitation = {
            id: docRef.id,
            ...invitationData,
            createdAt: getCurrentDate(),
            expiresAt: expiryDate.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).replace(/ /g, '-'),
            status: 'sent'
          };

          return { success: true, invitation: newInvitation };
        } else {
          // Email failed, update status
          await updateDoc(doc(db, 'invitations', docRef.id), {
            status: 'pending',
            lastActivity: serverTimestamp()
          });

          throw new Error(emailResult.error || 'فشل في إرسال البريد الإلكتروني');
        }

      } catch (err) {
        console.error('❌ Failed to create email invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إنشاء الدعوة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [invitations]
  );

  // Create link invitation
  const createLinkInvitation = useCallback(
    async (data: Omit<InvitationFormData, 'type' | 'email'>): Promise<{ success: boolean; invitation?: UserInvitation; error?: string }> => {
      try {
        console.log('🔗 Creating link invitation');

        const token = generateInvitationToken();
        const invitationLink = generateInvitationLink(token);
        const expiryDate = calculateExpiryDate(data.expirationDays);

        const invitationData = {
          type: 'link' as InvitationType,
          role: data.role || 'viewer',
          permissionGroups: data.permissionGroups || [],
          invitedBy: 'current-user', // Should come from auth context
          invitedByName: 'النظام', // Should come from auth context
          customMessage: data.customMessage || '',
          invitationLink,
          linkToken: token,
          status: 'pending' as InvitationStatus,
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiryDate),
          usageLimit: data.usageLimit || undefined,
          usageCount: 0,
          allowedDomains: data.allowedDomains || [],
        };

        const docRef = await addDoc(collection(db, 'invitations'), invitationData);
        console.log('✅ Link invitation created with ID:', docRef.id);

        const newInvitation: UserInvitation = {
          id: docRef.id,
          ...invitationData,
          createdAt: getCurrentDate(),
          expiresAt: expiryDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }).replace(/ /g, '-'),
        };

        return { success: true, invitation: newInvitation };

      } catch (err) {
        console.error('❌ Failed to create link invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إنشاء الدعوة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Resend invitation
  const resendInvitation = useCallback(
    async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('🔄 Resending invitation:', invitationId);

        const invitation = invitations.find(inv => inv.id === invitationId);
        if (!invitation) {
          throw new Error('الدعوة غير موجودة');
        }

        if (invitation.type !== 'email' || !invitation.email) {
          throw new Error('يمكن إعادة إرسال الدعوات بالبريد الإلكتروني فقط');
        }

        if (invitation.status === 'accepted' || invitation.status === 'revoked') {
          throw new Error('لا يمكن إعادة إرسال هذه الدعوة');
        }

        // Generate new token and link
        const newToken = generateInvitationToken();
        const newInvitationLink = generateInvitationLink(newToken);

        // Update invitation in Firebase
        await updateDoc(doc(db, 'invitations', invitationId), {
          linkToken: newToken,
          invitationLink: newInvitationLink,
          status: 'pending',
          lastActivity: serverTimestamp()
        });

        // Send email
        const emailTemplate = EmailService.generateInvitationContent(
          invitation.email,
          invitation.invitedByName,
          invitation.role,
          newInvitationLink,
          invitation.expiresAt,
          invitation.customMessage
        );

        const emailResult = await emailService.sendInvitationEmail(emailTemplate);

        if (emailResult.success) {
          // Update status to sent
          await updateDoc(doc(db, 'invitations', invitationId), {
            status: 'sent',
            sentAt: serverTimestamp()
          });

          console.log('✅ Invitation resent successfully');
          return { success: true };
        } else {
          throw new Error(emailResult.error || 'فشل في إعادة إرسال البريد الإلكتروني');
        }

      } catch (err) {
        console.error('❌ Failed to resend invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إعادة إرسال الدعوة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [invitations]
  );

  // Revoke invitation
  const revokeInvitation = useCallback(
    async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('🚫 Revoking invitation:', invitationId);

        await updateDoc(doc(db, 'invitations', invitationId), {
          status: 'revoked',
          revokedAt: serverTimestamp(),
          lastActivity: serverTimestamp()
        });

        console.log('✅ Invitation revoked successfully');
        return { success: true };

      } catch (err) {
        console.error('❌ Failed to revoke invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إلغاء الدعوة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Calculate invitation stats
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

  // Actions object
  const actions: InvitationActions = {
    createEmailInvitation,
    createLinkInvitation,
    resendInvitation,
    revokeInvitation,
    updateInvitation: async () => ({ success: false }), // Placeholder
    validateInvitation: async () => ({ isValid: false }), // Placeholder
    acceptInvitation: async (registrationData: InvitationRegistration): Promise<{ success: boolean; user?: any; error?: string }> => {
      try {
        console.log('👤 Accepting invitation for:', registrationData.email);

        // Find the invitation by token
        const invitation = invitations.find(inv => inv.linkToken === registrationData.invitationToken);
        if (!invitation) {
          throw new Error('الدعوة غير موجودة أو غير صالحة');
        }

        if (invitation.status !== 'sent' && invitation.status !== 'opened') {
          throw new Error('الدعوة غير صالحة أو منتهية الصلاحية');
        }

        // Check if user already exists
        const existingUserQuery = query(
          collection(db, 'users'),
          where('email', '==', registrationData.email)
        );
        const existingUserSnapshot = await getDocs(existingUserQuery);
        
        if (!existingUserSnapshot.empty) {
          throw new Error('يوجد حساب بالفعل لهذا البريد الإلكتروني');
        }

        // Create new user in Firebase
        const newUser = {
          username: registrationData.username,
          email: registrationData.email,
          fullName: registrationData.fullName,
          role: invitation.role || 'viewer',
          permissionGroups: invitation.permissionGroups || [],
          customPermissions: [],
          deniedPermissions: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: invitation.invitedBy || 'system'
        };

        // Add user to Firestore
        const userDocRef = await addDoc(collection(db, 'users'), newUser);
        console.log('✅ User created in Firestore with ID:', userDocRef.id);

        // Update invitation status
        await updateDoc(doc(db, 'invitations', invitation.id), {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          lastActivity: serverTimestamp()
        });

        console.log('✅ Invitation accepted successfully');

        return { 
          success: true, 
          user: {
            id: userDocRef.id,
            ...newUser
          }
        };

      } catch (err) {
        console.error('❌ Failed to accept invitation:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إنشاء الحساب';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    trackInvitationOpened: async () => {}, // Placeholder
    getInvitations: () => invitations, // Return current invitations
    getInvitationById: (id: string) => invitations.find(inv => inv.id === id) || null,
    getInvitationByToken: (token: string) => invitations.find(inv => inv.linkToken === token) || null,
    getInvitationStats: () => stats,
  };

  // Refresh function (compatibility)
  const refreshInvitations = useCallback(() => {
    console.log('🔄 Refresh invitations called (real-time listeners handle this automatically)');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    invitations,
    loading,
    error,
    stats,
    actions,
    refreshInvitations,
    clearError
  };
} 