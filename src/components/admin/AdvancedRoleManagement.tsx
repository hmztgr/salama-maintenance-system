'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Save,
  RefreshCw,
  Crown,
  Key,
  UserPlus,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useRoleManagementFirebase } from '@/hooks/useRoleManagementFirebase';
import {
  ExtendedUser,
  UserRole,
  PermissionGroup,
  RoleAssignmentRequest,
  PermissionCategory,
  Permission
} from '@/types/role-management';

export function AdvancedRoleManagement() {
  const { hasPermission } = useAuth();
  const {
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
  } = useRoleManagementFirebase();

  // Debug logging
  console.log('🔍 AdvancedRoleManagement - permissionGroups:', permissionGroups);
  console.log('🔍 AdvancedRoleManagement - loading:', loading);
  console.log('🔍 AdvancedRoleManagement - error:', error);

  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'history' | 'statistics'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  // Check permissions
  if (!hasPermission('admin')) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك</h3>
        <p className="text-gray-500">تحتاج صلاحيات المدير للوصول لإدارة الأدوار المتقدمة</p>
      </div>
    );
  }

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get role display information
  const getRoleDisplay = (role: UserRole) => {
    const displays = {
      admin: { name: 'مدير النظام', color: 'bg-red-100 text-red-800', icon: Crown },
      operations_manager: { name: 'مدير العمليات', color: 'bg-purple-100 text-purple-800', icon: Shield },
      supervisor: { name: 'مشرف', color: 'bg-blue-100 text-blue-800', icon: Shield },
      viewer: { name: 'مستخدم', color: 'bg-gray-100 text-gray-800', icon: Eye }
    };
    return displays[role];
  };

  // Get permission category display
  const getCategoryDisplay = (category: PermissionCategory) => {
    const displays = {
      customer: { name: 'إدارة العملاء', icon: '👥', color: 'bg-blue-50 text-blue-700' },
      planning: { name: 'التخطيط والجدولة', icon: '📅', color: 'bg-green-50 text-green-700' },
      visits: { name: 'إدارة الزيارات', icon: '🏠', color: 'bg-purple-50 text-purple-700' },
      reports: { name: 'التقارير', icon: '📊', color: 'bg-orange-50 text-orange-700' },
      admin: { name: 'الإدارة', icon: '⚙️', color: 'bg-red-50 text-red-700' },
      system: { name: 'النظام', icon: '🔧', color: 'bg-gray-50 text-gray-700' }
    };
    return displays[category];
  };

  // Handle role assignment
  const handleRoleAssignment = async (userId: string, newRole: UserRole, reason?: string) => {
    const request: RoleAssignmentRequest = {
      userId,
      newRole,
      reason,
      notifyUser: true
    };

    const result = await actions.assignRole(request);
    if (result.success) {
      refreshData();
      alert('تم تغيير الدور بنجاح');
    } else {
      alert(result.error || 'فشل في تغيير الدور');
    }
  };

  // Handle user activation/deactivation
  const handleUserActivation = async (userId: string, activate: boolean) => {
    const result = activate
      ? await actions.activateUser(userId, 'تفعيل من واجهة الإدارة')
      : await actions.deactivateUser(userId, 'إلغاء تفعيل من واجهة الإدارة');

    if (result.success) {
      refreshData();
      alert(activate ? 'تم تفعيل المستخدم' : 'تم إلغاء تفعيل المستخدم');
    } else {
      alert(result.error || 'فشل في العملية');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل بيانات إدارة الأدوار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الأدوار المتقدمة</h1>
          <p className="text-gray-600 mt-2">
            تعيين الأدوار، إدارة الصلاحيات المخصصة، ومجموعات الصلاحيات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshData}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button
            onClick={() => setShowCreateGroup(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            مجموعة صلاحيات جديدة
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 text-right">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">إجمالي المستخدمين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">المستخدمين النشطين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.usersByRole.admin || 0}</div>
            <div className="text-sm text-gray-600">المديرين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.usersByRole.supervisor || 0}</div>
            <div className="text-sm text-gray-600">المشرفين</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.permissionGroups}</div>
            <div className="text-sm text-gray-600">مجموعات الصلاحيات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.recentRoleChanges}</div>
            <div className="text-sm text-gray-600">تغييرات حديثة</div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline-block ml-2" />
            إدارة المستخدمين
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline-block ml-2" />
            مجموعات الصلاحيات
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 inline-block ml-2" />
            سجل التغييرات
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline-block ml-2" />
            إحصائيات تفصيلية
          </button>
        </nav>
      </div>

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search" className="text-right block mb-1">البحث</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="البحث في المستخدمين..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-right block mb-1">الدور</Label>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الأدوار" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأدوار</SelectItem>
                      <SelectItem value="admin">مدير النظام</SelectItem>
                      <SelectItem value="supervisor">مشرف</SelectItem>
                      <SelectItem value="viewer">مستخدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-right block mb-1">الحالة</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    عرض {filteredUsers.length} من {users.length} مستخدم
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">قائمة المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد مستخدمين</h3>
                  <p className="text-gray-500">لم يتم العثور على مستخدمين يطابقون المعايير</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right border-b">المستخدم</th>
                        <th className="px-4 py-3 text-right border-b">الدور الحالي</th>
                        <th className="px-4 py-3 text-right border-b">الحالة</th>
                        <th className="px-4 py-3 text-right border-b">الصلاحيات المخصصة</th>
                        <th className="px-4 py-3 text-right border-b">آخر دخول</th>
                        <th className="px-4 py-3 text-right border-b">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => {
                        const roleDisplay = getRoleDisplay(user.role);
                        const RoleIcon = roleDisplay.icon;

                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 font-medium">
                                    {user.fullName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{user.fullName}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                  <div className="text-xs text-gray-400">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <Badge className={roleDisplay.color}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleDisplay.name}
                              </Badge>
                            </td>

                            <td className="px-4 py-3">
                              <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {user.isActive ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    نشط
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    غير نشط
                                  </>
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-blue-600">
                                  {user.customPermissions.length} مخصصة
                                </span>
                                {user.permissionGroups.length > 0 && (
                                  <span className="text-sm text-purple-600">
                                    {user.permissionGroups.length} مجموعة
                                  </span>
                                )}
                                {user.deniedPermissions.length > 0 && (
                                  <span className="text-sm text-red-600">
                                    {user.deniedPermissions.length} مرفوضة
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-500">
                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserDetails(true);
                                  }}
                                  className="gap-1"
                                >
                                  <Edit className="w-3 h-3" />
                                  تعديل
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserActivation(user.id, !user.isActive)}
                                  className={`gap-1 ${
                                    user.isActive
                                      ? 'text-red-600 hover:text-red-700'
                                      : 'text-green-600 hover:text-green-700'
                                  }`}
                                >
                                  {user.isActive ? (
                                    <>
                                      <UserX className="w-3 h-3" />
                                      تعطيل
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3" />
                                      تفعيل
                                    </>
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permission Groups Tab */}
      {activeTab === 'groups' && (
        <PermissionGroupsTab
          permissionGroups={permissionGroups}
          permissions={permissions}
          actions={actions}
          onRefresh={refreshData}
        />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <HistoryTab
          roleHistory={roleHistory}
          permissionHistory={permissionHistory}
        />
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <StatisticsTab
          stats={stats}
          users={users}
          permissions={permissions}
          permissionGroups={permissionGroups}
        />
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          permissions={permissions}
          permissionGroups={permissionGroups}
          actions={actions}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            refreshData();
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          permissions={permissions}
          actions={actions}
          onClose={() => setShowCreateGroup(false)}
          onSuccess={() => {
            refreshData();
            setShowCreateGroup(false);
          }}
        />
      )}


    </div>
  );
}

// Permission Groups Tab Component
interface PermissionGroupsTabProps {
  permissionGroups: PermissionGroup[];
  permissions: Permission[];
  actions: any;
  onRefresh: () => void;
}

function PermissionGroupsTab({ permissionGroups, permissions, actions, onRefresh }: PermissionGroupsTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  const getCategoryDisplay = (category: PermissionCategory) => {
    const displays = {
      customer: { name: 'إدارة العملاء', icon: '👥', color: 'bg-blue-50 text-blue-700' },
      planning: { name: 'التخطيط والجدولة', icon: '📅', color: 'bg-green-50 text-green-700' },
      visits: { name: 'إدارة الزيارات', icon: '🏠', color: 'bg-purple-50 text-purple-700' },
      reports: { name: 'التقارير', icon: '📊', color: 'bg-orange-50 text-orange-700' },
      admin: { name: 'الإدارة', icon: '⚙️', color: 'bg-red-50 text-red-700' },
      system: { name: 'النظام', icon: '🔧', color: 'bg-gray-50 text-gray-700' }
    };
    return displays[category];
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟ سيتم إزالة جميع المستخدمين من المجموعة.')) {
      const result = await actions.deletePermissionGroup(groupId);
      if (result.success) {
        onRefresh();
        alert('تم حذف المجموعة بنجاح');
      } else {
        alert(result.error || 'فشل في حذف المجموعة');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-right">مجموعات الصلاحيات</CardTitle>
        </CardHeader>
        <CardContent>
          {permissionGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛡️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مجموعات صلاحيات</h3>
              <p className="text-gray-500">قم بإنشاء مجموعات لتنظيم الصلاحيات</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map((group) => {
                const categoryDisplay = getCategoryDisplay(group.category);

                return (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                        </div>
                        <Badge className={categoryDisplay.color}>
                          {categoryDisplay.icon} {categoryDisplay.name}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <strong>{group.permissions.length}</strong> صلاحية
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log('🔧 Edit button clicked for group:', group);
                              setSelectedGroup(group);
                              setShowGroupDetails(true);
                              console.log('🔧 Modal state set - selectedGroup:', group, 'showGroupDetails:', true);
                            }}
                            className="gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            تعديل
                          </Button>

                          {!group.isSystemGroup && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                              حذف
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Details Modal */}
      {(() => {
        console.log('🔧 Modal rendering check - showGroupDetails:', showGroupDetails, 'selectedGroup:', selectedGroup);
        return null;
      })()}
      {showGroupDetails && selectedGroup ? (
        <GroupDetailsModal
          group={selectedGroup}
          permissions={permissions}
          actions={actions}
          onClose={() => {
            console.log('🔧 Modal closing');
            setShowGroupDetails(false);
            setSelectedGroup(null);
          }}
          onSuccess={() => {
            console.log('🔧 Modal success');
            onRefresh();
            setShowGroupDetails(false);
            setSelectedGroup(null);
          }}
        />
      ) : (
        <div style={{ display: 'none' }}>
          {/* Debug: Modal not rendering - showGroupDetails: {String(showGroupDetails)}, selectedGroup: {selectedGroup ? 'exists' : 'null'} */}
        </div>
      )}
    </div>
  );
}

// History Tab Component
interface HistoryTabProps {
  roleHistory: any[];
  permissionHistory: any[];
}

function HistoryTab({ roleHistory, permissionHistory }: HistoryTabProps) {
  const [historyType, setHistoryType] = useState<'roles' | 'permissions'>('roles');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant={historyType === 'roles' ? 'default' : 'outline'}
          onClick={() => setHistoryType('roles')}
          className="gap-2"
        >
          <Crown className="w-4 h-4" />
          تاريخ الأدوار
        </Button>
        <Button
          variant={historyType === 'permissions' ? 'default' : 'outline'}
          onClick={() => setHistoryType('permissions')}
          className="gap-2"
        >
          <Key className="w-4 h-4" />
          تاريخ الصلاحيات
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">
            {historyType === 'roles' ? 'سجل تغييرات الأدوار' : 'سجل تغييرات الصلاحيات'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyType === 'roles' ? (
            <div className="space-y-4">
              {roleHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">لا يوجد سجل تغييرات للأدوار</p>
                </div>
              ) : (
                roleHistory.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-sm text-gray-600">
                          تم تغيير الدور من <span className="font-medium">{entry.previousRole}</span> إلى{' '}
                          <span className="font-medium">{entry.newRole}</span>
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-gray-500">السبب: {entry.reason}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>{entry.changedByName}</p>
                        <p>{new Date(entry.changedAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {permissionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">لا يوجد سجل تغييرات للصلاحيات</p>
                </div>
              ) : (
                permissionHistory.slice(0, 20).map((entry) => (
                  <div key={entry.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{entry.username}</p>
                        <p className="text-sm text-gray-600">
                          {entry.changeType === 'grant' ? 'منح' : 'سحب'} صلاحية{' '}
                          <span className="font-medium">{entry.permissionIds.join(', ')}</span>
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-gray-500">السبب: {entry.reason}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>{entry.changedByName}</p>
                        <p>{new Date(entry.changedAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Statistics Tab Component
interface StatisticsTabProps {
  stats: any;
  users: ExtendedUser[];
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
}

function StatisticsTab({ stats, users, permissions, permissionGroups }: StatisticsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">إحصائيات المستخدمين</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>إجمالي المستخدمين:</span>
              <span className="font-bold">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span>المستخدمين النشطين:</span>
              <span className="font-bold text-green-600">{stats.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span>المديرين:</span>
              <span className="font-bold text-red-600">{stats.usersByRole.admin || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>المشرفين:</span>
              <span className="font-bold text-blue-600">{stats.usersByRole.supervisor || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>المستخدمين:</span>
              <span className="font-bold text-gray-600">{stats.usersByRole.viewer || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Permission Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">إحصائيات الصلاحيات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>إجمالي الصلاحيات:</span>
              <span className="font-bold">{stats.totalPermissions}</span>
            </div>
            <div className="flex justify-between">
              <span>الصلاحيات المخصصة:</span>
              <span className="font-bold text-purple-600">{stats.customPermissions}</span>
            </div>
            <div className="flex justify-between">
              <span>مجموعات الصلاحيات:</span>
              <span className="font-bold text-blue-600">{stats.permissionGroups}</span>
            </div>
            <div className="flex justify-between">
              <span>تغييرات الأدوار (30 يوم):</span>
              <span className="font-bold text-orange-600">{stats.recentRoleChanges}</span>
            </div>
            <div className="flex justify-between">
              <span>تغييرات الصلاحيات (30 يوم):</span>
              <span className="font-bold text-green-600">{stats.recentPermissionChanges}</span>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right text-lg">ملخص النشاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
              </div>
              <div className="text-sm text-gray-600">معدل النشاط</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.recentRoleChanges + stats.recentPermissionChanges}
              </div>
              <div className="text-sm text-gray-600">تغييرات الشهر الماضي</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// User Details Modal Component
interface UserDetailsModalProps {
  user: ExtendedUser;
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
  actions: any;
  onClose: () => void;
  onSuccess: () => void;
}

function UserDetailsModal({ user, permissions, permissionGroups, actions, onClose, onSuccess }: UserDetailsModalProps) {
  const [newRole, setNewRole] = useState<UserRole>(user.role);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = async () => {
    if (newRole === user.role) {
      alert('لم يتم تغيير الدور');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await actions.assignRole({
        userId: user.id,
        newRole,
        reason: reason || `تغيير الدور إلى ${newRole}`,
        notifyUser: true
      });

      if (result.success) {
        alert('تم تغيير الدور بنجاح');
        onSuccess();
      } else {
        alert(result.error || 'فشل في تغيير الدور');
      }
    } catch (err) {
      alert('حدث خطأ أثناء تغيير الدور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>تفاصيل المستخدم - {user.fullName}</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">معلومات المستخدم</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">اسم المستخدم:</span>
                <span className="font-medium mr-2">{user.username}</span>
              </div>
              <div>
                <span className="text-gray-600">البريد الإلكتروني:</span>
                <span className="font-medium mr-2">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">آخر دخول:</span>
                <span className="font-medium mr-2">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <span className="font-medium mr-2">
                  {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
            </div>
          </div>

          {/* Role Management */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">إدارة الدور</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-right block mb-1">الدور الحالي</Label>
                <div className="p-2 bg-blue-50 rounded border">
                  {user.role === 'admin' ? 'مدير النظام' :
                   user.role === 'supervisor' ? 'مشرف' : 'مستخدم'}
                </div>
              </div>

              <div>
                <Label className="text-right block mb-1">الدور الجديد</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                    <SelectItem value="supervisor">مشرف</SelectItem>
                    <SelectItem value="viewer">مستخدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="text-right block mb-1">سبب التغيير</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اختياري - اكتب سبب تغيير الدور"
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* Current Permissions */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">الصلاحيات الحالية</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">الصلاحيات المخصصة:</span>
                <span className="font-bold text-blue-600 mr-2">{user.customPermissions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">مجموعات الصلاحيات:</span>
                <span className="font-bold text-purple-600 mr-2">{user.permissionGroups.length}</span>
              </div>
              <div>
                <span className="text-gray-600">الصلاحيات المرفوضة:</span>
                <span className="font-bold text-red-600 mr-2">{user.deniedPermissions.length}</span>
              </div>
            </div>
          </div>

          {/* Permission Groups Management */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">إدارة مجموعات الصلاحيات</h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
              {permissionGroups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">لا توجد مجموعات صلاحيات متاحة</p>
              ) : (
                permissionGroups.map((group) => (
                  <div key={group.id} className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="font-medium text-sm">{group.name}</div>
                      <div className="text-xs text-gray-600">{group.description}</div>
                    </div>
                    <Checkbox
                      checked={user.permissionGroups.includes(group.id)}
                      onCheckedChange={(checked) => {
                        // This would need to be implemented in the actions
                        console.log('Toggle permission group:', group.id, checked);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Permissions Management */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">إدارة الصلاحيات المخصصة</h3>
            
            <div className="space-y-2">
              <Label className="text-right block mb-1">فئة الصلاحيات</Label>
              <Select defaultValue="customer">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">إدارة العملاء</SelectItem>
                  <SelectItem value="planning">التخطيط والجدولة</SelectItem>
                  <SelectItem value="visits">إدارة الزيارات</SelectItem>
                  <SelectItem value="reports">التقارير</SelectItem>
                  <SelectItem value="admin">الإدارة</SelectItem>
                  <SelectItem value="system">النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-right block mb-1">الصلاحيات المخصصة</Label>
              
              {/* Bulk Selection Controls for Custom Permissions */}
              <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => {
                      // This would need to be implemented
                      console.log('Select all custom permissions:', checked);
                    }}
                  />
                  <span className="text-sm font-medium">تحديد الكل</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would need to be implemented
                      console.log('Select read permissions');
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات القراءة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would need to be implemented
                      console.log('Select write permissions');
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات الكتابة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // This would need to be implemented
                      console.log('Clear all custom permissions');
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                {permissions.slice(0, 10).map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="font-medium text-sm">{permission.name}</div>
                      <div className="text-xs text-gray-600">{permission.description}</div>
                    </div>
                    <Checkbox
                      checked={user.customPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        // This would need to be implemented in the actions
                        console.log('Toggle custom permission:', permission.id, checked);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={isSubmitting || newRole === user.role}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Group Modal Component
interface CreateGroupModalProps {
  permissions: Permission[];
  actions: any;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateGroupModal({ permissions, actions, onClose, onSuccess }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'customer' as PermissionCategory,
    permissions: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('اسم المجموعة مطلوب');
      return;
    }

    if (formData.permissions.length === 0) {
      alert('يجب اختيار صلاحية واحدة على الأقل');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await actions.createPermissionGroup({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        permissions: formData.permissions,
        isSystemGroup: false
      });

      if (result.success) {
        alert('تم إنشاء المجموعة بنجاح');
        onSuccess();
      } else {
        alert(result.error || 'فشل في إنشاء المجموعة');
      }
    } catch (err) {
      alert('حدث خطأ أثناء إنشاء المجموعة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const permissionsByCategory = permissions.filter(p => p.category === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>إنشاء مجموعة صلاحيات جديدة</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-right block mb-1">اسم المجموعة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: مجموعة إدارة العملاء"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-right block mb-1">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المجموعة والغرض منها"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label className="text-right block mb-1">الفئة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as PermissionCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">إدارة العملاء</SelectItem>
                  <SelectItem value="planning">التخطيط والجدولة</SelectItem>
                  <SelectItem value="visits">إدارة الزيارات</SelectItem>
                  <SelectItem value="reports">التقارير</SelectItem>
                  <SelectItem value="admin">الإدارة</SelectItem>
                  <SelectItem value="system">النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-3">الصلاحيات *</Label>
              
              {/* Bulk Selection Controls */}
              <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={permissions.length > 0 && formData.permissions.length === permissions.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: permissions.map(p => p.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissions: []
                          }));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">تحديد الكل (جميع الفئات)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={permissionsByCategory.length > 0 && 
                        permissionsByCategory.every(p => formData.permissions.includes(p.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: [...new Set([...prev.permissions, ...permissionsByCategory.map(p => p.id)])]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(id => 
                              !permissionsByCategory.some(p => p.id === id)
                            )
                          }));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">تحديد الكل (الفئة الحالية)</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const readPermissions = permissionsByCategory
                        .filter(p => p.action === 'read')
                        .map(p => p.id);
                      setFormData(prev => ({
                        ...prev,
                        permissions: [...new Set([...prev.permissions, ...readPermissions])]
                      }));
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات القراءة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const writePermissions = permissionsByCategory
                        .filter(p => ['create', 'update', 'delete'].includes(p.action))
                        .map(p => p.id);
                      setFormData(prev => ({
                        ...prev,
                        permissions: [...new Set([...prev.permissions, ...writePermissions])]
                      }));
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات الكتابة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        permissions: []
                      }));
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
              
              {/* Selection Summary */}
              <div className="text-xs text-gray-600 text-right mb-2">
                محدد {formData.permissions.length} من {permissions.length} صلاحية (جميع الفئات) | 
                محدد {permissionsByCategory.filter(p => formData.permissions.includes(p.id)).length} من {permissionsByCategory.length} صلاحية (الفئة الحالية)
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                {permissionsByCategory.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="font-medium text-sm">{permission.name}</div>
                      <div className="text-xs text-gray-600">{permission.description}</div>
                    </div>
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-right">
                محدد {formData.permissions.length} من {permissions.length} صلاحية (جميع الفئات)
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    إنشاء المجموعة
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Group Details Modal Component
interface GroupDetailsModalProps {
  group: PermissionGroup;
  permissions: Permission[];
  actions: any;
  onClose: () => void;
  onSuccess: () => void;
}

function GroupDetailsModal({ group, permissions, actions, onClose, onSuccess }: GroupDetailsModalProps) {
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    category: group.category,
    permissions: group.permissions || []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCategoryDisplay = (category: PermissionCategory) => {
    const displays = {
      customer: { name: 'إدارة العملاء', icon: '👥', color: 'bg-blue-50 text-blue-700' },
      planning: { name: 'التخطيط والجدولة', icon: '📅', color: 'bg-green-50 text-green-700' },
      visits: { name: 'إدارة الزيارات', icon: '🏠', color: 'bg-purple-50 text-purple-700' },
      reports: { name: 'التقارير', icon: '📊', color: 'bg-orange-50 text-orange-700' },
      admin: { name: 'الإدارة', icon: '⚙️', color: 'bg-red-50 text-red-700' },
      system: { name: 'النظام', icon: '🔧', color: 'bg-gray-50 text-gray-700' }
    };
    return displays[category];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المجموعة مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔧 GroupDetailsModal handleSubmit called');

    if (!validateForm()) {
      console.log('🔧 Form validation failed');
      return;
    }

    console.log('🔧 Starting update with data:', {
      groupId: group.id,
      updates: {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        permissions: formData.permissions
      }
    });

    setIsSubmitting(true);

    try {
      console.log('🔧 Calling actions.updatePermissionGroup...');
      const result = await actions.updatePermissionGroup(group.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        permissions: formData.permissions
      });

      console.log('🔧 Update result:', result);

      if (result.success) {
        console.log('🔧 Update successful, calling onSuccess');
        onSuccess();
      } else {
        console.log('🔧 Update failed:', result.error);
        setErrors({ submit: result.error || 'فشل في تحديث مجموعة الصلاحيات' });
      }
    } catch (err) {
      console.error('🔧 Exception during update:', err);
      setErrors({ submit: 'فشل في تحديث مجموعة الصلاحيات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const permissionsByCategory = permissions.filter(p => p.category === formData.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>تعديل مجموعة الصلاحيات: {group.name}</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-right block mb-1">اسم المجموعة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: مجموعة إدارة العملاء"
                className={`text-right ${errors.name ? 'border-red-500' : ''}`}
                dir="rtl"
              />
              {errors.name && (
                <p className="text-sm text-red-500 text-right mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-right block mb-1">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف المجموعة والغرض منها"
                className="text-right"
                dir="rtl"
              />
            </div>

            <div>
              <Label className="text-right block mb-1">الفئة *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as PermissionCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10001]" style={{ zIndex: 10001 }}>
                  <SelectItem value="customer">إدارة العملاء</SelectItem>
                  <SelectItem value="planning">التخطيط والجدولة</SelectItem>
                  <SelectItem value="visits">إدارة الزيارات</SelectItem>
                  <SelectItem value="reports">التقارير</SelectItem>
                  <SelectItem value="admin">الإدارة</SelectItem>
                  <SelectItem value="system">النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-3">الصلاحيات *</Label>
              
              {/* Bulk Selection Controls */}
              <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={permissions.length > 0 && formData.permissions.length === permissions.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: permissions.map(p => p.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissions: []
                          }));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">تحديد الكل (جميع الفئات)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={permissionsByCategory.length > 0 && 
                        permissionsByCategory.every(p => formData.permissions.includes(p.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissions: [...new Set([...prev.permissions, ...permissionsByCategory.map(p => p.id)])]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(id => 
                              !permissionsByCategory.some(p => p.id === id)
                            )
                          }));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">تحديد الكل (الفئة الحالية)</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const readPermissions = permissionsByCategory
                        .filter(p => p.action === 'read')
                        .map(p => p.id);
                      setFormData(prev => ({
                        ...prev,
                        permissions: [...new Set([...prev.permissions, ...readPermissions])]
                      }));
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات القراءة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const writePermissions = permissionsByCategory
                        .filter(p => ['create', 'update', 'delete'].includes(p.action))
                        .map(p => p.id);
                      setFormData(prev => ({
                        ...prev,
                        permissions: [...new Set([...prev.permissions, ...writePermissions])]
                      }));
                    }}
                    className="text-xs"
                  >
                    تحديد صلاحيات الكتابة
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        permissions: []
                      }));
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>
              
              {/* Selection Summary */}
              <div className="text-xs text-gray-600 text-right mb-2">
                محدد {formData.permissions.length} من {permissions.length} صلاحية (جميع الفئات) | 
                محدد {permissionsByCategory.filter(p => formData.permissions.includes(p.id)).length} من {permissionsByCategory.length} صلاحية (الفئة الحالية)
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-3">
                {permissionsByCategory.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="font-medium text-sm">{permission.name}</div>
                      <div className="text-xs text-gray-600">{permission.description}</div>
                    </div>
                    <Checkbox
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-right">
                محدد {formData.permissions.length} من {permissions.length} صلاحية (جميع الفئات)
              </p>
            </div>

            {errors.submit && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    تحديث المجموعة
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
