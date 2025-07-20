'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download, Upload } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useContracts } from '@/hooks/useContracts';
import { useBranches } from '@/hooks/useBranches';

interface VisitImportReviewProps {
  file: File;
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

export function VisitImportReview({ file, onClose, onImportComplete }: VisitImportReviewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);

  // Get data for validation
  const { companies } = useCompanies();
  const { contracts } = useContracts();
  const { branches } = useBranches();

  // Field validation configuration
  const validationConfig = useMemo(() => ({
    required: ['branchId', 'contractId', 'visitType', 'scheduledDate', 'status'],
    validations: {
      branchId: { pattern: /^[A-Z0-9\-]+$/ },
      contractId: { pattern: /^[A-Z0-9\-]+$/ },
      visitType: { enum: ['regular', 'emergency', 'followup'] },
      scheduledDate: { pattern: /^\d{2}-[A-Za-z]{3}-\d{2,4}$/ },
      scheduledTime: { pattern: /^\d{2}:\d{2}$/ },
      completedDate: { pattern: /^\d{2}-[A-Za-z]{3}-\d{2,4}$/ },
      completedTime: { pattern: /^\d{2}:\d{2}$/ },
      status: { enum: ['scheduled', 'completed', 'cancelled', 'in_progress', 'rescheduled'] },
      assignedTeam: { maxLength: 100 },
      assignedTechnician: { maxLength: 100 },
      fireExtinguisher: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      alarmSystem: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      fireSuppression: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      gasSystem: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      foamSystem: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      overallStatus: { enum: ['passed', 'failed', 'partial'] },
      issues: { maxLength: 1000 },
      recommendations: { maxLength: 1000 },
      nextVisitDate: { pattern: /^\d{2}-[A-Za-z]{3}-\d{2,4}$/ },
      notes: { maxLength: 500 }
    }
  }), []);

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

  // Validate individual field
  const validateField = useCallback((fieldName: string, value: string, rowNumber: number, rowData: Record<string, string>): ValidationError[] => {
    const errors: ValidationError[] = [];
    const config = validationConfig.validations[fieldName as keyof typeof validationConfig.validations];

    if (!config) return errors;

    // Required field validation
    if (validationConfig.required.includes(fieldName) && (!value || value.trim() === '')) {
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

    // Pattern validation
    if ('pattern' in config && config.pattern && !(config.pattern as RegExp).test(value)) {
      let suggestion = '';
      if (fieldName.includes('Date')) {
        suggestion = 'استخدم تنسيق dd-mmm-yyyy أو dd-mmm-yy (مثال: 15-Jan-2024 أو 15-Jan-24)';
      } else if (fieldName.includes('Time')) {
        suggestion = 'استخدم تنسيق HH:mm (مثال: 09:30)';
      } else if (fieldName === 'branchId') {
        suggestion = 'استخدم تنسيق معرف الفرع (مثال: 0001-RIY-001-0001)';
      } else if (fieldName === 'contractId') {
        suggestion = 'استخدم تنسيق معرف العقد (مثال: CON-0001-001)';
      }

      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: 'تنسيق القيمة غير صحيح',
        suggestion,
        severity: 'error'
      });
    }

    // Enum validation
    if ('enum' in config && config.enum && !(config.enum as string[]).some((option: string) =>
      option.toLowerCase() === value.toLowerCase() ||
      option === value
    )) {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value,
        error: 'القيمة غير صحيحة',
        suggestion: 'استخدم: ' + (config.enum as string[]).join(' أو '),
        severity: 'error'
      });
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

    // Business logic validation
    if (fieldName === 'branchId') {
      const branch = branches.find(b => b.branchId === value);
      if (!branch) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          error: 'معرف الفرع غير موجود في النظام',
          suggestion: 'تأكد من إضافة الفرع أولاً في إدارة العملاء',
          severity: 'error'
        });
      }
    }

    if (fieldName === 'contractId') {
      const contract = contracts.find(c => c.contractId === value);
      if (!contract) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          error: 'معرف العقد غير موجود في النظام',
          suggestion: 'تأكد من إضافة العقد أولاً في إدارة العملاء',
          severity: 'error'
        });
      } else {
        // Check if contract is linked to the branch
        const branchId = rowData.branchId;
        if (branchId) {
          const branch = branches.find(b => b.branchId === branchId);
          if (branch && !contracts.some(contract => 
          contract.contractId === value &&
          contract.serviceBatches?.some(batch => 
            batch.branchIds.includes(branch.branchId)
          )
        )) {
            errors.push({
              row: rowNumber,
              field: fieldName,
              value,
              error: 'العقد غير مرتبط بهذا الفرع',
              suggestion: 'تأكد من ربط العقد بالفرع في إدارة العملاء',
              severity: 'error'
            });
          }
        }
      }
    }

    // Date range validation
    if (fieldName === 'scheduledDate' || fieldName === 'completedDate') {
      const contractId = rowData.contractId;
      if (contractId) {
        const contract = contracts.find(c => c.contractId === contractId);
        if (contract) {
          const visitDate = new Date(value.split('-').reverse().join('-'));
          const contractStart = new Date(contract.contractStartDate.split('-').reverse().join('-'));
          const contractEnd = new Date(contract.contractEndDate.split('-').reverse().join('-'));

          if (visitDate < contractStart || visitDate > contractEnd) {
            errors.push({
              row: rowNumber,
              field: fieldName,
              value,
              error: 'تاريخ الزيارة خارج فترة العقد',
              suggestion: `العقد ساري من ${contract.contractStartDate} إلى ${contract.contractEndDate}`,
              severity: 'warning'
            });
          }
        }
      }
    }

    // Status-dependent validations
    if (fieldName === 'overallStatus' && value) {
      const status = rowData.status;
      if (status && status !== 'completed') {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value,
          error: 'النتيجة العامة مطلوبة فقط للزيارات المكتملة',
          suggestion: 'احذف النتيجة العامة أو غير حالة الزيارة إلى "completed"',
          severity: 'warning'
        });
      }
    }

    return errors;
  }, [branches, contracts, validationConfig]);

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

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const processedRows: ImportRow[] = dataRows.map((row, index) => {
        const rowNumber = index + 2; // +2 because we start from row 2 (after headers)
        const rowData: Record<string, string> = {};

        // Map row data to headers
        headers.forEach((header, headerIndex) => {
          rowData[header.trim()] = row[headerIndex]?.trim() || '';
        });

        // Validate each field
        const allErrors: ValidationError[] = [];
        Object.entries(rowData).forEach(([fieldName, value]) => {
          const fieldErrors = validateField(fieldName, value, rowNumber, rowData);
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
  }, [file, validateField]);

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
            <span>مراجعة استيراد الزيارات - {file.name}</span>
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
                جاري معالجة ملف الزيارات وتحليل البيانات...
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
                    <div className="text-sm text-gray-600">إجمالي الزيارات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                    <div className="text-sm text-gray-600">زيارات صحيحة</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                    <div className="text-sm text-gray-600">زيارات بأخطاء</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                    <div className="text-sm text-gray-600">زيارات بتحذيرات</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.approved}</div>
                    <div className="text-sm text-gray-600">زيارات مختارة</div>
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
                        <th className="p-3 text-right border-b">بيانات الزيارة</th>
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
                              <div className="text-xs">
                                <span className="font-medium">فرع:</span> {row.data.branchId || 'فارغ'}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">عقد:</span> {row.data.contractId || 'فارغ'}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">نوع:</span> {row.data.visitType || 'فارغ'}
                              </div>
                              <div className="text-xs">
                                <span className="font-medium">تاريخ:</span> {row.data.scheduledDate || 'فارغ'}
                              </div>
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
                  استيراد {stats.approved} زيارة
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
