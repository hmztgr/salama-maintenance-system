'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Eye,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useRoleManagementFirebase } from '@/hooks/useRoleManagementFirebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { UserRole, PermissionGroup } from '@/types/role-management';
import { getCurrentDate } from '@/lib/date-handler';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissionGroups: string[];
  customPermissions: string[];
  deniedPermissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastLogin?: string;
  firebaseUid?: string;
}

export function UserManagement() {
  const { hasPermission } = useAuth();
  const { permissionGroups, roleDefinitions } = useRoleManagementFirebase();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Check permissions
  if (!hasPermission('admin')) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك</h3>
        <p className="text-gray-500">تحتاج صلاحيات المدير للوصول لإدارة المستخدمين</p>
      </div>
    );
  }

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

  // Convert Firestore document to User object
  const convertDocToUser = (doc: any): User => {
    const data = doc.data();
    return {
      id: doc.id,
      username: data.username || '',
      email: data.email || '',
      fullName: data.displayName || data.fullName || '', // Support both displayName and fullName
      role: data.role || 'viewer',
      permissionGroups: data.permissionGroups || [],
      customPermissions: data.customPermissions || [],
      deniedPermissions: data.deniedPermissions || [],
      isActive: data.isActive !== false,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      createdBy: data.createdBy || 'system',
      lastLogin: data.lastLoginAt ? convertTimestamp(data.lastLoginAt) : undefined,
      firebaseUid: data.uid || data.firebaseUid,
    };
  };

  // Real-time listener for users
  useEffect(() => {
    console.log('🔥 Setting up Firebase real-time listener for users...');
    setLoading(true);

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        try {
          console.log('🔥 Firebase users snapshot received:', snapshot.size, 'documents');
          
          const usersData = snapshot.docs.map(convertDocToUser);
          
          console.log('📊 Processed users data:', usersData.length, 'users');
          setUsers(usersData);
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error('❌ Error processing users snapshot:', err);
          setError('فشل في تحميل بيانات المستخدمين');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Firebase users listener error:', err);
        setError('فشل في الاتصال بقاعدة البيانات');
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase users listener');
      unsubscribe();
    };
  }, []);

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
      supervisor: { name: 'مشرف', color: 'bg-blue-100 text-blue-800', icon: Shield },
      viewer: { name: 'مستخدم', color: 'bg-gray-100 text-gray-800', icon: Eye }
    };
    return displays[role];
  };

  // Handle user activation/deactivation
  const handleUserActivation = async (userId: string, activate: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: activate,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ User ${activate ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('❌ Failed to update user status:', err);
      setError('فشل في تحديث حالة المستخدم');
    }
  };

  // Handle user deletion
  const handleUserDeletion = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log('✅ User deleted successfully');
    } catch (err) {
      console.error('❌ Failed to delete user:', err);
      setError('فشل في حذف المستخدم');
    }
  };

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    inactiveUsers: users.filter(u => !u.isActive).length,
    usersByRole: users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<UserRole, number>)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل بيانات المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-2">
            إدارة حسابات المستخدمين والصلاحيات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button
            onClick={() => setShowCreateUser(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="text-2xl font-bold text-gray-600">{stats.usersByRole.viewer || 0}</div>
            <div className="text-sm text-gray-600">المستخدمين</div>
          </CardContent>
        </Card>
      </div>

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
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 ml-2" />
                إعادة تعيين
              </Button>
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
              <p className="text-gray-500">قم بإضافة مستخدمين جدد أو تعديل الفلاتر</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const roleDisplay = getRoleDisplay(user.role);
                const userPermissionGroups = permissionGroups.filter(g => 
                  user.permissionGroups.includes(g.id)
                );

                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                            <Badge className={roleDisplay.color}>
                              <roleDisplay.icon className="w-3 h-3 ml-1" />
                              {roleDisplay.name}
                            </Badge>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="w-3 h-3 ml-1" />
                                نشط
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <UserX className="w-3 h-3 ml-1" />
                                غير نشط
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            <div>اسم المستخدم: {user.username}</div>
                            <div>البريد الإلكتروني: {user.email}</div>
                            <div>تاريخ الإنشاء: {user.createdAt}</div>
                            {user.lastLogin && (
                              <div>آخر تسجيل دخول: {user.lastLogin}</div>
                            )}
                          </div>

                          {userPermissionGroups.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm text-gray-600 mb-1">مجموعات الصلاحيات:</div>
                              <div className="flex flex-wrap gap-1">
                                {userPermissionGroups.map(group => (
                                  <Badge key={group.id} variant="outline" className="text-xs">
                                    {group.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                          className={`gap-1 ${user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-3 h-3" />
                              إلغاء التفعيل
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              تفعيل
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserDeletion(user.id)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          permissionGroups={permissionGroups}
          roleDefinitions={roleDefinitions}
          onClose={() => setShowCreateUser(false)}
          onSuccess={() => {
            setShowCreateUser(false);
            // Refresh will happen automatically via real-time listener
          }}
        />
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          permissionGroups={permissionGroups}
          roleDefinitions={roleDefinitions}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
            // Refresh will happen automatically via real-time listener
          }}
        />
      )}
    </div>
  );
}

// Create User Modal Component
interface CreateUserModalProps {
  permissionGroups: PermissionGroup[];
  roleDefinitions: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUserModal({ permissionGroups, roleDefinitions, onClose, onSuccess }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'viewer' as UserRole,
    permissionGroups: [] as string[],
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check Firebase Auth initialization
  useEffect(() => {
    console.log('🔍 Checking Firebase Auth initialization...');
    console.log('🔍 Auth object:', auth);
    console.log('🔍 Auth current user:', auth?.currentUser);
    console.log('🔍 Firebase config API key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'Missing');
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Check if user already exists in Firestore
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        setErrors({ email: 'يوجد حساب بالفعل لهذا البريد الإلكتروني' });
        setIsSubmitting(false);
        return;
      }

      // Create Firebase Auth account first
      console.log('🔥 Creating Firebase Auth account...');
      console.log('📧 Email:', formData.email);
      console.log('🔑 Password length:', formData.password.length);
      
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      console.log('✅ Firebase Auth account created:', userCredential.user.uid);
      console.log('👤 User email verified:', userCredential.user.emailVerified);

      // Create Firestore document using Firebase Auth UID as document ID
      const newUser = {
        uid: userCredential.user.uid,
        username: formData.username,
        email: formData.email,
        displayName: formData.fullName, // Use displayName to match FirebaseUserProfile interface
        role: formData.role,
        permissionGroups: formData.permissionGroups,
        customPermissions: [],
        deniedPermissions: [],
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        createdBy: 'current-user', // Should come from auth context
        firebaseUid: userCredential.user.uid // Link to Firebase Auth
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      console.log('✅ Firestore user document created successfully');

      onSuccess();
    } catch (err: any) {
      console.error('❌ Failed to create user:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'البريد الإلكتروني مستخدم بالفعل في نظام المصادقة' });
      } else if (err.code === 'auth/weak-password') {
        setErrors({ password: 'كلمة المرور ضعيفة جداً' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'البريد الإلكتروني غير صحيح' });
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrors({ submit: 'إنشاء الحسابات غير مسموح به في إعدادات Firebase' });
      } else if (err.code === 'auth/network-request-failed') {
        setErrors({ submit: 'فشل في الاتصال بالشبكة' });
      } else {
        setErrors({ submit: `فشل في إنشاء المستخدم: ${err.code || 'خطأ غير معروف'} - ${err.message || ''}` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>إضافة مستخدم جديد</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-right block mb-1">اسم المستخدم *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={`text-right ${errors.username ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.username && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-right block mb-1">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`text-right ${errors.email ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="fullName" className="text-right block mb-1">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className={`text-right ${errors.fullName ? 'border-red-500' : ''}`}
                dir="rtl"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 text-right mt-1">{errors.fullName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-right block mb-1">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`text-right ${errors.password ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-right block mb-1">تأكيد كلمة المرور *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`text-right ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-right block mb-1">الدور</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((roleDef) => (
                    <SelectItem key={roleDef.role} value={roleDef.role}>
                      {roleDef.name} - {roleDef.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-1">مجموعات الصلاحيات</Label>
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
                        checked={formData.permissionGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: [...prev.permissionGroups, group.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: prev.permissionGroups.filter(id => id !== group.id)
                            }));
                          }
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive" className="text-sm">نشط</Label>
            </div>

            {errors.submit && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// User Details Modal Component
interface UserDetailsModalProps {
  user: User;
  permissionGroups: PermissionGroup[];
  roleDefinitions: any[];
  onClose: () => void;
  onSuccess: () => void;
}

function UserDetailsModal({ user, permissionGroups, roleDefinitions, onClose, onSuccess }: UserDetailsModalProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    permissionGroups: user.permissionGroups,
    isActive: user.isActive
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        ...formData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ User updated successfully');

      onSuccess();
    } catch (err) {
      console.error('❌ Failed to update user:', err);
      setErrors({ submit: 'فشل في تحديث المستخدم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>تعديل المستخدم</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-right block mb-1">اسم المستخدم *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className={`text-right ${errors.username ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.username && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-right block mb-1">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`text-right ${errors.email ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 text-right mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="fullName" className="text-right block mb-1">الاسم الكامل *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className={`text-right ${errors.fullName ? 'border-red-500' : ''}`}
                dir="rtl"
              />
              {errors.fullName && (
                <p className="text-sm text-red-500 text-right mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <Label className="text-right block mb-1">الدور</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((roleDef) => (
                    <SelectItem key={roleDef.role} value={roleDef.role}>
                      {roleDef.name} - {roleDef.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-1">مجموعات الصلاحيات</Label>
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
                        checked={formData.permissionGroups.includes(group.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: [...prev.permissionGroups, group.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: prev.permissionGroups.filter(id => id !== group.id)
                            }));
                          }
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="isActive" className="text-sm">نشط</Label>
            </div>

            {errors.submit && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'جاري التحديث...' : 'تحديث المستخدم'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 