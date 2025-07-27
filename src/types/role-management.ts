// Advanced Role Management System Types
// Supporting REQ-USER-008 and REQ-USER-009 from BRD Addendum

export type UserRole = 'admin' | 'operations_manager' | 'supervisor' | 'viewer';
export type PermissionCategory = 'customer' | 'planning' | 'visits' | 'reports' | 'admin' | 'system';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'manage';

// Individual Permission Definition
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  action: PermissionAction;
  resourceType?: string; // e.g., 'company', 'contract', 'visit'
  isSystemLevel: boolean; // Cannot be modified by regular admins
  isDefault: boolean; // Included in default role definitions
}

// Permission Group for organizing permissions
export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  permissions: string[]; // Permission IDs
  isSystemGroup: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// User with extended role and permission information
export interface ExtendedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  customPermissions: string[]; // Additional permissions beyond role
  deniedPermissions: string[]; // Permissions explicitly denied
  permissionGroups: string[]; // Permission group IDs
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  modifiedBy?: string;
  profileData?: Record<string, any>;
}

// Role Definition with permissions
export interface RoleDefinition {
  role: UserRole;
  name: string;
  description: string;
  defaultPermissions: string[]; // Permission IDs
  isSystemRole: boolean;
  canBeModified: boolean;
  level: number; // Role hierarchy level (higher = more permissions)
}

// Role Change History for audit trail
export interface RoleChangeHistory {
  id: string;
  userId: string;
  username: string;
  previousRole: UserRole;
  newRole: UserRole;
  previousPermissions: string[];
  newPermissions: string[];
  reason?: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  effectiveAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Permission Change History
export interface PermissionChangeHistory {
  id: string;
  userId: string;
  username: string;
  changeType: 'grant' | 'revoke' | 'group_add' | 'group_remove';
  permissionIds: string[];
  groupId?: string;
  reason?: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  effectiveAt: string;
}

// Role Assignment Request
export interface RoleAssignmentRequest {
  userId: string;
  newRole: UserRole;
  customPermissions?: string[];
  deniedPermissions?: string[];
  permissionGroups?: string[];
  reason?: string;
  effectiveAt?: string; // For scheduled role changes
  notifyUser: boolean;
}

// Permission Check Context
export interface PermissionContext {
  userId: string;
  resource?: string;
  resourceId?: string;
  action: PermissionAction;
  category: PermissionCategory;
}

// Permission Check Result
export interface PermissionCheckResult {
  granted: boolean;
  reason: string;
  source: 'role' | 'custom' | 'group' | 'denied';
  permissionId?: string;
  groupId?: string;
}

// Role Management Actions Interface
export interface RoleManagementActions {
  // User Role Management
  assignRole: (request: RoleAssignmentRequest) => Promise<{ success: boolean; error?: string }>;
  getUserRole: (userId: string) => UserRole | null;
  getUserPermissions: (userId: string) => string[];

  // Permission Checking
  hasPermission: (context: PermissionContext) => PermissionCheckResult;
  checkMultiplePermissions: (userId: string, permissions: string[]) => Record<string, PermissionCheckResult>;

  // Permission Groups
  createPermissionGroup: (group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; group?: PermissionGroup; error?: string }>;
  updatePermissionGroup: (groupId: string, updates: Partial<PermissionGroup>) => Promise<{ success: boolean; error?: string }>;
  deletePermissionGroup: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  addUserToGroup: (userId: string, groupId: string) => Promise<{ success: boolean; error?: string }>;
  removeUserFromGroup: (userId: string, groupId: string) => Promise<{ success: boolean; error?: string }>;

  // Custom Permissions
  grantPermission: (userId: string, permissionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  revokePermission: (userId: string, permissionId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;

  // History and Audit
  getRoleHistory: (userId?: string, limit?: number) => RoleChangeHistory[];
  getPermissionHistory: (userId?: string, limit?: number) => PermissionChangeHistory[];

  // Role Definitions
  getRoleDefinitions: () => RoleDefinition[];
  updateRoleDefinition: (role: UserRole, updates: Partial<RoleDefinition>) => Promise<{ success: boolean; error?: string }>;

  // Permission Definitions
  getAllPermissions: () => Permission[];
  getPermissionsByCategory: (category: PermissionCategory) => Permission[];
  createCustomPermission: (permission: Omit<Permission, 'id'>) => Promise<{ success: boolean; permission?: Permission; error?: string }>;

  // User Management
  getAllUsers: () => ExtendedUser[];
  getUserById: (userId: string) => ExtendedUser | null;
  updateUser: (userId: string, updates: Partial<ExtendedUser>) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (userId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  activateUser: (userId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
}

// Role Management Statistics
export interface RoleManagementStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  totalPermissions: number;
  customPermissions: number;
  permissionGroups: number;
  recentRoleChanges: number; // Last 30 days
  recentPermissionChanges: number; // Last 30 days
}

// Role Assignment Validation
export interface RoleAssignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredApprovals?: string[]; // For sensitive role changes
}

// Permission Template for common role setups
export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  targetRole: UserRole;
  permissions: string[];
  groups: string[];
  isSystemTemplate: boolean;
  createdAt: string;
  createdBy: string;
}

// Bulk Role Operations
export interface BulkRoleOperation {
  id: string;
  operation: 'assign_role' | 'grant_permission' | 'revoke_permission' | 'add_to_group' | 'remove_from_group';
  userIds: string[];
  roleOrPermission: string;
  groupId?: string;
  reason?: string;
  scheduledAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: Record<string, { success: boolean; error?: string }>;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

// Role-based UI Configuration
export interface RoleBasedUIConfig {
  role: UserRole;
  hiddenMenuItems: string[];
  disabledFeatures: string[];
  customizations: Record<string, any>;
}

export default {};
