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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
  { id: 'planning.read', name: 'عرض المواعيد', description: 'عرض الجداول والمواعيد', category: 'planning', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'planning.update', name: 'تحديث المواعيد', description: 'تعديل المواعيد والجداول', category: 'planning', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'planning.delete', name: 'حذف المواعيد', description: 'حذف المواعيد من الجداول', category: 'planning', action: 'delete', isSystemLevel: true, isDefault: true },

  // Visits Management
  { id: 'visits.create', name: 'إنشاء زيارات', description: 'إضافة زيارات جديدة', category: 'visits', action: 'create', isSystemLevel: true, isDefault: true },
  { id: 'visits.read', name: 'عرض الزيارات', description: 'عرض بيانات الزيارات', category: 'visits', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'visits.update', name: 'تحديث الزيارات', description: 'تعديل بيانات الزيارات', category: 'visits', action: 'update', isSystemLevel: true, isDefault: true },
  { id: 'visits.delete', name: 'حذف الزيارات', description: 'حذف الزيارات من النظام', category: 'visits', action: 'delete', isSystemLevel: true, isDefault: true },

  // Reports
  { id: 'reports.read', name: 'عرض التقارير', description: 'عرض التقارير والإحصائيات', category: 'reports', action: 'read', isSystemLevel: true, isDefault: true },
  { id: 'reports.export', name: 'تصدير التقارير', description: 'تصدير التقارير بصيغ مختلفة', category: 'reports', action: 'export', isSystemLevel: true, isDefault: true },
  { id: 'reports.manage', name: 'إدارة التقارير', description: 'إنشاء وتعديل قوالب التقارير', category: 'reports', action: 'manage', isSystemLevel: true, isDefault: true },

  // Admin
  { id: 'admin.users', name: 'إدارة المستخدمين', description: 'إدارة حسابات المستخدمين', category: 'admin', action: 'manage', isSystemLevel: true, isDefault: true },
  { id: 'admin.roles', name: 'إدارة الأدوار', description: 'إدارة الأدوار والصلاحيات', category: 'admin', action: 'manage', isSystemLevel: true, isDefault: true },
  { id: 'admin.settings', name: 'إعدادات النظام', description: 'تعديل إعدادات النظام العامة', category: 'admin', action: 'manage', isSystemLevel: true, isDefault: true },

  // System
  { id: 'system.backup', name: 'النسخ الاحتياطي', description: 'إدارة النسخ الاحتياطية', category: 'system', action: 'manage', isSystemLevel: true, isDefault: true },
  { id: 'system.logs', name: 'سجلات النظام', description: 'عرض سجلات النظام والتدقيق', category: 'system', action: 'read', isSystemLevel: true, isDefault: true },
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
    level: 4
  },
  {
    role: 'operations_manager',
    name: 'مدير العمليات',
    description: 'إدارة العمليات والموظفين مع استثناء إدارة النظام',
    defaultPermissions: [
      // Customer Management - Full access
      'customer.create', 'customer.read', 'customer.update', 'customer.delete', 'customer.export', 'customer.import',
      // Planning & Scheduling - Full access
      'planning.create', 'planning.read', 'planning.update', 'planning.delete', 'planning.export', 'planning.import',
      // Visits Management - Full access
      'visits.create', 'visits.read', 'visits.update', 'visits.delete', 'visits.export', 'visits.import',
      // Reports - Full access
      'reports.read', 'reports.export', 'reports.manage',
      // Issues Management - Full access
      'issues.create', 'issues.read', 'issues.update', 'issues.delete', 'issues.export',
      // Emergency Tickets - Full access
      'emergency.create', 'emergency.read', 'emergency.update', 'emergency.delete',
      // User Management - Limited access (no admin functions)
      'user.profile.read', 'user.profile.update',
      // System - Limited access (no admin functions)
      'system.audit.read'
    ],
    isSystemRole: true,
    canBeModified: true,
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

export function useRoleManagementFirebase() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>(SYSTEM_PERMISSIONS);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [roleHistory, setRoleHistory] = useState<RoleChangeHistory[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<PermissionChangeHistory[]>([]);
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

  // Convert Firestore document to PermissionGroup
  const convertDocToPermissionGroup = (doc: any): PermissionGroup => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      description: data.description || '',
      category: data.category || 'customer',
      permissions: data.permissions || [],
      isSystemGroup: data.isSystemGroup || false,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      createdBy: data.createdBy || 'system'
    };
  };

  // Real-time listener for permission groups
  useEffect(() => {
    console.log('🔥 Setting up Firebase real-time listener for permission groups...');
    setLoading(true);

    // Start with a simple query without ordering to avoid index issues
    const permissionGroupsQuery = query(
      collection(db, 'permissionGroups')
    );

    console.log('🔥 Query created, setting up listener...');

    const unsubscribe = onSnapshot(
      permissionGroupsQuery,
      (snapshot) => {
        try {
          console.log('🔥 Firebase permission groups snapshot received:', snapshot.size, 'documents');
          
          // Debug: Log each document
          snapshot.docs.forEach((doc, index) => {
            console.log(`📄 Document ${index + 1}:`, {
              id: doc.id,
              data: doc.data(),
              exists: doc.exists()
            });
          });
          
          const permissionGroupsData = snapshot.docs.map(convertDocToPermissionGroup);
          
          console.log('📊 Processed permission groups data:', permissionGroupsData);
          console.log('📊 Number of groups:', permissionGroupsData.length);
          
          setPermissionGroups(permissionGroupsData);
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error('❌ Error processing permission groups snapshot:', err);
          setError('فشل في تحميل بيانات مجموعات الصلاحيات');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Firebase permission groups listener error:', err);
        setError('فشل في الاتصال بقاعدة البيانات');
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase permission groups listener');
      unsubscribe();
    };
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

  // Create permission group
  const createPermissionGroup = useCallback(async (group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; group?: PermissionGroup; error?: string }> => {
    try {
      console.log('🔥 Creating permission group:', group.name);

      const currentUser = getCurrentUser();
      const groupData = {
        ...group,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.id
      };

      const docRef = await addDoc(collection(db, 'permissionGroups'), groupData);
      console.log('✅ Permission group created with ID:', docRef.id);

      const newGroup: PermissionGroup = {
        ...group,
        id: docRef.id,
        createdAt: getCurrentDate(),
        updatedAt: getCurrentDate(),
        createdBy: currentUser.id
      };

      return { success: true, group: newGroup };
    } catch (err) {
      console.error('❌ Failed to create permission group:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل في إنشاء المجموعة';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getCurrentUser]);

  // Update permission group
  const updatePermissionGroup = useCallback(async (groupId: string, updates: Partial<PermissionGroup>): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔥 Updating permission group:', groupId);

      const groupRef = doc(db, 'permissionGroups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Permission group updated successfully');
      return { success: true };
    } catch (err) {
      console.error('❌ Failed to update permission group:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحديث المجموعة';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Delete permission group
  const deletePermissionGroup = useCallback(async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔥 Deleting permission group:', groupId);

      const groupRef = doc(db, 'permissionGroups', groupId);
      await deleteDoc(groupRef);

      console.log('✅ Permission group deleted successfully');
      return { success: true };
    } catch (err) {
      console.error('❌ Failed to delete permission group:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل في حذف المجموعة';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
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
    assignRole: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
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
    updatePermissionGroup,
    deletePermissionGroup,
    addUserToGroup: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    removeUserFromGroup: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    grantPermission: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    revokePermission: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    getRoleHistory: () => roleHistory,
    getPermissionHistory: () => permissionHistory,
    getRoleDefinitions: () => roleDefinitions,
    updateRoleDefinition: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    getAllPermissions: () => permissions,
    getPermissionsByCategory: (category: PermissionCategory) => permissions.filter(p => p.category === category),
    createCustomPermission: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    getAllUsers: () => users,
    getUserById: (userId: string) => users.find(u => u.id === userId) || null,
    updateUser: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    deactivateUser: async () => ({ success: false, error: 'Not implemented in Firebase version' }),
    activateUser: async () => ({ success: false, error: 'Not implemented in Firebase version' })
  };

  // Refresh data
  const refreshData = useCallback(() => {
    // The real-time listener will automatically refresh the data
    console.log('🔄 Refreshing permission groups data...');
  }, []);

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
    refreshData
  };
} 