'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  UserCheck,
  Shield
} from 'lucide-react';

// Firebase imports for invitation validation
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { createUser } from '@/lib/firebase/auth';

// Enhanced client-side invitation acceptance with Firebase integration
export function InvitationAcceptance() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [validationError, setValidationError] = useState<string>('');
  const [invitation, setInvitation] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Enhanced Firebase-based invitation validation
  const validateInvitationToken = async (token: string) => {
    try {
      console.log('🔍 Validating invitation token:', token);
      
      // Query Firebase for invitation with this token
      const invitationsRef = collection(db, 'invitations');
      const q = query(invitationsRef, where('linkToken', '==', token));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ No invitation found for token:', token);
        setValidationState('invalid');
        setValidationError('رمز الدعوة غير صحيح أو غير موجود');
        return;
      }

      const invitationDoc = querySnapshot.docs[0];
      const invitationData = invitationDoc.data();
      
      console.log('✅ Found invitation:', invitationData);

      // Check expiration
      const expiresAt = invitationData.expiresAt?.toDate ? invitationData.expiresAt.toDate() : new Date(invitationData.expiresAt);
      if (expiresAt < new Date()) {
        console.log('❌ Invitation expired:', expiresAt);
        setValidationState('invalid');
        setValidationError('انتهت صلاحية الدعوة');
        return;
      }

      // Check if already accepted
      if (invitationData.status === 'accepted') {
        console.log('❌ Invitation already accepted');
        setValidationState('invalid');
        setValidationError('تم استخدام هذه الدعوة بالفعل');
        return;
      }

      // Check if revoked
      if (invitationData.status === 'revoked') {
        console.log('❌ Invitation revoked');
        setValidationState('invalid');
        setValidationError('تم إلغاء هذه الدعوة');
        return;
      }

      // Valid invitation
      console.log('✅ Invitation is valid');
      setInvitation({ id: invitationDoc.id, ...invitationData });
      setValidationState('valid');
      
      // Pre-fill email if available
      if (invitationData.email) {
        setFormData(prev => ({ ...prev, email: invitationData.email }));
      }

    } catch (error) {
      console.error('❌ Error validating invitation:', error);
      setValidationState('invalid');
      setValidationError('حدث خطأ أثناء التحقق من الدعوة');
    }
  };

  // Client-side only initialization with Firebase integration
  useEffect(() => {
    setMounted(true);

    // Get token from URL only on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      setToken(urlToken);

      if (!urlToken) {
        setValidationState('invalid');
        setValidationError('رابط الدعوة غير صحيح - لا يحتوي على رمز الدعوة');
        return;
      }

      // Validate with Firebase
      validateInvitationToken(urlToken);
    }
  }, []);

  // Show loading until client-side mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    // Basic validation
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'اسم المستخدم مطلوب';
    }

    if (!formData.password.trim()) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'الاسم الكامل مطلوب';
    }

    if (!formData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'تنسيق البريد الإلكتروني غير صحيح';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    // Real user creation process
    try {
      console.log('📝 Creating user account:', {
        token,
        userData: formData,
        invitation: invitation
      });

      console.log('🔧 Firebase config check:', {
        auth: !!auth,
        db: !!db,
        email: formData.email,
        password: formData.password ? '***' : 'missing'
      });

      // Check if user already exists
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        setFormErrors({ email: 'يوجد حساب بالفعل لهذا البريد الإلكتروني' });
        setIsSubmitting(false);
        return;
      }

      // Create user in Firebase Authentication and Firestore
      console.log('🚀 Starting user creation in Firebase Auth...');
      
      const userProfile = await createUser(
        formData.email,
        formData.password,
        {
          displayName: formData.fullName,
          role: invitation.role || 'viewer',
          phone: formData.phone || '',
          invitedBy: invitation.invitedBy || 'system'
        }
      );
      
      console.log('✅ User created in Firebase Auth and Firestore:', userProfile);

      // Update user profile with permission groups if they exist
      if (invitation.permissionGroups && invitation.permissionGroups.length > 0) {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          permissionGroups: invitation.permissionGroups,
          customPermissions: [],
          deniedPermissions: []
        });
        console.log('✅ User permission groups updated');
      }

      // Mark invitation as accepted
      if (typeof window !== 'undefined' && token) {
        try {
          const invitationRef = doc(db, 'invitations', invitation.id);
          await updateDoc(invitationRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
          });
          console.log('✅ Invitation status updated to accepted:', invitation.id);
        } catch (e) {
          console.error('Failed to update invitation status:', e);
        }
      }

      setRegistrationSuccess(true);
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          errorMessage = 'يوجد حساب بالفعل لهذا البريد الإلكتروني';
        } else if (error.message.includes('auth/weak-password')) {
          errorMessage = 'كلمة المرور ضعيفة جداً';
        } else if (error.message.includes('auth/invalid-email')) {
          errorMessage = 'البريد الإلكتروني غير صحيح';
        } else {
          errorMessage = `خطأ: ${error.message}`;
        }
      }
      
      setFormErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (validationState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الدعوة...</p>
        </div>
      </div>
    );
  }

  // Invalid invitation state
  if (validationState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">دعوة غير صالحة</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{validationError}</p>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              العودة إلى الصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration success state
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">تم إنشاء الحساب بنجاح!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول باستخدام البيانات التي أدخلتها.
            </p>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ملاحظة:</strong> هذا نظام تجريبي. في النظام الحقيقي سيتم إنشاء حساب فعلي يمكنك استخدامه لتسجيل الدخول.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              الذهاب لتسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show registration form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بك!</h1>
          <p className="text-gray-600">تم دعوتك للانضمام إلى نظام إدارة الصيانة</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">إنشاء حساب جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>دعوة صالحة:</strong> تم التحقق من صحة رابط الدعوة بنجاح.
              </AlertDescription>
            </Alert>

            {formErrors.general && (
              <Alert className="mb-6" variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{formErrors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <Label htmlFor="username">اسم المستخدم *</Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="pr-10"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pr-10"
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pr-10"
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pr-10"
                    placeholder="أدخل رقم الهاتف (اختياري)"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10 pl-10"
                    placeholder="أدخل كلمة المرور"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  كلمة المرور يجب أن تكون 6 أحرف على الأقل
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  'إنشاء الحساب'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                بإنشاء الحساب، أنت توافق على شروط الخدمة وسياسة الخصوصية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
