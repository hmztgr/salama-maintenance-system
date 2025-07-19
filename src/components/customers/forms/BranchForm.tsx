'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Branch } from '@/types/customer';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';

interface BranchFormProps {
  branch?: Branch;
  onSuccess: () => void;
  onCancel: () => void;
}

const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران',
  'الطائف', 'بريدة', 'تبوك', 'خميس مشيط', 'حائل', 'نجران', 'الجبيل', 'ينبع',
  'أبها', 'عرعر', 'سكاكا', 'جيزان', 'القطيف', 'الأحساء', 'الباحة', 'القريات'
];

export function BranchForm({ branch, onSuccess, onCancel }: BranchFormProps) {
  const { addBranch, updateBranch } = useBranchesFirebase();
  const { companies } = useCompaniesFirebase();

  const [formData, setFormData] = useState({
    companyId: branch?.companyId || '',
    contractIds: [], // Empty by default - contracts will be linked from contract creation
    city: branch?.city || '',
    location: branch?.location || '',
    branchName: branch?.branchName || '',
    address: branch?.address || '',
    contactPerson: branch?.contactPerson || '',
    contactPhone: branch?.contactPhone || '',
    notes: branch?.notes || '',
    teamMember: branch?.teamMember || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Note: Contract handling moved to contract creation flow

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyId.trim()) {
      newErrors.companyId = 'اختيار الشركة مطلوب';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'الموقع مطلوب';
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = 'اسم الفرع مطلوب';
    }

    if (formData.contactPhone && !/^[\d\s\-\+\(\)]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'رقم الهاتف غير صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (branch) {
        // Update existing branch
        const result = await updateBranch(branch.id, formData);
        if (result.success) {
          setSuccessMessage('تم تحديث بيانات الفرع بنجاح');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setErrorMessage(result.warnings?.join(', ') || 'فشل في تحديث بيانات الفرع');
        }
      } else {
        // Add new branch
        const result = await addBranch(formData);
        if (result.success) {
          setSuccessMessage('تم إضافة الفرع بنجاح');

          // Show warnings if any
          if (result.warnings && result.warnings.length > 0) {
            console.warn('Branch creation warnings:', result.warnings);
          }

          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setErrorMessage(result.warnings?.join(', ') || 'فشل في إضافة الفرع');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrorMessage('حدث خطأ أثناء العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-right">
            {branch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}
          </CardTitle>
        </CardHeader>

        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Selection - Enhanced Searchable */}
          <div className="space-y-2">
            <Label htmlFor="companyId" className="text-right block">
              الشركة *
            </Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) => handleInputChange('companyId', value)}
              dir="rtl"
            >
              <SelectTrigger className={errors.companyId ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر الشركة" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {companies.filter(c => !c.isArchived).map((company) => (
                  <SelectItem key={company.companyId} value={company.companyId}>
                    {company.companyName} ({company.companyId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && (
              <p className="text-sm text-red-500 text-right">{errors.companyId}</p>
            )}
          </div>

          {/* Note: Contract selection moved to contract creation flow */}

          {/* City Selection - Enhanced Searchable */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-right block">
              المدينة *
            </Label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleInputChange('city', value)}
              dir="rtl"
            >
              <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر المدينة" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                {SAUDI_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && (
              <p className="text-sm text-red-500 text-right">{errors.city}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-right block">
              الموقع *
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="مثال: حي الملز، طريق الملك فهد"
              className={`text-right ${errors.location ? 'border-red-500' : ''}`}
              dir="rtl"
            />
            {errors.location && (
              <p className="text-sm text-red-500 text-right">{errors.location}</p>
            )}
          </div>

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branchName" className="text-right block">
              اسم الفرع *
            </Label>
            <Input
              id="branchName"
              value={formData.branchName}
              onChange={(e) => handleInputChange('branchName', e.target.value)}
              placeholder="مثال: الفرع الرئيسي، فرع الرياض"
              className={`text-right ${errors.branchName ? 'border-red-500' : ''}`}
              dir="rtl"
            />
            {errors.branchName && (
              <p className="text-sm text-red-500 text-right">{errors.branchName}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-right block">
              العنوان التفصيلي
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="العنوان التفصيلي للفرع"
              className="text-right min-h-[80px]"
              dir="rtl"
            />
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <Label htmlFor="contactPerson" className="text-right block">
              الشخص المسؤول
            </Label>
            <Input
              id="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              placeholder="اسم الشخص المسؤول عن الفرع"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-right block">
              هاتف التواصل
            </Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="0501234567"
              className={`text-right ${errors.contactPhone ? 'border-red-500' : ''}`}
              dir="rtl"
            />
            {errors.contactPhone && (
              <p className="text-sm text-red-500 text-right">{errors.contactPhone}</p>
            )}
          </div>

          {/* Team Member */}
          <div className="space-y-2">
            <Label htmlFor="teamMember" className="text-right block">
              فريق العمل المختص
            </Label>
            <Input
              id="teamMember"
              value={formData.teamMember}
              onChange={(e) => handleInputChange('teamMember', e.target.value)}
              placeholder="اسم فريق العمل المسؤول عن هذا الفرع"
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-right block">
              ملاحظات
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="أي ملاحظات إضافية حول الفرع"
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
          {errorMessage && (
            <Alert className="border-red-500 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 text-right">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'جاري الحفظ...' : (branch ? 'تحديث' : 'إضافة')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
