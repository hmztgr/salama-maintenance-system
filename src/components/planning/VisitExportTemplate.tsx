'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Visit } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface VisitExportTemplateProps {
  visits: Visit[];
  onClose?: () => void;
}

interface ExportConfig {
  dateRange: {
    start: string;
    end: string;
  };
  visitTypes: string[];
  visitStatuses: string[];
  includeResults: boolean;
  includeServices: boolean;
  selectedFields: string[];
  format: 'csv';
}

export function VisitExportTemplate({ visits, onClose }: VisitExportTemplateProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    dateRange: {
      start: '',
      end: ''
    },
    visitTypes: ['regular', 'emergency', 'followup'],
    visitStatuses: ['scheduled', 'completed', 'cancelled', 'in_progress'],
    includeResults: true,
    includeServices: true,
    selectedFields: [],
    format: 'csv'
  });
  const [exportCompleted, setExportCompleted] = useState<string | null>(null);

  // Available fields for export
  const availableFields = [
    { key: 'visitId', label: 'معرف الزيارة', required: true },
    { key: 'branchId', label: 'معرف الفرع', required: true },
    { key: 'contractId', label: 'معرف العقد', required: true },
    { key: 'companyId', label: 'معرف الشركة', required: true },
    { key: 'type', label: 'نوع الزيارة', required: true },
    { key: 'status', label: 'حالة الزيارة', required: true },
    { key: 'scheduledDate', label: 'تاريخ الجدولة', required: true },
    { key: 'scheduledTime', label: 'وقت الجدولة', required: false },
    { key: 'completedDate', label: 'تاريخ التنفيذ', required: false },
    { key: 'completedTime', label: 'وقت التنفيذ', required: false },
    { key: 'duration', label: 'مدة الزيارة (دقيقة)', required: false },
    { key: 'assignedTeam', label: 'الفريق المختص', required: false },
    { key: 'assignedTechnician', label: 'الفني المختص', required: false },
    { key: 'notes', label: 'ملاحظات', required: false },
    { key: 'createdAt', label: 'تاريخ الإنشاء', required: false },
    { key: 'createdBy', label: 'أنشئ بواسطة', required: false }
  ];

  // Service fields
  const serviceFields = [
    { key: 'services.fireExtinguisher', label: 'صيانة الطفايات' },
    { key: 'services.alarmSystem', label: 'صيانة نظام الإنذار' },
    { key: 'services.fireSuppression', label: 'صيانة نظام الإطفاء' },
    { key: 'services.gasSystem', label: 'نظام الغاز' },
    { key: 'services.foamSystem', label: 'نظام الفوم' }
  ];

  // Result fields
  const resultFields = [
    { key: 'results.overallStatus', label: 'النتيجة العامة' },
    { key: 'results.issues', label: 'المشاكل المكتشفة' },
    { key: 'results.recommendations', label: 'التوصيات' },
    { key: 'results.nextVisitDate', label: 'تاريخ الزيارة القادمة' }
  ];

  // Initialize selected fields
  useState(() => {
    const requiredFields = availableFields
      .filter(field => field.required)
      .map(field => field.key);

    const allFields = [...requiredFields];
    if (exportConfig.includeServices) {
      allFields.push(...serviceFields.map(f => f.key));
    }
    if (exportConfig.includeResults) {
      allFields.push(...resultFields.map(f => f.key));
    }

    setExportConfig(prev => ({
      ...prev,
      selectedFields: allFields
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

  const handleVisitTypeToggle = (type: string, checked: boolean) => {
    setExportConfig(prev => ({
      ...prev,
      visitTypes: checked
        ? [...prev.visitTypes, type]
        : prev.visitTypes.filter(t => t !== type)
    }));
  };

  const handleVisitStatusToggle = (status: string, checked: boolean) => {
    setExportConfig(prev => ({
      ...prev,
      visitStatuses: checked
        ? [...prev.visitStatuses, status]
        : prev.visitStatuses.filter(s => s !== status)
    }));
  };

  const formatFieldValue = (visit: Visit, fieldKey: string): string => {
    // Handle nested fields
    if (fieldKey.includes('.')) {
      const parts = fieldKey.split('.');
      let value: unknown = visit;

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[part];
        } else {
          value = undefined;
          break;
        }
      }

      if (value === null || value === undefined) {
        return '';
      }

      // Handle boolean values for services
      if (typeof value === 'boolean') {
        return value ? 'نعم' : 'لا';
      }

      // Handle array values (like issues, recommendations)
      if (Array.isArray(value)) {
        return value.join('; ');
      }

      return String(value);
    }

    // Handle direct fields
    const value = (visit as unknown as Record<string, unknown>)[fieldKey];

    if (value === null || value === undefined) {
      return '';
    }

    // Handle date formatting
    if (fieldKey.includes('Date') || fieldKey.includes('At')) {
      return formatDateForDisplay(value as string);
    }

    // Handle visit type translation
    if (fieldKey === 'type') {
      const typeMap: Record<string, string> = {
        'regular': 'دورية',
        'emergency': 'طارئة',
        'followup': 'متابعة'
      };
      return typeMap[value as string] || String(value);
    }

    // Handle status translation
    if (fieldKey === 'status') {
      const statusMap: Record<string, string> = {
        'scheduled': 'مجدولة',
        'completed': 'مكتملة',
        'cancelled': 'ملغية',
        'in_progress': 'جارية',
        'rescheduled': 'معاد جدولتها'
      };
      return statusMap[value as string] || String(value);
    }

    return String(value);
  };

  const filterVisits = (): Visit[] => {
    let filteredVisits = visits;

    // Filter by date range
    if (exportConfig.dateRange.start && exportConfig.dateRange.end) {
      const startDate = new Date(exportConfig.dateRange.start);
      const endDate = new Date(exportConfig.dateRange.end);

      filteredVisits = filteredVisits.filter(visit => {
        const visitDate = new Date(visit.scheduledDate.split('-').reverse().join('-'));
        return visitDate >= startDate && visitDate <= endDate;
      });
    }

    // Filter by visit types
    if (exportConfig.visitTypes.length > 0) {
      filteredVisits = filteredVisits.filter(visit =>
        exportConfig.visitTypes.includes(visit.type)
      );
    }

    // Filter by visit statuses
    if (exportConfig.visitStatuses.length > 0) {
      filteredVisits = filteredVisits.filter(visit =>
        exportConfig.visitStatuses.includes(visit.status)
      );
    }

    return filteredVisits;
  };

  const generateVisitExport = () => {
    setIsExporting(true);

    try {
      const filteredVisits = filterVisits();

      if (filteredVisits.length === 0) {
        alert('لا توجد زيارات تطابق معايير التصدير');
        setIsExporting(false);
        return;
      }

      // Create Excel-compatible CSV content with UTF-8 BOM
      const BOM = '\uFEFF';

      let content = BOM;

      // Add title and export info
      content += `تقرير تصدير الزيارات\n`;
      content += `تاريخ التصدير: ${formatDateForDisplay(new Date().toISOString())}\n`;
      content += `عدد الزيارات: ${filteredVisits.length}\n`;

      if (exportConfig.dateRange.start && exportConfig.dateRange.end) {
        content += `فترة التصدير: ${exportConfig.dateRange.start} إلى ${exportConfig.dateRange.end}\n`;
      }

      content += `أنواع الزيارات: ${exportConfig.visitTypes.join(', ')}\n`;
      content += `حالات الزيارات: ${exportConfig.visitStatuses.join(', ')}\n\n`;

      // Get headers
      const allFieldOptions = [
        ...availableFields,
        ...(exportConfig.includeServices ? serviceFields : []),
        ...(exportConfig.includeResults ? resultFields : [])
      ];

      const headers = exportConfig.selectedFields.map(fieldKey => {
        const field = allFieldOptions.find(f => f.key === fieldKey);
        return field?.label || fieldKey;
      });

      content += headers.join(',') + '\n';

      // Add data rows
      filteredVisits.forEach((visit) => {
        const row = exportConfig.selectedFields.map(fieldKey => {
          const value = formatFieldValue(visit, fieldKey);
          return `"${value.replace(/"/g, '""')}"`;
        });
        content += row.join(',') + '\n';
      });

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `visit_report_${timestamp}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportCompleted(`تم تصدير ${filteredVisits.length} زيارة`);
    } catch (error) {
      console.error('Error generating visit export:', error);
      alert('حدث خطأ في تصدير بيانات الزيارات');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredVisitsCount = filterVisits().length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>تصدير بيانات الزيارات</span>
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="p-2">
                ✕
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Export Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right flex items-center gap-2">
              <Filter className="w-5 h-5" />
              معايير التصدير
            </h3>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-right mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={exportConfig.dateRange.start}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-right mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={exportConfig.dateRange.end}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* Visit Types */}
            <div>
              <label className="block text-sm font-medium text-right mb-2">أنواع الزيارات</label>
              <div className="flex gap-4 justify-end">
                {[
                  { value: 'regular', label: 'دورية' },
                  { value: 'emergency', label: 'طارئة' },
                  { value: 'followup', label: 'متابعة' }
                ].map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <span className="text-sm">{type.label}</span>
                    <Checkbox
                      checked={exportConfig.visitTypes.includes(type.value)}
                      onCheckedChange={(checked) => handleVisitTypeToggle(type.value, !!checked)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Visit Statuses */}
            <div>
              <label className="block text-sm font-medium text-right mb-2">حالات الزيارات</label>
              <div className="flex gap-4 justify-end flex-wrap">
                {[
                  { value: 'scheduled', label: 'مجدولة' },
                  { value: 'completed', label: 'مكتملة' },
                  { value: 'cancelled', label: 'ملغية' },
                  { value: 'in_progress', label: 'جارية' }
                ].map((status) => (
                  <div key={status.value} className="flex items-center gap-2">
                    <span className="text-sm">{status.label}</span>
                    <Checkbox
                      checked={exportConfig.visitStatuses.includes(status.value)}
                      onCheckedChange={(checked) => handleVisitStatusToggle(status.value, !!checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Inclusion Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">تضمين البيانات</h3>

            <div className="flex gap-4 justify-end">
              <div className="flex items-center gap-2">
                <span className="text-sm">تضمين خدمات السلامة</span>
                <Checkbox
                  checked={exportConfig.includeServices}
                  onCheckedChange={(checked) =>
                    setExportConfig(prev => ({ ...prev, includeServices: !!checked }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">تضمين نتائج الزيارات</span>
                <Checkbox
                  checked={exportConfig.includeResults}
                  onCheckedChange={(checked) =>
                    setExportConfig(prev => ({ ...prev, includeResults: !!checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Data Count Display */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-blue-800 text-right">
              عدد الزيارات المطابقة للمعايير: <strong>{filteredVisitsCount}</strong> من أصل {visits.length}
            </p>
          </div>

          {/* Export Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateVisitExport}
              disabled={isExporting || filteredVisitsCount === 0}
              className="gap-2 h-auto p-6 flex-col min-w-64"
            >
              <FileSpreadsheet className="w-12 h-12 text-blue-600" />
              <span className="text-xl font-medium">تصدير تقرير الزيارات</span>
              <span className="text-sm text-gray-500">
                ملف CSV شامل للزيارات المفلترة
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
                تم تصدير تقرير الزيارات بنجاح! ({exportCompleted})
              </AlertDescription>
            </Alert>
          )}

          {/* Export Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-medium text-yellow-800 text-right mb-2">ملاحظات تقرير الزيارات:</h4>
            <ul className="space-y-1 text-sm text-yellow-700 text-right">
              <li>• التقرير يشمل جميع بيانات الزيارات حسب المعايير المحددة</li>
              <li>• التواريخ بتنسيق dd-mmm-yyyy حسب معيار النظام</li>
              <li>• الأنواع والحالات مترجمة إلى العربية</li>
              <li>• خدمات السلامة تظهر كـ "نعم" أو "لا"</li>
              <li>• المشاكل والتوصيات مفصولة بفاصلة منقوطة</li>
              <li>• يمكن استخدام التقرير للتحليل والمراجعة</li>
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
