import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ExtendedUser,
  Permission,
  PermissionGroup,
  RoleDefinition,
  RoleChangeHistory,
  PermissionChangeHistory,
  RoleAssignmentRequest,
  PermissionContext,
  PermissionCheckResult,
  RoleManagementActions,
  RoleManagementStats,
  UserRole,
  PermissionCategory,
  PermissionAction
} from '@/types/role-management';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

// Default system permissions
const SYSTEM_PERMISSIONS: Permission[] = [
  // Customer Management
  { id: 'customer.create', name: 'إنشاء عملاء', description: 'إضافة عملاء جدد', category: 'customer', action: 'create', isSystemLevel: true, isDefault: true },
  { id: 'customer.read', name: 'عرض العملاء', description: 'عرض بيانات العملاء', category: 'customer', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'customer.update', name: 'تحديث العملاء', description: 'تعديل بيانات العملاء', category: 'customer', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'customer.delete', name: 'حذف العملاء', description: 'حذف العملاء وأرشفتهم', category: 'customer', action: 'delete', isSystemLevel: true, isDefault: true },
  { id: 'customer.export', name: 'تصدير العملاء', description: 'تصدير بيانات العملاء', category: 'customer', action: 'export', isSystemLevel: true, isDefault: true },
  { id: 'customer.import', name: 'استيراد العملاء', description: 'استيراد بيانات العملاء', category: 'customer', action: 'import', isSystemLevel: true, isDefault: true },

  // Planning & Scheduling
  { id: 'planning.create', name: 'إنشاء مواعيد', description: 'جدولة مواعيد جديدة', category: 'planning', action: 'create', isSystemLevel: true, isDefault: true },
  { id: 'planning.read', name: 'عرض الجدولة', description: 'عرض الجداول والمواعيد', category: 'planning', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'planning.update', name: 'تحديث الجدولة', description: 'تعديل المواعيد والجداول', category: 'planning', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'planning.delete', name: 'حذف المواعيد', description: 'حذف المواعيد المجدولة', category: 'planning', action: 'delete', isSystemLevel: true, isDefault: true },

  // Visit Management
  { id: 'visits.create', name: 'إنشاء زيارات', description: 'إضافة زيارات جديدة', category: 'visits', action: 'create', isSystemLevel: true, isDefault: true },
  { id: 'visits.read', name: 'عرض الزيارات', description: 'عرض تفاصيل الزيارات', category: 'visits', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'visits.update', name: 'تحديث الزيارات', description: 'تعديل تفاصيل الزيارات', category: 'visits', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'visits.delete', name: 'حذف الزيارات', description: 'حذف الزيارات', category: 'visits', action: 'delete', isSystemLevel: true, isDefault: true },

  // Reports
  { id: 'reports.read', name: 'عرض التقارير', description: 'عرض التقارير والإحصائيات', category: 'reports', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'reports.export', name: 'تصدير التقارير', description: 'تصدير التقارير', category: 'reports', action: 'export', isSystemLevel: true, isDefault: true },
  { id: 'reports.manage', name: 'إدارة التقارير', description: 'إنشاء وتخصيص التقارير', category: 'reports', action: 'manage', isSystemLevel: true, isDefault: true },

  // Admin Functions
  { id: 'admin.users.create', name: 'إنشاء مستخدمين', description: 'إضافة مستخدمين جدد', category: 'admin', action: 'create', isSystemLevel: true, isDefault: true },
  { id: 'admin.users.read', name: 'عرض المستخدمين', description: 'عرض قائمة المستخدمين', category: 'admin', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'admin.users.update', name: 'تحديث المستخدمين', description: 'تعديل بيانات المستخدمين', category: 'admin', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'admin.users.delete', name: 'حذف المستخدمين', description: 'حذف حسابات المستخدمين', category: 'admin', action: 'delete', isSystemLevel: true, isDefault: true },
  { id: 'admin.roles.manage', name: 'إدارة الأدوار', description: 'تعديل الأدوار والصلاحيات', category: 'admin', action: 'manage', isSystemLevel: true, isDefault: true },
  { id: 'admin.invitations.manage', name: 'إدارة الدعوات', description: 'إرسال وإدارة دعوات المستخدمين', category: 'admin', action: 'manage', isSystemLevel: true, isDefault: true },

  // System Functions
  { id: 'system.settings.read', name: 'عرض الإعدادات', description: 'عرض إعدادات النظام', category: 'system', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'system.settings.update', name: 'تحديث الإعدادات', description: 'تعديل إعدادات النظام', category: 'system', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'system.backup.manage', name: 'إدارة النسخ الاحتياطي', description: 'إنشاء واستعادة النسخ الاحتياطي', category: 'system', action: 'manage', isSystemLevel: true, isDefault: true },
  { id: 'system.audit.read', name: 'عرض سجل التدقيق', description: 'عرض سجلات النشاط والتدقيق', category: 'system', action: 'read', isSystemLevel: true, isDefault: true }
];

// Default role definitions
const DEFAULT_ROLES: RoleDefinition[] = [
  {
    role: 'admin',
    name: 'مدير النظام',
    description: 'صلاحيات كاملة لجميع وظائف النظام',
    defaultPermissions: SYSTEM_PERMISSIONS.map(p => p.id),
    isSystemRole: true,
    canBeModified: false,
    level: 3
  },
  {
    role: 'supervisor',
    name: 'مشرف',
    description: 'إدارة العمليات والجدولة والتقارير',
    defaultPermissions: [
      'customer.create', 'customer.read', 'customer.update', 'customer.export', 'customer.import',
      'planning.create', 'planning.read', 'planning.update', 'planning.delete',
      'visits.create', 'visits.read', 'visits.update', 'visits.delete',
      'reports.read', 'reports.export', 'reports.manage'
    ],
    isSystemRole: true,
    canBeModified: true,
    level: 2
  },
  {
    role: 'viewer',
    name: 'مستخدم',
    description: 'عرض البيانات والتقارير فقط',
    defaultPermissions: [
      'customer.read', 'planning.read', 'visits.read', 'reports.read'
    ],
    isSystemRole: true,
    canBeModified: true,
    level: 1
  }
];

export function useRoleManagement(): {
  users: ExtendedUser[];
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
  roleDefinitions: RoleDefinition[];
  roleHistory: RoleChangeHistory[];
  permissionHistory: PermissionChangeHistory[];
  loading: boolean;
  error: string | null;
  stats: RoleManagementStats;
  actions: RoleManagementActions;
  refreshData: () => void;
} {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>(SYSTEM_PERMISSIONS);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [roleHistory, setRoleHistory] = useState<RoleChangeHistory[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<PermissionChangeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage
  const loadData = useCallback(() => {
    try {
      setLoading(true);

      // Load users (combine with basic auth users)
      const basicUsers = SafeStorage.get<any[]>('users', []);
      const extendedUsers = SafeStorage.get<ExtendedUser[]>('extendedUsers', []);

      // Convert basic users to extended format if needed
      const allUsers = basicUsers.map(user => {
        const existingExtended = extendedUsers.find(eu => eu.username === user.username);
        if (existingExtended) {
          return existingExtended;
        }

        // Convert basic user to extended format
        const roleMapping: Record<string, UserRole> = {
          'admin': 'admin',
          'supervisor': 'supervisor',
          'viewer': 'viewer'
        };

        return {
          id: user.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          username: user.username,
          email: user.email || `${user.username}@example.com`,
          fullName: user.name || user.username,
          phone: user.phone,
          role: roleMapping[user.role] || 'viewer',
          customPermissions: [],
          deniedPermissions: [],
          permissionGroups: [],
          isActive: true,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt || getCurrentDate(),
          updatedAt: getCurrentDate(),
          createdBy: 'system'
        } as ExtendedUser;
      });

      setUsers(allUsers);
      setPermissions(SafeStorage.get<Permission[]>('permissions', SYSTEM_PERMISSIONS));
      setPermissionGroups(SafeStorage.get<PermissionGroup[]>('permissionGroups', []));
      setRoleDefinitions(SafeStorage.get<RoleDefinition[]>('roleDefinitions', DEFAULT_ROLES));
      setRoleHistory(SafeStorage.get<RoleChangeHistory[]>('roleHistory', []));
      setPermissionHistory(SafeStorage.get<PermissionChangeHistory[]>('permissionHistory', []));

      setError(null);
    } catch (err) {
      console.error('Failed to load role management data:', err);
      setError('فشل في تحميل بيانات إدارة الأدوار');
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Generate unique ID
  const generateId = useCallback((): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Get current user (for audit trail)
  const getCurrentUser = useCallback((): { id: string; name: string } => {
    // In a real app, this would come from auth context
    return { id: 'current-user', name: 'المستخدم الحالي' };
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((context: PermissionContext): PermissionCheckResult => {
    const user = users.find(u => u.id === context.userId);
    if (!user || !user.isActive) {
      return { granted: false, reason: 'المستخدم غير موجود أو غير نشط', source: 'role' };
    }

    const permissionId = `${context.category}.${context.action}`;

    // Check if explicitly denied
    if (user.deniedPermissions.includes(permissionId)) {
      return { granted: false, reason: 'الصلاحية مرفوضة صراحة', source: 'denied', permissionId };
    }

    // Check custom permissions
    if (user.customPermissions.includes(permissionId)) {
      return { granted: true, reason: 'صلاحية مخصصة', source: 'custom', permissionId };
    }

    // Check permission groups
    for (const groupId of user.permissionGroups) {
      const group = permissionGroups.find(g => g.id === groupId);
      if (group && group.permissions.includes(permissionId)) {
        return { granted: true, reason: 'صلاحية من مجموعة', source: 'group', permissionId, groupId };
      }
    }

    // Check role permissions
    const roleDefinition = roleDefinitions.find(r => r.role === user.role);
    if (roleDefinition && roleDefinition.defaultPermissions.includes(permissionId)) {
      return { granted: true, reason: 'صلاحية الدور', source: 'role', permissionId };
    }

    return { granted: false, reason: 'لا توجد صلاحية', source: 'role' };
  }, [users, permissionGroups, roleDefinitions]);

  // Assign role to user
  const assignRole = useCallback(async (request: RoleAssignmentRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = users.find(u => u.id === request.userId);
      if (!user) {
        return { success: false, error: 'المستخدم غير موجود' };
      }

      const currentUser = getCurrentUser();
      const previousRole = user.role;
      const previousPermissions = [...user.customPermissions];

      // Create role change history entry
      const historyEntry: RoleChangeHistory = {
        id: generateId(),
        userId: user.id,
        username: user.username,
        previousRole,
        newRole: request.newRole,
        previousPermissions,
        newPermissions: request.customPermissions || [],
        reason: request.reason,
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        changedAt: getCurrentDate(),
        effectiveAt: request.effectiveAt || getCurrentDate()
      };

      // Update user
      const updatedUser: ExtendedUser = {
        ...user,
        role: request.newRole,
        customPermissions: request.customPermissions || user.customPermissions,
        deniedPermissions: request.deniedPermissions || user.deniedPermissions,
        permissionGroups: request.permissionGroups || user.permissionGroups,
        updatedAt: getCurrentDate(),
        modifiedBy: currentUser.id
      };

      const updatedUsers = users.map(u => u.id === request.userId ? updatedUser : u);
      const updatedHistory = [...roleHistory, historyEntry];

      // Save to storage
      const saveSuccess = saveData('extendedUsers', updatedUsers) && saveData('roleHistory', updatedHistory);

      if (saveSuccess) {
        setUsers(updatedUsers);
        setRoleHistory(updatedHistory);
        return { success: true };
      } else {
        return { success: false, error: 'فشل في حفظ البيانات' };
      }
    } catch (err) {
      console.error('Failed to assign role:', err);
      return { success: false, error: 'حدث خطأ أثناء تعيين الدور' };
    }
  }, [users, roleHistory, getCurrentUser, generateId, saveData]);

  // Create permission group
  const createPermissionGroup = useCallback(async (group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; group?: PermissionGroup; error?: string }> => {
    try {
      const currentUser = getCurrentUser();
      const newGroup: PermissionGroup = {
        ...group,
        id: generateId(),
        createdAt: getCurrentDate(),
        updatedAt: getCurrentDate(),
        createdBy: currentUser.id
      };

      const updatedGroups = [...permissionGroups, newGroup];
      const saveSuccess = saveData('permissionGroups', updatedGroups);

      if (saveSuccess) {
        setPermissionGroups(updatedGroups);
        return { success: true, group: newGroup };
      } else {
        return { success: false, error: 'فشل في حفظ المجموعة' };
      }
    } catch (err) {
      console.error('Failed to create permission group:', err);
      return { success: false, error: 'حدث خطأ أثناء إنشاء المجموعة' };
    }
  }, [permissionGroups, getCurrentUser, generateId, saveData]);

  // Grant custom permission
  const grantPermission = useCallback(async (userId: string, permissionId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        return { success: false, error: 'المستخدم غير موجود' };
      }

      if (user.customPermissions.includes(permissionId)) {
        return { success: false, error: 'المستخدم يملك هذه الصلاحية بالفعل' };
      }

      const currentUser = getCurrentUser();

      // Create permission change history
      const historyEntry: PermissionChangeHistory = {
        id: generateId(),
        userId: user.id,
        username: user.username,
        changeType: 'grant',
        permissionIds: [permissionId],
        reason,
        changedBy: currentUser.id,
        changedByName: currentUser.name,
        changedAt: getCurrentDate(),
        effectiveAt: getCurrentDate()
      };

      // Update user
      const updatedUser = {
        ...user,
        customPermissions: [...user.customPermissions, permissionId],
        deniedPermissions: user.deniedPermissions.filter(p => p !== permissionId), // Remove from denied if present
        updatedAt: getCurrentDate(),
        modifiedBy: currentUser.id
      };

      const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
      const updatedHistory = [...permissionHistory, historyEntry];

      const saveSuccess = saveData('extendedUsers', updatedUsers) && saveData('permissionHistory', updatedHistory);

      if (saveSuccess) {
        setUsers(updatedUsers);
        setPermissionHistory(updatedHistory);
        return { success: true };
      } else {
        return { success: false, error: 'فشل في حفظ البيانات' };
      }
    } catch (err) {
      console.error('Failed to grant permission:', err);
      return { success: false, error: 'حدث خطأ أثناء منح الصلاحية' };
    }
  }, [users, permissionHistory, getCurrentUser, generateId, saveData]);

  // Calculate statistics
  const stats = useMemo((): RoleManagementStats => {
    const activeUsers = users.filter(u => u.isActive);
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRoleChanges = roleHistory.filter(h =>
      new Date(h.changedAt) > thirtyDaysAgo
    ).length;

    const recentPermissionChanges = permissionHistory.filter(h =>
      new Date(h.changedAt) > thirtyDaysAgo
    ).length;

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      usersByRole,
      totalPermissions: permissions.length,
      customPermissions: permissions.filter(p => !p.isDefault).length,
      permissionGroups: permissionGroups.length,
      recentRoleChanges,
      recentPermissionChanges
    };
  }, [users, permissions, permissionGroups, roleHistory, permissionHistory]);

  // Actions object
  const actions: RoleManagementActions = {
    assignRole,
    getUserRole: (userId: string) => users.find(u => u.id === userId)?.role || null,
    getUserPermissions: (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return [];

      const rolePerms = roleDefinitions.find(r => r.role === user.role)?.defaultPermissions || [];
      const groupPerms = user.permissionGroups.flatMap(groupId =>
        permissionGroups.find(g => g.id === groupId)?.permissions || []
      );

      return [...new Set([...rolePerms, ...groupPerms, ...user.customPermissions])]
        .filter(p => !user.deniedPermissions.includes(p));
    },
    hasPermission,
    checkMultiplePermissions: (userId: string, permissionIds: string[]) => {
      return permissionIds.reduce((acc, permissionId) => {
        const [category, action] = permissionId.split('.');
        acc[permissionId] = hasPermission({
          userId,
          category: category as PermissionCategory,
          action: action as PermissionAction
        });
        return acc;
      }, {} as Record<string, PermissionCheckResult>);
    },
    createPermissionGroup,
    updatePermissionGroup: async (groupId: string, updates: Partial<PermissionGroup>) => {
      try {
        const updatedGroups = permissionGroups.map(g =>
          g.id === groupId ? { ...g, ...updates, updatedAt: getCurrentDate() } : g
        );
        const saveSuccess = saveData('permissionGroups', updatedGroups);
        if (saveSuccess) {
          setPermissionGroups(updatedGroups);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء التحديث' };
      }
    },
    deletePermissionGroup: async (groupId: string) => {
      try {
        const updatedGroups = permissionGroups.filter(g => g.id !== groupId);
        const updatedUsers = users.map(u => ({
          ...u,
          permissionGroups: u.permissionGroups.filter(gId => gId !== groupId)
        }));

        const saveSuccess = saveData('permissionGroups', updatedGroups) && saveData('extendedUsers', updatedUsers);
        if (saveSuccess) {
          setPermissionGroups(updatedGroups);
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء الحذف' };
      }
    },
    addUserToGroup: async (userId: string, groupId: string) => {
      try {
        const user = users.find(u => u.id === userId);
        if (!user || user.permissionGroups.includes(groupId)) {
          return { success: false, error: 'المستخدم غير موجود أو موجود في المجموعة بالفعل' };
        }

        const updatedUser = {
          ...user,
          permissionGroups: [...user.permissionGroups, groupId],
          updatedAt: getCurrentDate()
        };

        const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
        const saveSuccess = saveData('extendedUsers', updatedUsers);

        if (saveSuccess) {
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء الإضافة' };
      }
    },
    removeUserFromGroup: async (userId: string, groupId: string) => {
      try {
        const user = users.find(u => u.id === userId);
        if (!user) {
          return { success: false, error: 'المستخدم غير موجود' };
        }

        const updatedUser = {
          ...user,
          permissionGroups: user.permissionGroups.filter(gId => gId !== groupId),
          updatedAt: getCurrentDate()
        };

        const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
        const saveSuccess = saveData('extendedUsers', updatedUsers);

        if (saveSuccess) {
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء الإزالة' };
      }
    },
    grantPermission,
    revokePermission: async (userId: string, permissionId: string, reason?: string) => {
      try {
        const user = users.find(u => u.id === userId);
        if (!user) {
          return { success: false, error: 'المستخدم غير موجود' };
        }

        const currentUser = getCurrentUser();

        const historyEntry: PermissionChangeHistory = {
          id: generateId(),
          userId: user.id,
          username: user.username,
          changeType: 'revoke',
          permissionIds: [permissionId],
          reason,
          changedBy: currentUser.id,
          changedByName: currentUser.name,
          changedAt: getCurrentDate(),
          effectiveAt: getCurrentDate()
        };

        const updatedUser = {
          ...user,
          customPermissions: user.customPermissions.filter(p => p !== permissionId),
          deniedPermissions: [...new Set([...user.deniedPermissions, permissionId])],
          updatedAt: getCurrentDate(),
          modifiedBy: currentUser.id
        };

        const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
        const updatedHistory = [...permissionHistory, historyEntry];

        const saveSuccess = saveData('extendedUsers', updatedUsers) && saveData('permissionHistory', updatedHistory);

        if (saveSuccess) {
          setUsers(updatedUsers);
          setPermissionHistory(updatedHistory);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء سحب الصلاحية' };
      }
    },
    getRoleHistory: (userId?: string, limit = 50) => {
      const filtered = userId ? roleHistory.filter(h => h.userId === userId) : roleHistory;
      return filtered.slice(0, limit).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    },
    getPermissionHistory: (userId?: string, limit = 50) => {
      const filtered = userId ? permissionHistory.filter(h => h.userId === userId) : permissionHistory;
      return filtered.slice(0, limit).sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    },
    getRoleDefinitions: () => roleDefinitions,
    updateRoleDefinition: async (role: UserRole, updates: Partial<RoleDefinition>) => {
      try {
        const updatedDefinitions = roleDefinitions.map(r =>
          r.role === role ? { ...r, ...updates } : r
        );
        const saveSuccess = saveData('roleDefinitions', updatedDefinitions);
        if (saveSuccess) {
          setRoleDefinitions(updatedDefinitions);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء التحديث' };
      }
    },
    getAllPermissions: () => permissions,
    getPermissionsByCategory: (category: PermissionCategory) => permissions.filter(p => p.category === category),
    createCustomPermission: async (permission: Omit<Permission, 'id'>) => {
      try {
        const newPermission: Permission = {
          ...permission,
          id: generateId()
        };
        const updatedPermissions = [...permissions, newPermission];
        const saveSuccess = saveData('permissions', updatedPermissions);
        if (saveSuccess) {
          setPermissions(updatedPermissions);
          return { success: true, permission: newPermission };
        }
        return { success: false, error: 'فشل في حفظ الصلاحية' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء إنشاء الصلاحية' };
      }
    },
    getAllUsers: () => users,
    getUserById: (userId: string) => users.find(u => u.id === userId) || null,
    updateUser: async (userId: string, updates: Partial<ExtendedUser>) => {
      try {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, ...updates, updatedAt: getCurrentDate() } : u
        );
        const saveSuccess = saveData('extendedUsers', updatedUsers);
        if (saveSuccess) {
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء التحديث' };
      }
    },
    deactivateUser: async (userId: string, reason?: string) => {
      try {
        const currentUser = getCurrentUser();
        const updatedUsers = users.map(u =>
          u.id === userId ? {
            ...u,
            isActive: false,
            updatedAt: getCurrentDate(),
            modifiedBy: currentUser.id
          } : u
        );
        const saveSuccess = saveData('extendedUsers', updatedUsers);
        if (saveSuccess) {
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء إلغاء التفعيل' };
      }
    },
    activateUser: async (userId: string, reason?: string) => {
      try {
        const currentUser = getCurrentUser();
        const updatedUsers = users.map(u =>
          u.id === userId ? {
            ...u,
            isActive: true,
            updatedAt: getCurrentDate(),
            modifiedBy: currentUser.id
          } : u
        );
        const saveSuccess = saveData('extendedUsers', updatedUsers);
        if (saveSuccess) {
          setUsers(updatedUsers);
          return { success: true };
        }
        return { success: false, error: 'فشل في حفظ البيانات' };
      } catch (err) {
        return { success: false, error: 'حدث خطأ أثناء التفعيل' };
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    users,
    permissions,
    permissionGroups,
    roleDefinitions,
    roleHistory,
    permissionHistory,
    loading,
    error,
    stats,
    actions,
    refreshData: loadData
  };
}
