'use client';

import { useState, useEffect } from 'react';
import { Company, Contract, Branch } from '@/types/customer';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useVisits } from '@/hooks/useVisits';
import { CompanyForm } from './forms/CompanyForm';
import { ContractForm } from './forms/ContractForm';
import { EnhancedContractForm } from './forms/EnhancedContractForm';
import { BranchForm } from './forms/BranchForm';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { useSearch } from '@/hooks/useSearch';
import { formatDateForDisplay } from '@/lib/date-handler';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ImportTemplate } from './import/ImportTemplate';
import { ExportTemplate } from './export/ExportTemplate';

export interface NewCustomerManagementProps {
  className?: string;
}

type TabType = 'companies' | 'contracts' | 'branches' | 'checklists';

export function NewCustomerManagement({ className = '' }: NewCustomerManagementProps) {
  const { hasPermission, authState } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('companies');

  // Form state management
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showEnhancedContractForm, setShowEnhancedContractForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Bulk selection state
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());

  // Import/Export state
  const [showImportTemplate, setShowImportTemplate] = useState(false);
  const [showExportTemplate, setShowExportTemplate] = useState(false);
  const [importExportType, setImportExportType] = useState<'companies' | 'contracts' | 'branches'>('companies');

  // Data hooks - using Firebase
  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
    addCompany,
    updateCompany,
    archiveCompany,
    restoreCompany: unarchiveCompany,
    deleteCompany
  } = useCompaniesFirebase();

  // Firebase hook doesn't have clearError, so create a dummy function
  const clearCompaniesError = () => {};

  const {
    contracts,
    loading: contractsLoading,
    error: contractsError,
    addContract,
    updateContract,
    archiveContract,
    unarchiveContract,
    deleteContract,
    clearError: clearContractsError
  } = useContractsFirebase();

  const {
    branches,
    loading: branchesLoading,
    error: branchesError,
    addBranch,
    updateBranch,
    archiveBranch,
    unarchiveBranch,
    deleteBranch,
    clearError: clearBranchesError
  } = useBranchesFirebase();

  const { visits, deleteVisit } = useVisits();

  // Search functionality for each tab
  const companySearchConfig = {
    searchFields: ['companyName', 'unifiedNumber', 'email', 'phone'] as (keyof Company)[],
    statusField: 'isArchived' as keyof Company,
    cityField: 'address' as keyof Company, // Using address as city equivalent
    teamMemberField: 'contactPerson' as keyof Company,
  };

  const contractSearchConfig = {
    searchFields: ['contractId', 'companyId', 'notes'] as (keyof Contract)[],
    statusField: 'isArchived' as keyof Contract,
    dateField: 'contractEndDate' as keyof Contract,
    contractFields: {
      fireExtinguisher: 'fireExtinguisherMaintenance' as keyof Contract,
      alarmSystem: 'alarmSystemMaintenance' as keyof Contract,
      fireSuppression: 'fireSuppressionMaintenance' as keyof Contract,
      gasSystem: 'gasFireSuppression' as keyof Contract,
      foamSystem: 'foamFireSuppression' as keyof Contract,
    }
  };

  const branchSearchConfig = {
    searchFields: ['branchName', 'branchId', 'address', 'contactPerson'] as (keyof Branch)[],
    statusField: 'isArchived' as keyof Branch,
    cityField: 'city' as keyof Branch,
    locationField: 'location' as keyof Branch,
    teamMemberField: 'teamMember' as keyof Branch,
  };

  const companySearch = useSearch(companies, companySearchConfig);
  const contractSearch = useSearch(contracts, contractSearchConfig);
  const branchSearch = useSearch(branches, branchSearchConfig);

  // Simple form handlers
  const handleAddCompany = () => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لإضافة شركة جديدة');
      return;
    }
    setEditingCompany(null);
    setShowCompanyForm(true);
  };

  // Selection handlers
  const handleCompanySelect = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(companyId);
      else newSet.delete(companyId);
      return newSet;
    });
  };

  const handleContractSelect = (contractId: string, checked: boolean) => {
    setSelectedContracts(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(contractId);
      else newSet.delete(contractId);
      return newSet;
    });
  };

  const handleBranchSelect = (branchId: string, checked: boolean) => {
    setSelectedBranches(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(branchId);
      else newSet.delete(branchId);
      return newSet;
    });
  };

  const tabs = [
    {
      id: 'companies' as TabType,
      label: 'الشركات',
      icon: '🏢',
      count: companies.filter(c => !c.isArchived).length,
      description: 'إدارة الشركات والعملاء'
    },
    {
      id: 'contracts' as TabType,
      label: 'العقود',
      icon: '📋',
      count: contracts.filter(c => !c.isArchived).length,
      description: 'إدارة العقود وخدمات السلامة'
    },
    {
      id: 'branches' as TabType,
      label: 'الفروع',
      icon: '🏪',
      count: branches.filter(b => !b.isArchived).length,
      description: 'إدارة الفروع والمواقع'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
        <p className="text-gray-600 mt-2">
          نظام إدارة العملاء المحسن مع تصنيف الشركات والعقود والفروع
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="ml-2 text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="mr-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-1 min-w-[24px] text-center">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
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

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الشركات</h2>
                <p className="text-gray-600 mt-1">
                  عرض وإدارة الشركات بالمعرف البسيط (0001، 0002، 0003...)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('companies');
                      setShowImportTemplate(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    📥 استيراد
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('companies');
                      setShowExportTemplate(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
                  >
                    📤 تصدير
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <button
                    onClick={handleAddCompany}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <span className="ml-2">➕</span>
                    إضافة شركة جديدة
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <SearchAndFilter
              filters={companySearch.filters}
              onFiltersChange={companySearch.setFilters}
              className="mb-6"
            />

            {/* Results Summary & Bulk Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  عرض {companySearch.filteredData.length} من أصل {companies.filter(c => !c.isArchived).length} شركة
                </div>
                {selectedCompanies.size > 0 && hasPermission('admin') && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedCompanies.size} محدد
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من حذف ${selectedCompanies.size} شركة؟`)) {
                          let successCount = 0;
                          for (const companyId of selectedCompanies) {
                            const success = await deleteCompany(companyId);
                            if (success) successCount++;
                          }
                          setSelectedCompanies(new Set());
                          setSuccessMessage(`تم حذف ${successCount} شركة بنجاح`);
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️ حذف المحدد
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                إجمالي الشركات (مع المؤرشف): {companies.length}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center">
                        <Checkbox
                          checked={companySearch.filteredData.length > 0 && selectedCompanies.size === companySearch.filteredData.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCompanies(new Set(companySearch.filteredData.map(c => c.companyId)));
                            } else {
                              setSelectedCompanies(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        معرف الشركة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اسم الشركة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        معلومات الاتصال
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companySearch.filteredData.map((company) => (
                      <tr key={company.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Checkbox
                            checked={selectedCompanies.has(company.companyId)}
                            onCheckedChange={(checked) => handleCompanySelect(company.companyId, checked === true)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {company.companyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                          {company.unifiedNumber && (
                            <div className="text-sm text-gray-500">الرقم الموحد: {company.unifiedNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{company.email || '-'}</div>
                          <div className="text-gray-500">{company.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setEditingCompany(company);
                              setShowCompanyForm(true);
                            }}
                          >
                            تعديل
                          </button>
                          {hasPermission('admin') && (
                            <button
                              onClick={async () => {
                                if (confirm(`هل أنت متأكد من حذف الشركة "${company.companyName}"؟`)) {
                                  const success = await deleteCompany(company.companyId);
                                  if (success) {
                                    setSuccessMessage('تم حذف الشركة بنجاح');
                                  } else {
                                    setSuccessMessage('فشل في حذف الشركة');
                                  }
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              حذف
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة العقود</h2>
                <p className="text-gray-600 mt-1">
                  عرض وإدارة عقود الصيانة وخدمات السلامة
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('contracts');
                      setShowImportTemplate(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    📥 استيراد
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('contracts');
                      setShowExportTemplate(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
                  >
                    📤 تصدير
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => {
                        setEditingContract(null);
                        setShowEnhancedContractForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <span className="ml-2">✨</span>
                      إضافة عقد متقدم (خدمات متعددة)
                    </button>
                    <button
                      onClick={() => {
                        setEditingContract(null);
                        setShowContractForm(true);
                      }}
                      className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 flex items-center text-sm"
                    >
                      <span className="ml-2">➕</span>
                      عقد بسيط
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <SearchAndFilter
              filters={contractSearch.filters}
              onFiltersChange={contractSearch.setFilters}
              className="mb-6"
            />

            {/* Results Summary & Bulk Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  عرض {contractSearch.filteredData.length} من أصل {contracts.filter(c => !c.isArchived).length} عقد
                </div>
                {selectedContracts.size > 0 && hasPermission('admin') && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedContracts.size} محدد
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من حذف ${selectedContracts.size} عقد؟`)) {
                          let successCount = 0;
                          for (const contractId of selectedContracts) {
                            const success = await deleteContract(contractId);
                            if (success) successCount++;
                          }
                          setSelectedContracts(new Set());
                          setSuccessMessage(`تم حذف ${successCount} عقد بنجاح`);
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️ حذف المحدد
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                إجمالي العقود (مع المؤرشف): {contracts.length}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center">
                        <Checkbox
                          checked={contractSearch.filteredData.length > 0 && selectedContracts.size === contractSearch.filteredData.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContracts(new Set(contractSearch.filteredData.map(c => c.contractId)));
                            } else {
                              setSelectedContracts(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        معرف العقد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الشركة
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        فترة العقد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الخدمات
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        قيمة العقد
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contractSearch.filteredData.map((contract) => {
                      const company = companies.find(c => c.companyId === contract.companyId);
                      
                      // NEW: Extract services from all service batches
                      const services: Array<{name: string; icon: string; color: string}> = [];
                      const serviceSet = new Set<string>(); // Avoid duplicates
                      
                      contract.serviceBatches?.forEach(batch => {
                        if (batch.services.fireExtinguisherMaintenance && !serviceSet.has('fireExtinguisher')) {
                          services.push({
                            name: 'طفايات',
                            icon: '🧯',
                            color: 'bg-red-100 text-red-800 border-red-200'
                          });
                          serviceSet.add('fireExtinguisher');
                        }
                        if (batch.services.alarmSystemMaintenance && !serviceSet.has('alarm')) {
                          services.push({
                            name: 'إنذار',
                            icon: '⚠️',
                            color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          });
                          serviceSet.add('alarm');
                        }
                        if (batch.services.fireSuppressionMaintenance && !serviceSet.has('suppression')) {
                          services.push({
                            name: 'إطفاء',
                            icon: '💧',
                            color: 'bg-blue-100 text-blue-800 border-blue-200'
                          });
                          serviceSet.add('suppression');
                        }
                        if (batch.services.gasFireSuppression && !serviceSet.has('gas')) {
                          services.push({
                            name: 'غاز',
                            icon: '🟦',
                            color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          });
                          serviceSet.add('gas');
                        }
                        if (batch.services.foamFireSuppression && !serviceSet.has('foam')) {
                          services.push({
                            name: 'فوم',
                            icon: '🟢',
                            color: 'bg-green-100 text-green-800 border-green-200'
                          });
                          serviceSet.add('foam');
                        }
                      });

                      return (
                        <tr key={contract.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Checkbox
                              checked={selectedContracts.has(contract.contractId)}
                              onCheckedChange={(checked) => handleContractSelect(contract.contractId, checked === true)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {contract.contractId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {company?.companyName || 'شركة غير معروفة'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {company?.companyId || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{contract.contractStartDate}</div>
                            <div className="text-gray-500">إلى {contract.contractEndDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {services.map(service => (
                                <span
                                  key={service.name}
                                  className={`text-xs px-2 py-1 rounded border ${service.color} flex items-center gap-1`}
                                >
                                  <span>{service.icon}</span>
                                  <span>{service.name}</span>
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              {(() => {
                                // Calculate total visits from all service batches
                                const totalRegular = contract.serviceBatches?.reduce((sum, batch) => sum + (batch.regularVisitsPerYear || 0), 0) || 0;
                                const totalEmergency = contract.serviceBatches?.reduce((sum, batch) => sum + (batch.emergencyVisitsPerYear || 0), 0) || 0;
                                return (
                                  <>
                                    <span>📅 {totalRegular} زيارة عادية/سنة</span>
                                    {totalEmergency > 0 && (
                                      <span>🚨 {totalEmergency} زيارة طارئة/سنة</span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contract.contractValue?.toLocaleString('ar-SA')} ر.س
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                            <button
                              className="text-blue-600 hover:text-blue-900 ml-2"
                              onClick={() => {
                                setEditingContract(contract);
                                setShowEnhancedContractForm(true);
                              }}
                            >
                              تعديل متقدم
                            </button>
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => {
                                setEditingContract(contract);
                                setShowContractForm(true);
                              }}
                            >
                              تعديل بسيط
                            </button>
                            {hasPermission('admin') && (
                              <button
                                onClick={async () => {
                                  if (confirm(`هل أنت متأكد من حذف العقد "${contract.contractId}"؟`)) {
                                    const success = await deleteContract(contract.id);
                                    if (success) {
                                      setSuccessMessage('تم حذف العقد بنجاح');
                                    } else {
                                      setSuccessMessage('فشل في حذف العقد');
                                    }
                                    setTimeout(() => setSuccessMessage(''), 3000);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                حذف
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">إدارة الفروع</h2>
                <p className="text-gray-600 mt-1">
                  عرض وإدارة الفروع والمواقع
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('branches');
                      setShowImportTemplate(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    📥 استيراد
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setImportExportType('branches');
                      setShowExportTemplate(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
                  >
                    📤 تصدير
                  </button>
                )}
                {hasPermission('supervisor') && (
                  <button
                    onClick={() => {
                      setEditingBranch(null);
                      setShowBranchForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <span className="ml-2">➕</span>
                    إضافة فرع جديد
                  </button>
                )}
              </div>
            </div>

            {/* Search and Filter */}
            <SearchAndFilter
              filters={branchSearch.filters}
              onFiltersChange={branchSearch.setFilters}
              className="mb-6"
            />

            {/* Results Summary & Bulk Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  عرض {branchSearch.filteredData.length} من أصل {branches.filter(b => !b.isArchived).length} فرع
                </div>
                {selectedBranches.size > 0 && hasPermission('admin') && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedBranches.size} محدد
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من حذف ${selectedBranches.size} فرع؟`)) {
                          let successCount = 0;
                          for (const branchId of selectedBranches) {
                            const success = await deleteBranch(branchId);
                            if (success) successCount++;
                          }
                          setSelectedBranches(new Set());
                          setSuccessMessage(`تم حذف ${successCount} فرع بنجاح`);
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️ حذف المحدد
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                إجمالي الفروع (مع المؤرشف): {branches.length}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center">
                        <Checkbox
                          checked={branchSearch.filteredData.length > 0 && selectedBranches.size === branchSearch.filteredData.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBranches(new Set(branchSearch.filteredData.map(b => b.branchId)));
                            } else {
                              setSelectedBranches(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        معرف الفرع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        اسم الفرع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المدينة والموقع
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branchSearch.filteredData.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Checkbox
                            checked={selectedBranches.has(branch.branchId)}
                            onCheckedChange={(checked) => handleBranchSelect(branch.branchId, checked === true)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {branch.branchId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{branch.city}</div>
                          <div className="text-gray-500">{branch.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setEditingBranch(branch);
                              setShowBranchForm(true);
                            }}
                          >
                            تعديل
                          </button>
                          {hasPermission('admin') && (
                            <button
                              onClick={async () => {
                                if (confirm(`هل أنت متأكد من حذف الفرع "${branch.branchName}"؟`)) {
                                  const success = await deleteBranch(branch.id);
                                  if (success) {
                                    setSuccessMessage('تم حذف الفرع بنجاح');
                                  } else {
                                    setSuccessMessage('فشل في حذف الفرع');
                                  }
                                  setTimeout(() => setSuccessMessage(''), 3000);
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              حذف
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modals */}
      {showCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CompanyForm
              company={editingCompany || undefined}
              onSubmit={async (data) => {
                setFormLoading(true);
                try {
                  if (editingCompany) {
                    console.log('Updating company:', editingCompany.companyId, 'with data:', data);
                    const result = await updateCompany(editingCompany.companyId, data);
                    console.log('Update result:', result);
                    if (result.success) {
                      setSuccessMessage('تم تحديث بيانات الشركة بنجاح');
                      setShowCompanyForm(false);
                      setEditingCompany(null);
                    } else {
                      setSuccessMessage('فشل في تحديث الشركة: ' + (result.warnings?.join(', ') || 'خطأ غير معروف'));
                    }
                  } else {
                    const result = await addCompany(data);
                    if (result.success) {
                      setSuccessMessage('تمت إضافة الشركة بنجاح');
                      setShowCompanyForm(false);
                      setEditingCompany(null);
                    } else {
                      setSuccessMessage('فشل في إضافة الشركة: ' + (result.warnings?.join(', ') || 'خطأ غير معروف'));
                    }
                  }
                } catch (e) {
                  console.error('Form submission error:', e);
                  setSuccessMessage('حدث خطأ أثناء حفظ البيانات');
                } finally {
                  setFormLoading(false);
                  // Only close form on success
                  setTimeout(() => setSuccessMessage(''), 5000);
                }
              }}
              onCancel={() => {
                setShowCompanyForm(false);
                setEditingCompany(null);
              }}
              isLoading={formLoading}
            />
          </div>
        </div>
      )}

      {showContractForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ContractForm
              contract={editingContract || undefined}
              companies={companies}
              onSubmit={async (data) => {
                setFormLoading(true);
                try {
                  if (editingContract) {
                    await updateContract(editingContract.id, data);
                    setSuccessMessage('تم تحديث بيانات العقد بنجاح');
                  } else {
                    await addContract(data);
                    setSuccessMessage('تمت إضافة العقد بنجاح');
                  }
                } catch (e) {
                  // handle error
                } finally {
                  setFormLoading(false);
                  setShowContractForm(false);
                  setEditingContract(null);
                  setTimeout(() => setSuccessMessage(''), 5000);
                }
              }}
              onCancel={() => {
                setShowContractForm(false);
                setEditingContract(null);
              }}
              isLoading={formLoading}
            />
          </div>
        </div>
      )}

      {showEnhancedContractForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            <EnhancedContractForm
              contract={editingContract || undefined}
              companies={companies}
              branches={branches}
              onSubmit={async (data) => {
                setFormLoading(true);
                try {
                  let result;
                  if (editingContract) {
                    result = await updateContract(editingContract.id, data);
                    setSuccessMessage('تم تحديث بيانات العقد بنجاح مع الخدمات المتقدمة');
                  } else {
                    result = await addContract(data);
                    setSuccessMessage('تمت إضافة العقد بنجاح مع الخدمات المتقدمة');
                  }
                  
                  setFormLoading(false);
                  setShowEnhancedContractForm(false);
                  setEditingContract(null);
                  setTimeout(() => setSuccessMessage(''), 5000);
                  
                  return { success: true, warnings: result.warnings };
                } catch (e) {
                  setFormLoading(false);
                  return { success: false, warnings: ['حدث خطأ أثناء حفظ العقد'] };
                }
              }}
              onCancel={() => {
                setShowEnhancedContractForm(false);
                setEditingContract(null);
              }}
              isLoading={formLoading}
            />
          </div>
        </div>
      )}

      {showBranchForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <BranchForm
              branch={editingBranch || undefined}
              onSuccess={() => {
                setShowBranchForm(false);
                setEditingBranch(null);
                if (editingBranch) {
                  setSuccessMessage('تم تحديث بيانات الفرع بنجاح');
                } else {
                  setSuccessMessage('تمت إضافة الفرع بنجاح');
                }
                setTimeout(() => setSuccessMessage(''), 5000);
              }}
              onCancel={() => {
                setShowBranchForm(false);
                setEditingBranch(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Import/Export Modals */}
      {showImportTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ImportTemplate
              entityType={importExportType}
              onClose={() => setShowImportTemplate(false)}
            />
          </div>
        </div>
      )}
      {showExportTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ExportTemplate
              entityType={importExportType}
              data={
                importExportType === 'companies' ? companies :
                importExportType === 'contracts' ? contracts :
                branches
              }
              onClose={() => setShowExportTemplate(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
