'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  RefreshCw,
  Save,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { PasswordChangeRequest, ProfileManagementActions } from '@/types/profile-management';

interface PasswordChangerProps {
  actions: ProfileManagementActions;
  onSuccess: () => void;
}

export function PasswordChanger({ actions, onSuccess }: PasswordChangerProps) {
  const { authState } = useAuth();

  const [formData, setFormData] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false);

  // Get password strength when user types
  const passwordStrength = formData.newPassword
    ? actions.getPasswordStrength(formData.newPassword)
    : null;

  // Handle input change
  const handleInputChange = (field: keyof PasswordChangeRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }

    // Reset current password validation if current password changes
    if (field === 'currentPassword' && currentPasswordValidated) {
      setCurrentPasswordValidated(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validate current password
  const validateCurrentPassword = async () => {
    if (!formData.currentPassword || !authState.user) return;

    try {
      const result = await actions.validateCurrentPassword(authState.user.uid, formData.currentPassword);

      if (result.success) {
        setCurrentPasswordValidated(true);
        setErrors(prev => ({ ...prev, currentPassword: '' }));
      } else {
        setCurrentPasswordValidated(false);
        setErrors(prev => ({ ...prev, currentPassword: result.error || 'كلمة المرور الحالية غير صحيحة' }));
      }
    } catch (error) {
      console.error('Current password validation error:', error);
      setErrors(prev => ({ ...prev, currentPassword: 'فشل في التحقق من كلمة المرور' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'كلمة المرور الحالية مطلوبة';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة مطلوبة';
    } else if (passwordStrength && passwordStrength.score < 3) {
      newErrors.newPassword = 'كلمة المرور ضعيفة، يرجى اختيار كلمة مرور أقوى';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقتين';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.user) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const result = await actions.changePassword(authState.user.uid, formData);

      if (result.success) {
        setSuccessMessage('تم تغيير كلمة المرور بنجاح');

        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setCurrentPasswordValidated(false);

        onSuccess();

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrors({ submit: result.error || 'فشل في تغيير كلمة المرور' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setErrors({ submit: 'حدث خطأ أثناء تغيير كلمة المرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength color and text
  const getPasswordStrengthDisplay = () => {
    if (!passwordStrength) return null;

    const colors = {
      'very-weak': { bg: 'bg-red-500', text: 'text-red-600', label: 'ضعيفة جداً' },
      'weak': { bg: 'bg-red-400', text: 'text-red-600', label: 'ضعيفة' },
      'fair': { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'متوسطة' },
      'good': { bg: 'bg-blue-500', text: 'text-blue-600', label: 'جيدة' },
      'strong': { bg: 'bg-green-500', text: 'text-green-600', label: 'قوية' },
      'very-strong': { bg: 'bg-green-600', text: 'text-green-700', label: 'قوية جداً' }
    };

    return colors[passwordStrength.strength];
  };

  const strengthDisplay = getPasswordStrengthDisplay();

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

      {/* Password Change Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Key className="w-5 h-5" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-right block">
                كلمة المرور الحالية *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  onBlur={validateCurrentPassword}
                  placeholder="كلمة المرور الحالية"
                  className={`pl-10 pr-10 text-left ${errors.currentPassword ? 'border-red-500' : currentPasswordValidated ? 'border-green-500' : ''}`}
                  dir="ltr"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                {/* Current password validation indicator */}
                {formData.currentPassword && (
                  <div className="absolute left-10 top-3">
                    {currentPasswordValidated ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : errors.currentPassword ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-500 text-right">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-right block">
                كلمة المرور الجديدة *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  placeholder="كلمة مرور قوية جديدة"
                  className={`pl-10 pr-10 text-left ${errors.newPassword ? 'border-red-500' : ''}`}
                  dir="ltr"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-500 text-right">{errors.newPassword}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.newPassword && passwordStrength && strengthDisplay && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">قوة كلمة المرور:</span>
                    <span className={strengthDisplay.text}>{strengthDisplay.label}</span>
                  </div>

                  <Progress
                    value={(passwordStrength.score / 6) * 100}
                    className="h-2"
                  />

                  {/* Password Requirements */}
                  <div className="space-y-1">
                    {Object.entries(passwordStrength.requirements).map(([key, met]) => {
                      const labels = {
                        minLength: '8 أحرف على الأقل',
                        hasUpperCase: 'حرف كبير واحد على الأقل',
                        hasLowerCase: 'حرف صغير واحد على الأقل',
                        hasNumbers: 'رقم واحد على الأقل',
                        hasSpecialChars: 'رمز خاص واحد على الأقل',
                        notCommon: 'ليست كلمة مرور شائعة'
                      };

                      return (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          {met ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span className={met ? 'text-green-600' : 'text-red-500'}>
                            {labels[key as keyof typeof labels]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-right block">
                تأكيد كلمة المرور الجديدة *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className={`pl-10 pr-10 text-left ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  dir="ltr"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                {/* Password match indicator */}
                {formData.newPassword && formData.confirmPassword && (
                  <div className="absolute left-10 top-3">
                    {formData.newPassword === formData.confirmPassword ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 text-right">{errors.confirmPassword}</p>
              )}

              {/* Password match status */}
              {formData.newPassword && formData.confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {formData.newPassword === formData.confirmPassword ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">كلمة المرور متطابقة</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">كلمة المرور غير متطابقة</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setErrors({});
                  setSuccessMessage('');
                  setCurrentPasswordValidated(false);
                }}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !currentPasswordValidated || !passwordStrength || passwordStrength.score < 3}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري التغيير...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    تغيير كلمة المرور
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900 mb-1">نصائح أمنية لكلمة المرور</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• استخدم كلمة مرور فريدة لا تستخدمها في مواقع أخرى</li>
                <li>• اجعل كلمة المرور طويلة (12 حرف أو أكثر)</li>
                <li>• امزج بين الأحرف الكبيرة والصغيرة والأرقام والرموز</li>
                <li>• تجنب المعلومات الشخصية مثل الأسماء والتواريخ</li>
                <li>• غيّر كلمة المرور بانتظام (كل 3-6 أشهر)</li>
                <li>• لا تشارك كلمة مرورك مع أي شخص</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password History Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">معلومات إضافية</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• سيتم تسجيل تغيير كلمة المرور في سجل النشاط</li>
                <li>• سيتم إرسال إشعار أمني بالتغيير</li>
                <li>• ستحتاج لإعادة تسجيل الدخول في جميع الأجهزة</li>
                <li>• يُنصح بتغيير كلمة المرور في حالة الشك في تسريبها</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
