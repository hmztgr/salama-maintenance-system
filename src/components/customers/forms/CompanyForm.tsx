'use client';

import { useState, useRef } from 'react';
import { Company } from '@/types/customer';

export interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: Omit<Company, 'id' | 'companyId' | 'isArchived' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CompanyForm({ company, onSubmit, onCancel, isLoading = false }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    companyName: company?.companyName || '',
    unifiedNumber: company?.unifiedNumber || '',
    commercialRegistration: company?.commercialRegistration || '',
    vatNumber: company?.vatNumber || '',
    email: company?.email || '',
    phone: company?.phone || '',
    mobile: company?.mobile || '',
    address: company?.address || '',
    website: company?.website || '',
    contactPerson: company?.contactPerson || '',
    contactPersonTitle: company?.contactPersonTitle || '',
    notes: company?.notes || '',
    commercialRegistrationFile: undefined as File | undefined,
    vatFile: undefined as File | undefined,
    nationalAddressFile: undefined as File | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // File input refs
  const commercialRegFileRef = useRef<HTMLInputElement>(null);
  const vatFileRef = useRef<HTMLInputElement>(null);
  const nationalAddressFileRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company name is mandatory
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'اسم الشركة مطلوب';
    }

    // Email validation if provided
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'صيغة البريد الإلكتروني غير صحيحة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const isEditing = !!company;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'تعديل الشركة' : 'إضافة شركة جديدة'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">المعلومات الأساسية</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name - Mandatory */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الشركة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="أدخل اسم الشركة أو المؤسسة"
                    disabled={isLoading}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرقم الموحد
                  </label>
                  <input
                    type="text"
                    value={formData.unifiedNumber}
                    onChange={(e) => handleInputChange('unifiedNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم المؤسسة الموحد"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={formData.commercialRegistration}
                    onChange={(e) => handleInputChange('commercialRegistration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم السجل التجاري"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرقم الضريبي
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم ضريبة القيمة المضافة"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الاتصال</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@company.com"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="011-123-4567"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange('mobile', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="05x-xxx-xxxx"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الموقع الإلكتروني
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://www.company.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الشخص المسؤول
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الشخص المسؤول"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المنصب
                  </label>
                  <input
                    type="text"
                    value={formData.contactPersonTitle}
                    onChange={(e) => handleInputChange('contactPersonTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مدير، مشرف، إلخ"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="العنوان الكامل للمقر الرئيسي"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">الوثائق والمرفقات</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Commercial Registration Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السجل التجاري
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      ref={commercialRegFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('commercialRegistrationFile', e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => commercialRegFileRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      📎 رفع ملف السجل التجاري
                    </button>
                    {formData.commercialRegistrationFile && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.commercialRegistrationFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* VAT Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شهادة ضريبة القيمة المضافة
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      ref={vatFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('vatFile', e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => vatFileRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      📎 رفع شهادة الضريبة
                    </button>
                    {formData.vatFile && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.vatFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* National Address Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان الوطني
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                      ref={nationalAddressFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange('nationalAddressFile', e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => nationalAddressFileRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      📎 رفع العنوان الوطني
                    </button>
                    {formData.nationalAddressFile && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.nationalAddressFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملاحظات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="أي ملاحظات إضافية"
                disabled={isLoading}
              />
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
      </div>
    </div>
  );
}

// Safe default props
CompanyForm.defaultProps = {
  isLoading: false,
};
