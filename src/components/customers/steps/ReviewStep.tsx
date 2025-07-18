'use client';

import { MultiStepCustomerData, CustomerCreationStep, ContractInfo } from '@/types/customer';

export interface ReviewStepProps {
  data: MultiStepCustomerData;
  onComplete: (data: MultiStepCustomerData) => void;
  onBack: () => void;
  onEdit: (step: CustomerCreationStep) => void;
  onAddContract: () => void;
  onEditContract: (contractId: string) => void;
  isLoading?: boolean;
}

export function ReviewStep({
  data,
  onComplete,
  onBack,
  onEdit,
  onAddContract,
  onEditContract,
  isLoading = false
}: ReviewStepProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data);
  };

  const getFireSafetyServices = (contract: ContractInfo) => {
    const services = [];
    if (contract.fireExtinguisherMaintenance) services.push('صيانة الطفايات');
    if (contract.alarmSystemMaintenance) services.push('صيانة نظام الانذار');
    if (contract.fireSuppressionMaintenance) services.push('صيانة نظام الاطفاء');
    if (contract.gasFireSuppression) services.push('نظام الاطفاء بنظام الغاز');
    if (contract.foamFireSuppression) services.push('صيانة نظام الاطفاء بنظام الفوم');
    return services;
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          الخطوة 4: مراجعة البيانات
        </h2>
        <p className="text-gray-600">
          راجع جميع البيانات المدخلة قبل حفظ العميل الجديد
        </p>
      </div>

      <div className="space-y-6">
        {/* Customer Basic Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">معلومات الشركة</h3>
            <button
              type="button"
              onClick={() => onEdit('basic')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isLoading}
            >
              تعديل ✏️
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">اسم الشركة:</span>
              <span className="mr-2 text-gray-900">{data.basicInfo.companyName || 'غير محدد'}</span>
            </div>

            {data.basicInfo.unifiedNumber && (
              <div>
                <span className="font-medium text-gray-700">الرقم الموحد:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.unifiedNumber}</span>
              </div>
            )}

            {data.basicInfo.commercialRegistration && (
              <div>
                <span className="font-medium text-gray-700">السجل التجاري:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.commercialRegistration}</span>
              </div>
            )}

            {data.basicInfo.vatNumber && (
              <div>
                <span className="font-medium text-gray-700">الرقم الضريبي:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.vatNumber}</span>
              </div>
            )}

            {data.basicInfo.email && (
              <div>
                <span className="font-medium text-gray-700">البريد الإلكتروني:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.email}</span>
              </div>
            )}

            {data.basicInfo.phone && (
              <div>
                <span className="font-medium text-gray-700">رقم الهاتف:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.phone}</span>
              </div>
            )}

            {data.basicInfo.mobile && (
              <div>
                <span className="font-medium text-gray-700">رقم الجوال:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.mobile}</span>
              </div>
            )}

            {data.basicInfo.contactPerson && (
              <div>
                <span className="font-medium text-gray-700">الشخص المسؤول:</span>
                <span className="mr-2 text-gray-900">{data.basicInfo.contactPerson}</span>
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">الوثائق المرفقة:</h4>
            <div className="flex flex-wrap gap-2">
              {data.basicInfo.commercialRegistrationFile && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  📎 السجل التجاري
                </span>
              )}
              {data.basicInfo.vatFile && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  📎 شهادة الضريبة
                </span>
              )}
              {data.basicInfo.nationalAddressFile && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  📎 العنوان الوطني
                </span>
              )}
              {!data.basicInfo.commercialRegistrationFile &&
               !data.basicInfo.vatFile &&
               !data.basicInfo.nationalAddressFile && (
                <span className="text-gray-500 text-sm">لا توجد وثائق مرفقة</span>
              )}
            </div>
          </div>
        </div>

        {/* Contracts */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              العقود ({data.contracts.length})
            </h3>
            <button
              type="button"
              onClick={onAddContract}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isLoading}
            >
              إضافة عقد آخر ➕
            </button>
          </div>

          {data.contracts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لم يتم إضافة أي عقود بعد</p>
          ) : (
            <div className="space-y-4">
              {data.contracts.map((contract, index) => (
                <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">العقد {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => onEditContract(contract.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      تعديل ✏️
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">تاريخ البداية:</span>
                      <span className="mr-2 text-gray-900">{contract.contractStartDate}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">تاريخ الانتهاء:</span>
                      <span className="mr-2 text-gray-900">{contract.contractEndDate}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">الزيارات العادية:</span>
                      <span className="mr-2 text-gray-900">{contract.regularVisitsPerYear} زيارة/سنة</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">الزيارات الطارئة:</span>
                      <span className="mr-2 text-gray-900">{contract.emergencyVisitsPerYear} زيارة/سنة</span>
                    </div>
                    {contract.contractValue && contract.contractValue > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">قيمة العقد:</span>
                        <span className="mr-2 text-gray-900">{contract.contractValue.toLocaleString()} ريال</span>
                      </div>
                    )}
                  </div>

                  {/* Fire Safety Services */}
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">خدمات السلامة:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getFireSafetyServices(contract).map((service, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {contract.contractDocument && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">وثيقة العقد:</span>
                      <span className="mr-2 text-green-600 text-sm">📎 {contract.contractDocument.name}</span>
                    </div>
                  )}

                  {contract.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">ملاحظات:</span>
                      <p className="text-gray-900 text-sm mt-1">{contract.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Branches */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              الفروع ({data.branches.length})
            </h3>
            <button
              type="button"
              onClick={() => onEdit('branches')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isLoading}
            >
              تعديل ✏️
            </button>
          </div>

          {data.branches.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لم يتم إضافة أي فروع بعد</p>
          ) : (
            <div className="space-y-4">
              {data.branches.map((branch, index) => (
                <div key={branch.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">الفرع {index + 1}: {branch.branchName}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">المدينة:</span>
                      <span className="mr-2 text-gray-900">{branch.city}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">الموقع:</span>
                      <span className="mr-2 text-gray-900">{branch.location}</span>
                    </div>
                    {branch.contactPerson && (
                      <div>
                        <span className="font-medium text-gray-700">الشخص المسؤول:</span>
                        <span className="mr-2 text-gray-900">{branch.contactPerson}</span>
                      </div>
                    )}
                    {branch.contactPhone && (
                      <div>
                        <span className="font-medium text-gray-700">رقم الهاتف:</span>
                        <span className="mr-2 text-gray-900">{branch.contactPhone}</span>
                      </div>
                    )}
                  </div>

                  {branch.address && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">العنوان:</span>
                      <p className="text-gray-900 text-sm mt-1">{branch.address}</p>
                    </div>
                  )}

                  {branch.notes && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">ملاحظات:</span>
                      <p className="text-gray-900 text-sm mt-1">{branch.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">ملخص العميل الجديد:</h4>
          <div className="text-sm text-blue-700">
            <p>• الشركة: <strong>{data.basicInfo.companyName}</strong></p>
            <p>• عدد العقود: <strong>{data.contracts.length}</strong></p>
            <p>• عدد الفروع: <strong>{data.branches.length}</strong></p>
            <p>• إجمالي الزيارات السنوية: <strong>
              {data.contracts.reduce((total, contract) =>
                total + contract.regularVisitsPerYear + contract.emergencyVisitsPerYear, 0
              )} زيارة
            </strong></p>
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
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          disabled={isLoading || data.contracts.length === 0 || !data.contracts.every(c => c.branches && c.branches.length > 0)}
        >
          {isLoading ? 'جاري الحفظ...' : '💾 حفظ العميل الجديد'}
        </button>
      </div>

      {/* Validation Warning */}
      {(data.contracts.length === 0 || !data.contracts.every(c => c.branches && c.branches.length > 0)) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            ⚠️ يجب إضافة عقد واحد على الأقل مع فرع واحد على الأقل لكل عقد قبل حفظ العميل
          </p>
        </div>
      )}
    </form>
  );
}

// Safe default props
ReviewStep.defaultProps = {
  isLoading: false,
};
