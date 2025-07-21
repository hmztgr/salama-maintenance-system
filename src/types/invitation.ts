// User Invitation System Types
// Supporting REQ-USER-006 and REQ-USER-007 from BRD Addendum

export type InvitationType = 'email' | 'link';
export type InvitationStatus = 'pending' | 'sent' | 'opened' | 'accepted' | 'expired' | 'revoked';
export type UserRole = 'admin' | 'supervisor' | 'viewer';

export interface UserInvitation {
  id: string;
  type: InvitationType;
  email?: string; // For email invitations
  role: UserRole;
  permissionGroups?: string[]; // Permission group IDs
  invitedBy: string; // User ID of who sent the invitation
  invitedByName: string; // Display name of who sent the invitation
  customMessage?: string;

  // Link properties
  invitationLink?: string;
  linkToken: string; // Secure token for the invitation

  // Status and tracking
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  sentAt?: string;
  openedAt?: string;
  acceptedAt?: string;
  revokedAt?: string;

  // Usage tracking
  usageLimit?: number; // For link invitations
  usageCount: number;

  // Email domain restrictions (for link invitations)
  allowedDomains?: string[];

  // Metadata
  lastActivity?: string;
  userAgent?: string; // When opened/accepted
  ipAddress?: string; // When opened/accepted
}

export interface InvitationFormData {
  type: InvitationType;
  email?: string;
  role: UserRole;
  permissionGroups?: string[];
  customMessage?: string;
  expirationDays: number;
  usageLimit?: number;
  allowedDomains?: string[];
}

export interface InvitationStats {
  total: number;
  pending: number;
  sent: number;
  opened: number;
  accepted: number;
  expired: number;
  revoked: number;
  acceptanceRate: number;
  byRole: Record<UserRole, number>;
  byType: Record<InvitationType, number>;
}

export interface EmailInvitationData {
  to: string;
  role: UserRole;
  inviterName: string;
  customMessage?: string;
  invitationLink: string;
  expiresAt: string;
  companyName?: string;
}

export interface LinkInvitationConfig {
  role: UserRole;
  expirationDays: number;
  usageLimit?: number;
  allowedDomains?: string[];
  customMessage?: string;
}

// Invitation validation result
export interface InvitationValidation {
  isValid: boolean;
  invitation?: UserInvitation;
  error?: string;
  errorCode?: 'EXPIRED' | 'REVOKED' | 'USAGE_EXCEEDED' | 'DOMAIN_NOT_ALLOWED' | 'NOT_FOUND';
}

// Registration data when accepting invitation
export interface InvitationRegistration {
  invitationToken: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  profileData?: Record<string, any>;
}

export interface InvitationActions {
  // Create invitations
  createEmailInvitation: (data: Omit<InvitationFormData, 'type'> & { email: string }) => Promise<{ success: boolean; invitation?: UserInvitation; error?: string }>;
  createLinkInvitation: (data: Omit<InvitationFormData, 'type' | 'email'>) => Promise<{ success: boolean; invitation?: UserInvitation; error?: string }>;

  // Manage invitations
  revokeInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  updateInvitation: (invitationId: string, updates: Partial<UserInvitation>) => Promise<{ success: boolean; error?: string }>;

  // Validate and accept
  validateInvitation: (token: string) => Promise<InvitationValidation>;
  acceptInvitation: (registrationData: InvitationRegistration) => Promise<{ success: boolean; user?: any; error?: string }>;

  // Tracking
  trackInvitationOpened: (token: string, metadata?: { userAgent?: string; ipAddress?: string }) => Promise<void>;

  // Query invitations
  getInvitations: (filters?: Partial<{ status: InvitationStatus; type: InvitationType; role: UserRole }>) => UserInvitation[];
  getInvitationById: (id: string) => UserInvitation | null;
  getInvitationByToken: (token: string) => UserInvitation | null;
  getInvitationStats: () => InvitationStats;
}

// Email template data structure
export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailTemplateData {
  inviterName: string;
  recipientEmail: string;
  role: UserRole;
  roleDisplayName: string;
  customMessage?: string;
  invitationLink: string;
  expirationDate: string;
  companyName: string;
  loginUrl: string;
}

// Invitation URL structure
export interface InvitationUrlParams {
  token: string;
  email?: string;
  role?: UserRole;
}

export default {};
