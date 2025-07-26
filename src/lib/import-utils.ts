/**
 * Import Utilities for Excel/CSV Data Processing
 * Handles common Excel formatting issues like leading zeros and single quotes
 */

export interface ImportFieldConfig {
  fieldName: string;
  type: 'id' | 'text' | 'number' | 'date' | 'boolean' | 'email' | 'phone';
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  enum?: string[];
  normalize?: boolean; // Whether to apply normalization
  padZeros?: number; // Number of zeros to pad for ID fields
}

export interface NormalizedValue {
  originalValue: string;
  normalizedValue: string;
  warnings: string[];
}

/**
 * Normalize a value based on its field configuration
 * Handles Excel formatting issues like leading zeros and single quotes
 */
export function normalizeImportValue(
  value: string, 
  config: ImportFieldConfig
): NormalizedValue {
  const warnings: string[] = [];
  let normalizedValue = value.trim();

  // Handle empty values
  if (!normalizedValue) {
    return {
      originalValue: value,
      normalizedValue: '',
      warnings: []
    };
  }

  // Remove Excel's single quote prefix (forces text formatting)
  if (normalizedValue.startsWith("'")) {
    normalizedValue = normalizedValue.substring(1);
    warnings.push('تم إزالة علامة الاقتباس المفردة من بداية القيمة (تنسيق Excel)');
  }

  // Handle ID fields specifically
  if (config.type === 'id') {
    normalizedValue = normalizeIdField(normalizedValue, config, warnings);
  }

  // Handle number fields
  if (config.type === 'number') {
    normalizedValue = normalizeNumberField(normalizedValue, warnings);
  }

  // Handle date fields
  if (config.type === 'date') {
    normalizedValue = normalizeDateField(normalizedValue, warnings);
  }

  // Handle boolean fields
  if (config.type === 'boolean') {
    normalizedValue = normalizeBooleanField(normalizedValue, warnings);
  }

  // Handle email fields
  if (config.type === 'email') {
    normalizedValue = normalizeEmailField(normalizedValue, warnings);
  }

  // Handle phone fields
  if (config.type === 'phone') {
    normalizedValue = normalizePhoneField(normalizedValue, warnings);
  }

  return {
    originalValue: value,
    normalizedValue,
    warnings
  };
}

/**
 * Normalize ID fields (companyId, contractId, branchId, etc.)
 * Handles leading zeros and Excel formatting issues
 */
function normalizeIdField(
  value: string, 
  config: ImportFieldConfig, 
  warnings: string[]
): string {
  let normalized = value;

  // Remove any non-alphanumeric characters except hyphens and underscores
  normalized = normalized.replace(/[^A-Za-z0-9\-_]/g, '');

  // If padZeros is specified, pad with leading zeros
  if (config.padZeros && config.padZeros > 0) {
    const numericPart = normalized.replace(/[^0-9]/g, '');
    if (numericPart) {
      const paddedNumeric = numericPart.padStart(config.padZeros, '0');
      const nonNumericPart = normalized.replace(/[0-9]/g, '');
      normalized = nonNumericPart + paddedNumeric;
      warnings.push(`تم إضافة الأصفار في البداية لتصبح ${config.padZeros} أرقام`);
    }
  }

  // Convert to uppercase for consistency
  normalized = normalized.toUpperCase();

  return normalized;
}

/**
 * Normalize number fields
 */
function normalizeNumberField(value: string, warnings: string[]): string {
  // Remove any non-numeric characters except decimal point and minus
  let normalized = value.replace(/[^0-9.\-]/g, '');

  // Handle Excel's number formatting (e.g., "1,234.56" -> "1234.56")
  normalized = normalized.replace(/,/g, '');

  // Ensure only one decimal point
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
    warnings.push('تم إزالة النقاط العشرية الزائدة');
  }

  return normalized;
}

/**
 * Normalize date fields
 */
function normalizeDateField(value: string, warnings: string[]): string {
  // Handle various date formats
  const dateFormats = [
    // DD-MMM-YYYY (e.g., 01-Jan-2024)
    /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/,
    // DD/MM/YYYY (e.g., 01/01/2024)
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
    // YYYY-MM-DD (e.g., 2024-01-01)
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD.MM.YYYY (e.g., 01.01.2024)
    /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/
  ];

  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  for (const format of dateFormats) {
    const match = value.match(format);
    if (match) {
      let day, month, year;

      if (format.source.includes('[A-Za-z]{3}')) {
        // DD-MMM-YYYY format
        day = match[1].padStart(2, '0');
        month = monthNames[match[2].toLowerCase() as keyof typeof monthNames] || '01';
        year = match[3].length === 2 ? '20' + match[3] : match[3];
      } else if (format.source.includes('\\d{4}') && format.source.includes('\\d{1,2}')) {
        // YYYY-MM-DD format
        year = match[1];
        month = match[2].padStart(2, '0');
        day = match[3].padStart(2, '0');
      } else {
        // DD/MM/YYYY or DD.MM.YYYY format
        day = match[1].padStart(2, '0');
        month = match[2].padStart(2, '0');
        year = match[3].length === 2 ? '20' + match[3] : match[3];
      }

      return `${day}-${month}-${year}`;
    }
  }

  // If no format matches, return as is
  warnings.push('تنسيق التاريخ غير معروف، سيتم الاحتفاظ بالقيمة الأصلية');
  return value;
}

/**
 * Normalize boolean fields
 */
function normalizeBooleanField(value: string, warnings: string[]): string {
  const trueValues = ['نعم', 'yes', 'true', '1', 'صح', 'صحيح', 'y'];
  const falseValues = ['لا', 'no', 'false', '0', 'خطأ', 'خطأ', 'n'];

  const lowerValue = value.toLowerCase();
  
  if (trueValues.includes(lowerValue)) {
    return 'نعم';
  } else if (falseValues.includes(lowerValue)) {
    return 'لا';
  } else {
    warnings.push('قيمة غير معروفة للحقل المنطقي، سيتم الاحتفاظ بالقيمة الأصلية');
    return value;
  }
}

/**
 * Normalize email fields
 */
function normalizeEmailField(value: string, warnings: string[]): string {
  const normalized = value.toLowerCase().trim();
  
  // Basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalized)) {
    warnings.push('تنسيق البريد الإلكتروني غير صحيح');
  }

  return normalized;
}

/**
 * Normalize phone fields
 */
function normalizePhoneField(value: string, warnings: string[]): string {
  // Remove all non-numeric characters except +, -, (, ), and space
  let normalized = value.replace(/[^\d\s\-\+\(\)]/g, '');

  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Validate phone number length
  const digitsOnly = normalized.replace(/[^\d]/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    warnings.push('رقم الهاتف يجب أن يكون بين 7 و 15 رقم');
  }

  return normalized;
}

/**
 * Validate a normalized value against its configuration
 */
export function validateNormalizedValue(
  normalizedValue: string,
  config: ImportFieldConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required field validation
  if (config.required && (!normalizedValue || normalizedValue.trim() === '')) {
    errors.push(`الحقل "${config.fieldName}" مطلوب`);
    return { isValid: false, errors };
  }

  // Skip validation for empty optional fields
  if (!normalizedValue || normalizedValue.trim() === '') {
    return { isValid: true, errors: [] };
  }

  // Max length validation
  if (config.maxLength && normalizedValue.length > config.maxLength) {
    errors.push(`الحقل "${config.fieldName}" يجب أن يكون أقل من ${config.maxLength} حرف`);
  }

  // Pattern validation
  if (config.pattern && !config.pattern.test(normalizedValue)) {
    errors.push(`الحقل "${config.fieldName}" لا يتطابق مع التنسيق المطلوب`);
  }

  // Enum validation
  if (config.enum && !config.enum.includes(normalizedValue)) {
    errors.push(`الحقل "${config.fieldName}" يجب أن يكون واحداً من: ${config.enum.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate business logic rules for specific entity types
 */
export function validateBusinessLogic(
  normalizedData: Record<string, string>,
  entityType: string
): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  // Business logic for contractsAdvanced
  if (entityType === 'contractsAdvanced') {
    const contractEndDate = normalizedData.contractEndDate;
    const contractPeriodMonths = normalizedData.contractPeriodMonths;
    
    // Either contractEndDate OR contractPeriodMonths must be provided
    if ((!contractEndDate || contractEndDate.trim() === '') && 
        (!contractPeriodMonths || contractPeriodMonths.trim() === '')) {
      errors.contractEndDate = ['تاريخ انتهاء العقد أو مدة العقد: أحدهما مطلوب'];
      errors.contractPeriodMonths = ['تاريخ انتهاء العقد أو مدة العقد: أحدهما مطلوب'];
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Process a complete row of data with normalization
 */
export function processImportRow(
  rowData: Record<string, string>,
  fieldConfigs: ImportFieldConfig[],
  entityType?: string
): {
  originalData: Record<string, string>;
  normalizedData: Record<string, string>;
  warnings: Record<string, string[]>;
  errors: Record<string, string[]>;
  isValid: boolean;
} {
  const originalData = { ...rowData };
  const normalizedData: Record<string, string> = {};
  const warnings: Record<string, string[]> = {};
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const config of fieldConfigs) {
    const value = rowData[config.fieldName] || '';
    
    // Normalize the value
    const normalized = normalizeImportValue(value, config);
    normalizedData[config.fieldName] = normalized.normalizedValue;
    
    // Store warnings
    if (normalized.warnings.length > 0) {
      warnings[config.fieldName] = normalized.warnings;
    }

    // Validate the normalized value
    const validation = validateNormalizedValue(normalized.normalizedValue, config);
    if (!validation.isValid) {
      errors[config.fieldName] = validation.errors;
      isValid = false;
    }
  }

  // Apply business logic validation
  if (entityType) {
    const businessValidation = validateBusinessLogic(normalizedData, entityType);
    if (!businessValidation.isValid) {
      // Merge business logic errors
      Object.entries(businessValidation.errors).forEach(([field, fieldErrors]) => {
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(...fieldErrors);
      });
      isValid = false;
    }
  }

  return {
    originalData,
    normalizedData,
    warnings,
    errors,
    isValid
  };
}

/**
 * Field configurations for different entity types
 */
export const ENTITY_FIELD_CONFIGS: Record<string, ImportFieldConfig[]> = {
  companies: [
    { fieldName: 'companyName', type: 'text', required: true, maxLength: 100 },
    { fieldName: 'email', type: 'email', required: false },
    { fieldName: 'phone', type: 'phone', required: true },
    { fieldName: 'address', type: 'text', required: true, maxLength: 200 },
    { fieldName: 'city', type: 'text', required: true },
    { fieldName: 'contactPerson', type: 'text', required: false, maxLength: 100 },
    { fieldName: 'notes', type: 'text', required: false, maxLength: 500 }
  ],
  contracts: [
    { fieldName: 'companyId', type: 'id', required: true, padZeros: 4, normalize: true },
    { fieldName: 'contractStartDate', type: 'date', required: true },
    { fieldName: 'contractEndDate', type: 'date', required: true },
    { fieldName: 'regularVisitsPerYear', type: 'number', required: true },
    { fieldName: 'emergencyVisitsPerYear', type: 'number', required: true },
    { fieldName: 'contractValue', type: 'number', required: false },
    { fieldName: 'fireExtinguisherMaintenance', type: 'boolean', required: true },
    { fieldName: 'alarmSystemMaintenance', type: 'boolean', required: true },
    { fieldName: 'fireSuppressionMaintenance', type: 'boolean', required: true },
    { fieldName: 'gasFireSuppression', type: 'boolean', required: true },
    { fieldName: 'foamFireSuppression', type: 'boolean', required: true },
    { fieldName: 'notes', type: 'text', required: false, maxLength: 500 }
  ],
  contractsAdvanced: [
    { fieldName: 'companyId', type: 'id', required: true, padZeros: 4, normalize: true },
    { fieldName: 'contractStartDate', type: 'date', required: true },
    { fieldName: 'contractEndDate', type: 'date', required: false }, // Either endDate OR periodMonths
    { fieldName: 'contractPeriodMonths', type: 'number', required: false }, // Either endDate OR periodMonths
    { fieldName: 'contractValue', type: 'number', required: false },
    { fieldName: 'branchIds', type: 'text', required: true },
    { fieldName: 'fireExtinguisherMaintenance', type: 'boolean', required: true },
    { fieldName: 'alarmSystemMaintenance', type: 'boolean', required: true },
    { fieldName: 'fireSuppressionMaintenance', type: 'boolean', required: true },
    { fieldName: 'gasFireSuppression', type: 'boolean', required: true },
    { fieldName: 'foamFireSuppression', type: 'boolean', required: true },
    { fieldName: 'notes', type: 'text', required: false, maxLength: 500 }
  ],
  branches: [
    { fieldName: 'companyId', type: 'id', required: true, padZeros: 4, normalize: true },
    { fieldName: 'branchName', type: 'text', required: true, maxLength: 100 },
    { fieldName: 'address', type: 'text', required: true, maxLength: 200 },
    { fieldName: 'city', type: 'text', required: true },
    { fieldName: 'contactPerson', type: 'text', required: false, maxLength: 100 },
    { fieldName: 'phone', type: 'phone', required: false },
    { fieldName: 'email', type: 'email', required: false },
    { fieldName: 'notes', type: 'text', required: false, maxLength: 500 }
  ]
};

/**
 * Get field configuration for a specific entity type
 */
export function getFieldConfig(entityType: string): ImportFieldConfig[] {
  return ENTITY_FIELD_CONFIGS[entityType] || [];
}

/**
 * Create a comprehensive import guide for users
 */
export function generateImportGuide(entityType: string): string {
  const configs = getFieldConfig(entityType);
  
  let guide = `# دليل استيراد ${entityType}\n\n`;
  guide += `## ملاحظات مهمة حول Excel:\n\n`;
  guide += `1. **معرفات الأرقام**: إذا بدأ المعرف بصفر (مثل 0017)، قد يحذف Excel الأصفار أو يضيف علامة اقتباس مفردة ('0017).\n`;
  guide += `2. **التواريخ**: تأكد من تنسيق التواريخ بشكل صحيح (DD-MMM-YYYY).\n`;
  guide += `3. **الأرقام**: تأكد من أن الأرقام لا تحتوي على فواصل أو رموز عملة.\n\n`;
  
  guide += `## الأعمدة المطلوبة:\n\n`;
  
  configs.forEach(config => {
    const required = config.required ? ' *' : '';
    const type = config.type === 'id' ? 'معرف' : 
                 config.type === 'date' ? 'تاريخ' :
                 config.type === 'number' ? 'رقم' :
                 config.type === 'boolean' ? 'نعم/لا' :
                 config.type === 'email' ? 'بريد إلكتروني' :
                 config.type === 'phone' ? 'هاتف' : 'نص';
    
    guide += `- **${config.fieldName}${required}**: ${type}`;
    if (config.maxLength) {
      guide += ` (أقل من ${config.maxLength} حرف)`;
    }
    if (config.padZeros) {
      guide += ` (سيتم إضافة أصفار في البداية لتصبح ${config.padZeros} أرقام)`;
    }
    guide += '\n';
  });
  
  return guide;
} 