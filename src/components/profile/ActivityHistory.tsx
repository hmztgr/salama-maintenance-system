'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Key,
  Shield,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { UserActivity, ActivityQueryOptions, ProfileManagementActions } from '@/types/profile-management';

interface ActivityHistoryProps {
  activities: UserActivity[];
  actions: ProfileManagementActions;
}

export function ActivityHistory({ activities: initialActivities, actions }: ActivityHistoryProps) {
  const { authState } = useAuth();

  const [activities, setActivities] = useState<UserActivity[]>(initialActivities);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<UserActivity['type'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load more activities with filters
  const loadActivities = async (options: ActivityQueryOptions = {}) => {
    if (!authState.user) return;

    setLoading(true);
    setError('');

    try {
      const result = await actions.getUserActivity(authState.user.uid, {
        limit: 100,
        ...options
      });

      if (result.success && result.activities) {
        setActivities(result.activities);
      } else {
        setError(result.error || 'فشل في تحميل سجل النشاط');
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('حدث خطأ أثناء تحميل سجل النشاط');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...activities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.action.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(activity =>
        statusFilter === 'success' ? activity.success : !activity.success
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(activity =>
        new Date(activity.timestamp) >= startDate
      );
    }

    setFilteredActivities(filtered);
    setCurrentPage(1);
  }, [activities, searchQuery, typeFilter, statusFilter, dateFilter]);

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    if (!authState.user) return;

    setExporting(true);

    try {
      const result = await actions.exportActivityHistory(authState.user.uid, format);

      if (result.success && result.data) {
        // Create download link
        const blob = new Blob([result.data], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-history.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'فشل في تصدير البيانات');
      }
    } catch (err) {
      console.error('Export error:', err);
      setError('حدث خطأ أثناء تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  // Get activity type info
  const getActivityTypeInfo = (type: UserActivity['type']) => {
    const types = {
      login: { name: 'تسجيل دخول', icon: LogIn, color: 'bg-green-100 text-green-800' },
      logout: { name: 'تسجيل خروج', icon: LogOut, color: 'bg-blue-100 text-blue-800' },
      profile_update: { name: 'تحديث الملف الشخصي', icon: User, color: 'bg-purple-100 text-purple-800' },
      password_change: { name: 'تغيير كلمة المرور', icon: Key, color: 'bg-orange-100 text-orange-800' },
      permission_change: { name: 'تغيير الصلاحيات', icon: Shield, color: 'bg-red-100 text-red-800' },
      data_access: { name: 'الوصول للبيانات', icon: FileText, color: 'bg-indigo-100 text-indigo-800' },
      export: { name: 'تصدير البيانات', icon: Download, color: 'bg-cyan-100 text-cyan-800' },
      import: { name: 'استيراد البيانات', icon: Upload, color: 'bg-teal-100 text-teal-800' },
      system_action: { name: 'إجراء النظام', icon: Settings, color: 'bg-gray-100 text-gray-800' }
    };

    return types[type] || { name: type, icon: Settings, color: 'bg-gray-100 text-gray-800' };
  };

  // Get device icon
  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return Monitor;
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return Smartphone;
    }
    return Monitor;
  };

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = filteredActivities.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 text-right">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5" />
              سجل النشاط ({filteredActivities.length})
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadActivities()}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    تحديث
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير JSON
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-right block mb-1">البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="البحث في الأنشطة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Label className="text-right block mb-1">نوع النشاط</Label>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="login">تسجيل دخول</SelectItem>
                  <SelectItem value="logout">تسجيل خروج</SelectItem>
                  <SelectItem value="profile_update">تحديث الملف الشخصي</SelectItem>
                  <SelectItem value="password_change">تغيير كلمة المرور</SelectItem>
                  <SelectItem value="permission_change">تغيير الصلاحيات</SelectItem>
                  <SelectItem value="data_access">الوصول للبيانات</SelectItem>
                  <SelectItem value="export">تصدير البيانات</SelectItem>
                  <SelectItem value="import">استيراد البيانات</SelectItem>
                  <SelectItem value="system_action">إجراء النظام</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-right block mb-1">النتيجة</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع النتائج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع النتائج</SelectItem>
                  <SelectItem value="success">نجح</SelectItem>
                  <SelectItem value="error">فشل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <Label className="text-right block mb-1">الفترة الزمنية</Label>
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الفترات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفترات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">آخر أسبوع</SelectItem>
                  <SelectItem value="month">آخر شهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                className="w-full gap-2"
              >
                <Filter className="w-4 h-4" />
                مسح الفلاتر
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          {currentActivities.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا يوجد نشاط</h3>
              <p className="text-gray-500">لم يتم العثور على أنشطة تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentActivities.map((activity) => {
                const typeInfo = getActivityTypeInfo(activity.type);
                const TypeIcon = typeInfo.icon;
                const DeviceIcon = getDeviceIcon(activity.metadata?.userAgent);

                return (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Activity Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>

                      {/* Activity Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{activity.description}</h3>
                            <Badge className={typeInfo.color}>
                              {typeInfo.name}
                            </Badge>
                            <Badge className={activity.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {activity.success ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  نجح
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  فشل
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleString('ar-SA')}
                          </div>
                        </div>

                        {/* Activity Metadata */}
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.timestamp).toLocaleDateString('ar-SA')}
                            </div>

                            {activity.metadata?.ipAddress && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.metadata.ipAddress}
                                {activity.metadata.location && ` • ${activity.metadata.location}`}
                              </div>
                            )}

                            {activity.metadata?.userAgent && (
                              <div className="flex items-center gap-1">
                                <DeviceIcon className="w-3 h-3" />
                                {activity.metadata.deviceType === 'mobile' ? 'جهاز محمول' : 'كمبيوتر'}
                              </div>
                            )}
                          </div>

                          {/* Additional Details */}
                          {activity.metadata?.resource && (
                            <div className="text-xs text-blue-600">
                              المورد: {activity.metadata.resource}
                              {activity.metadata.resourceId && ` (${activity.metadata.resourceId})`}
                            </div>
                          )}

                          {/* Error Message */}
                          {!activity.success && activity.errorMessage && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              خطأ: {activity.errorMessage}
                            </div>
                          )}

                          {/* Session Info */}
                          {activity.sessionId && (
                            <div className="text-xs text-gray-500">
                              الجلسة: {activity.sessionId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            عرض {startIndex + 1}-{Math.min(endIndex, filteredActivities.length)} من {filteredActivities.length} نشاط
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">معلومات حول سجل النشاط</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• يتم تسجيل جميع الأنشطة المهمة تلقائياً</li>
                <li>• يُحفظ السجل لمدة 12 شهر للمراجعة</li>
                <li>• يمكنك تصدير سجل النشاط للمراجعة الخارجية</li>
                <li>• الأنشطة الأمنية لا يمكن حذفها لأغراض الأمان</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
