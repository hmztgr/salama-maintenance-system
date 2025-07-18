// Profile Self-Management System Types
// Supporting REQ-USER-011 from BRD Addendum

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone?: string;
  language: 'ar' | 'en';
  dateFormat: 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileData?: Record<string, any>;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly' | 'never';
    types: {
      systemUpdates: boolean;
      securityAlerts: boolean;
      visitReminders: boolean;
      contractExpiry: boolean;
      reportGeneration: boolean;
      roleChanges: boolean;
      invitations: boolean;
    };
  };
  inApp: {
    enabled: boolean;
    showOnLogin: boolean;
    types: {
      systemMessages: boolean;
      taskReminders: boolean;
      statusUpdates: boolean;
      announcements: boolean;
    };
  };
  sms?: {
    enabled: boolean;
    phoneNumber?: string;
    types: {
      urgentAlerts: boolean;
      verificationCodes: boolean;
    };
  };
  updatedAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'login' | 'logout' | 'profile_update' | 'password_change' | 'permission_change' | 'data_access' | 'export' | 'import' | 'system_action';
  action: string;
  description: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceType?: string;
    resource?: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    updatedFields?: string[];
    deviceId?: string;
    sessionId?: string;
    exceptCurrent?: boolean;
  };
  timestamp: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  timezone?: string;
  language?: 'ar' | 'en';
  dateFormat?: 'dd-mm-yyyy' | 'mm-dd-yyyy' | 'yyyy-mm-dd';
  profileData?: Record<string, any>;
}

export interface SecuritySettings {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  passwordExpiryDays: number;
  loginNotifications: boolean;
  sessionTimeout: number; // minutes
  trustedDevices: {
    id: string;
    name: string;
    userAgent: string;
    lastUsed: string;
    trusted: boolean;
  }[];
  updatedAt: string;
}

export interface LoginSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
    location?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  startTime: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  logoutTime?: string;
}

export interface ProfileManagementActions {
  // Profile Management
  getProfile: (userId: string) => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  updateProfile: (userId: string, updates: ProfileUpdateRequest) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (userId: string, file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string }>;
  deleteAvatar: (userId: string) => Promise<{ success: boolean; error?: string }>;

  // Password Management
  changePassword: (userId: string, request: PasswordChangeRequest) => Promise<{ success: boolean; error?: string }>;
  validateCurrentPassword: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  getPasswordStrength: (password: string) => PasswordStrengthResult;

  // Notification Preferences
  getNotificationPreferences: (userId: string) => Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }>;
  updateNotificationPreferences: (userId: string, preferences: Partial<NotificationPreferences>) => Promise<{ success: boolean; error?: string }>;
  testNotification: (userId: string, type: 'email' | 'sms') => Promise<{ success: boolean; error?: string }>;

  // Activity History
  getUserActivity: (userId: string, options?: ActivityQueryOptions) => Promise<{ success: boolean; activities?: UserActivity[]; totalCount?: number; error?: string }>;
  exportActivityHistory: (userId: string, format: 'csv' | 'json') => Promise<{ success: boolean; data?: string; error?: string }>;

  // Security Settings
  getSecuritySettings: (userId: string) => Promise<{ success: boolean; settings?: SecuritySettings; error?: string }>;
  updateSecuritySettings: (userId: string, settings: Partial<SecuritySettings>) => Promise<{ success: boolean; error?: string }>;
  getTrustedDevices: (userId: string) => Promise<{ success: boolean; devices?: SecuritySettings['trustedDevices']; error?: string }>;
  removeTrustedDevice: (userId: string, deviceId: string) => Promise<{ success: boolean; error?: string }>;

  // Session Management
  getActiveSessions: (userId: string) => Promise<{ success: boolean; sessions?: LoginSession[]; error?: string }>;
  terminateSession: (userId: string, sessionId: string) => Promise<{ success: boolean; error?: string }>;
  terminateAllSessions: (userId: string, exceptCurrent?: boolean) => Promise<{ success: boolean; error?: string }>;

  // Data Management
  exportPersonalData: (userId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  deletePersonalData: (userId: string, confirmationToken: string) => Promise<{ success: boolean; error?: string }>;
}

export interface PasswordStrengthResult {
  score: number; // 0-5
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    notCommon: boolean;
  };
}

export interface ActivityQueryOptions {
  type?: UserActivity['type'];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  searchQuery?: string;
  includeSuccess?: boolean;
  includeErrors?: boolean;
}

export interface ProfileValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ProfileManagementStats {
  totalLogins: number;
  lastLogin: string;
  profileCompleteness: number; // percentage
  securityScore: number; // 0-100
  notificationsSent: number;
  activeSessions: number;
  trustedDevices: number;
  dataExports: number;
  passwordAge: number; // days
}

export default {};
