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
  Mail,
  Link,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Send,
  Ban,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { useInvitationsFirebase } from '@/hooks/useInvitationsFirebase';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useRoleManagementFirebase } from '@/hooks/useRoleManagementFirebase';
import { InvitationFormData, InvitationType, UserRole, InvitationStatus } from '@/types/invitation';
import { formatDateForDisplay } from '@/lib/date-handler';

export function InvitationManagement() {
  const { hasPermission } = useAuth();
  const { invitations, loading, error, stats, actions, refreshInvitations } = useInvitationsFirebase();
  const { permissionGroups } = useRoleManagementFirebase();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InvitationType | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Check permissions
  if (!hasPermission('admin')) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح لك</h3>
        <p className="text-gray-500">تحتاج صلاحيات المدير للوصول لإدارة الدعوات</p>
      </div>
    );
  }

  // Filter invitations based on search and filters
  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = !searchQuery ||
      invitation.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.invitedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
    const matchesType = typeFilter === 'all' || invitation.type === typeFilter;
    const matchesRole = roleFilter === 'all' || invitation.role === roleFilter;

    return matchesSearch && matchesStatus && matchesType && matchesRole;
  });

  // Get status color and icon
  const getStatusDisplay = (status: InvitationStatus) => {
    const displays = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'في الانتظار' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send, text: 'مرسلة' },
      opened: { color: 'bg-yellow-100 text-yellow-800', icon: Eye, text: 'مفتوحة' },
      accepted: { color: 'bg-green-100 text-green-800', icon: UserCheck, text: 'مقبولة' },
      expired: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, text: 'منتهية' },
      revoked: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'ملغية' }
    };
    return displays[status];
  };

  // Get role display name
  const getRoleDisplayName = (role: UserRole) => {
    const names = {
      admin: 'مدير النظام',
      supervisor: 'مشرف',
      viewer: 'مستخدم'
    };
    return names[role];
  };

  // Handle copy invitation link
  const handleCopyLink = async (invitation: any) => {
    try {
      await navigator.clipboard.writeText(invitation.invitationLink);
      // Show success message
      alert('تم نسخ الرابط بنجاح');
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert('فشل في نسخ الرابط');
    }
  };

  // Handle revoke invitation
  const handleRevoke = async (invitationId: string) => {
    if (confirm('هل أنت متأكد من إلغاء هذه الدعوة؟')) {
      const result = await actions.revokeInvitation(invitationId);
      if (result.success) {
        refreshInvitations();
      } else {
        alert(result.error || 'فشل في إلغاء الدعوة');
      }
    }
  };

  // Handle resend invitation
  const handleResend = async (invitationId: string) => {
    const result = await actions.resendInvitation(invitationId);
    if (result.success) {
      refreshInvitations();
      alert('تم إعادة إرسال الدعوة بنجاح');
    } else {
      alert(result.error || 'فشل في إعادة إرسال الدعوة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل الدعوات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة دعوات المستخدمين</h1>
          <p className="text-gray-600 mt-2">
            دعوة مستخدمين جدد وإدارة الدعوات المرسلة
          </p>
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          دعوة جديدة
        </Button>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي الدعوات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">في الانتظار</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">مرسلة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.opened}</div>
            <div className="text-sm text-gray-600">مفتوحة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">مقبولة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">منتهية</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
            <div className="text-sm text-gray-600">ملغية</div>
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
                  placeholder="البحث في البريد الإلكتروني أو المرسل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div>
              <Label className="text-right block mb-1">الحالة</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvitationStatus | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="sent">مرسلة</SelectItem>
                  <SelectItem value="opened">مفتوحة</SelectItem>
                  <SelectItem value="accepted">مقبولة</SelectItem>
                  <SelectItem value="expired">منتهية</SelectItem>
                  <SelectItem value="revoked">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-1">النوع</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as InvitationType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="email">دعوة بالإيميل</SelectItem>
                  <SelectItem value="link">دعوة برابط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-right block mb-1">الصلاحية</Label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الصلاحيات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصلاحيات</SelectItem>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="supervisor">مشرف</SelectItem>
                  <SelectItem value="viewer">مستخدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>الدعوات ({filteredInvitations.length})</span>
            <Button variant="outline" size="sm" onClick={refreshInvitations} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دعوات</h3>
              <p className="text-gray-500">لم يتم العثور على دعوات تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right border-b">النوع</th>
                    <th className="px-4 py-3 text-right border-b">البريد/الرابط</th>
                    <th className="px-4 py-3 text-right border-b">الدور الأساسي</th>
                    <th className="px-4 py-3 text-right border-b">مجموعات الصلاحيات</th>
                    <th className="px-4 py-3 text-right border-b">الحالة</th>
                    <th className="px-4 py-3 text-right border-b">أرسل بواسطة</th>
                    <th className="px-4 py-3 text-right border-b">تاريخ الإنشاء</th>
                    <th className="px-4 py-3 text-right border-b">تاريخ الانتهاء</th>
                    <th className="px-4 py-3 text-right border-b">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvitations.map((invitation) => {
                    const statusDisplay = getStatusDisplay(invitation.status);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {invitation.type === 'email' ? (
                              <Mail className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Link className="w-4 h-4 text-green-600" />
                            )}
                            <span className="text-sm">
                              {invitation.type === 'email' ? 'إيميل' : 'رابط'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            {invitation.type === 'email' ? (
                              <div className="text-sm font-medium text-gray-900">
                                {invitation.email}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 font-mono truncate">
                                {invitation.invitationLink}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline">
                            {getRoleDisplayName(invitation.role)}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          {invitation.permissionGroups && invitation.permissionGroups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {invitation.permissionGroups.map((groupId) => {
                                const group = permissionGroups.find(g => g.id === groupId);
                                return group ? (
                                  <Badge key={groupId} variant="secondary" className="text-xs">
                                    {group.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">لا توجد</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Badge className={statusDisplay.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusDisplay.text}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {invitation.invitedByName}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">
                            {invitation.createdAt}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-500">
                            {new Date(invitation.expiresAt).toLocaleDateString('ar-SA')}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {invitation.status !== 'accepted' && invitation.status !== 'revoked' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(invitation)}
                                  className="gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  نسخ
                                </Button>

                                {invitation.type === 'email' && invitation.status !== 'expired' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleResend(invitation.id)}
                                    className="gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    إعادة إرسال
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevoke(invitation.id)}
                                  className="gap-1 text-red-600 hover:text-red-700"
                                >
                                  <Ban className="w-3 h-3" />
                                  إلغاء
                                </Button>
                              </>
                            )}
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

      {/* Create Invitation Modal */}
      {showCreateForm && (
        <CreateInvitationForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            refreshInvitations();
          }}
          actions={actions}
        />
      )}
    </div>
  );
}

// Create Invitation Form Component
interface CreateInvitationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  actions: any;
}

function CreateInvitationForm({ onClose, onSuccess, actions }: CreateInvitationFormProps) {
  const { permissionGroups, roleDefinitions } = useRoleManagement();
  
  const [formData, setFormData] = useState<InvitationFormData>({
    type: 'email',
    email: '',
    role: 'viewer',
    permissionGroups: [],
    customMessage: '',
    expirationDays: 7,
    usageLimit: 1,
    allowedDomains: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.type === 'email') {
      if (!formData.email?.trim()) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'تنسيق البريد الإلكتروني غير صحيح';
      }
    }

    if (!formData.role) {
      newErrors.role = 'الصلاحية مطلوبة';
    }

    if (formData.expirationDays < 1 || formData.expirationDays > 365) {
      newErrors.expirationDays = 'مدة الانتهاء يجب أن تكون بين 1 و 365 يوم';
    }

    if (formData.type === 'link' && formData.usageLimit && (formData.usageLimit < 1 || formData.usageLimit > 1000)) {
      newErrors.usageLimit = 'حد الاستخدام يجب أن يكون بين 1 و 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      let result;
      if (formData.type === 'email') {
        result = await actions.createEmailInvitation(formData);
      } else {
        result = await actions.createLinkInvitation(formData);
      }

      if (result.success) {
        setSuccessMessage('تم إنشاء الدعوة بنجاح');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setErrors({ submit: result.error || 'فشل في إنشاء الدعوة' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'حدث خطأ أثناء إنشاء الدعوة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>دعوة مستخدم جديد</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invitation Type */}
            <div className="space-y-2">
              <Label className="text-right block">نوع الدعوة *</Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    formData.type === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => handleInputChange('type', 'email')}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">دعوة بالإيميل</div>
                      <div className="text-sm text-gray-600">إرسال دعوة مباشرة للبريد الإلكتروني</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    formData.type === 'link' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onClick={() => handleInputChange('type', 'link')}
                >
                  <div className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">دعوة برابط</div>
                      <div className="text-sm text-gray-600">إنشاء رابط قابل للمشاركة</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Email (for email invitations) */}
            {formData.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-right block">
                  البريد الإلكتروني *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className={`text-right ${errors.email ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 text-right">{errors.email}</p>
                )}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-right block">الدور الأساسي *</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر الدور الأساسي" />
                </SelectTrigger>
                <SelectContent>
                  {roleDefinitions.map((roleDef) => (
                    <SelectItem key={roleDef.role} value={roleDef.role}>
                      {roleDef.name} - {roleDef.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 text-right">{errors.role}</p>
              )}
            </div>

            {/* Permission Groups Selection */}
            <div className="space-y-2">
              <Label className="text-right block">مجموعات الصلاحيات الإضافية</Label>
              
              {/* Bulk Selection Controls for Permission Groups */}
              {permissionGroups.length > 0 && (
                <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={permissionGroups.length > 0 && (formData.permissionGroups?.length || 0) === permissionGroups.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            permissionGroups: permissionGroups.map(g => g.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            permissionGroups: []
                          }));
                        }
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
                        const readGroups = permissionGroups.filter(g => 
                          g.permissions.some(p => p.endsWith('.read'))
                        );
                        setFormData(prev => ({
                          ...prev,
                          permissionGroups: [...new Set([...(prev.permissionGroups || []), ...readGroups.map(g => g.id)])]
                        }));
                      }}
                      className="text-xs"
                    >
                      تحديد مجموعات القراءة
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const writeGroups = permissionGroups.filter(g => 
                          g.permissions.some(p => ['create', 'update', 'delete'].some(action => p.endsWith(`.${action}`)))
                        );
                        setFormData(prev => ({
                          ...prev,
                          permissionGroups: [...new Set([...(prev.permissionGroups || []), ...writeGroups.map(g => g.id)])]
                        }));
                      }}
                      className="text-xs"
                    >
                      تحديد مجموعات الكتابة
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          permissionGroups: []
                        }));
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      إلغاء التحديد
                    </Button>
                  </div>
                </div>
              )}
              
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
                        checked={formData.permissionGroups?.includes(group.id) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: [...(prev.permissionGroups || []), group.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              permissionGroups: (prev.permissionGroups || []).filter(id => id !== group.id)
                            }));
                          }
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-600 text-right">
                محدد {formData.permissionGroups?.length || 0} مجموعة صلاحيات
              </p>
            </div>

            {/* Expiration Days */}
            <div className="space-y-2">
              <Label htmlFor="expirationDays" className="text-right block">
                مدة انتهاء الدعوة (بالأيام) *
              </Label>
              <Input
                id="expirationDays"
                type="number"
                min="1"
                max="365"
                value={formData.expirationDays}
                onChange={(e) => handleInputChange('expirationDays', parseInt(e.target.value) || 7)}
                className={`text-right ${errors.expirationDays ? 'border-red-500' : ''}`}
                dir="rtl"
              />
              {errors.expirationDays && (
                <p className="text-sm text-red-500 text-right">{errors.expirationDays}</p>
              )}
            </div>

            {/* Usage Limit (for link invitations) */}
            {formData.type === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="usageLimit" className="text-right block">
                  حد الاستخدام (اختياري)
                </Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.usageLimit || ''}
                  onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || undefined)}
                  placeholder="1"
                  className={`text-right ${errors.usageLimit ? 'border-red-500' : ''}`}
                  dir="rtl"
                />
                <p className="text-sm text-gray-600 text-right">
                  عدد المرات التي يمكن استخدام الرابط فيها (اتركه فارغ لاستخدام غير محدود)
                </p>
                {errors.usageLimit && (
                  <p className="text-sm text-red-500 text-right">{errors.usageLimit}</p>
                )}
              </div>
            )}

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="customMessage" className="text-right block">
                رسالة مخصصة (اختياري)
              </Label>
              <Textarea
                id="customMessage"
                value={formData.customMessage || ''}
                onChange={(e) => handleInputChange('customMessage', e.target.value)}
                placeholder="رسالة ترحيبية للمستخدم الجديد"
                className="text-right min-h-[100px]"
                dir="rtl"
              />
            </div>

            {/* Success Message */}
            {successMessage && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-right">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errors.submit && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
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
                    <Send className="w-4 h-4" />
                    إنشاء الدعوة
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
