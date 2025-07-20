'use client';

import { useState } from 'react';
import { Contract, Company } from '@/types/customer';
import { formatDateForInput, convertInputDateToStandard, parseStandardDate } from '@/lib/date-handler';
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

export interface ContractFormProps {
  contract?: Contract;
  companies: Company[];
  onSubmit: (data: Omit<Contract, 'id' | 'contractId' | 'isArchived' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ContractForm({ contract, companies, onSubmit, onCancel, isLoading = false }: ContractFormProps) {
  // Extract values from first service batch for backward compatibility
  const firstBatch = contract?.serviceBatches?.[0];
  
  const [formData, setFormData] = useState({
    companyId: contract?.companyId || '',
    contractStartDate: contract?.contractStartDate || '',
    contractEndDate: contract?.contractEndDate || '',
    contractPeriodMonths: contract?.contractPeriodMonths || 12,
    regularVisitsPerYear: firstBatch?.regularVisitsPerYear || 12,
    emergencyVisitsPerYear: firstBatch?.emergencyVisitsPerYear ?? 0,
    emergencyVisitCost: firstBatch?.emergencyVisitCost || 0,
    contractValue: contract?.contractValue || 0,
    notes: contract?.notes || '',
    // Fire safety services - extract from first service batch for compatibility
    fireExtinguisherMaintenance: firstBatch?.services?.fireExtinguisherMaintenance || false,
    alarmSystemMaintenance: firstBatch?.services?.alarmSystemMaintenance || false,
    fireSuppressionMaintenance: firstBatch?.services?.fireSuppressionMaintenance || false,
    gasFireSuppression: firstBatch?.services?.gasFireSuppression || false,
    foamFireSuppression: firstBatch?.services?.foamFireSuppression || false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    contract?.contractDocument && typeof contract.contractDocument === 'string'
      ? [{
          name: 'Contract Document',
          url: contract.contractDocument,
          path: 'contracts/' + contract.contractId,
          size: 0,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
        }]
      : []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usePeriod, setUsePeriod] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company is mandatory
    if (!formData.companyId) {
      newErrors.companyId = 'اختيار الشركة مطلوب';
    }

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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    let processedValue = value;

    // Convert date values from input format (yyyy-mm-dd) to standard format (dd-mmm-yyyy)
    if ((field === 'contractStartDate' || field === 'contractEndDate') && typeof value === 'string') {
      processedValue = convertInputDateToStandard(value);
    }

    // Update form data with auto-calculation for period
    setFormData(prev => {
      const newData = { ...prev, [field]: processedValue };

      // Auto-calculate end date if using period
      if ((field === 'contractStartDate' || field === 'contractPeriodMonths') && usePeriod) {
        const startDateValue = field === 'contractStartDate' ? processedValue as string : newData.contractStartDate;
        const monthsValue = field === 'contractPeriodMonths' ? processedValue as number : newData.contractPeriodMonths;

        if (startDateValue && monthsValue && monthsValue > 0) {
          const startDate = parseStandardDate(startDateValue);

          if (startDate) {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + monthsValue);
            const endDateString = convertInputDateToStandard(endDate.toISOString().split('T')[0]);
            newData.contractEndDate = endDateString;
          }
        }
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileDeleted = (filePath: string) => {
    setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Convert old form structure to new serviceBatches structure
      const serviceBatches = [{
        batchId: `batch-${Date.now()}`,
        branchIds: [], // Empty for now - will be assigned when branches are linked
        services: {
          fireExtinguisherMaintenance: formData.fireExtinguisherMaintenance,
          alarmSystemMaintenance: formData.alarmSystemMaintenance,
          fireSuppressionMaintenance: formData.fireSuppressionMaintenance,
          gasFireSuppression: formData.gasFireSuppression,
          foamFireSuppression: formData.foamFireSuppression,
        },
        regularVisitsPerYear: formData.regularVisitsPerYear,
        emergencyVisitsPerYear: formData.emergencyVisitsPerYear,
        emergencyVisitCost: formData.emergencyVisitCost,
        notes: 'خدمات العقد الأساسية',
      }];

      const contractData = {
        companyId: formData.companyId,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        contractPeriodMonths: formData.contractPeriodMonths,
        contractValue: formData.contractValue,
        notes: formData.notes,
        serviceBatches,
        ...(uploadedFiles.length > 0 && { contractDocument: uploadedFiles[0].url }),
      };

      onSubmit(contractData);
    }
  };

  const isEditing = !!contract;
  const selectedCompany = companies.find(c => c.companyId === formData.companyId);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}
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
            {/* Company Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات الشركة</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الشركة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => handleInputChange('companyId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.companyId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading || isEditing} // Don't allow changing company when editing
                  >
                    <option value="">اختر الشركة</option>
                    {companies.filter(c => !c.isArchived).map(company => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyId} - {company.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
                  )}
                  {selectedCompany && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedCompany.companyName}
                      {selectedCompany.email && ` - ${selectedCompany.email}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تكلفة الزيارة الطارئة الإضافية (ريال سعودي)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.emergencyVisitCost || ''}
                    onChange={(e) => handleInputChange('emergencyVisitCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    التكلفة للزيارات الطارئة التي تتجاوز العدد المجاني
                  </p>
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange('contractValue', value ? parseInt(value, 10) : 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    وثيقة العقد
                  </label>
                  <FileUpload
                    onFilesUploaded={handleFilesUploaded}
                    onFileDeleted={handleFileDeleted}
                    existingFiles={uploadedFiles}
                    maxFiles={1}
                    allowedTypes={['pdf', 'doc', 'docx']}
                    folder={contract ? `contracts/${contract.contractId}/documents` : 'contracts/temp'}
                    disabled={isLoading}
                  />
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
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
ContractForm.defaultProps = {
  isLoading: false,
};
