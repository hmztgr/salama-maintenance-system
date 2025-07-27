'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Settings, Bell, Shield, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';

export function UserProfile() {
  const { authState, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!authState.user) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">غير مصرح بالدخول</h3>
        <p className="text-gray-500">يجب تسجيل الدخول لعرض الملف الشخصي</p>
      </div>
    );
  }

  const user = authState.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">الملف الشخصي</h2>
        <Badge variant="outline" className="text-sm">
          {user.role === 'admin' ? 'مدير النظام' : 
         user.role === 'operations_manager' ? 'مدير العمليات' : 
         user.role === 'supervisor' ? 'مشرف' : 'فني'}
        </Badge>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات المستخدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">الاسم</label>
                <p className="text-gray-900">{user.displayName || 'غير محدد'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">الصفة</label>
                <p className="text-gray-900">
                  {user.role === 'admin' ? 'مدير النظام' :
                   user.role === 'operations_manager' ? 'مدير العمليات' :
        user.role === 'supervisor' ? 'مشرف الصيانة' : 'فني الصيانة'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">حالة الحساب</label>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">نشط</span>
                </div>
              </div>
            </div>

            {user.createdAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">تاريخ إنشاء الحساب</label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                </p>
              </div>
            )}

            {user.lastLoginAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">آخر تسجيل دخول</label>
                <p className="text-gray-900">
                  {new Date(user.lastLoginAt).toLocaleString('ar-SA')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Firebase Integration Note */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>تم الترقية إلى Firebase:</strong> الملف الشخصي متصل الآن بقاعدة بيانات Firebase.
          ميزات إدارة الملف الشخصي المتقدمة قيد التطوير.
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإجراءات السريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/profile/edit'}
            >
              <User className="h-4 w-4" />
              تعديل الملف الشخصي
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/profile/security'}
            >
              <Shield className="h-4 w-4" />
              إعدادات الأمان
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/profile/notifications'}
            >
              <Bell className="h-4 w-4" />
              إعدادات الإشعارات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Temporary Development Note */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">قيد التطوير</h4>
              <p className="text-sm text-orange-700 mt-1">
                بعد اكتمال ترحيل البيانات إلى Firebase، سيتم تطوير ميزات إدارة الملف الشخصي المتقدمة
                مثل تغيير كلمة المرور، إعدادات الإشعارات، وسجل النشاط.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
