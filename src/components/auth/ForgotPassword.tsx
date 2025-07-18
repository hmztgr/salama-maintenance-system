'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  Send,
  Lock,
  Shield
} from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';

export function ForgotPassword() {
  const router = useRouter();
  const { sendResetEmail, loading, error } = useForgotPassword();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('البريد الإلكتروني مطلوب');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('تنسيق البريد الإلكتروني غير صحيح');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateEmail(email)) {
      return;
    }

    try {
      const result = await sendResetEmail(email);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setSubmitError(result.error || 'فشل في إرسال بريد استعادة كلمة المرور');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setSubmitError('حدث خطأ أثناء إرسال البريد');
    }
  };

  // Handle input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  // Success state - email sent
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              تم إرسال البريد بنجاح
            </h2>

            <p className="text-gray-600 mb-6">
              تم إرسال رابط استعادة كلمة المرور إلى:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{email}</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2 mb-6 text-right">
              <p>• تحقق من صندوق الوارد وملف الرسائل غير المرغوبة</p>
              <p>• الرابط صالح لمدة 24 ساعة فقط</p>
              <p>• اتبع التعليمات في البريد لاستعادة كلمة المرور</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full gap-2"
              >
                <Send className="w-4 h-4" />
                إرسال مرة أخرى
              </Button>

              <Button
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

  // Main forgot password form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <CardTitle className="text-xl font-bold text-gray-900">
            استعادة كلمة المرور
          </CardTitle>

          <p className="text-gray-600 mt-2">
            أدخل بريدك الإلكتروني وسنرسل لك رابط لاستعادة كلمة المرور
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="your@email.com"
                  className={`pl-10 text-left ${emailError ? 'border-red-500' : ''}`}
                  dir="ltr"
                  disabled={loading}
                />
              </div>
              {emailError && (
                <p className="text-sm text-red-500 text-right">{emailError}</p>
              )}
            </div>

            {/* Error Message */}
            {(submitError || error) && (
              <Alert className="border-red-500 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {submitError || error}
                </AlertDescription>
              </Alert>
            )}

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">تنبيه أمني:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• سيتم إرسال رابط آمن لاستعادة كلمة المرور</li>
                    <li>• الرابط صالح لمدة 24 ساعة فقط</li>
                    <li>• لا تشارك الرابط مع أي شخص آخر</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال رابط الاستعادة
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
                disabled={loading}
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
