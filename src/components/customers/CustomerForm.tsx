'use client';

import { useState, useEffect } from 'react';
import { Customer, CustomerFormData } from '@/types/customer';
import { getSaudiCities } from '@/lib/id-generator';
import { formatDateForDisplay, getCurrentDate, formatDateForInput, convertInputDateToStandard, parseStandardDate } from '@/lib/date-handler';

export interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, isLoading = false }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    location: '',
    branch: '',
    area: '',
    contractStartDate: '',
    contractEndDate: '',
    regularVisitsPerYear: 12,
    emergencyVisitsPerYear: 4,
    teamMember: '',
    // Fire safety services - default to false
    fireExtinguisherMaintenance: false,
    alarmSystemMaintenance: false,
    fireSuppressionMaintenance: false,
    gasFireSuppression: false,
    foamFireSuppression: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const saudiCities = getSaudiCities();

  // Populate form when editing
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        location: customer.location,
        branch: customer.branch,
        area: customer.area,
        contractStartDate: formatDateForInput(customer.contractStartDate || ''),
        contractEndDate: formatDateForInput(customer.contractEndDate || ''),
        regularVisitsPerYear: customer.regularVisitsPerYear,
        emergencyVisitsPerYear: customer.emergencyVisitsPerYear,
        teamMember: customer.teamMember || '',
        fireExtinguisherMaintenance: customer.fireExtinguisherMaintenance,
        alarmSystemMaintenance: customer.alarmSystemMaintenance,
        fireSuppressionMaintenance: customer.fireSuppressionMaintenance,
        gasFireSuppression: customer.gasFireSuppression,
        foamFireSuppression: customer.foamFireSuppression,
      });
    }
  }, [customer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'اسم العميل مطلوب';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'الموقع مطلوب';
    }
    if (!formData.branch.trim()) {
      newErrors.branch = 'اسم الفرع مطلوب';
    }
    if (!formData.area) {
      newErrors.area = 'المنطقة مطلوبة';
    }

    // Validate visit numbers
    if (formData.regularVisitsPerYear < 0) {
      newErrors.regularVisitsPerYear = 'عدد الزيارات العادية يجب أن يكون 0 أو أكثر';
    }
    if (formData.emergencyVisitsPerYear < 0) {
      newErrors.emergencyVisitsPerYear = 'عدد الزيارات الطارئة يجب أن يكون 0 أو أكثر';
    }

    // Validate contract dates if provided
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: string | number | boolean) => {
    // Convert date values from input format (yyyy-mm-dd) to standard format (dd-mmm-yyyy)
    let processedValue = value;
    if ((field === 'contractStartDate' || field === 'contractEndDate') && typeof value === 'string') {
      processedValue = convertInputDateToStandard(value);
    }

    setFormData(prev => ({ ...prev, [field]: processedValue }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isEditing = !!customer;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {isEditing ? 'تعديل العميل' : 'إضافة عميل جديد'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم العميل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="اسم الشركة أو المؤسسة"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المنطقة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">اختر المنطقة</option>
                {saudiCities.map(city => (
                  <option key={city.code} value={city.name}>{city.name}</option>
                ))}
              </select>
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الموقع <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="اسم الموقع أو المجمع"
                disabled={isLoading}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الفرع <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.branch ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="الفرع الرئيسي، الفرع الشمالي، إلخ"
                disabled={isLoading}
              />
              {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
            </div>

            {/* Team Member */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عضو الفريق المسؤول
              </label>
              <input
                type="text"
                value={formData.teamMember}
                onChange={(e) => handleInputChange('teamMember', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="اسم الفني أو المشرف المسؤول"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Contract Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات العقد</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ بداية العقد
              </label>
              <input
                type="date"
                value={formatDateForInput(formData.contractStartDate || '')}
                onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Contract End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ انتهاء العقد
              </label>
              <input
                type="date"
                value={formatDateForInput(formData.contractEndDate || '')}
                onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contractEndDate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.contractEndDate && <p className="text-red-500 text-xs mt-1">{errors.contractEndDate}</p>}
            </div>

            {/* Regular Visits Per Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الزيارات العادية سنوياً
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
              {errors.regularVisitsPerYear && <p className="text-red-500 text-xs mt-1">{errors.regularVisitsPerYear}</p>}
            </div>

            {/* Emergency Visits Per Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عدد الزيارات الطارئة سنوياً
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
              {errors.emergencyVisitsPerYear && <p className="text-red-500 text-xs mt-1">{errors.emergencyVisitsPerYear}</p>}
            </div>
          </div>
        </div>

        {/* Fire Safety Services */}
        <div className="pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            خدمات السلامة من الحريق <span className="text-red-500">*</span>
          </h3>

          {errors.services && (
            <p className="text-red-500 text-sm mb-4">{errors.services}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fire Extinguisher Maintenance */}
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

            {/* Alarm System Maintenance */}
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

            {/* Fire Suppression System Maintenance */}
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

            {/* Gas Fire Suppression System */}
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

            {/* Foam Fire Suppression System */}
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

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 space-x-reverse pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحفظ...' : (isEditing ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </form>
    </div>
  );
}

// Safe default props
CustomerForm.defaultProps = {
  isLoading: false,
};
