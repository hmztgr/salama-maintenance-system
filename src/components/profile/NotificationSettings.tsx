'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Save,
  Volume2,
  VolumeX,
  Calendar,
  AlertTriangle,
  FileText,
  Users,
  Shield,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { NotificationPreferences, ProfileManagementActions } from '@/types/profile-management';

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null;
  actions: ProfileManagementActions;
  onSuccess: () => void;
}

export function NotificationSettings({ preferences, actions, onSuccess }: NotificationSettingsProps) {
  const { authState } = useAuth();

  const [formData, setFormData] = useState<NotificationPreferences>(
    preferences || {
      id: '',
      userId: authState.user?.uid || '',
      email: {
        enabled: true,
        frequency: 'immediate',
        types: {
          systemUpdates: true,
          securityAlerts: true,
          visitReminders: true,
          contractExpiry: true,
          reportGeneration: false,
          roleChanges: true,
          invitations: true
        }
      },
      inApp: {
        enabled: true,
        showOnLogin: true,
        types: {
          systemMessages: true,
          taskReminders: true,
          statusUpdates: true,
          announcements: true
        }
      },
      sms: {
        enabled: false,
        types: {
          urgentAlerts: false,
          verificationCodes: false
        }
      },
      updatedAt: ''
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [testingNotification, setTestingNotification] = useState<'email' | 'sms' | null>(null);

  // Handle form field changes
  const handleChange = (section: keyof NotificationPreferences, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));

    // Clear success message when user makes changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle notification type toggle
  const handleNotificationTypeToggle = (
    section: 'email' | 'inApp' | 'sms',
    type: string,
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        types: {
          ...((prev[section] as any)?.types || {}),
          [type]: value
        }
      }
    }));

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.user) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const result = await actions.updateNotificationPreferences(authState.user.uid, formData);

      if (result.success) {
        setSuccessMessage('تم حفظ إعدادات الإشعارات بنجاح');
        onSuccess();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: result.error || 'فشل في حفظ الإعدادات' });
      }
    } catch (error) {
      console.error('Notification preferences update error:', error);
      setErrors({ submit: 'حدث خطأ أثناء حفظ الإعدادات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle test notification
  const handleTestNotification = async (type: 'email' | 'sms') => {
    if (!authState.user) return;

    setTestingNotification(type);
    setErrors({ [`test_${type}`]: '' });

    try {
      const result = await actions.testNotification(authState.user.uid, type);

      if (result.success) {
        setSuccessMessage(`تم إرسال إشعار تجريبي عبر ${type === 'email' ? 'البريد الإلكتروني' : 'الرسائل النصية'}`);
      } else {
        setErrors({ [`test_${type}`]: result.error || 'فشل في إرسال الإشعار التجريبي' });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      setErrors({ [`test_${type}`]: 'حدث خطأ أثناء إرسال الإشعار التجريبي' });
    } finally {
      setTestingNotification(null);
    }
  };

  // Get notification type display info
  const getNotificationTypeInfo = (type: string) => {
    const types = {
      systemUpdates: { name: 'تحديثات النظام', icon: Settings, description: 'إشعارات بالتحديثات والصيانة' },
      securityAlerts: { name: 'تنبيهات الأمان', icon: Shield, description: 'تسجيل دخول وتغييرات أمنية' },
      visitReminders: { name: 'تذكير الزيارات', icon: Calendar, description: 'تذكير بالزيارات المجدولة' },
      contractExpiry: { name: 'انتهاء العقود', icon: FileText, description: 'تنبيه قرب انتهاء العقود' },
      reportGeneration: { name: 'إنشاء التقارير', icon: FileText, description: 'إشعار بجاهزية التقارير' },
      roleChanges: { name: 'تغييرات الصلاحيات', icon: Users, description: 'تغييرات في الأدوار والصلاحيات' },
      invitations: { name: 'الدعوات', icon: UserPlus, description: 'دعوات مستخدمين جدد' },
      systemMessages: { name: 'رسائل النظام', icon: Bell, description: 'رسائل مهمة من النظام' },
      taskReminders: { name: 'تذكير المهام', icon: Calendar, description: 'تذكير بالمهام المطلوبة' },
      statusUpdates: { name: 'تحديثات الحالة', icon: RefreshCw, description: 'تحديثات حالة العمليات' },
      announcements: { name: 'الإعلانات', icon: Volume2, description: 'إعلانات وأخبار مهمة' },
      urgentAlerts: { name: 'التنبيهات العاجلة', icon: AlertTriangle, description: 'تنبيهات عاجلة ومهمة' },
      verificationCodes: { name: 'رموز التحقق', icon: Shield, description: 'رموز التحقق الأمنية' }
    };

    return types[type as keyof typeof types] || { name: type, icon: Bell, description: '' };
  };

  return (
    <div className="space-y-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Mail className="w-5 h-5" />
              إشعارات البريد الإلكتروني
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">تفعيل إشعارات البريد الإلكتروني</Label>
                <p className="text-sm text-gray-600">تلقي الإشعارات عبر البريد الإلكتروني</p>
              </div>
              <Switch
                checked={formData.email.enabled}
                onCheckedChange={(checked) => handleChange('email', 'enabled', checked)}
                disabled={isSubmitting}
              />
            </div>

            {/* Email Frequency */}
            {formData.email.enabled && (
              <div className="space-y-2">
                <Label className="text-right block">تكرار الإشعارات</Label>
                <Select
                  value={formData.email.frequency}
                  onValueChange={(value) => handleChange('email', 'frequency', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">فوري</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="never">لا ترسل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Email Notification Types */}
            {formData.email.enabled && (
              <div className="space-y-3">
                <Label className="text-base font-medium">أنواع الإشعارات</Label>
                <div className="space-y-3">
                  {Object.entries(formData.email.types).map(([type, enabled]) => {
                    const typeInfo = getNotificationTypeInfo(type);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{typeInfo.name}</div>
                            <div className="text-sm text-gray-600">{typeInfo.description}</div>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handleNotificationTypeToggle('email', type, checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Email Button */}
            {formData.email.enabled && (
              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTestNotification('email')}
                  disabled={testingNotification === 'email'}
                  className="gap-2"
                >
                  {testingNotification === 'email' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال إشعار تجريبي
                    </>
                  )}
                </Button>
                {errors.test_email && (
                  <p className="text-sm text-red-500 mt-1">{errors.test_email}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Bell className="w-5 h-5" />
              الإشعارات داخل التطبيق
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* In-App Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">تفعيل الإشعارات داخل التطبيق</Label>
                <p className="text-sm text-gray-600">عرض الإشعارات أثناء استخدام النظام</p>
              </div>
              <Switch
                checked={formData.inApp.enabled}
                onCheckedChange={(checked) => handleChange('inApp', 'enabled', checked)}
                disabled={isSubmitting}
              />
            </div>

            {/* Show on Login */}
            {formData.inApp.enabled && (
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">عرض عند تسجيل الدخول</Label>
                  <p className="text-sm text-gray-600">عرض الإشعارات عند تسجيل الدخول</p>
                </div>
                <Switch
                  checked={formData.inApp.showOnLogin}
                  onCheckedChange={(checked) => handleChange('inApp', 'showOnLogin', checked)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* In-App Notification Types */}
            {formData.inApp.enabled && (
              <div className="space-y-3">
                <Label className="text-base font-medium">أنواع الإشعارات</Label>
                <div className="space-y-3">
                  {Object.entries(formData.inApp.types).map(([type, enabled]) => {
                    const typeInfo = getNotificationTypeInfo(type);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{typeInfo.name}</div>
                            <div className="text-sm text-gray-600">{typeInfo.description}</div>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handleNotificationTypeToggle('inApp', type, checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              إشعارات الرسائل النصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SMS Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">تفعيل الرسائل النصية</Label>
                <p className="text-sm text-gray-600">تلقي إشعارات مهمة عبر الرسائل النصية</p>
              </div>
              <Switch
                checked={formData.sms?.enabled || false}
                onCheckedChange={(checked) => handleChange('sms', 'enabled', checked)}
                disabled={isSubmitting}
              />
            </div>

            {/* SMS Phone Number */}
            {formData.sms?.enabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>رقم الهاتف:</strong> يتم استخدام رقم الهاتف من الملف الشخصي
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  يمكنك تحديث رقم الهاتف من صفحة الملف الشخصي
                </p>
              </div>
            )}

            {/* SMS Notification Types */}
            {formData.sms?.enabled && (
              <div className="space-y-3">
                <Label className="text-base font-medium">أنواع الرسائل النصية</Label>
                <div className="space-y-3">
                  {Object.entries(formData.sms.types).map(([type, enabled]) => {
                    const typeInfo = getNotificationTypeInfo(type);
                    const TypeIcon = typeInfo.icon;

                    return (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{typeInfo.name}</div>
                            <div className="text-sm text-gray-600">{typeInfo.description}</div>
                          </div>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) => handleNotificationTypeToggle('sms', type, checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test SMS Button */}
            {formData.sms?.enabled && (
              <div className="pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTestNotification('sms')}
                  disabled={testingNotification === 'sms'}
                  className="gap-2"
                >
                  {testingNotification === 'sms' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال رسالة تجريبية
                    </>
                  )}
                </Button>
                {errors.test_sms && (
                  <p className="text-sm text-red-500 mt-1">{errors.test_sms}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (preferences) {
                setFormData(preferences);
                setErrors({});
                setSuccessMessage('');
              }
            }}
            disabled={isSubmitting}
          >
            إعادة تعيين
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">معلومات الخصوصية</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• لن نشارك معلومات الاتصال الخاصة بك مع أطراف ثالثة</li>
                <li>• يمكنك تعديل إعدادات الإشعارات في أي وقت</li>
                <li>• الإشعارات الأمنية لا يمكن إلغاؤها لحماية حسابك</li>
                <li>• يتم تشفير جميع الإشعارات المرسلة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
