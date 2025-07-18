'use client';

import { useState } from 'react';
import { BranchInfo } from '@/types/customer';
import { getSaudiCities } from '@/lib/id-generator';

export interface BranchInfoStepProps {
  data: BranchInfo[];
  onComplete: (data: BranchInfo[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const initialBranchData: Omit<BranchInfo, 'id'> = {
  city: '',
  location: '',
  branchName: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  notes: '',
};

export function BranchInfoStep({
  data,
  onComplete,
  onBack,
  isLoading = false
}: BranchInfoStepProps) {
  const [branches, setBranches] = useState<BranchInfo[]>(
    data.length > 0 ? data : [{
      id: Date.now().toString(),
      ...initialBranchData
    }]
  );
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const saudiCities = getSaudiCities();

  const validateForm = (): boolean => {
    const newErrors: Record<string, Record<string, string>> = {};

    branches.forEach((branch, index) => {
      const branchErrors: Record<string, string> = {};

      // Required fields
      if (!branch.city.trim()) {
        branchErrors.city = 'المدينة مطلوبة';
      }
      if (!branch.location.trim()) {
        branchErrors.location = 'الموقع مطلوب';
      }
      if (!branch.branchName.trim()) {
        branchErrors.branchName = 'اسم الفرع مطلوب';
      }

      if (Object.keys(branchErrors).length > 0) {
        newErrors[branch.id] = branchErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    branchId: string,
    field: keyof BranchInfo,
    value: string
  ) => {
    setBranches(prev => prev.map(branch =>
      branch.id === branchId
        ? { ...branch, [field]: value }
        : branch
    ));

    // Clear error for this field
    if (errors[branchId]?.[field]) {
      setErrors(prev => ({
        ...prev,
        [branchId]: {
          ...prev[branchId],
          [field]: ''
        }
      }));
    }
  };

  const addBranch = () => {
    const newBranch: BranchInfo = {
      id: Date.now().toString(),
      ...initialBranchData
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const removeBranch = (branchId: string) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter(branch => branch.id !== branchId));
      // Remove errors for this branch
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[branchId];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onComplete(branches);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          الخطوة 3: معلومات الفروع
        </h2>
        <p className="text-gray-600">
          أضف مواقع الفروع والمناطق التي تشملها خدمات الصيانة
        </p>
      </div>

      <div className="space-y-6">
        {branches.map((branch, index) => (
          <div key={branch.id} className="border border-gray-200 rounded-lg p-4">
            {/* Branch Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                الفرع {index + 1}
              </h3>
              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBranch(branch.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  disabled={isLoading}
                >
                  ❌ حذف الفرع
                </button>
              )}
            </div>

            {/* Branch Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* City - Mandatory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المدينة <span className="text-red-500">*</span>
                </label>
                <select
                  value={branch.city}
                  onChange={(e) => handleInputChange(branch.id, 'city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[branch.id]?.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <option value="">اختر المدينة</option>
                  {saudiCities.map(city => (
                    <option key={city.code} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                {errors[branch.id]?.city && (
                  <p className="text-red-500 text-xs mt-1">{errors[branch.id].city}</p>
                )}
              </div>

              {/* Location - Mandatory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الموقع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={branch.location}
                  onChange={(e) => handleInputChange(branch.id, 'location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[branch.id]?.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="اسم الموقع أو المجمع"
                  disabled={isLoading}
                />
                {errors[branch.id]?.location && (
                  <p className="text-red-500 text-xs mt-1">{errors[branch.id].location}</p>
                )}
              </div>

              {/* Branch Name - Mandatory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الفرع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={branch.branchName}
                  onChange={(e) => handleInputChange(branch.id, 'branchName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[branch.id]?.branchName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="الفرع الرئيسي، الفرع الشمالي، إلخ"
                  disabled={isLoading}
                />
                {errors[branch.id]?.branchName && (
                  <p className="text-red-500 text-xs mt-1">{errors[branch.id].branchName}</p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الشخص المسؤول
                </label>
                <input
                  type="text"
                  value={branch.contactPerson || ''}
                  onChange={(e) => handleInputChange(branch.id, 'contactPerson', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم الشخص المسؤول في الفرع"
                  disabled={isLoading}
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={branch.contactPhone || ''}
                  onChange={(e) => handleInputChange(branch.id, 'contactPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="05x-xxx-xxxx"
                  disabled={isLoading}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان التفصيلي
                </label>
                <textarea
                  value={branch.address || ''}
                  onChange={(e) => handleInputChange(branch.id, 'address', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="العنوان الكامل للفرع"
                  disabled={isLoading}
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={branch.notes || ''}
                  onChange={(e) => handleInputChange(branch.id, 'notes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أي ملاحظات خاصة بهذا الفرع"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Branch Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={addBranch}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            ➕ إضافة فرع جديد
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">ملخص الفروع:</h4>
          <div className="text-sm text-gray-600">
            <p>إجمالي عدد الفروع: <strong>{branches.length}</strong></p>
            <div className="mt-2">
              <p className="font-medium">الفروع المضافة:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {branches.map((branch, index) => (
                  <li key={branch.id}>
                    {branch.branchName || `الفرع ${index + 1}`} - {branch.city} - {branch.location}
                  </li>
                ))}
              </ul>
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
          {isLoading ? 'جاري الحفظ...' : 'حفظ الفروع والانتقال للمراجعة'}
        </button>
      </div>
    </form>
  );
}

// Safe default props
BranchInfoStep.defaultProps = {
  isLoading: false,
};
