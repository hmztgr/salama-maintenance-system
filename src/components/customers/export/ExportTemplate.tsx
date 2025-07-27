'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, FileText, Settings } from 'lucide-react';
import { Company, Contract, Branch } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface ExportTemplateProps {
  entityType: 'companies' | 'contracts' | 'contractsAdvanced' | 'branches';
  data: Company[] | Contract[] | Branch[];
  onClose?: () => void;
  // Add optional props for related data to enhance exports
  companies?: Company[];
  branches?: Branch[];
}

interface ExportConfig {
  includeArchived: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  selectedFields: string[];
  format: 'csv' | 'excel';
}

export function ExportTemplate({ entityType, data, onClose, companies, branches }: ExportTemplateProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  // Debug logging for component props (simplified to prevent loops)
  console.log('🔍 ExportTemplate props:', {
    entityType,
    dataLength: data.length,
    companiesLength: companies?.length || 0,
    branchesLength: branches?.length || 0,
    hasCompanies: !!companies,
    hasBranches: !!branches
  });
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeArchived: false,
    selectedFields: [],
    format: 'csv'
  });
  const [exportCompleted, setExportCompleted] = useState<string | null>(null);

  // Field configurations for different entity types
  const fieldConfigs = {
    companies: {
      title: 'تصدير بيانات الشركات',
      description: 'تصدير بيانات الشركات إلى Excel/CSV مع دعم النص العربي',
      availableFields: [
        { key: 'companyId', label: 'معرف الشركة', required: true },
        { key: 'companyName', label: 'اسم الشركة', required: true },
        { key: 'email', label: 'البريد الإلكتروني', required: false },
        { key: 'phone', label: 'رقم الهاتف', required: false },
        { key: 'address', label: 'العنوان', required: false },
        { key: 'city', label: 'المدينة', required: false },
        { key: 'contactPerson', label: 'الشخص المسؤول', required: false },
        { key: 'notes', label: 'ملاحظات', required: false },
        { key: 'createdAt', label: 'تاريخ الإنشاء', required: false },
        { key: 'updatedAt', label: 'تاريخ التحديث', required: false }
      ]
    },
    contracts: {
      title: 'تصدير بيانات العقود',
      description: 'تصدير بيانات العقود مع تفاصيل الخدمات والتواريخ',
      availableFields: [
        { key: 'contractId', label: 'معرف العقد', required: true },
        { key: 'companyId', label: 'معرف الشركة', required: true },
        { key: 'companyName', label: 'اسم الشركة', required: false },
        { key: 'contractStartDate', label: 'تاريخ بداية العقد', required: true },
        { key: 'contractEndDate', label: 'تاريخ انتهاء العقد', required: true },
        { key: 'contractPeriodMonths', label: 'مدة العقد (بالأشهر)', required: false },
        { key: 'regularVisitsPerYear', label: 'عدد الزيارات العادية سنوياً', required: false },
        { key: 'emergencyVisitsPerYear', label: 'عدد الزيارات الطارئة سنوياً', required: false },
        { key: 'contractValue', label: 'قيمة العقد', required: false },
        { key: 'fireExtinguisherMaintenance', label: 'صيانة الطفايات', required: false },
        { key: 'alarmSystemMaintenance', label: 'صيانة نظام الإنذار', required: false },
        { key: 'fireSuppressionMaintenance', label: 'صيانة نظام الإطفاء', required: false },
        { key: 'gasFireSuppression', label: 'نظام الإطفاء بالغاز', required: false },
        { key: 'foamFireSuppression', label: 'نظام الإطفاء بالفوم', required: false },
        { key: 'branchIds', label: 'معرفات الفروع', required: false },
        { key: 'branchNames', label: 'أسماء الفروع', required: false },
        { key: 'totalBranches', label: 'عدد الفروع', required: false },
        { key: 'notes', label: 'ملاحظات', required: false },
        { key: 'createdAt', label: 'تاريخ الإنشاء', required: false }
      ]
    },
    contractsAdvanced: {
      title: 'تصدير بيانات العقود المتقدمة',
      description: 'تصدير بيانات العقود المتقدمة مع مجموعات الخدمات والفروع',
      availableFields: [
        { key: 'contractId', label: 'معرف العقد', required: true },
        { key: 'companyId', label: 'معرف الشركة', required: true },
        { key: 'contractStartDate', label: 'تاريخ بداية العقد', required: true },
        { key: 'contractEndDate', label: 'تاريخ انتهاء العقد', required: false },
        { key: 'contractPeriodMonths', label: 'مدة العقد (بالأشهر)', required: false },
        { key: 'contractValue', label: 'قيمة العقد', required: false },
        { key: 'serviceBatches', label: 'مجموعات الخدمات', required: false },
        { key: 'totalBranches', label: 'عدد الفروع', required: false },
        { key: 'totalServices', label: 'عدد الخدمات', required: false },
        { key: 'notes', label: 'ملاحظات العقد', required: false },
        { key: 'createdAt', label: 'تاريخ الإنشاء', required: false }
      ]
    },
    branches: {
      title: 'تصدير بيانات الفروع',
      description: 'تصدير بيانات الفروع مع تفاصيل المواقع والعقود',
      availableFields: [
        { key: 'branchId', label: 'معرف الفرع', required: true },
        { key: 'companyId', label: 'معرف الشركة', required: true },
        { key: 'contractIds', label: 'معرفات العقود', required: false },
        { key: 'city', label: 'المدينة', required: true },
        { key: 'location', label: 'الموقع', required: true },
        { key: 'branchName', label: 'اسم الفرع', required: true },
        { key: 'address', label: 'العنوان التفصيلي', required: false },
        { key: 'contactPerson', label: 'الشخص المسؤول', required: false },
        { key: 'contactPhone', label: 'هاتف التواصل', required: false },
        { key: 'teamMember', label: 'فريق العمل المختص', required: false },
        { key: 'notes', label: 'ملاحظات', required: false },
        { key: 'createdAt', label: 'تاريخ الإنشاء', required: false }
      ]
    }
  };

  const currentConfig = fieldConfigs[entityType];

  // Initialize selected fields with required fields
  useState(() => {
    const requiredFields = currentConfig.availableFields
      .filter(field => field.required)
      .map(field => field.key);
    setExportConfig(prev => ({
      ...prev,
      selectedFields: requiredFields
    }));
  });

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    setExportConfig(prev => ({
      ...prev,
      selectedFields: checked
        ? [...prev.selectedFields, fieldKey]
        : prev.selectedFields.filter(key => key !== fieldKey)
    }));
  };

  const formatFieldValue = (item: Company | Contract | Branch, fieldKey: string): string => {
    // Debug logging for all field processing (simplified to prevent loops)
    if (entityType === 'contracts') {
      const contract = item as Contract;
      console.log('🔍 formatFieldValue called:', {
        fieldKey,
        fieldKeyType: typeof fieldKey,
        entityType,
        contractId: contract.contractId,
        companyId: contract.companyId
      });
    }

    // Handle computed fields for contracts first (before checking direct field values)
    if (entityType === 'contracts') {
      // Handle company name for contracts
      if (fieldKey === 'companyName') {
        const contract = item as Contract;
        console.log('🔍 Company name lookup:', {
          contractId: contract.contractId,
          companyId: contract.companyId,
          companiesCount: companies?.length || 0,
          foundCompany: companies?.find(c => c.companyId === contract.companyId)?.companyName || 'Not found'
        });
        if (companies) {
          const company = companies.find(c => c.companyId === contract.companyId);
          return company?.companyName || '';
        }
        return '';
      }

      // Handle branch IDs for contracts
      if (fieldKey === 'branchIds') {
        const contract = item as Contract;
        console.log('🔍 Branch IDs lookup:', {
          contractId: contract.contractId,
          hasServiceBatches: !!contract.serviceBatches,
          serviceBatchesCount: contract.serviceBatches?.length || 0,
          branchesCount: branches?.length || 0
        });
        if (contract.serviceBatches && branches) {
          const allBranchIds = new Set<string>();
          contract.serviceBatches.forEach(batch => {
            batch.branchIds?.forEach(branchId => allBranchIds.add(branchId));
          });
          const result = Array.from(allBranchIds).join(',');
          console.log('🔍 Branch IDs result:', result);
          return result;
        }
        return '';
      }

      // Handle branch names for contracts
      if (fieldKey === 'branchNames') {
        const contract = item as Contract;
        if (contract.serviceBatches && branches) {
          const allBranchIds = new Set<string>();
          contract.serviceBatches.forEach(batch => {
            batch.branchIds?.forEach(branchId => allBranchIds.add(branchId));
          });
          const branchNames = Array.from(allBranchIds).map(branchId => {
            const branch = branches.find(b => b.branchId === branchId);
            return branch?.branchName || branchId;
          });
          return branchNames.join(',');
        }
        return '';
      }

      // Handle total branches for contracts
      if (fieldKey === 'totalBranches') {
        const contract = item as Contract;
        if (contract.serviceBatches) {
          const allBranchIds = new Set<string>();
          contract.serviceBatches.forEach(batch => {
            batch.branchIds?.forEach(branchId => allBranchIds.add(branchId));
          });
          return allBranchIds.size.toString();
        }
        return '0';
      }
    }

    const value = (item as unknown as Record<string, unknown>)[fieldKey];
    
    // Debug logging for contract exports to see what fields are being processed
    if (entityType === 'contracts') {
      console.log('🔍 Field processing:', {
        fieldKey,
        value,
        valueType: typeof value,
        hasValue: value !== null && value !== undefined
      });
    }

    // Debug logging for contract exports
    if (entityType === 'contracts' && fieldKey === 'contractId') {
      const contract = item as Contract;
      console.log('🔍 Processing contract:', {
        contractId: contract.contractId,
        companyId: contract.companyId,
        hasServiceBatches: !!contract.serviceBatches,
        serviceBatchesLength: contract.serviceBatches?.length || 0,
        companiesCount: companies?.length || 0,
        branchesCount: branches?.length || 0
      });
    }

    if (value === null || value === undefined) {
      return '';
    }

    // Handle boolean values for services
    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }

    // Handle array values (like contractIds)
    if (Array.isArray(value)) {
      return value.join(',');
    }



    // Handle serviceBatches for advanced contracts
    if (fieldKey === 'serviceBatches' && Array.isArray(value)) {
      return value.map((batch: any) => {
        const services = Object.entries(batch.services || {})
          .filter(([_, enabled]) => enabled)
          .map(([service, _]) => service)
          .join(',');
        return `${batch.branchIds?.join(',') || ''}:${services}`;
      }).join(';');
    }

    // Handle totalBranches calculation for advanced contracts
    if (fieldKey === 'totalBranches' && entityType === 'contractsAdvanced') {
      const contract = item as Contract;
      if (contract.serviceBatches) {
        const allBranchIds = new Set<string>();
        contract.serviceBatches.forEach(batch => {
          batch.branchIds?.forEach(branchId => allBranchIds.add(branchId));
        });
        return allBranchIds.size.toString();
      }
      return '0';
    }

    // Handle totalServices calculation for advanced contracts
    if (fieldKey === 'totalServices' && entityType === 'contractsAdvanced') {
      const contract = item as Contract;
      if (contract.serviceBatches) {
        const allServices = new Set<string>();
        contract.serviceBatches.forEach(batch => {
          Object.entries(batch.services || {}).forEach(([service, enabled]) => {
            if (enabled) allServices.add(service);
          });
        });
        return allServices.size.toString();
      }
      return '0';
    }

    // Handle date formatting
    if (fieldKey.includes('Date') || fieldKey.includes('At')) {
      return formatDateForDisplay(value as string);
    }

    return String(value);
  };

  const generateComprehensiveExport = () => {
    setIsExporting(true);

    try {
      // Filter data based on configuration
      const filteredData = exportConfig.includeArchived
        ? data
        : data.filter((item) => !(item as unknown as Record<string, unknown>).isArchived);

      if (filteredData.length === 0) {
        alert('لا توجد بيانات للتصدير');
        setIsExporting(false);
        return;
      }

      // Create Excel-compatible CSV content with UTF-8 BOM
      const BOM = '\uFEFF';

      let content = BOM;

      // Add title and export info
      content += `${currentConfig.title}\n`;
      content += `تاريخ التصدير: ${formatDateForDisplay(new Date().toISOString())}\n`;
      content += `عدد السجلات: ${filteredData.length}\n\n`;

      // Get headers
      const headers = exportConfig.selectedFields.map(fieldKey => {
        const field = currentConfig.availableFields.find(f => f.key === fieldKey);
        return field?.label || fieldKey;
      });

      content += headers.join(',') + '\n';

      // Debug logging for selected fields
      console.log('🔍 Export configuration:');
      console.log('  - selectedFields:', exportConfig.selectedFields);
      console.log('  - totalDataItems:', filteredData.length);
      console.log('  - selectedFieldsDetails:');
      exportConfig.selectedFields.forEach((fieldKey, index) => {
        console.log(`    ${index + 1}. fieldKey: "${fieldKey}"`);
        console.log(`       type: ${typeof fieldKey}`);
        console.log(`       length: ${fieldKey.length}`);
        console.log(`       charCodes: [${Array.from(fieldKey).map(c => c.charCodeAt(0)).join(', ')}]`);
      });

      // Add data rows
      filteredData.forEach((item) => {
        const row = exportConfig.selectedFields.map(fieldKey => {
          const value = formatFieldValue(item, fieldKey);
          return `"${value.replace(/"/g, '""')}"`;
        });
        content += row.join(',') + '\n';
      });

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `export_${entityType}_${timestamp}_enhanced.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportCompleted(`تم تصدير ${filteredData.length} سجل`);
    } catch (error) {
      console.error('Error generating enhanced export:', error);
      alert('حدث خطأ في تصدير البيانات إلى التنسيق المحسن');
    } finally {
      setIsExporting(false);
    }
  };

  const activeData = exportConfig.includeArchived
    ? data
    : data.filter((item) => !(item as unknown as Record<string, unknown>).isArchived);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>{currentConfig.title}</span>
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="p-2">
                ✕
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Export Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات التصدير
            </h3>

            {/* Include Archived Option */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm">تضمين البيانات المؤرشفة</span>
              <Checkbox
                checked={exportConfig.includeArchived}
                onCheckedChange={(checked) =>
                  setExportConfig(prev => ({ ...prev, includeArchived: !!checked }))
                }
              />
            </div>

            {/* Data Count Display */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-blue-800 text-right">
                عدد السجلات المتاحة للتصدير: <strong>{activeData.length}</strong>
                {exportConfig.includeArchived && (
                  <span className="text-sm"> (شامل المؤرشف)</span>
                )}
              </p>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">الحقول المطلوب تصديرها:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded p-4">
              {currentConfig.availableFields.map((field) => (
                <div key={field.key} className="flex items-center gap-2 justify-end">
                  <span className={`text-sm ${field.required ? 'font-medium' : ''}`}>
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </span>
                  <Checkbox
                    checked={exportConfig.selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                    disabled={field.required}
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-right">
              * الحقول المحددة مطلوبة ولا يمكن إلغاؤها
            </p>
          </div>

          {/* Export Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateComprehensiveExport}
              disabled={isExporting || exportConfig.selectedFields.length === 0}
              className="gap-2 h-auto p-6 flex-col min-w-64"
            >
              <FileSpreadsheet className="w-12 h-12 text-blue-600" />
              <span className="text-xl font-medium">تصدير البيانات</span>
              <span className="text-sm text-gray-500">
                ملف CSV شامل مع معلومات تفصيلية
              </span>
              <span className="text-xs text-gray-400">
                يفتح في Excel وجميع البرامج
              </span>
            </Button>
          </div>

          {/* Success Message */}
          {exportCompleted && (
            <Alert className="border-green-500 bg-green-50">
              <Download className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-right">
                تم تصدير البيانات بنجاح! ({exportCompleted})
              </AlertDescription>
            </Alert>
          )}

          {/* Export Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-medium text-yellow-800 text-right mb-2">ملاحظات التصدير:</h4>
            <ul className="space-y-1 text-sm text-yellow-700 text-right">
              <li>• الملفات المصدرة تدعم النص العربي بترميز UTF-8</li>
              <li>• التواريخ بتنسيق dd-mmm-yyyy حسب معيار النظام</li>
              <li>• القيم المنطقية تظهر كـ "نعم" أو "لا"</li>
              <li>• المصفوفات (مثل معرفات العقود) مفصولة بفاصلة</li>
              <li>• يمكن فتح ملفات CSV في Excel مباشرة</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
