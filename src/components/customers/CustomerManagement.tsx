'use client';

import { useState } from 'react';
import { Customer, CustomerFormData, MultiStepCustomerData } from '@/types/customer';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { CustomerList } from './CustomerList';
import { CustomerForm } from './CustomerForm';
import { MultiStepCustomerForm } from './MultiStepCustomerForm';

export interface CustomerManagementProps {
  className?: string;
}

export function CustomerManagement({ className = '' }: CustomerManagementProps) {
  const { hasPermission, authState } = useAuth();
  const {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    archiveCustomer,
    unarchiveCustomer,
    deleteCustomer,
    clearError
  } = useCustomers();

  const [showForm, setShowForm] = useState(false);
  const [showMultiStepForm, setShowMultiStepForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAddNew = () => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لإضافة عملاء جدد');
      return;
    }
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleEdit = (customer: Customer) => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لتعديل بيانات العملاء');
      return;
    }
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: CustomerFormData) => {
    setFormLoading(true);
    setSuccessMessage('');
    clearError();

    try {
      let result;

      if (editingCustomer) {
        // Update existing customer
        result = updateCustomer(editingCustomer.id, formData);
        if (result) {
          setSuccessMessage('تم تحديث بيانات العميل بنجاح');
        }
      } else {
        // Add new customer
        const addResult = addCustomer(formData);
        if (addResult.success) {
          setSuccessMessage(`تم إضافة العميل بنجاح. رقم العميل: ${addResult.customer?.customerId}`);

          // Show warnings if any
          if (addResult.warnings && addResult.warnings.length > 0) {
            console.warn('Customer creation warnings:', addResult.warnings);
          }
        } else {
          throw new Error('فشل في إضافة العميل');
        }
      }

      // Close form on success
      setShowForm(false);
      setEditingCustomer(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormLoading(false);
  };

  const handleMultiStepFormCancel = () => {
    setShowMultiStepForm(false);
    setEditingCustomer(null);
    setFormLoading(false);
  };

  const handleMultiStepFormSubmit = async (multiStepData: MultiStepCustomerData) => {
    if (!multiStepData.contracts.length || !multiStepData.branches.length) {
      alert('يجب إضافة عقد واحد على الأقل وفرع واحد على الأقل');
      return;
    }

    setFormLoading(true);
    setSuccessMessage('');
    clearError();

    try {
      // For now, we'll create multiple customers - one for each branch
      // In a real system, you might handle this differently
      let createdCount = 0;
      const warnings: string[] = [];

      for (const branch of multiStepData.branches) {
        // Use the first contract for all branches (or you could create separate logic)
        const primaryContract = multiStepData.contracts[0];

        const customerFormData: CustomerFormData = {
          name: multiStepData.basicInfo.companyName,
          location: branch.location,
          branch: branch.branchName,
          area: branch.city,
          contractStartDate: primaryContract.contractStartDate,
          contractEndDate: primaryContract.contractEndDate,
          regularVisitsPerYear: primaryContract.regularVisitsPerYear,
          emergencyVisitsPerYear: primaryContract.emergencyVisitsPerYear,
          teamMember: '', // Could be set based on branch contact person
          fireExtinguisherMaintenance: primaryContract.fireExtinguisherMaintenance,
          alarmSystemMaintenance: primaryContract.alarmSystemMaintenance,
          fireSuppressionMaintenance: primaryContract.fireSuppressionMaintenance,
          gasFireSuppression: primaryContract.gasFireSuppression,
          foamFireSuppression: primaryContract.foamFireSuppression,
        };

        const result = addCustomer(customerFormData);
        if (result.success) {
          createdCount++;
          if (result.warnings) {
            warnings.push(...result.warnings);
          }
        } else {
          console.error(`Failed to create customer for branch: ${branch.branchName}`);
        }
      }

      if (createdCount > 0) {
        setSuccessMessage(`تم إنشاء ${createdCount} عميل بنجاح من إجمالي ${multiStepData.branches.length} فرع`);

        if (warnings.length > 0) {
          console.warn('Customer creation warnings:', warnings);
        }

        // Close form on success
        setShowMultiStepForm(false);
        setEditingCustomer(null);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error('فشل في إنشاء أي عميل');
      }

    } catch (err) {
      console.error('Multi-step form submission error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchive = (customerId: string) => {
    if (!authState.user) return;
    archiveCustomer(customerId, authState.user.displayName || authState.user.email);
  };

  const handleUnarchive = (customerId: string) => {
    unarchiveCustomer(customerId);
  };

  const handleDelete = (customerId: string) => {
    deleteCustomer(customerId);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة العملاء</h1>
          <p className="text-gray-600 mt-1">
            إدارة بيانات العملاء والعقود وخدمات السلامة من الحريق
          </p>
        </div>

        {hasPermission('supervisor') && (
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => {
                setEditingCustomer(null);
                setShowMultiStepForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <span className="ml-2">➕</span>
              إضافة عميل جديد (محسن)
            </button>
            <button
              onClick={handleAddNew}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center text-sm"
            >
              <span className="ml-2">📝</span>
              نموذج بسيط
            </button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="mr-auto pl-3">
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-400 hover:text-green-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="mr-auto pl-3">
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">👥</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">إجمالي العملاء</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">عملاء نشطون</p>
              <p className="text-2xl font-semibold text-green-600">
                {customers.filter(c => !c.isArchived).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📁</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">عملاء مؤرشفون</p>
              <p className="text-2xl font-semibold text-gray-600">
                {customers.filter(c => c.isArchived).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="mr-3">
              <p className="text-sm font-medium text-gray-500">عقود منتهية قريباً</p>
              <p className="text-2xl font-semibold text-orange-600">
                {(() => {
                  const now = new Date();
                  const thirtyDaysFromNow = new Date();
                  thirtyDaysFromNow.setDate(now.getDate() + 30);

                  return customers.filter(c => {
                    if (!c.contractEndDate || c.isArchived) return false;
                    const endDate = new Date(c.contractEndDate);
                    return endDate > now && endDate <= thirtyDaysFromNow;
                  }).length;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 max-w-4xl">
            <CustomerForm
              customer={editingCustomer || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={formLoading}
            />
          </div>
        </div>
      )}

      {/* Multi-Step Form */}
      {showMultiStepForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <MultiStepCustomerForm
            onComplete={handleMultiStepFormSubmit}
            onCancel={handleMultiStepFormCancel}
            isLoading={formLoading}
          />
        </div>
      )}

      {/* Customer List */}
      <CustomerList
        customers={customers}
        onUpdate={handleEdit}
        onDelete={handleDelete}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        readonly={!hasPermission('supervisor')}
      />

      {/* Empty State */}
      {customers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء مسجلون</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة عميلك الأول لإدارة خدمات الصيانة</p>

          {hasPermission('supervisor') && (
            <div className="flex space-x-4 space-x-reverse justify-center">
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowMultiStepForm(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                إضافة العميل الأول (محسن)
              </button>
              <button
                onClick={handleAddNew}
                className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                نموذج بسيط
              </button>
            </div>
          )}
        </div>
      )}

      {/* Features Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="font-medium text-blue-800 mb-2">حالة الميزات:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            إضافة وتعديل العملاء
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            نظام الترقيم المحسن للعملاء
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            التحقق من المدن السعودية
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            إدارة خدمات السلامة من الحريق
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            نظام الأرشفة والحذف الآمن
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            البحث والفلترة المتقدمة
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            نموذج إضافة العملاء المحسن (4 خطوات)
          </div>
          <div className="flex items-center text-green-700">
            <span className="ml-2">✅</span>
            إدارة العقود المتعددة والفروع
          </div>
          <div className="flex items-center text-blue-700">
            <span className="ml-2">⏳</span>
            استيراد/تصدير البيانات
          </div>
          <div className="flex items-center text-blue-700">
            <span className="ml-2">⏳</span>
            جدولة الصيانة
          </div>
        </div>
      </div>
    </div>
  );
}

// Safe default props
CustomerManagement.defaultProps = {
  className: '',
};
