'use client';

import { useState, useRef } from 'react';
import { ContractInfo } from '@/types/customer';
import { formatDateForInput, convertInputDateToStandard, parseStandardDate } from '@/lib/date-handler';

export interface ContractInfoStepProps {
  data?: ContractInfo;
  onComplete: (data: ContractInfo) => void;
  onBack: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function ContractInfoStep({
  data,
  onComplete,
  onBack,
  isLoading = false,
  isEditing = false
}: ContractInfoStepProps) {
  const [formData, setFormData] = useState<ContractInfo>(data || {
    id: Date.now().toString(),
    contractStartDate: '',
    contractEndDate: '',
    contractPeriodMonths: 12,
    regularVisitsPerYear: 12,
    emergencyVisitsPerYear: 4,
    fireExtinguisherMaintenance: false,
    alarmSystemMaintenance: false,
    fireSuppressionMaintenance: false,
    gasFireSuppression: false,
    foamFireSuppression: false,
    contractValue: 0,
    notes: '',
    branches: [], // Initialize empty branches for this contract
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usePeriod, setUsePeriod] = useState(false);
  const contractFileRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Contract dates are mandatory
    if (!formData.contractStartDate) {
      newErrors.contractStartDate = 'تاريخ بداية العقد مطلوب';
    }

    if (!usePeriod && !formData.contractEndDate) {
      newErrors.contractEndDate = 'تاريخ انتهاء العقد مطلوب';
    }

    if (usePeriod && (!formData.contractPeriodMonths || formData.contractPeriodMonths <= 0)) {
      newErrors.contractPeriodMonths = 'مدة العقد بالأشهر مطلوبة';
    }

    // Visits are mandatory
    if (formData.regularVisitsPerYear < 0) {
      newErrors.regularVisitsPerYear = 'عدد الزيارات العادية يجب أن يكون 0 أو أكثر';
    }

    if (formData.emergencyVisitsPerYear < 0) {
      newErrors.emergencyVisitsPerYear = 'عدد الزيارات الطارئة يجب أن يكون 0 أو أكثر';
    }

    // Date validation
    if (formData.contractStartDate && formData.contractEndDate) {
      const startDate = parseStandardDate(formData.contractStartDate);
      const endDate = parseStandardDate(formData.contractEndDate);

      if (startDate && endDate && endDate <= startDate) {
        newErrors.contractEndDate = 'تاريخ انتهاء العقد يجب أن يكون بعد تاريخ البداية';
      }
    }

    // Check if at least one fire safety service is selected
    const hasAnyService = formData.fireExtinguisherMaintenance ||
                         formData.alarmSystemMaintenance ||
                         formData.fireSuppressionMaintenance ||
                         formData.gasFireSuppression ||
                         formData.foamFireSuppression;

    if (!hasAnyService) {
      newErrors.services = 'يجب اختيار خدمة واحدة على الأقل من خدمات السلامة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContractInfo, value: string | number | boolean) => {
    let processedValue = value;

    // Convert date values from input format (yyyy-mm-dd) to standard format (dd-mmm-yyyy)
    if ((field === 'contractStartDate' || field === 'contractEndDate') && typeof value === 'string') {
      processedValue = convertInputDateToStandard(value);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));

    // Auto-calculate end date if using period
    if (field === 'contractStartDate' || field === 'contractPeriodMonths') {
      if (usePeriod && formData.contractStartDate && formData.contractPeriodMonths) {
        const startDate = parseStandardDate(formData.contractStartDate);
        if (startDate) {
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + (formData.contractPeriodMonths || 12));
          const endDateString = convertInputDateToStandard(endDate.toISOString().split('T')[0]);
          setFormData(prev => ({ ...prev, contractEndDate: endDateString }));
        }
      }
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, contractDocument: file || undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onComplete(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          الخطوة 2: {isEditing ? 'تعديل' : 'إضافة'} بيانات العقد
        </h2>
        <p className="text-gray-600">
          أدخل تفاصيل العقد وخدمات السلامة من الحريق
        </p>
      </div>

      <div className="space-y-6">
        {/* Contract Dates */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">تواريخ العقد</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ بداية العقد <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formatDateForInput(formData.contractStartDate)}
                onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contractStartDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.contractStartDate && (
                <p className="text-red-500 text-xs mt-1">{errors.contractStartDate}</p>
              )}
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="usePeriod"
                  checked={usePeriod}
                  onChange={(e) => setUsePeriod(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <label htmlFor="usePeriod" className="mr-2 text-sm text-gray-700">
                  تحديد مدة العقد بالأشهر
                </label>
              </div>

              {usePeriod ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    مدة العقد (بالأشهر) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.contractPeriodMonths || ''}
                    onChange={(e) => handleInputChange('contractPeriodMonths', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contractPeriodMonths ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12"
                    disabled={isLoading}
                  />
                  {errors.contractPeriodMonths && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractPeriodMonths}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ انتهاء العقد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.contractEndDate)}
                    onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contractEndDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.contractEndDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractEndDate}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {usePeriod && formData.contractEndDate && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>تاريخ انتهاء العقد المحسوب:</strong> {formData.contractEndDate}
              </p>
            </div>
          )}
        </div>

        {/* Visit Allowances */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">عدد الزيارات السنوية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الزيارات العادية <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.regularVisitsPerYear}
                onChange={(e) => handleInputChange('regularVisitsPerYear', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.regularVisitsPerYear ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.regularVisitsPerYear && (
                <p className="text-red-500 text-xs mt-1">{errors.regularVisitsPerYear}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الزيارات الطارئة المجانية <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={formData.emergencyVisitsPerYear}
                onChange={(e) => handleInputChange('emergencyVisitsPerYear', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyVisitsPerYear ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.emergencyVisitsPerYear && (
                <p className="text-red-500 text-xs mt-1">{errors.emergencyVisitsPerYear}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fire Safety Services */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            خدمات السلامة من الحريق <span className="text-red-500">*</span>
          </h3>

          {errors.services && (
            <p className="text-red-500 text-sm mb-4">{errors.services}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="fireExtinguisher"
                checked={formData.fireExtinguisherMaintenance}
                onChange={(e) => handleInputChange('fireExtinguisherMaintenance', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="fireExtinguisher" className="mr-2 text-sm text-gray-700">
                صيانة الطفايات
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="alarmSystem"
                checked={formData.alarmSystemMaintenance}
                onChange={(e) => handleInputChange('alarmSystemMaintenance', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="alarmSystem" className="mr-2 text-sm text-gray-700">
                صيانة نظام الانذار
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="fireSuppression"
                checked={formData.fireSuppressionMaintenance}
                onChange={(e) => handleInputChange('fireSuppressionMaintenance', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="fireSuppression" className="mr-2 text-sm text-gray-700">
                صيانة نظام الاطفاء
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="gasSuppression"
                checked={formData.gasFireSuppression}
                onChange={(e) => handleInputChange('gasFireSuppression', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="gasSuppression" className="mr-2 text-sm text-gray-700">
                نظام الاطفاء بنظام الغاز
              </label>
            </div>

            <div className="flex items-center md:col-span-2">
              <input
                type="checkbox"
                id="foamSuppression"
                checked={formData.foamFireSuppression}
                onChange={(e) => handleInputChange('foamFireSuppression', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="foamSuppression" className="mr-2 text-sm text-gray-700">
                صيانة نظام الاطفاء بنظام الفوم
              </label>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات إضافية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                قيمة العقد (ريال سعودي)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.contractValue || ''}
                onChange={(e) => handleInputChange('contractValue', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وثيقة العقد
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                <input
                  ref={contractFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => contractFileRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  disabled={isLoading}
                >
                  📎 رفع وثيقة العقد
                </button>
                {formData.contractDocument && (
                  <p className="text-xs text-green-600 mt-1">
                    {formData.contractDocument.name}
                  </p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات العقد
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أي ملاحظات خاصة بهذا العقد"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          disabled={isLoading}
        >
          العودة للخطوة السابقة
        </button>

        <button
          type="submit"
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'جاري الحفظ...' : (isEditing ? 'تحديث العقد' : 'حفظ العقد والانتقال للخطوة التالية')}
        </button>
      </div>
    </form>
  );
}

// Safe default props
ContractInfoStep.defaultProps = {
  isLoading: false,
  isEditing: false,
};
