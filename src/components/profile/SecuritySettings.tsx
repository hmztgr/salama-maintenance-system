'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Smartphone,
  Monitor,
  Trash2,
  LogOut,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  AlertTriangle,
  Clock,
  MapPin,
  Eye,
  Key,
  Bell,
  Settings,
  Chrome
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { SecuritySettings as SecuritySettingsType, LoginSession, ProfileManagementActions } from '@/types/profile-management';

interface SecuritySettingsProps {
  settings: SecuritySettingsType | null;
  sessions: LoginSession[];
  actions: ProfileManagementActions;
  onSuccess: () => void;
}

export function SecuritySettings({ settings, sessions, actions, onSuccess }: SecuritySettingsProps) {
  const { authState } = useAuth();

  const [formData, setFormData] = useState<SecuritySettingsType>(
    settings || {
      id: '',
      userId: authState.user?.uid || '',
      twoFactorEnabled: false,
      lastPasswordChange: new Date().toISOString(),
      passwordExpiryDays: 90,
      loginNotifications: true,
      sessionTimeout: 60,
      trustedDevices: [],
      updatedAt: ''
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null);
  const [terminatingAllSessions, setTerminatingAllSessions] = useState(false);

  // Handle form field changes
  const handleChange = (field: keyof SecuritySettingsType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear success message when user makes changes
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
      const result = await actions.updateSecuritySettings(authState.user.uid, formData);

      if (result.success) {
        setSuccessMessage('تم حفظ إعدادات الأمان بنجاح');
        onSuccess();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: result.error || 'فشل في حفظ إعدادات الأمان' });
      }
    } catch (error) {
      console.error('Security settings update error:', error);
      setErrors({ submit: 'حدث خطأ أثناء حفظ إعدادات الأمان' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle session termination
  const handleTerminateSession = async (sessionId: string) => {
    if (!authState.user || !confirm('هل أنت متأكد من إنهاء هذه الجلسة؟')) return;

    setTerminatingSession(sessionId);

    try {
      const result = await actions.terminateSession(authState.user.uid, sessionId);

      if (result.success) {
        setSuccessMessage('تم إنهاء الجلسة بنجاح');
        onSuccess();
      } else {
        setErrors({ session: result.error || 'فشل في إنهاء الجلسة' });
      }
    } catch (error) {
      console.error('Session termination error:', error);
      setErrors({ session: 'حدث خطأ أثناء إنهاء الجلسة' });
    } finally {
      setTerminatingSession(null);
    }
  };

  // Handle terminate all sessions
  const handleTerminateAllSessions = async () => {
    if (!authState.user || !confirm('هل أنت متأكد من إنهاء جميع الجلسات؟ ستحتاج لإعادة تسجيل الدخول في جميع الأجهزة.')) return;

    setTerminatingAllSessions(true);

    try {
      const result = await actions.terminateAllSessions(authState.user.uid, true);

      if (result.success) {
        setSuccessMessage('تم إنهاء جميع الجلسات بنجاح');
        onSuccess();
      } else {
        setErrors({ sessions: result.error || 'فشل في إنهاء الجلسات' });
      }
    } catch (error) {
      console.error('All sessions termination error:', error);
      setErrors({ sessions: 'حدث خطأ أثناء إنهاء الجلسات' });
    } finally {
      setTerminatingAllSessions(false);
    }
  };

  // Handle remove trusted device
  const handleRemoveTrustedDevice = async (deviceId: string) => {
    if (!authState.user || !confirm('هل أنت متأكد من إزالة هذا الجهاز من الأجهزة الموثوقة؟')) return;

    try {
      const result = await actions.removeTrustedDevice(authState.user.uid, deviceId);

      if (result.success) {
        setSuccessMessage('تم إزالة الجهاز من الأجهزة الموثوقة');
        onSuccess();
      } else {
        setErrors({ device: result.error || 'فشل في إزالة الجهاز' });
      }
    } catch (error) {
      console.error('Remove trusted device error:', error);
      setErrors({ device: 'حدث خطأ أثناء إزالة الجهاز' });
    }
  };

  // Get device type icon
  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return Smartphone;
    }
    return Monitor;
  };

  // Get browser icon
  const getBrowserIcon = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return Chrome;
    return Monitor;
  };

  // Format session duration
  const formatSessionDuration = (startTime: string, lastActivity: string) => {
    const start = new Date(startTime);
    const last = new Date(lastActivity);
    const durationMs = last.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  // Calculate password age
  const getPasswordAge = () => {
    if (!formData.lastPasswordChange) return 0;
    const lastChange = new Date(formData.lastPasswordChange);
    const now = new Date();
    return Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
  };

  const passwordAge = getPasswordAge();
  const passwordNeedsChange = passwordAge > formData.passwordExpiryDays;

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

      {/* Error Messages */}
      {(errors.submit || errors.session || errors.sessions || errors.device) && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 text-right">
            {errors.submit || errors.session || errors.sessions || errors.device}
          </AlertDescription>
        </Alert>
      )}

      {/* Password Status */}
      <Card className={passwordNeedsChange ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {passwordNeedsChange ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            <div>
              <h3 className={`font-medium ${passwordNeedsChange ? 'text-red-900' : 'text-green-900'}`}>
                {passwordNeedsChange ? 'كلمة المرور تحتاج إلى تغيير' : 'كلمة المرور محدثة'}
              </h3>
              <p className={`text-sm ${passwordNeedsChange ? 'text-red-700' : 'text-green-700'}`}>
                آخر تغيير: {passwordAge} يوم مضى
                {passwordNeedsChange && ` (تنتهي كل ${formData.passwordExpiryDays} يوم)`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Security Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Shield className="w-5 h-5" />
              إعدادات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-base font-medium">المصادقة الثنائية</Label>
                <p className="text-sm text-gray-600">طبقة أمان إضافية لحسابك</p>
                <p className="text-xs text-blue-600">قريباً - ميزة تحت التطوير</p>
              </div>
              <Switch
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => handleChange('twoFactorEnabled', checked)}
                disabled={true} // Disabled for now
              />
            </div>

            {/* Login Notifications */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-base font-medium">إشعارات تسجيل الدخول</Label>
                <p className="text-sm text-gray-600">تنبيه عند تسجيل دخول جديد</p>
              </div>
              <Switch
                checked={formData.loginNotifications}
                onCheckedChange={(checked) => handleChange('loginNotifications', checked)}
                disabled={isSubmitting}
              />
            </div>

            {/* Password Expiry */}
            <div className="space-y-2">
              <Label className="text-right block">
                <Key className="inline w-4 h-4 ml-1" />
                انتهاء صلاحية كلمة المرور (أيام)
              </Label>
              <Select
                value={formData.passwordExpiryDays.toString()}
                onValueChange={(value) => handleChange('passwordExpiryDays', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 يوم</SelectItem>
                  <SelectItem value="60">60 يوم</SelectItem>
                  <SelectItem value="90">90 يوم (مُوصى)</SelectItem>
                  <SelectItem value="180">180 يوم</SelectItem>
                  <SelectItem value="365">سنة واحدة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Session Timeout */}
            <div className="space-y-2">
              <Label className="text-right block">
                <Clock className="inline w-4 h-4 ml-1" />
                انتهاء الجلسة تلقائياً (دقيقة)
              </Label>
              <Select
                value={formData.sessionTimeout.toString()}
                onValueChange={(value) => handleChange('sessionTimeout', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 دقيقة</SelectItem>
                  <SelectItem value="30">30 دقيقة</SelectItem>
                  <SelectItem value="60">ساعة واحدة (مُوصى)</SelectItem>
                  <SelectItem value="120">ساعتان</SelectItem>
                  <SelectItem value="240">4 ساعات</SelectItem>
                  <SelectItem value="480">8 ساعات</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                الجلسات النشطة ({sessions.length})
              </div>
              {sessions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTerminateAllSessions}
                  disabled={terminatingAllSessions}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  {terminatingAllSessions ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري الإنهاء...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      إنهاء جميع الجلسات
                    </>
                  )}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">لا توجد جلسات نشطة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.deviceInfo.userAgent);
                  const BrowserIcon = getBrowserIcon(session.deviceInfo.userAgent);
                  const isCurrentSession = session.id === sessionStorage.getItem('currentSessionId');

                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DeviceIcon className="w-6 h-6 text-gray-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <BrowserIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {session.deviceInfo.deviceType === 'mobile' ? 'جهاز محمول' : 'كمبيوتر'}
                            </span>
                            {isCurrentSession && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                الجلسة الحالية
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.deviceInfo.ipAddress}
                              {session.deviceInfo.location && ` • ${session.deviceInfo.location}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              بدأت: {new Date(session.startTime).toLocaleString('ar-SA')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              آخر نشاط: {new Date(session.lastActivity).toLocaleString('ar-SA')}
                            </div>
                            <div className="text-xs text-blue-600">
                              المدة: {formatSessionDuration(session.startTime, session.lastActivity)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {!isCurrentSession && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={terminatingSession === session.id}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          {terminatingSession === session.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              جاري الإنهاء...
                            </>
                          ) : (
                            <>
                              <LogOut className="w-4 h-4" />
                              إنهاء
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              الأجهزة الموثوقة ({formData.trustedDevices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formData.trustedDevices.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">لا توجد أجهزة موثوقة</p>
                <p className="text-sm text-gray-400 mt-1">
                  الأجهزة الموثوقة لا تحتاج لتأكيد إضافي عند تسجيل الدخول
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.trustedDevices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.userAgent);

                  return (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <DeviceIcon className="w-6 h-6 text-gray-500" />
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-gray-600">
                            آخر استخدام: {new Date(device.lastUsed).toLocaleString('ar-SA')}
                          </div>
                          <div className="text-xs text-gray-400 max-w-md truncate">
                            {device.userAgent}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTrustedDevice(device.id)}
                        className="gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        إزالة
                      </Button>
                    </div>
                  );
                })}
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
              if (settings) {
                setFormData(settings);
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

      {/* Security Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900 mb-1">نصائح أمنية</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• فعّل إشعارات تسجيل الدخول لمراقبة النشاط</li>
                <li>• أنه الجلسات غير المستخدمة بانتظام</li>
                <li>• اختر مهلة زمنية مناسبة للجلسات</li>
                <li>• راجع الأجهزة الموثوقة وأزل ما لا تعرفه</li>
                <li>• غيّر كلمة المرور عند الشك في تسريبها</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
