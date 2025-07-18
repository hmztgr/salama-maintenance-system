'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  Globe,
  Calendar,
  Camera,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Upload
} from 'lucide-react';
import { UserProfile, ProfileUpdateRequest, ProfileManagementActions } from '@/types/profile-management';

interface ProfileEditorProps {
  profile: UserProfile | null;
  actions: ProfileManagementActions;
  onSuccess: () => void;
}

export function ProfileEditor({ profile, actions, onSuccess }: ProfileEditorProps) {
  const [formData, setFormData] = useState<ProfileUpdateRequest>({
    fullName: profile?.fullName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    jobTitle: profile?.jobTitle || '',
    department: profile?.department || '',
    location: profile?.location || '',
    timezone: profile?.timezone || '',
    language: profile?.language || 'ar',
    dateFormat: profile?.dateFormat || 'dd-mm-yyyy'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle input change
  const handleInputChange = (field: keyof ProfileUpdateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const result = await actions.updateProfile(profile.id, formData);

      if (result.success) {
        setSuccessMessage('تم تحديث الملف الشخصي بنجاح');
        onSuccess();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: result.error || 'فشل في تحديث الملف الشخصي' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setErrors({ submit: 'حدث خطأ أثناء تحديث الملف الشخصي' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'يجب أن يكون الملف صورة' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' });
      return;
    }

    setAvatarUploading(true);
    setErrors({ avatar: '' });

    try {
      const result = await actions.uploadAvatar(profile.id, file);

      if (result.success) {
        setSuccessMessage('تم تحديث الصورة الشخصية بنجاح');
        onSuccess();
      } else {
        setErrors({ avatar: result.error || 'فشل في رفع الصورة' });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setErrors({ avatar: 'حدث خطأ أثناء رفع الصورة' });
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle avatar deletion
  const handleAvatarDelete = async () => {
    if (!profile) return;

    if (!confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) return;

    try {
      const result = await actions.deleteAvatar(profile.id);

      if (result.success) {
        setSuccessMessage('تم حذف الصورة الشخصية بنجاح');
        onSuccess();
      } else {
        setErrors({ avatar: result.error || 'فشل في حذف الصورة' });
      }
    } catch (error) {
      console.error('Avatar delete error:', error);
      setErrors({ avatar: 'حدث خطأ أثناء حذف الصورة' });
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">الملف الشخصي غير متوفر</h3>
        <p className="text-gray-500">لم يتم العثور على بيانات الملف الشخصي</p>
      </div>
    );
  }

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

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Camera className="w-5 h-5" />
            الصورة الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Avatar Display */}
            <div className="relative">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                {profile.profileData?.avatarUrl ? (
                  <img
                    src={profile.profileData.avatarUrl}
                    alt="الصورة الشخصية"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-blue-600" />
                )}
              </div>

              {avatarUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Avatar Controls */}
            <div className="space-y-3">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {profile.profileData?.avatarUrl ? 'تغيير الصورة' : 'رفع صورة'}
                </Button>
              </div>

              {profile.profileData?.avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarDelete}
                  disabled={avatarUploading}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف الصورة
                </Button>
              )}

              <p className="text-xs text-gray-600">
                يُقبل JPG، PNG، GIF. الحد الأقصى 5 ميجابايت.
              </p>

              {errors.avatar && (
                <p className="text-sm text-red-500">{errors.avatar}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <User className="w-5 h-5" />
            المعلومات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-right block">
                  الاسم الكامل *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="الاسم الأول والأخير"
                    className={`pl-10 text-right ${errors.fullName ? 'border-red-500' : ''}`}
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-500 text-right">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-right block">
                  البريد الإلكتروني *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`pl-10 text-left ${errors.email ? 'border-red-500' : ''}`}
                    dir="ltr"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 text-right">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-right block">
                  رقم الهاتف
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="05xxxxxxxx"
                    className={`pl-10 text-left ${errors.phone ? 'border-red-500' : ''}`}
                    dir="ltr"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 text-right">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-right block">
                  الموقع
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="المدينة، البلد"
                    className="pl-10 text-right"
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-right block">
                  المنصب
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle || ''}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="المنصب الوظيفي"
                    className="pl-10 text-right"
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-right block">
                  القسم
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="القسم أو الإدارة"
                    className="pl-10 text-right"
                    dir="rtl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-right block">
                  <Globe className="inline w-4 h-4 ml-1" />
                  اللغة المفضلة
                </Label>
                <Select
                  value={formData.language || 'ar'}
                  onValueChange={(value) => handleInputChange('language', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-right block">
                  <Calendar className="inline w-4 h-4 ml-1" />
                  تنسيق التاريخ
                </Label>
                <Select
                  value={formData.dateFormat || 'dd-mm-yyyy'}
                  onValueChange={(value) => handleInputChange('dateFormat', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                    <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-right block">
                  المنطقة الزمنية
                </Label>
                <Select
                  value={formData.timezone || ''}
                  onValueChange={(value) => handleInputChange('timezone', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنطقة الزمنية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">توقيت السعودية (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">توقيت الإمارات (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Kuwait">توقيت الكويت (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Qatar">توقيت قطر (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Bahrain">توقيت البحرين (GMT+3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Reset form to original values
                  setFormData({
                    fullName: profile?.fullName || '',
                    email: profile?.email || '',
                    phone: profile?.phone || '',
                    jobTitle: profile?.jobTitle || '',
                    department: profile?.department || '',
                    location: profile?.location || '',
                    timezone: profile?.timezone || '',
                    language: profile?.language || 'ar',
                    dateFormat: profile?.dateFormat || 'dd-mm-yyyy'
                  });
                  setErrors({});
                  setSuccessMessage('');
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
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Profile Completion Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">نصائح لإكمال الملف الشخصي</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• أكمل جميع الحقول المطلوبة لتحسين نقاط الأمان</li>
                <li>• أضف صورة شخصية لتسهيل التعرف عليك</li>
                <li>• تأكد من صحة معلومات الاتصال للحصول على الإشعارات</li>
                <li>• اختر المنطقة الزمنية الصحيحة لضمان دقة المواعيد</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
