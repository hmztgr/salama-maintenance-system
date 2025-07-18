import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  NotificationPreferences,
  UserActivity,
  SecuritySettings,
  LoginSession,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  ProfileManagementActions,
  PasswordStrengthResult,
  ActivityQueryOptions,
  ProfileManagementStats,
  ProfileValidationErrors
} from '@/types/profile-management';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';
import { useAuth } from '@/contexts/AuthContext';

// Default notification preferences
const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'id' | 'userId' | 'updatedAt'> = {
  email: {
    enabled: true,
    frequency: 'immediate',
    types: {
      systemUpdates: true,
      securityAlerts: true,
      visitReminders: true,
      contractExpiry: true,
      reportGeneration: false,
      roleChanges: true,
      invitations: true
    }
  },
  inApp: {
    enabled: true,
    showOnLogin: true,
    types: {
      systemMessages: true,
      taskReminders: true,
      statusUpdates: true,
      announcements: true
    }
  },
  sms: {
    enabled: false,
    types: {
      urgentAlerts: false,
      verificationCodes: false
    }
  }
};

// Default security settings
const DEFAULT_SECURITY_SETTINGS: Omit<SecuritySettings, 'id' | 'userId' | 'updatedAt'> = {
  twoFactorEnabled: false,
  lastPasswordChange: getCurrentDate(),
  passwordExpiryDays: 90,
  loginNotifications: true,
  sessionTimeout: 60, // 1 hour
  trustedDevices: []
};

export function useProfileManagement(userId?: string): {
  profile: UserProfile | null;
  notificationPreferences: NotificationPreferences | null;
  securitySettings: SecuritySettings | null;
  recentActivity: UserActivity[];
  activeSessions: LoginSession[];
  loading: boolean;
  error: string | null;
  stats: ProfileManagementStats;
  validationErrors: ProfileValidationErrors;
  actions: ProfileManagementActions;
  refreshData: () => void;
} {
  const { authState } = useAuth();
  const currentUserId = userId || authState.user?.id || '';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [activeSessions, setActiveSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ProfileValidationErrors>({});

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Load data from storage
  const loadData = useCallback(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load profile data
      const profiles = SafeStorage.get<UserProfile[]>('userProfiles', []);
      const userProfile = profiles.find(p => p.id === currentUserId);

      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Create default profile from auth user
        if (authState.user) {
          const defaultProfile: UserProfile = {
            id: currentUserId,
            username: authState.user.username,
            email: authState.user.email || `${authState.user.username}@example.com`,
            fullName: authState.user.name || authState.user.username,
            language: 'ar',
            dateFormat: 'dd-mm-yyyy',
            createdAt: getCurrentDate(),
            updatedAt: getCurrentDate()
          };
          setProfile(defaultProfile);

          // Save default profile
          const updatedProfiles = [...profiles, defaultProfile];
          SafeStorage.set('userProfiles', updatedProfiles);
        }
      }

      // Load notification preferences
      const notificationPrefs = SafeStorage.get<NotificationPreferences[]>('notificationPreferences', []);
      const userNotifications = notificationPrefs.find(n => n.userId === currentUserId);

      if (userNotifications) {
        setNotificationPreferences(userNotifications);
      } else {
        // Create default notification preferences
        const defaultNotifications: NotificationPreferences = {
          id: generateId(),
          userId: currentUserId,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          updatedAt: getCurrentDate()
        };
        setNotificationPreferences(defaultNotifications);

        const updatedNotifications = [...notificationPrefs, defaultNotifications];
        SafeStorage.set('notificationPreferences', updatedNotifications);
      }

      // Load security settings
      const securitySettings = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
      const userSecurity = securitySettings.find(s => s.userId === currentUserId);

      if (userSecurity) {
        setSecuritySettings(userSecurity);
      } else {
        // Create default security settings
        const defaultSecurity: SecuritySettings = {
          id: generateId(),
          userId: currentUserId,
          ...DEFAULT_SECURITY_SETTINGS,
          updatedAt: getCurrentDate()
        };
        setSecuritySettings(defaultSecurity);

        const updatedSecurity = [...securitySettings, defaultSecurity];
        SafeStorage.set('securitySettings', updatedSecurity);
      }

      // Load recent activity
      const activities = SafeStorage.get<UserActivity[]>('userActivities', []);
      const userActivities = activities
        .filter(a => a.userId === currentUserId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);
      setRecentActivity(userActivities);

      // Load active sessions
      const sessions = SafeStorage.get<LoginSession[]>('loginSessions', []);
      const userSessions = sessions.filter(s => s.userId === currentUserId && s.isActive);
      setActiveSessions(userSessions);

      setError(null);
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setError('فشل في تحميل بيانات الملف الشخصي');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, authState.user, generateId]);

  // Save data to storage
  const saveData = useCallback((dataType: string, data: any): boolean => {
    try {
      return SafeStorage.set(dataType, data);
    } catch (err) {
      console.error(`Failed to save ${dataType}:`, err);
      setError(`فشل في حفظ ${dataType}`);
      return false;
    }
  }, []);

  // Log user activity
  const logActivity = useCallback((activity: Omit<UserActivity, 'id' | 'userId' | 'timestamp'>): void => {
    try {
      const activities = SafeStorage.get<UserActivity[]>('userActivities', []);
      const newActivity: UserActivity = {
        id: generateId(),
        userId: currentUserId,
        timestamp: getCurrentDate(),
        ...activity
      };

      const updatedActivities = [newActivity, ...activities].slice(0, 1000); // Keep last 1000 activities
      saveData('userActivities', updatedActivities);
      setRecentActivity(prev => [newActivity, ...prev.slice(0, 49)]);
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  }, [currentUserId, generateId, saveData]);

  // Validate profile fields
  const validateProfile = useCallback((updates: ProfileUpdateRequest): ProfileValidationErrors => {
    const errors: ProfileValidationErrors = {};

    if (updates.fullName !== undefined) {
      if (!updates.fullName.trim()) {
        errors.fullName = 'الاسم الكامل مطلوب';
      } else if (updates.fullName.length < 2) {
        errors.fullName = 'الاسم يجب أن يكون حرفين على الأقل';
      }
    }

    if (updates.email !== undefined) {
      if (!updates.email.trim()) {
        errors.email = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        errors.email = 'تنسيق البريد الإلكتروني غير صحيح';
      }
    }

    if (updates.phone !== undefined && updates.phone) {
      if (!/^[\d\s\-\+\(\)]+$/.test(updates.phone)) {
        errors.phone = 'رقم الهاتف غير صحيح';
      }
    }

    return errors;
  }, []);

  // Validate password
  const validatePassword = useCallback((password: string, currentPassword?: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('يجب أن تكون 8 أحرف على الأقل');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('يجب أن تحتوي على رقم واحد على الأقل');
    }

    if (currentPassword && password === currentPassword) {
      errors.push('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية');
    }

    return { isValid: errors.length === 0, errors };
  }, []);

  // Get password strength
  const getPasswordStrength = useCallback((password: string): PasswordStrengthResult => {
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /(?=.*[A-Z])/.test(password),
      hasLowerCase: /(?=.*[a-z])/.test(password),
      hasNumbers: /(?=.*\d)/.test(password),
      hasSpecialChars: /(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password),
      notCommon: !['password', '123456', 'qwerty', 'admin', 'user'].includes(password.toLowerCase())
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let strength: PasswordStrengthResult['strength'];
    let feedback: string[] = [];

    if (score <= 1) {
      strength = 'very-weak';
      feedback.push('كلمة مرور ضعيفة جداً');
    } else if (score <= 2) {
      strength = 'weak';
      feedback.push('كلمة مرور ضعيفة');
    } else if (score <= 3) {
      strength = 'fair';
      feedback.push('كلمة مرور متوسطة');
    } else if (score <= 4) {
      strength = 'good';
      feedback.push('كلمة مرور جيدة');
    } else if (score === 5) {
      strength = 'strong';
      feedback.push('كلمة مرور قوية');
    } else {
      strength = 'very-strong';
      feedback.push('كلمة مرور قوية جداً');
    }

    if (!requirements.minLength) feedback.push('أضف المزيد من الأحرف (8 على الأقل)');
    if (!requirements.hasUpperCase) feedback.push('أضف أحرف كبيرة');
    if (!requirements.hasLowerCase) feedback.push('أضف أحرف صغيرة');
    if (!requirements.hasNumbers) feedback.push('أضف أرقام');
    if (!requirements.hasSpecialChars) feedback.push('أضف رموز خاصة');
    if (!requirements.notCommon) feedback.push('تجنب كلمات المرور الشائعة');

    return { score, strength, feedback, requirements };
  }, []);

  // Calculate profile statistics
  const stats = useMemo((): ProfileManagementStats => {
    const loginActivities = recentActivity.filter(a => a.type === 'login' && a.success);
    const lastLogin = loginActivities[0]?.timestamp || '';

    // Calculate profile completeness
    const requiredFields = ['fullName', 'email'];
    const optionalFields = ['phone', 'jobTitle', 'department', 'location'];

    const completedRequired = requiredFields.filter(field =>
      profile && (profile as any)[field]
    ).length;

    const completedOptional = optionalFields.filter(field =>
      profile && (profile as any)[field]
    ).length;

    const profileCompleteness = Math.round(
      ((completedRequired / requiredFields.length) * 70) +
      ((completedOptional / optionalFields.length) * 30)
    );

    // Calculate security score
    let securityScore = 50; // Base score
    if (securitySettings?.twoFactorEnabled) securityScore += 20;
    if (securitySettings?.loginNotifications) securityScore += 10;
    if (securitySettings?.trustedDevices.length === 0) securityScore += 10;
    if (securitySettings?.sessionTimeout && securitySettings.sessionTimeout <= 60) securityScore += 10;

    const passwordAge = securitySettings?.lastPasswordChange
      ? Math.floor((new Date().getTime() - new Date(securitySettings.lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalLogins: loginActivities.length,
      lastLogin,
      profileCompleteness,
      securityScore: Math.min(securityScore, 100),
      notificationsSent: recentActivity.filter(a => a.type === 'system_action' && a.action.includes('notification')).length,
      activeSessions: activeSessions.length,
      trustedDevices: securitySettings?.trustedDevices.length || 0,
      dataExports: recentActivity.filter(a => a.action.includes('export')).length,
      passwordAge
    };
  }, [profile, securitySettings, recentActivity, activeSessions]);

  // Profile management actions
  const actions: ProfileManagementActions = {
    // Profile Management
    getProfile: async (userId: string) => {
      try {
        const profiles = SafeStorage.get<UserProfile[]>('userProfiles', []);
        const userProfile = profiles.find(p => p.id === userId);

        if (userProfile) {
          return { success: true, profile: userProfile };
        } else {
          return { success: false, error: 'الملف الشخصي غير موجود' };
        }
      } catch (err) {
        return { success: false, error: 'فشل في تحميل الملف الشخصي' };
      }
    },

    updateProfile: async (userId: string, updates: ProfileUpdateRequest) => {
      try {
        const errors = validateProfile(updates);
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return { success: false, error: 'بيانات غير صحيحة' };
        }

        const profiles = SafeStorage.get<UserProfile[]>('userProfiles', []);
        const profileIndex = profiles.findIndex(p => p.id === userId);

        if (profileIndex === -1) {
          return { success: false, error: 'الملف الشخصي غير موجود' };
        }

        const updatedProfile = {
          ...profiles[profileIndex],
          ...updates,
          updatedAt: getCurrentDate()
        };

        profiles[profileIndex] = updatedProfile;
        const saveSuccess = saveData('userProfiles', profiles);

        if (saveSuccess) {
          setProfile(updatedProfile);
          setValidationErrors({});

          // Log activity
          logActivity({
            type: 'profile_update',
            action: 'update_profile',
            description: 'تحديث الملف الشخصي',
            success: true,
            metadata: {
              updatedFields: Object.keys(updates)
            }
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في حفظ البيانات' };
        }
      } catch (err) {
        console.error('Failed to update profile:', err);
        return { success: false, error: 'حدث خطأ أثناء تحديث الملف الشخصي' };
      }
    },

    uploadAvatar: async (userId: string, file: File) => {
      try {
        // In a real app, this would upload to a file service
        // For demo, we'll create a data URL
        const reader = new FileReader();

        return new Promise((resolve) => {
          reader.onload = async (e) => {
            const avatarUrl = e.target?.result as string;

            const updateResult = await actions.updateProfile(userId, { profileData: { avatarUrl } });

            if (updateResult.success) {
              logActivity({
                type: 'profile_update',
                action: 'upload_avatar',
                description: 'تحديث الصورة الشخصية',
                success: true
              });

              resolve({ success: true, avatarUrl });
            } else {
              resolve({ success: false, error: 'فشل في حفظ الصورة' });
            }
          };

          reader.onerror = () => {
            resolve({ success: false, error: 'فشل في قراءة الملف' });
          };

          reader.readAsDataURL(file);
        });
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء رفع الصورة' };
      }
    },

    deleteAvatar: async (userId: string) => {
      try {
        const updateResult = await actions.updateProfile(userId, {
          profileData: { avatarUrl: undefined }
        });

        if (updateResult.success) {
          logActivity({
            type: 'profile_update',
            action: 'delete_avatar',
            description: 'حذف الصورة الشخصية',
            success: true
          });
        }

        return updateResult;
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء حذف الصورة' };
      }
    },

    // Password Management
    changePassword: async (userId: string, request: PasswordChangeRequest) => {
      try {
        // Validate passwords match
        if (request.newPassword !== request.confirmPassword) {
          setValidationErrors({ confirmPassword: 'كلمات المرور غير متطابقة' });
          return { success: false, error: 'كلمات المرور غير متطابقة' };
        }

        // Validate new password
        const passwordValidation = validatePassword(request.newPassword, request.currentPassword);
        if (!passwordValidation.isValid) {
          setValidationErrors({ newPassword: passwordValidation.errors[0] });
          return { success: false, error: passwordValidation.errors[0] };
        }

        // In a real app, this would verify the current password against the database
        // For demo, we'll accept any current password

        // Update security settings
        const securitySettingsArray = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
        const settingsIndex = securitySettingsArray.findIndex(s => s.userId === userId);

        if (settingsIndex !== -1) {
          securitySettingsArray[settingsIndex] = {
            ...securitySettingsArray[settingsIndex],
            lastPasswordChange: getCurrentDate(),
            updatedAt: getCurrentDate()
          };

          const saveSuccess = saveData('securitySettings', securitySettingsArray);

          if (saveSuccess) {
            setSecuritySettings(securitySettingsArray[settingsIndex]);
            setValidationErrors({});

            // Log activity
            logActivity({
              type: 'password_change',
              action: 'change_password',
              description: 'تغيير كلمة المرور',
              success: true
            });

            return { success: true };
          }
        }

        return { success: false, error: 'فشل في تحديث كلمة المرور' };
      } catch (err) {
        console.error('Failed to change password:', err);
        return { success: false, error: 'حدث خطأ أثناء تغيير كلمة المرور' };
      }
    },

    validateCurrentPassword: async (userId: string, password: string) => {
      // In a real app, this would validate against the stored password hash
      // For demo, we'll accept any non-empty password
      if (!password) {
        return { success: false, error: 'كلمة المرور الحالية مطلوبة' };
      }
      return { success: true };
    },

    getPasswordStrength,

    // Notification Preferences
    getNotificationPreferences: async (userId: string) => {
      try {
        const preferences = SafeStorage.get<NotificationPreferences[]>('notificationPreferences', []);
        const userPreferences = preferences.find(p => p.userId === userId);

        if (userPreferences) {
          return { success: true, preferences: userPreferences };
        } else {
          return { success: false, error: 'إعدادات الإشعارات غير موجودة' };
        }
      } catch (err) {
        return { success: false, error: 'فشل في تحميل إعدادات الإشعارات' };
      }
    },

    updateNotificationPreferences: async (userId: string, updates: Partial<NotificationPreferences>) => {
      try {
        const preferences = SafeStorage.get<NotificationPreferences[]>('notificationPreferences', []);
        const preferencesIndex = preferences.findIndex(p => p.userId === userId);

        if (preferencesIndex === -1) {
          return { success: false, error: 'إعدادات الإشعارات غير موجودة' };
        }

        const updatedPreferences = {
          ...preferences[preferencesIndex],
          ...updates,
          updatedAt: getCurrentDate()
        };

        preferences[preferencesIndex] = updatedPreferences;
        const saveSuccess = saveData('notificationPreferences', preferences);

        if (saveSuccess) {
          setNotificationPreferences(updatedPreferences);

          // Log activity
          logActivity({
            type: 'profile_update',
            action: 'update_notifications',
            description: 'تحديث إعدادات الإشعارات',
            success: true
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في حفظ الإعدادات' };
        }
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء تحديث الإعدادات' };
      }
    },

    testNotification: async (userId: string, type: 'email' | 'sms') => {
      try {
        // In a real app, this would send a test notification
        console.log(`📧 Test ${type} notification sent to user ${userId}`);

        // Log activity
        logActivity({
          type: 'system_action',
          action: `test_${type}_notification`,
          description: `إرسال إشعار تجريبي (${type})`,
          success: true
        });

        return { success: true };
      } catch (err) {
        return { success: false, error: 'فشل في إرسال الإشعار التجريبي' };
      }
    },

    // Activity History
    getUserActivity: async (userId: string, options: ActivityQueryOptions = {}) => {
      try {
        const activities = SafeStorage.get<UserActivity[]>('userActivities', []);
        let userActivities = activities.filter(a => a.userId === userId);

        // Apply filters
        if (options.type) {
          userActivities = userActivities.filter(a => a.type === options.type);
        }

        if (options.startDate) {
          userActivities = userActivities.filter(a =>
            new Date(a.timestamp) >= new Date(options.startDate!)
          );
        }

        if (options.endDate) {
          userActivities = userActivities.filter(a =>
            new Date(a.timestamp) <= new Date(options.endDate!)
          );
        }

        if (options.searchQuery) {
          const query = options.searchQuery.toLowerCase();
          userActivities = userActivities.filter(a =>
            a.action.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query)
          );
        }

        if (options.includeSuccess === false) {
          userActivities = userActivities.filter(a => !a.success);
        }

        if (options.includeErrors === false) {
          userActivities = userActivities.filter(a => a.success);
        }

        // Sort by timestamp
        userActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Apply pagination
        const totalCount = userActivities.length;
        const offset = options.offset || 0;
        const limit = options.limit || 50;

        userActivities = userActivities.slice(offset, offset + limit);

        return { success: true, activities: userActivities, totalCount };
      } catch (err) {
        return { success: false, error: 'فشل في تحميل سجل النشاط' };
      }
    },

    exportActivityHistory: async (userId: string, format: 'csv' | 'json') => {
      try {
        const result = await actions.getUserActivity(userId, { limit: 1000 });

        if (!result.success || !result.activities) {
          return { success: false, error: 'فشل في تحميل البيانات' };
        }

        let exportData: string;

        if (format === 'csv') {
          const headers = ['التاريخ', 'النوع', 'الإجراء', 'الوصف', 'النتيجة'];
          const rows = result.activities.map(activity => [
            new Date(activity.timestamp).toLocaleDateString('ar-SA'),
            activity.type,
            activity.action,
            activity.description,
            activity.success ? 'نجح' : 'فشل'
          ]);

          exportData = [headers, ...rows].map(row => row.join(',')).join('\n');
        } else {
          exportData = JSON.stringify(result.activities, null, 2);
        }

        // Log activity
        logActivity({
          type: 'data_access',
          action: 'export_activity_history',
          description: `تصدير سجل النشاط (${format})`,
          success: true
        });

        return { success: true, data: exportData };
      } catch (err) {
        return { success: false, error: 'فشل في تصدير البيانات' };
      }
    },

    // Security Settings
    getSecuritySettings: async (userId: string) => {
      try {
        const settings = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
        const userSettings = settings.find(s => s.userId === userId);

        if (userSettings) {
          return { success: true, settings: userSettings };
        } else {
          return { success: false, error: 'إعدادات الأمان غير موجودة' };
        }
      } catch (err) {
        return { success: false, error: 'فشل في تحميل إعدادات الأمان' };
      }
    },

    updateSecuritySettings: async (userId: string, updates: Partial<SecuritySettings>) => {
      try {
        const settings = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
        const settingsIndex = settings.findIndex(s => s.userId === userId);

        if (settingsIndex === -1) {
          return { success: false, error: 'إعدادات الأمان غير موجودة' };
        }

        const updatedSettings = {
          ...settings[settingsIndex],
          ...updates,
          updatedAt: getCurrentDate()
        };

        settings[settingsIndex] = updatedSettings;
        const saveSuccess = saveData('securitySettings', settings);

        if (saveSuccess) {
          setSecuritySettings(updatedSettings);

          // Log activity
          logActivity({
            type: 'profile_update',
            action: 'update_security_settings',
            description: 'تحديث إعدادات الأمان',
            success: true
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في حفظ الإعدادات' };
        }
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء تحديث إعدادات الأمان' };
      }
    },

    getTrustedDevices: async (userId: string) => {
      try {
        const settings = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
        const userSettings = settings.find(s => s.userId === userId);

        if (userSettings) {
          return { success: true, devices: userSettings.trustedDevices };
        } else {
          return { success: false, error: 'إعدادات الأمان غير موجودة' };
        }
      } catch (err) {
        return { success: false, error: 'فشل في تحميل الأجهزة الموثوقة' };
      }
    },

    removeTrustedDevice: async (userId: string, deviceId: string) => {
      try {
        const settings = SafeStorage.get<SecuritySettings[]>('securitySettings', []);
        const settingsIndex = settings.findIndex(s => s.userId === userId);

        if (settingsIndex === -1) {
          return { success: false, error: 'إعدادات الأمان غير موجودة' };
        }

        const updatedSettings = {
          ...settings[settingsIndex],
          trustedDevices: settings[settingsIndex].trustedDevices.filter(d => d.id !== deviceId),
          updatedAt: getCurrentDate()
        };

        settings[settingsIndex] = updatedSettings;
        const saveSuccess = saveData('securitySettings', settings);

        if (saveSuccess) {
          setSecuritySettings(updatedSettings);

          // Log activity
          logActivity({
            type: 'profile_update',
            action: 'remove_trusted_device',
            description: 'إزالة جهاز موثوق',
            success: true,
            metadata: { deviceId }
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في حفظ الإعدادات' };
        }
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء إزالة الجهاز' };
      }
    },

    // Session Management
    getActiveSessions: async (userId: string) => {
      try {
        const sessions = SafeStorage.get<LoginSession[]>('loginSessions', []);
        const userSessions = sessions.filter(s => s.userId === userId && s.isActive);

        return { success: true, sessions: userSessions };
      } catch (err) {
        return { success: false, error: 'فشل في تحميل الجلسات النشطة' };
      }
    },

    terminateSession: async (userId: string, sessionId: string) => {
      try {
        const sessions = SafeStorage.get<LoginSession[]>('loginSessions', []);
        const sessionIndex = sessions.findIndex(s => s.id === sessionId && s.userId === userId);

        if (sessionIndex === -1) {
          return { success: false, error: 'الجلسة غير موجودة' };
        }

        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          isActive: false,
          logoutTime: getCurrentDate()
        };

        const saveSuccess = saveData('loginSessions', sessions);

        if (saveSuccess) {
          setActiveSessions(prev => prev.filter(s => s.id !== sessionId));

          // Log activity
          logActivity({
            type: 'logout',
            action: 'terminate_session',
            description: 'إنهاء جلسة',
            success: true,
            metadata: { sessionId }
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في إنهاء الجلسة' };
        }
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء إنهاء الجلسة' };
      }
    },

    terminateAllSessions: async (userId: string, exceptCurrent: boolean = true) => {
      try {
        const sessions = SafeStorage.get<LoginSession[]>('loginSessions', []);
        const currentSessionId = sessionStorage.getItem('currentSessionId'); // In real app, this would come from auth context

        const updatedSessions = sessions.map(session => {
          if (session.userId === userId && session.isActive) {
            if (!exceptCurrent || session.id !== currentSessionId) {
              return {
                ...session,
                isActive: false,
                logoutTime: getCurrentDate()
              };
            }
          }
          return session;
        });

        const saveSuccess = saveData('loginSessions', updatedSessions);

        if (saveSuccess) {
          setActiveSessions(prev =>
            exceptCurrent
              ? prev.filter(s => s.id === currentSessionId)
              : []
          );

          // Log activity
          logActivity({
            type: 'logout',
            action: 'terminate_all_sessions',
            description: 'إنهاء جميع الجلسات',
            success: true,
            metadata: { exceptCurrent }
          });

          return { success: true };
        } else {
          return { success: false, error: 'فشل في إنهاء الجلسات' };
        }
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء إنهاء الجلسات' };
      }
    },

    // Data Management
    exportPersonalData: async (userId: string) => {
      try {
        const profileResult = await actions.getProfile(userId);
        const activityResult = await actions.getUserActivity(userId, { limit: 1000 });
        const notificationResult = await actions.getNotificationPreferences(userId);
        const securityResult = await actions.getSecuritySettings(userId);

        const personalData = {
          profile: profileResult.profile,
          activities: activityResult.activities,
          notificationPreferences: notificationResult.preferences,
          securitySettings: securityResult.settings,
          exportDate: getCurrentDate()
        };

        // Log activity
        logActivity({
          type: 'data_access',
          action: 'export_personal_data',
          description: 'تصدير البيانات الشخصية',
          success: true
        });

        return { success: true, data: personalData };
      } catch (err) {
        return { success: false, error: 'فشل في تصدير البيانات الشخصية' };
      }
    },

    deletePersonalData: async (userId: string, confirmationToken: string) => {
      try {
        // In a real app, this would require proper authorization and confirmation
        if (confirmationToken !== 'CONFIRM_DELETE') {
          return { success: false, error: 'رمز التأكيد غير صحيح' };
        }

        // This is a destructive operation and should be implemented carefully
        // For demo, we'll just log it without actually deleting
        logActivity({
          type: 'data_access',
          action: 'request_data_deletion',
          description: 'طلب حذف البيانات الشخصية',
          success: true
        });

        return { success: true };
      } catch (err) {
        return { success: false, error: 'فشل في معالجة طلب الحذف' };
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    profile,
    notificationPreferences,
    securitySettings,
    recentActivity,
    activeSessions,
    loading,
    error,
    stats,
    validationErrors,
    actions,
    refreshData: loadData
  };
}
