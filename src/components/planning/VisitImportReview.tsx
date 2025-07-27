'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download, Upload } from 'lucide-react';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { 
  normalizeImportValue, 
  validateNormalizedValue, 
  processImportRow, 
  getFieldConfig,
  ImportFieldConfig 
} from '@/lib/import-utils';
import { Visit } from '@/types/customer';

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

// Enhanced Saudi Arabia cities database
const SAUDI_CITIES = [
  'الرياض', 'Riyadh', 'جدة', 'Jeddah', 'مكة المكرمة', 'Mecca', 'المدينة المنورة', 'Medina',
  'الدمام', 'Dammam', 'الخبر', 'Khobar', 'الظهران', 'Dhahran', 'الطائف', 'Taif',
  'بريدة', 'Buraydah', 'تبوك', 'Tabuk', 'خميس مشيط', 'Khamis Mushait', 'حائل', 'Hail',
  'نجران', 'Najran', 'الجبيل', 'Jubail', 'ينبع', 'Yanbu', 'أبها', 'Abha', 'عرعر', 'Arar',
  'سكاكا', 'Sakaka', 'جيزان', 'Jazan', 'القطيف', 'Qatif', 'الأحساء', 'Al-Ahsa', 'الباحة', 'Al-Baha'
];

// Column mapping for visit import
const COLUMN_MAPPINGS = {
  branchId: ['branchId', 'branch_id', 'معرف الفرع*', 'معرف الفرع', 'Branch ID', 'الفرع', 'فرع'],
  contractId: ['contractId', 'contract_id', 'معرف العقد*', 'معرف العقد', 'Contract ID', 'العقد', 'عقد'],
  companyId: ['companyId', 'company_id', 'معرف الشركة*', 'معرف الشركة', 'Company ID', 'الشركة', 'شركة'],
  visitType: ['visitType', 'visit_type', 'نوع الزيارة*', 'نوع الزيارة', 'Visit Type', 'النوع', 'نوع'],
  status: ['status', 'حالة الزيارة*', 'حالة الزيارة', 'Status', 'الحالة', 'حالة'],
  scheduledDate: ['scheduledDate', 'scheduled_date', 'تاريخ الجدولة*', 'تاريخ الجدولة', 'Scheduled Date', 'التاريخ', 'تاريخ'],
  scheduledTime: ['scheduledTime', 'scheduled_time', 'وقت الجدولة', 'وقت الجدولة', 'Scheduled Time', 'الوقت', 'وقت'],
  completedDate: ['completedDate', 'completed_date', 'تاريخ التنفيذ', 'تاريخ التنفيذ', 'Completed Date', 'تاريخ التنفيذ'],
  completedTime: ['completedTime', 'completed_time', 'وقت التنفيذ', 'وقت التنفيذ', 'Completed Time', 'وقت التنفيذ'],
  duration: ['duration', 'مدة الزيارة (دقائق)', 'مدة الزيارة', 'Duration', 'المدة', 'مدة'],
  assignedTeam: ['assignedTeam', 'assigned_team', 'الفريق المختص', 'الفريق', 'Team', 'فريق'],
  assignedTechnician: ['assignedTechnician', 'assigned_technician', 'الفني المختص', 'الفني', 'Technician', 'فني'],
  fireExtinguisher: ['fireExtinguisher', 'fire_extinguisher', 'صيانة الطفايات', 'الطفايات', 'Fire Extinguisher'],
  alarmSystem: ['alarmSystem', 'alarm_system', 'صيانة نظام الإنذار', 'الإنذار', 'Alarm System'],
  fireSuppression: ['fireSuppression', 'fire_suppression', 'صيانة نظام الإطفاء', 'الإطفاء', 'Fire Suppression'],
  gasSystem: ['gasSystem', 'gas_system', 'نظام الغاز', 'الغاز', 'Gas System'],
  foamSystem: ['foamSystem', 'foam_system', 'نظام الفوم', 'الفوم', 'Foam System'],
  overallStatus: ['overallStatus', 'overall_status', 'النتيجة العامة', 'النتيجة', 'Overall Status'],
  issues: ['issues', 'المشاكل المكتشفة', 'المشاكل', 'Issues'],
  recommendations: ['recommendations', 'التوصيات', 'التوصيات', 'Recommendations'],
  nextVisitDate: ['nextVisitDate', 'next_visit_date', 'تاريخ الزيارة القادمة', 'الزيارة القادمة', 'Next Visit Date'],
  notes: ['notes', 'ملاحظات', 'ملاحظات', 'Notes'],
  createdBy: ['createdBy', 'created_by', 'تم الإنشاء بواسطة', 'المنشئ', 'Created By']
};

const mapHeaderToField = (header: string): string | null => {
  const normalizedHeader = header.trim().toLowerCase();
  
  for (const [fieldName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    if (variations.some(variation => variation.toLowerCase() === normalizedHeader)) {
      return fieldName;
    }
  }
  
  return null;
};

export function VisitImportReview({ file, onClose, onImportComplete }: VisitImportReviewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{ type: 'error' | 'warning' | null; field: string | null }>({ type: null, field: null });
  const [skippedRowsCount, setSkippedRowsCount] = useState<number>(0);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  // Get data for validation
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();
  const { addVisit } = useVisitsFirebase();

  // Field validation configuration for visits
  const validationConfig = useMemo(() => ({
    required: ['branchId', 'contractId', 'companyId', 'visitType', 'status', 'scheduledDate'],
    validations: {
      branchId: { type: 'id', pattern: /^[0-9]{4}-[A-Z]{3}-[0-9]{3}-[0-9]{4}$/ },
      contractId: { type: 'id', pattern: /^CON-[0-9]{4}-[0-9]{3}$/ },
      companyId: { type: 'id', pattern: /^[0-9]{4}$/ },
      visitType: { type: 'text', enum: ['regular', 'emergency', 'followup'] },
      status: { type: 'text', enum: ['scheduled', 'completed', 'cancelled', 'in_progress', 'rescheduled'] },
      scheduledDate: { type: 'date', pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
      scheduledTime: { type: 'text', pattern: /^\d{2}:\d{2}$/ },
      completedDate: { type: 'date', pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
      completedTime: { type: 'text', pattern: /^\d{2}:\d{2}$/ },
      duration: { type: 'number', min: 15, max: 480 },
      assignedTeam: { type: 'text', maxLength: 100 },
      assignedTechnician: { type: 'text', maxLength: 100 },
      fireExtinguisher: { type: 'boolean', enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      alarmSystem: { type: 'boolean', enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      fireSuppression: { type: 'boolean', enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      gasSystem: { type: 'boolean', enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      foamSystem: { type: 'boolean', enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
      overallStatus: { type: 'text', enum: ['passed', 'failed', 'partial'] },
      issues: { type: 'text', maxLength: 1000 },
      recommendations: { type: 'text', maxLength: 1000 },
      nextVisitDate: { type: 'date', pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
      notes: { type: 'text', maxLength: 500 },
      createdBy: { type: 'text', maxLength: 100 }
    }
  }), []);

  // Parse CSV content with empty row filtering
  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim() === '' || line.startsWith('#')) continue;

      const row: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
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
      
      // Only add the row if it has at least one non-empty cell
      if (row.some(cell => cell && cell.trim().length > 0)) {
        result.push(row);
      } else {
        console.log(`🚫 Skipping completely empty row during CSV parsing`);
      }
    }

    return result;
  };

  // Validate individual field with normalization
  const validateField = useCallback((fieldName: string, value: string, rowNumber: number, rowData: Record<string, string>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Find field configuration
    const fieldConfig = validationConfig.validations[fieldName as keyof typeof validationConfig.validations];
    if (!fieldConfig) return errors;

    // Normalize the value
    const normalized = normalizeImportValue(value, { fieldName, ...fieldConfig } as ImportFieldConfig);
    
    // Validate the normalized value
    const validation = validateNormalizedValue(normalized.normalizedValue, { fieldName, ...fieldConfig } as ImportFieldConfig);
    
    // Add normalization warnings
    normalized.warnings.forEach(warning => {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value: normalized.originalValue,
        error: warning,
        suggestion: 'تم تطبيع القيمة تلقائياً',
        severity: 'warning'
      });
    });

    // Add validation errors
    validation.errors.forEach(error => {
      errors.push({
        row: rowNumber,
        field: fieldName,
        value: normalized.originalValue,
        error: error,
        suggestion: 'يرجى تصحيح القيمة',
        severity: 'error'
      });
    });

    // Business logic validation
    if (fieldName === 'branchId') {
      const branch = branches.find(b => b.branchId === normalized.normalizedValue);
      if (!branch) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value: normalized.originalValue,
          error: 'معرف الفرع غير موجود في النظام',
          suggestion: 'تأكد من إضافة الفرع أولاً في إدارة العملاء',
          severity: 'error'
        });
      }
    }

    if (fieldName === 'contractId') {
      const contract = contracts.find(c => c.contractId === normalized.normalizedValue);
      if (!contract) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value: normalized.originalValue,
          error: 'معرف العقد غير موجود في النظام',
          suggestion: 'تأكد من إضافة العقد أولاً في إدارة العملاء',
          severity: 'error'
        });
      }
    }

    if (fieldName === 'companyId') {
      const company = companies.find(c => c.companyId === normalized.normalizedValue);
      if (!company) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value: normalized.originalValue,
          error: 'معرف الشركة غير موجود في النظام',
          suggestion: 'تأكد من إضافة الشركة أولاً في إدارة العملاء',
          severity: 'error'
        });
      }
    }

    // Validate relationships
    if (fieldName === 'branchId' || fieldName === 'contractId' || fieldName === 'companyId') {
      const branchId = rowData.branchId;
      const contractId = rowData.contractId;
      const companyId = rowData.companyId;

      if (branchId && contractId && companyId) {
        const branch = branches.find(b => b.branchId === branchId);
        const contract = contracts.find(c => c.contractId === contractId);
        const company = companies.find(c => c.companyId === companyId);

        if (branch && contract && company) {
          // Check if branch belongs to company
          if (branch.companyId !== companyId) {
            errors.push({
              row: rowNumber,
              field: fieldName,
              value: normalized.originalValue,
              error: 'الفرع لا ينتمي للشركة المحددة',
              suggestion: `الفرع ${branchId} ينتمي للشركة ${branch.companyId}`,
              severity: 'error'
            });
          }

          // Check if contract belongs to company
          if (contract.companyId !== companyId) {
            errors.push({
              row: rowNumber,
              field: fieldName,
              value: normalized.originalValue,
              error: 'العقد لا ينتمي للشركة المحددة',
              suggestion: `العقد ${contractId} ينتمي للشركة ${contract.companyId}`,
              severity: 'error'
            });
          }

          // Check if branch is included in contract service batches
          const branchInContract = contract.serviceBatches?.some(batch => 
            batch.branchIds && Array.isArray(batch.branchIds) && batch.branchIds.includes(branchId)
          );
          if (!branchInContract) {
            errors.push({
              row: rowNumber,
              field: fieldName,
              value: normalized.originalValue,
              error: 'الفرع غير مدرج في خدمات العقد',
              suggestion: 'تأكد من إضافة الفرع لخدمات العقد',
              severity: 'error'
            });
          }
        }
      }
    }

    // Validate completed visits have required fields
    if (rowData.status === 'completed') {
      if (fieldName === 'overallStatus' && !rowData.overallStatus) {
        errors.push({
          row: rowNumber,
          field: fieldName,
          value: normalized.originalValue,
          error: 'النتيجة العامة مطلوبة للزيارات المكتملة',
          suggestion: 'أدخل passed أو failed أو partial',
          severity: 'error'
        });
      }
    }

    return errors;
  }, [companies, contracts, branches, validationConfig]);

  // Process uploaded file
  const processFile = useCallback(async () => {
    setIsProcessing(true);

    try {
      let content = '';

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        content = await file.text();
      } else {
        throw new Error('Excel file processing not yet implemented. Please convert to CSV format.');
      }

      const rows = parseCSV(content);
      if (rows.length === 0) {
        throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
      }

      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);

      console.log('📋 CSV Headers Found:', headers);

      // Map headers to standard field names
      const headerMapping: Record<string, string> = {};
      const mappedFields: Set<string> = new Set();

      headers.forEach(header => {
        const mappedField = mapHeaderToField(header);
        console.log(`📋 Mapping "${header}" -> "${mappedField}"`);
        if (mappedField) {
          headerMapping[header] = mappedField;
          mappedFields.add(mappedField);
        }
      });

      console.log('📋 Header Mapping Result:', headerMapping);
      console.log('📋 Mapped Fields Found:', Array.from(mappedFields));
      console.log('📋 Required Fields:', validationConfig.required);

      // Validate headers
      const missingHeaders: string[] = [];
      validationConfig.required.forEach((requiredField: string) => {
        if (!mappedFields.has(requiredField)) {
          missingHeaders.push(requiredField);
        }
      });

      if (missingHeaders.length > 0) {
        throw new Error(`أعمدة مطلوبة مفقودة: ${missingHeaders.join(', ')}`);
      }

      // Filter out completely empty rows before processing
      const nonEmptyDataRows = dataRows.filter((row, index) => {
        const hasData = row.some(cell => cell && cell.trim().length > 0);
        
        if (!hasData) {
          console.log(`🚫 Skipping empty row ${index + 2} (all cells empty)`);
        }
        
        return hasData;
      });

      const skippedCount = dataRows.length - nonEmptyDataRows.length;
      setSkippedRowsCount(skippedCount);
      console.log(`📊 Processing ${nonEmptyDataRows.length} non-empty rows out of ${dataRows.length} total rows (skipped ${skippedCount} empty rows)`);

      const processedRows: ImportRow[] = nonEmptyDataRows.map((row, index) => {
        const originalRowIndex = dataRows.indexOf(row);
        const rowNumber = originalRowIndex + 2;
        
        const rowData: Record<string, string> = {};

        // Map row data to standard field names
        headers.forEach((header, headerIndex) => {
          const standardFieldName = headerMapping[header];
          if (standardFieldName) {
            rowData[standardFieldName] = row[headerIndex]?.trim() || '';
          }
        });

        // Validate each field
        const allErrors: ValidationError[] = [];

        // Check for missing required fields
        validationConfig.required.forEach((requiredField: string) => {
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

        // Validate all mapped fields
        Object.entries(rowData).forEach(([fieldName, value]) => {
          if (fieldName in validationConfig.validations) {
            const fieldErrors = validateField(fieldName, value, rowNumber, rowData);
            allErrors.push(...fieldErrors);
          }
        });

        const errors = allErrors.filter(e => e.severity === 'error');
        const warnings = allErrors.filter(e => e.severity === 'warning');

        return {
          rowNumber,
          data: rowData,
          errors,
          warnings,
          approved: errors.length === 0,
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
  }, [file, validationConfig, validateField]);

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

  // Process import with Firebase integration
  const processImport = async () => {
    const approvedRows = importRows.filter(row => row.approved);
    
    if (approvedRows.length === 0) {
      alert('يرجى اختيار سجلات للاستيراد');
      return;
    }

    setImportProgress({ current: 0, total: approvedRows.length, message: 'جاري استيراد الزيارات...' });

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < approvedRows.length; i++) {
      const row = approvedRows[i];
      setImportProgress({ 
        current: i + 1, 
        total: approvedRows.length, 
        message: `جاري استيراد الزيارة ${i + 1} من ${approvedRows.length}...` 
      });

      try {
        // Convert row data to Visit format
        const visitData: Omit<Visit, 'id' | 'visitId' | 'isArchived' | 'createdAt' | 'updatedAt'> = {
          branchId: row.data.branchId,
          contractId: row.data.contractId,
          companyId: row.data.companyId,
          type: row.data.visitType as 'regular' | 'emergency' | 'followup',
          status: row.data.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled',
          scheduledDate: row.data.scheduledDate,
          scheduledTime: row.data.scheduledTime || undefined,
          completedDate: row.data.completedDate || undefined,
          completedTime: row.data.completedTime || undefined,
          duration: row.data.duration ? parseInt(row.data.duration) : undefined,
          assignedTeam: row.data.assignedTeam || undefined,
          assignedTechnician: row.data.assignedTechnician || undefined,
          notes: row.data.notes || undefined,
          services: {
            fireExtinguisher: row.data.fireExtinguisher === 'نعم' || row.data.fireExtinguisher === 'yes' || row.data.fireExtinguisher === 'true',
            alarmSystem: row.data.alarmSystem === 'نعم' || row.data.alarmSystem === 'yes' || row.data.alarmSystem === 'true',
            fireSuppression: row.data.fireSuppression === 'نعم' || row.data.fireSuppression === 'yes' || row.data.fireSuppression === 'true',
            gasSystem: row.data.gasSystem === 'نعم' || row.data.gasSystem === 'yes' || row.data.gasSystem === 'true',
            foamSystem: row.data.foamSystem === 'نعم' || row.data.foamSystem === 'yes' || row.data.foamSystem === 'true',
          },
          results: row.data.overallStatus ? {
            overallStatus: row.data.overallStatus as 'passed' | 'failed' | 'partial',
            issues: row.data.issues ? [row.data.issues] : undefined,
            recommendations: row.data.recommendations ? [row.data.recommendations] : undefined,
            nextVisitDate: row.data.nextVisitDate || undefined,
          } : undefined,
          attachments: [],
          createdBy: row.data.createdBy || 'system-import'
        };

        const result = await addVisit(visitData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`الصف ${row.rowNumber}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`الصف ${row.rowNumber}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }

      // Small delay to prevent overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setImportProgress(null);

    const results: ImportResults = {
      totalRows: importRows.length,
      successfulRows: successCount,
      errorRows: errorCount,
      warningRows: importRows.filter(row => row.warnings.length > 0).length,
      importedData: approvedRows.map(row => row.data)
    };

    onImportComplete(results);

    // Show detailed results
    const message = `تم استيراد الزيارات!\n\n` +
      `إجمالي السجلات: ${results.totalRows}\n` +
      `تم استيراد: ${successCount}\n` +
      `أخطاء: ${errorCount}\n` +
      `تحذيرات: ${results.warningRows}`;

    if (errors.length > 0) {
      alert(`${message}\n\nالأخطاء:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...والمزيد' : ''}`);
    } else {
      alert(message);
    }
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
    
    if (activeFilter.type && activeFilter.field) {
      if (activeFilter.type === 'error') {
        return row.errors.some(error => 
          `${error.field}: ${error.error}` === activeFilter.field
        );
      } else if (activeFilter.type === 'warning') {
        return row.warnings.some(warning => 
          `${warning.field}: ${warning.error}` === activeFilter.field
        );
      }
    }
    
    return true;
  });

  // Calculate error and warning summaries
  const errorSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    importRows.forEach(row => {
      row.errors.forEach(error => {
        const key = `${error.field}: ${error.error}`;
        summary[key] = (summary[key] || 0) + 1;
      });
    });
    return summary;
  }, [importRows]);

  const warningSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    importRows.forEach(row => {
      row.warnings.forEach(warning => {
        const key = `${warning.field}: ${warning.error}`;
        summary[key] = (summary[key] || 0) + 1;
      });
    });
    return summary;
  }, [importRows]);

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
                جاري معالجة الملف وتحليل البيانات...
              </AlertDescription>
            </Alert>
          )}

          {importProgress && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="text-right">
                {importProgress.message} ({importProgress.current}/{importProgress.total})
              </AlertDescription>
            </Alert>
          )}

          {processingComplete && (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                {skippedRowsCount > 0 && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">{skippedRowsCount}</div>
                      <div className="text-sm text-gray-600">صفوف فارغة تم تجاهلها</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Error and Warning Summary */}
              {(Object.keys(errorSummary).length > 0 || Object.keys(warningSummary).length > 0) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-right">ملخص الأخطاء والتحذيرات</h3>
                  
                  {/* Error Summary */}
                  {Object.keys(errorSummary).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-medium text-red-700 text-right">الأخطاء</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(errorSummary).map(([errorKey, count]) => (
                          <Button
                            key={errorKey}
                            variant={activeFilter.type === 'error' && activeFilter.field === errorKey ? "default" : "outline"}
                            size="sm"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => setActiveFilter({ type: 'error', field: errorKey })}
                          >
                            {count} {errorKey}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warning Summary */}
                  {Object.keys(warningSummary).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-medium text-yellow-700 text-right">التحذيرات</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(warningSummary).map(([warningKey, count]) => (
                          <Button
                            key={warningKey}
                            variant={activeFilter.type === 'warning' && activeFilter.field === warningKey ? "default" : "outline"}
                            size="sm"
                            className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                            onClick={() => setActiveFilter({ type: 'warning', field: warningKey })}
                          >
                            {count} {warningKey}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filter Button */}
                  {activeFilter.type && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFilter({ type: null, field: null })}
                        className="text-gray-600"
                      >
                        إلغاء التصفية
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                          </td>
                          <td className="p-3">
                            <div className="space-y-1 text-xs">
                              <div><strong>الفرع:</strong> {row.data.branchId}</div>
                              <div><strong>العقد:</strong> {row.data.contractId}</div>
                              <div><strong>النوع:</strong> {row.data.visitType}</div>
                              <div><strong>الحالة:</strong> {row.data.status}</div>
                              <div><strong>التاريخ:</strong> {row.data.scheduledDate}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {row.errors.map((error, errorIndex) => (
                                <div key={errorIndex} className="text-red-600 text-xs">
                                  <strong>{error.field}:</strong> {error.error}
                                  {error.suggestion && <div className="text-gray-500">{error.suggestion}</div>}
                                </div>
                              ))}
                              {row.warnings.map((warning, warningIndex) => (
                                <div key={warningIndex} className="text-yellow-600 text-xs">
                                  <strong>{warning.field}:</strong> {warning.error}
                                  {warning.suggestion && <div className="text-gray-500">{warning.suggestion}</div>}
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

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  onClick={processImport}
                  disabled={importRows.filter(row => row.approved).length === 0 || importProgress !== null}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {importProgress ? 'جاري الاستيراد...' : 'استيراد المختار'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
