'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  AlertTriangle,
  User,
  ArrowLeft
} from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export function PasswordReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { validateResetToken, resetPassword, loading, error } = useForgotPassword();

  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [validationError, setValidationError] = useState('');
  const [userInfo, setUserInfo] = useState<{ email: string; username: string } | null>(null);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate reset token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationState('invalid');
        setValidationError('رابط استعادة كلمة المرور غير صحيح');
        return;
      }

      try {
        const validation = await validateResetToken(token);

        if (validation.isValid && validation.userInfo) {
          setValidationState('valid');
          setUserInfo(validation.userInfo);
        } else {
          setValidationState('invalid');
          setValidationError(validation.error || 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setValidationState('invalid');
        setValidationError('حدث خطأ أثناء التحقق من رابط الاستعادة');
      }
    };

    validateToken();
  }, [token, validateResetToken]);

  // Validate password strength
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('يجب أن تكون 8 أحرف على الأقل');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('يجب أن تحتوي على رقم واحد على الأقل');
    }

    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      errors.push('يُنصح بإضافة رمز خاص (!@#$%^&*)');
    }

    return { isValid: errors.length === 0, errors };
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]; // Show first error
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقتين';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setIsSubmitting(true);

    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        setResetSuccess(true);

        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login?message=تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول');
        }, 3000);
      } else {
        setFormErrors({ submit: result.error || 'فشل في تغيير كلمة المرور' });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setFormErrors({ submit: 'حدث خطأ أثناء تغيير كلمة المرور' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Get password strength indicator
  const getPasswordStrength = (password: string) => {
    const validation = validatePassword(password);
    const score = 5 - validation.errors.length;

    if (score <= 2) return { strength: 'ضعيفة', color: 'text-red-600', bgColor: 'bg-red-500' };
    if (score <= 3) return { strength: 'متوسطة', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    if (score <= 4) return { strength: 'جيدة', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    return { strength: 'قوية جداً', color: 'text-green-600', bgColor: 'bg-green-500' };
  };

  // Loading state
  if (validationState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">جاري التحقق من رابط الاستعادة</h2>
            <p className="text-gray-600">يرجى الانتظار...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (validationState === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">رابط غير صالح</h2>
            <p className="text-gray-600 mb-6">{validationError}</p>

            <div className="space-y-3">
              <Button onClick={() => router.push('/forgot-password')} className="w-full">
                طلب رابط جديد
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="w-full gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">تم تغيير كلمة المرور بنجاح!</h2>
            <p className="text-gray-600 mb-6">
              تم تحديث كلمة مرورك. سيتم توجيهك لصفحة تسجيل الدخول خلال قليل.
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>جاري التوجيه...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <CardTitle className="text-xl font-bold text-gray-900">
            إنشاء كلمة مرور جديدة
          </CardTitle>

          <p className="text-gray-600 mt-2">
            أدخل كلمة مرور جديدة قوية لحسابك
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          {userInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{userInfo.username}</p>
                  <p className="text-sm text-blue-700">{userInfo.email}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block">
                كلمة المرور الجديدة *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="كلمة مرور قوية جديدة"
                  className={`pl-10 pr-10 text-left ${formErrors.password ? 'border-red-500' : ''}`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-red-500 text-right">{formErrors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">قوة كلمة المرور:</span>
                    <span className={getPasswordStrength(formData.password).color}>
                      {getPasswordStrength(formData.password).strength}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password).bgColor}`}
                      style={{ width: `${(5 - validatePassword(formData.password).errors.length) * 20}%` }}
                    />
                  </div>

                  {/* Password requirements */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {validatePassword(formData.password).errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-right block">
                تأكيد كلمة المرور *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className={`pl-10 pr-10 text-left ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-500 text-right">{formErrors.confirmPassword}</p>
              )}

              {/* Password match indicator */}
              {formData.password && formData.confirmPassword && (
                <div className="flex items-center gap-2 text-sm">
                  {formData.password === formData.confirmPassword ? (
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

            {/* Submit Error */}
            {(formErrors.submit || error) && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {formErrors.submit || error}
                </AlertDescription>
              </Alert>
            )}

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">نصائح أمنية:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• استخدم كلمة مرور قوية وفريدة</li>
                    <li>• لا تشارك كلمة مرورك مع أي شخص</li>
                    <li>• قم بتغيير كلمة المرور بانتظام</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || loading || !formData.password || !formData.confirmPassword}
              className="w-full gap-2"
            >
              {isSubmitting || loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري تغيير كلمة المرور...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  تغيير كلمة المرور
                </>
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/login')}
                className="gap-2"
                disabled={isSubmitting || loading}
              >
                <ArrowLeft className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
