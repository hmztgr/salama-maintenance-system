'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download, Upload } from 'lucide-react';

interface ImportReviewProps {
  file: File;
  entityType: 'companies' | 'contracts' | 'branches';
  onClose: () => void;
  onImportComplete: (results: ImportResults) => void;
}

interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  suggestion?: string;
  severity: 'error' | 'warning';
}

interface ImportRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: ValidationError[];
  warnings: ValidationError[];
  approved: boolean;
  isValid: boolean;
}

interface ImportResults {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
  warningRows: number;
  importedData: Record<string, string>[];
}

// Saudi Arabia cities database for validation
const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران',
  'الطائف', 'بريدة', 'تبوك', 'خميس مشيط', 'حائل', 'نجران', 'الجبيل', 'ينبع',
  'أبها', 'عرعر', 'سكاكا', 'جيزان', 'القطيف', 'الأحساء', 'الباحة', 'القريات',
  'الخرج', 'القصيم', 'الهفوف', 'المجمعة', 'رفحاء', 'الزلفي', 'وادي الدواسر',
  'الافلاج', 'صبيا', 'محايل عسير', 'القنفذة', 'الليث', 'رابغ', 'الحوية',
  'تيماء', 'العلا', 'بدر', 'المهد', 'خيبر', 'العيص', 'املج', 'الوجه',
  'ضباء', 'حقل', 'البدع', 'الطوال', 'بيشة', 'النماص', 'تنومة', 'ظهران الجنوب',
  'سراة عبيدة', 'الباحة', 'المندق', 'العقيق', 'قلوة', 'المخواة', 'بلجرشي',
  'العارضة', 'فرسان', 'ابو عريش', 'صامطة', 'احد رفيدة', 'الداير',
  'هروب', 'فيفا', 'العيدابي', 'الحرث', 'بيش', 'الطائف', 'الليث',
  'تربة', 'رنية', 'الخرمة', 'الموية', 'ميسان', 'أضم', 'الكامل'
];

export function ImportReview({ file, entityType, onClose, onImportComplete }: ImportReviewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Field validation configurations
  const validationConfigs = useMemo(() => ({
    companies: {
      required: ['companyName', 'phone', 'address', 'city'],
      validations: {
        companyName: { maxLength: 100, pattern: /^.{1,100}$/ },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { pattern: /^[\d\s\-\+\(\)]{7,15}$/ },
        address: { maxLength: 200 },
        city: { enum: SAUDI_CITIES },
        contactPerson: { maxLength: 100 },
        notes: { maxLength: 500 }
      }
    },
    contracts: {
      required: ['companyId', 'contractStartDate', 'contractEndDate', 'regularVisitsPerYear', 'emergencyVisitsPerYear'],
      validations: {
        companyId: { pattern: /^\d{4}$/ },
        contractStartDate: { pattern: /^\d{2}-[A-Za-z]{3}-\d{4}$/ },
        contractEndDate: { pattern: /^\d{2}-[A-Za-z]{3}-\d{4}$/ },
        regularVisitsPerYear: { min: 0, max: 365, type: 'number' },
        emergencyVisitsPerYear: { min: 0, max: 365, type: 'number' },
        contractValue: { min: 0, type: 'number' },
        fireExtinguisherMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        alarmSystemMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        fireSuppressionMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        gasFireSuppression: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        foamFireSuppression: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        notes: { maxLength: 500 }
      }
    },
    branches: {
      required: ['companyId', 'contractIds', 'city', 'location', 'branchName'],
      validations: {
        companyId: { pattern: /^\d{4}$/ },
        contractIds: { pattern: /^[A-Z\-\d,\s]+$/ },
        city: { enum: SAUDI_CITIES },
        location: { maxLength: 100 },
        branchName: { maxLength: 100 },
        address: { maxLength: 200 },
        contactPerson: { maxLength: 100 },
        contactPhone: { pattern: /^[\d\s\-\+\(\)]{7,15}$/ },
        teamMember: { maxLength: 100 },
        notes: { maxLength: 500 }
      }
    }
  }), []);

  const currentConfig = useMemo(() => validationConfigs[entityType], [validationConfigs, entityType]);

  // Parse CSV content
  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue; // Skip empty lines and comments

      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }

      row.push(current.trim());
      result.push(row);
    }

    return result.filter(row => row.some(cell => cell.length > 0));
  };

  // Validate individual field with enhanced error handling
  const validateField = useCallback((fieldName: string, value: string, rowNumber: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const config = currentConfig.validations[fieldName as keyof typeof currentConfig.validations];

    // Skip validation for fields not in our configuration
    if (!config) {
      console.warn(`⚠️ No validation config found for field: ${fieldName}`);
      return errors;
    }

    // Required field validation
    if (currentConfig.required.includes(fieldName) && (!value || value.trim() === '')) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: `الحقل "${fieldName}" مطلوب`,
        suggestion: 'يرجى إدخال قيمة صحيحة',
        severity: 'error'
      });
      return errors;
    }

    // Skip validation for empty optional fields
    if (!value || value.trim() === '') return errors;

    // Type validation
    if ('type' in config && config.type === 'number' && isNaN(Number(value))) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: 'يجب أن تكون القيمة رقم',
        suggestion: `مثال: 12`,
        severity: 'error'
      });
      return errors;
    }

    // Enhanced pattern validation with date format flexibility
    if ('pattern' in config && config.pattern) {
      let isValid = false;
      let suggestion = '';

      if (fieldName.includes('Date')) {
        // For date fields, try multiple formats
        const dateFormats = [
          /^\d{2}-[A-Za-z]{3}-\d{4}$/,  // dd-mmm-yyyy
          /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // mm/dd/yyyy or dd/mm/yyyy
          /^\d{1,2}-\d{1,2}-\d{4}$/,    // mm-dd-yyyy or dd-mm-yyyy
          /^\d{4}-\d{1,2}-\d{1,2}$/     // yyyy-mm-dd
        ];

        isValid = dateFormats.some(format => format.test(value));
        suggestion = 'استخدم تنسيق dd-mmm-yyyy (مثال: 15-Jan-2024) أو mm/dd/yyyy أو dd/mm/yyyy';
      } else {
        // For non-date fields, use the original pattern
        isValid = (config.pattern as RegExp).test(value);

        if (fieldName === 'email') {
          suggestion = 'استخدم تنسيق email صحيح (مثال: user@company.com)';
        } else if (fieldName.includes('phone') || fieldName === 'phone') {
          suggestion = 'استخدم أرقام ورموز فقط (مثال: 0501234567)';
        } else if (fieldName === 'companyId') {
          suggestion = 'استخدم 4 أرقام (مثال: 0001)';
        } else {
          suggestion = 'تحقق من تنسيق القيمة المدخلة';
        }
      }

      if (!isValid) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          error: 'تنسيق القيمة غير صحيح',
          suggestion,
          severity: 'error'
        });
      }
    }

    // Length validation
    if ('maxLength' in config && config.maxLength && value.length > config.maxLength) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: `القيمة طويلة جداً (الحد الأقصى ${config.maxLength} حرف)`,
        suggestion: `اختصر النص إلى ${config.maxLength} حرف أو أقل`,
        severity: 'warning'
      });
    }

    // Enhanced enum validation with flexible matching
    if ('enum' in config && config.enum) {
      const enumValues = config.enum as string[];
      const isValid = enumValues.some((option: string) => {
        // Exact match
        if (option === value) return true;

        // Case-insensitive match
        if (option.toLowerCase() === value.toLowerCase()) return true;

        // Boolean value flexibility for service fields
        if (fieldName.includes('Maintenance') || fieldName.includes('Suppression')) {
          const valueLower = value.toLowerCase();
          const optionLower = option.toLowerCase();

          // Map various boolean representations
          const trueValues = ['yes', 'true', '1', 'نعم', 'صحيح'];
          const falseValues = ['no', 'false', '0', 'لا', 'خطأ'];

          if (trueValues.includes(optionLower) && trueValues.includes(valueLower)) return true;
          if (falseValues.includes(optionLower) && falseValues.includes(valueLower)) return true;
        }

        return false;
      });

      if (!isValid) {
        if (fieldName === 'city') {
          const suggestion = SAUDI_CITIES.find(city =>
            city.includes(value) || value.includes(city)
          );

          errors.push({
            row: rowNumber,
            field: fieldName,
            value,
            error: 'المدينة غير موجودة في قاعدة بيانات المدن السعودية',
            suggestion: suggestion ? `هل تقصد "${suggestion}"؟` : 'اختر مدينة من القائمة المعتمدة',
            severity: 'error'
          });
        } else if (fieldName.includes('Maintenance') || fieldName.includes('Suppression')) {
          errors.push({
            row: rowNumber,
            field: fieldName,
            value,
            error: 'قيمة الخدمة غير صحيحة',
            suggestion: 'استخدم: نعم، لا، yes، no، true، false',
            severity: 'error'
          });
        } else {
          errors.push({
            row: rowNumber,
            field: fieldName,
            value,
            error: 'القيمة غير صحيحة',
            suggestion: 'استخدم: ' + enumValues.join(' أو '),
            severity: 'error'
          });
        }
      }
    }

    // Range validation
    if ('min' in config && config.min !== undefined && Number(value) < (config.min as number)) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: `القيمة صغيرة جداً (الحد الأدنى ${config.min})`,
        suggestion: `استخدم قيمة ${config.min} أو أكبر`,
        severity: 'error'
      });
    }

    if ('max' in config && config.max !== undefined && Number(value) > (config.max as number)) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: `القيمة كبيرة جداً (الحد الأقصى ${config.max})`,
        suggestion: `استخدم قيمة ${config.max} أو أقل`,
        severity: 'error'
      });
    }

    return errors;
  }, [currentConfig]);

  // Process uploaded file
  const processFile = useCallback(async () => {
    setIsProcessing(true);

    try {
      let content = '';

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        content = await file.text();
      } else {
        // For Excel files, we'll need to use a library like xlsx
        // For now, show an error message
        throw new Error('Excel file processing not yet implemented. Please convert to CSV format.');
      }

      const rows = parseCSV(content);
      if (rows.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
      }

      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);

      // Validate headers first
      const missingHeaders: string[] = [];
      const extraHeaders: string[] = [];

      // Check for missing required headers
      currentConfig.required.forEach(requiredField => {
        if (!headers.includes(requiredField)) {
          missingHeaders.push(requiredField);
        }
      });

      // Check for unknown headers
      headers.forEach(header => {
        if (header && !(header in currentConfig.validations) && !currentConfig.required.includes(header)) {
          extraHeaders.push(header);
        }
      });

      // If there are critical header issues, stop processing
      if (missingHeaders.length > 0) {
        throw new Error(`أعمدة مطلوبة مفقودة: ${missingHeaders.join(', ')}. تأكد من وجود جميع الأعمدة المطلوبة في ملف CSV.`);
      }

      console.log('📋 Import Header Validation:', {
        headers,
        missingHeaders,
        extraHeaders,
        expectedRequired: currentConfig.required,
        entityType
      });

      const processedRows: ImportRow[] = dataRows.map((row, index) => {
        const rowNumber = index + 2; // +2 because we start from row 2 (after headers)
        const rowData: Record<string, string> = {};

        // Map row data to headers
        headers.forEach((header, headerIndex) => {
          rowData[header.trim()] = row[headerIndex]?.trim() || '';
        });

        // Validate each field with enhanced validation
        const allErrors: ValidationError[] = [];

        // Check for missing required fields first
        currentConfig.required.forEach(requiredField => {
          if (!(requiredField in rowData) || !rowData[requiredField] || rowData[requiredField].trim() === '') {
            allErrors.push({
              row: rowNumber,
              field: requiredField,
              value: rowData[requiredField] || '',
              error: `الحقل المطلوب "${requiredField}" مفقود أو فارغ`,
              suggestion: 'تأكد من وجود العمود في ملف CSV ووجود قيمة صحيحة',
              severity: 'error'
            });
          }
        });

        // Validate fields that exist in the data
        Object.entries(rowData).forEach(([fieldName, value]) => {
          // Skip validation for fields that are not in our configuration
          if (!(fieldName in currentConfig.validations)) {
            // Add warning for unknown fields
            if (value && value.trim() !== '') {
              allErrors.push({
                row: rowNumber,
                field: fieldName,
                value,
                error: `عمود غير معروف: "${fieldName}"`,
                suggestion: 'قد يكون هذا العمود غير مطلوب أو اسمه غير صحيح',
                severity: 'warning'
              });
            }
            return;
          }

          const fieldErrors = validateField(fieldName, value, rowNumber);
          allErrors.push(...fieldErrors);
        });

        const errors = allErrors.filter(e => e.severity === 'error');
        const warnings = allErrors.filter(e => e.severity === 'warning');

        return {
          rowNumber,
          data: rowData,
          errors,
          warnings,
          approved: errors.length === 0, // Auto-approve rows without errors
          isValid: errors.length === 0
        };
      });

      setImportRows(processedRows);
      setProcessingComplete(true);

      // Auto-select all valid rows
      const validRowsCount = processedRows.filter(row => row.isValid).length;
      if (validRowsCount === processedRows.length) {
        setSelectAll(true);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      alert(`خطأ في معالجة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [file, currentConfig, validateField, entityType]);

  // Handle row approval toggle
  const toggleRowApproval = (rowIndex: number) => {
    setImportRows(prev => prev.map((row, index) =>
      index === rowIndex ? { ...row, approved: !row.approved } : row
    ));
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setImportRows(prev => prev.map(row => ({ ...row, approved: newSelectAll && row.isValid })));
  };

  // Process import
  const processImport = () => {
    const approvedRows = importRows.filter(row => row.approved);
    const results: ImportResults = {
      totalRows: importRows.length,
      successfulRows: approvedRows.length,
      errorRows: importRows.filter(row => row.errors.length > 0).length,
      warningRows: importRows.filter(row => row.warnings.length > 0).length,
      importedData: approvedRows.map(row => row.data)
    };

    onImportComplete(results);
  };

  // Initialize file processing
  useEffect(() => {
    if (file) {
      processFile();
    }
  }, [file, processFile]);

  // Filter rows based on display options
  const filteredRows = importRows.filter(row => {
    if (showApprovedOnly && !row.approved) return false;
    if (showErrorsOnly && row.isValid) return false;
    return true;
  });

  const stats = {
    total: importRows.length,
    valid: importRows.filter(row => row.isValid).length,
    errors: importRows.filter(row => row.errors.length > 0).length,
    warnings: importRows.filter(row => row.warnings.length > 0).length,
    approved: importRows.filter(row => row.approved).length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>مراجعة الاستيراد - {file.name}</span>
            <Button variant="ghost" onClick={onClose} className="p-2">
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {isProcessing && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription className="text-right">
                جاري معالجة الملف وتحليل البيانات...
              </AlertDescription>
            </Alert>
          )}

          {processingComplete && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-gray-600">إجمالي السجلات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                    <div className="text-sm text-gray-600">سجلات صحيحة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                    <div className="text-sm text-gray-600">سجلات بأخطاء</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                    <div className="text-sm text-gray-600">سجلات بتحذيرات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.approved}</div>
                    <div className="text-sm text-gray-600">سجلات مختارة</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-4 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm">الأخطاء فقط</span>
                  <Checkbox
                    checked={showErrorsOnly}
                    onCheckedChange={(checked) => setShowErrorsOnly(!!checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">المختارة فقط</span>
                  <Checkbox
                    checked={showApprovedOnly}
                    onCheckedChange={(checked) => setShowApprovedOnly(!!checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">تحديد الكل</span>
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              </div>

              {/* Data Review Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-3 text-right border-b">اختيار</th>
                        <th className="p-3 text-right border-b">الصف</th>
                        <th className="p-3 text-right border-b">الحالة</th>
                        <th className="p-3 text-right border-b">البيانات</th>
                        <th className="p-3 text-right border-b">الأخطاء والتحذيرات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row, index) => (
                        <tr key={index} className={`border-b ${!row.isValid ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-yellow-50' : ''}`}>
                          <td className="p-3">
                            <Checkbox
                              checked={row.approved}
                              onCheckedChange={() => toggleRowApproval(importRows.indexOf(row))}
                              disabled={!row.isValid}
                            />
                          </td>
                          <td className="p-3 font-mono">{row.rowNumber}</td>
                          <td className="p-3">
                            {row.isValid ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                صحيح
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                خطأ
                              </Badge>
                            )}
                            {row.warnings.length > 0 && (
                              <Badge className="bg-yellow-100 text-yellow-800 mr-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                تحذير
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {Object.entries(row.data).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span> {value || 'فارغ'}
                                </div>
                              ))}
                              {Object.keys(row.data).length > 3 && (
                                <div className="text-xs text-gray-500">...وحقول أخرى</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-2">
                              {row.errors.map((error, errorIndex) => (
                                <div key={errorIndex} className="text-xs text-red-700 bg-red-100 p-2 rounded">
                                  <div className="font-medium">{error.field}: {error.error}</div>
                                  {error.suggestion && (
                                    <div className="text-red-600">اقتراح: {error.suggestion}</div>
                                  )}
                                </div>
                              ))}
                              {row.warnings.map((warning, warningIndex) => (
                                <div key={warningIndex} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                                  <div className="font-medium">{warning.field}: {warning.error}</div>
                                  {warning.suggestion && (
                                    <div className="text-yellow-600">اقتراح: {warning.suggestion}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Import Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  onClick={processImport}
                  disabled={stats.approved === 0}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  استيراد {stats.approved} سجل
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
