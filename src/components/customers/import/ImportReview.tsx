'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, FileText, Download, Upload, MapPin } from 'lucide-react';
import { standardizeDate } from '@/lib/date-handler';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { 
  normalizeImportValue, 
  validateNormalizedValue, 
  processImportRow, 
  getFieldConfig,
  generateImportGuide,
  ImportFieldConfig 
} from '@/lib/import-utils';
import { validateSaudiCity, addSaudiCity } from '@/lib/id-generator';
import { CityManagementModal } from './CityManagementModal';

interface ImportReviewProps {
  file: File;
  entityType: 'companies' | 'contracts' | 'contractsAdvanced' | 'branches';
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

// Enhanced Saudi Arabia cities database with both Arabic and English names
const SAUDI_CITIES = [
  // Major Cities (Arabic and English)
  'الرياض', 'Riyadh',
  'جدة', 'Jeddah', 'Jidda',
  'مكة المكرمة', 'Mecca', 'Makkah',
  'المدينة المنورة', 'Medina', 'Madinah',
  'الدمام', 'Dammam',
  'الخبر', 'Khobar', 'Al-Khobar',
  'الظهران', 'Dhahran',
  'الطائف', 'Taif', 'At-Taif',
  'بريدة', 'Buraydah',
  'تبوك', 'Tabuk',
  'خميس مشيط', 'Khamis Mushait',
  'حائل', 'Hail', 'Ha\'il',
  'نجران', 'Najran',
  'الجبيل', 'Jubail', 'Al-Jubail',
  'ينبع', 'Yanbu', 'Yenbo',
  'أبها', 'Abha',
  'عرعر', 'Arar',
  'سكاكا', 'Sakaka',
  'جيزان', 'Jazan', 'Gizan',
  'القطيف', 'Qatif', 'Al-Qatif',
  'الأحساء', 'Al-Ahsa', 'Hofuf',
  'الباحة', 'Al-Baha',
  'القريات', 'Qurayyat',
  'الخرج', 'Al-Kharj',
  'القصيم', 'Qassim', 'Al-Qassim',
  'الهفوف', 'Hofuf', 'Al-Hofuf',
  // Additional cities (keeping existing Arabic names)
  'المجمعة', 'رفحاء', 'الزلفي', 'وادي الدواسر',
  'الافلاج', 'صبيا', 'محايل عسير', 'القنفذة', 'الليث', 'رابغ', 'الحوية',
  'تيماء', 'العلا', 'بدر', 'المهد', 'خيبر', 'العيص', 'املج', 'الوجه',
  'ضباء', 'حقل', 'البدع', 'الطوال', 'بيشة', 'النماص', 'تنومة', 'ظهران الجنوب',
  'سراة عبيدة', 'المندق', 'العقيق', 'قلوة', 'المخواة', 'بلجرشي',
  'العارضة', 'فرسان', 'ابو عريش', 'صامطة', 'احد رفيدة', 'الداير',
  'هروب', 'فيفا', 'العيدابي', 'الحرث', 'بيش', 'تربة', 'رنية', 'الخرمة', 
  'الموية', 'ميسان', 'أضم', 'الكامل'
];

// City management state
interface CitySuggestion {
  originalCity: string;
  suggestedCity: string;
  rowNumber: number;
  fieldName: string;
}

interface CityManagementModal {
  isOpen: boolean;
  suggestions: CitySuggestion[];
  onConfirm: (suggestions: CitySuggestion[]) => void;
  onCancel: () => void;
}

// Enhanced Column mapping for different languages and variations with better Arabic support
const COLUMN_MAPPINGS = {
  companies: {
    companyName: ['companyName', 'company_name', 'اسم الشركة*', 'اسم الشركة', 'Company Name', 'الشركة', 'اسم', 'شركة', 'الاسم'],
    email: ['email', 'Email', 'البريد الإلكتروني', 'البريد', 'company_email', 'ايميل', 'بريد'],
    phone: ['phone', 'Phone', 'رقم الهاتف*', 'رقم الهاتف', 'الهاتف', 'phone_number', 'هاتف', 'رقم', 'جوال', 'موبايل'],
    address: ['address', 'Address', 'العنوان*', 'العنوان', 'company_address', 'عنوان', 'موقع'],
    city: ['city', 'City', 'المدينة*', 'المدينة', 'company_city', 'مدينة'],
    contactPerson: ['contactPerson', 'contact_person', 'الشخص المسؤول', 'Contact Person', 'المسؤول', 'شخص مسؤول', 'مسؤول', 'جهة اتصال'],
    notes: ['notes', 'Notes', 'ملاحظات', 'Notes', 'التعليقات', 'تعليق', 'ملحوظات']
  },
  contracts: {
    companyId: ['companyId', 'company_id', 'معرف الشركة*', 'معرف الشركة', 'Company ID', 'معرف', 'رقم الشركة', 'id'],
    contractStartDate: ['contractStartDate', 'contract_start_date', 'تاريخ بداية العقد*', 'تاريخ البداية', 'Start Date', 'بداية العقد', 'تاريخ بدء'],
    contractEndDate: ['contractEndDate', 'contract_end_date', 'تاريخ انتهاء العقد*', 'تاريخ الانتهاء', 'End Date', 'انتهاء العقد', 'تاريخ انتهاء'],
    regularVisitsPerYear: ['regularVisitsPerYear', 'regular_visits', 'عدد الزيارات العادية سنوياً*', 'الزيارات العادية', 'Regular Visits', 'زيارات عادية', 'زيارات'],
    emergencyVisitsPerYear: ['emergencyVisitsPerYear', 'emergency_visits', 'عدد الزيارات الطارئة سنوياً*', 'الزيارات الطارئة', 'Emergency Visits', 'زيارات طارئة', 'طوارئ'],
    contractValue: ['contractValue', 'contract_value', 'قيمة العقد', 'Contract Value', 'القيمة', 'قيمة', 'سعر'],
    fireExtinguisherMaintenance: ['fireExtinguisherMaintenance', 'fire_extinguisher', 'صيانة الطفايات*', 'صيانة الطفايات', 'Fire Extinguisher', 'طفايات', 'صيانة طفايات'],
    alarmSystemMaintenance: ['alarmSystemMaintenance', 'alarm_system', 'صيانة نظام الإنذار*', 'نظام الإنذار', 'Alarm System', 'إنذار', 'صيانة إنذار'],
    fireSuppressionMaintenance: ['fireSuppressionMaintenance', 'fire_suppression', 'صيانة نظام الإطفاء*', 'نظام الإطفاء', 'Fire Suppression', 'إطفاء', 'صيانة إطفاء'],
    gasFireSuppression: ['gasFireSuppression', 'gas_suppression', 'نظام الإطفاء بالغاز*', 'إطفاء الغاز', 'Gas Suppression', 'غاز', 'إطفاء غاز'],
    foamFireSuppression: ['foamFireSuppression', 'foam_suppression', 'نظام الإطفاء بالفوم*', 'إطفاء الفوم', 'Foam Suppression', 'فوم', 'إطفاء فوم'],
    notes: ['notes', 'Notes', 'ملاحظات', 'التعليقات', 'تعليق', 'ملحوظات']
  },
  contractsAdvanced: {
    companyId: ['companyId', 'company_id', 'معرف الشركة*', 'معرف الشركة', 'Company ID', 'معرف', 'رقم الشركة'],
    contractStartDate: ['contractStartDate', 'contract_start_date', 'تاريخ بداية العقد*', 'تاريخ البداية', 'Start Date', 'بداية العقد', 'تاريخ بدء'],
    contractEndDate: ['contractEndDate', 'contract_end_date', 'تاريخ انتهاء العقد*', 'تاريخ انتهاء العقد', 'تاريخ الانتهاء', 'End Date', 'انتهاء العقد', 'تاريخ انتهاء'],
    contractPeriodMonths: ['contractPeriodMonths', 'contract_period_months', 'مدة العقد بالشهور*', 'مدة العقد بالأشهر', 'مدة العقد', 'Contract Period', 'مدة العقد', 'مدة عقد'],
    contractValue: ['contractValue', 'contract_value', 'قيمة العقد', 'Contract Value', 'القيمة', 'قيمة', 'سعر'],
    branchIds: ['branchIds', 'branch_ids', 'معرفات الفروع*', 'معرفات الفروع', 'Branch IDs', 'فروع', 'معرفات فروع'],
    fireExtinguisherMaintenance: ['fireExtinguisherMaintenance', 'fire_extinguisher', 'صيانة الطفايات*', 'صيانة الطفايات', 'Fire Extinguisher', 'طفايات', 'صيانة طفايات'],
    alarmSystemMaintenance: ['alarmSystemMaintenance', 'alarm_system', 'صيانة نظام الإنذار*', 'صيانة نظام الإنذار', 'نظام الإنذار', 'Alarm System', 'إنذار', 'صيانة إنذار'],
    fireSuppressionMaintenance: ['fireSuppressionMaintenance', 'fire_suppression', 'صيانة نظام الإطفاء*', 'صيانة نظام الإطفاء', 'نظام الإطفاء', 'Fire Suppression', 'إطفاء', 'صيانة إطفاء'],
    gasFireSuppression: ['gasFireSuppression', 'gas_suppression', 'نظام الإطفاء بالغاز*', 'نظام الإطفاء بالغاز', 'إطفاء الغاز', 'Gas Suppression', 'غاز', 'إطفاء غاز'],
    foamFireSuppression: ['foamFireSuppression', 'foam_suppression', 'نظام الإطفاء بالفوم*', 'نظام الإطفاء بالفوم', 'إطفاء الفوم', 'Foam Suppression', 'فوم', 'إطفاء فوم'],
    regularVisitsPerYear: ['regularVisitsPerYear', 'regular_visits', 'عدد الزيارات العادية سنوياً*', 'عدد الزيارات العادية سنوياً', 'الزيارات العادية', 'Regular Visits', 'زيارات عادية', 'زيارات'],
    emergencyVisitsPerYear: ['emergencyVisitsPerYear', 'emergency_visits', 'عدد الزيارات الطارئة سنوياً*', 'عدد الزيارات الطارئة سنوياً', 'الزيارات الطارئة', 'Emergency Visits', 'زيارات طارئة', 'طوارئ'],
    emergencyVisitCost: ['emergencyVisitCost', 'emergency_visit_cost', 'تكلفة الزيارة الطارئة*', 'تكلفة الزيارة الطارئة', 'Emergency Visit Cost', 'تكلفة زيارة طارئة', 'تكلفة طوارئ'],
    batchNotes: ['batchNotes', 'batch_notes', 'ملاحظات الدفعة*', 'ملاحظات الدفعة', 'Batch Notes', 'ملاحظات الدفعة', 'ملاحظات دفعة'],
    contractNotes: ['contractNotes', 'contract_notes', 'ملاحظات العقد*', 'ملاحظات العقد', 'Contract Notes', 'ملاحظات العقد', 'ملاحظات عقد']
  },
  branches: {
    companyId: ['companyId', 'company_id', 'معرف الشركة***', 'معرف الشركة', 'Company ID', 'معرف', 'رقم الشركة'],
    companyName: ['companyName', 'company_name', 'اسم الشركة**', 'اسم الشركة', 'Company Name', 'الشركة', 'اسم', 'شركة', 'الاسم'],
    city: ['city', 'City', 'المدينة*', 'المدينة', 'مدينة'],
    location: ['location', 'Location', 'الموقع*', 'الموقع', 'موقع', 'منطقة'],
    branchName: ['branchName', 'branch_name', 'اسم الفرع*', 'اسم الفرع', 'Branch Name', 'فرع', 'اسم فرع'],
    address: ['address', 'Address', 'العنوان التفصيلي', 'العنوان', 'branch_address', 'عنوان', 'عنوان تفصيلي'],
    contactPerson: ['contactPerson', 'contact_person', 'الشخص المسؤول', 'Contact Person', 'المسؤول', 'مسؤول', 'جهة اتصال'],
    contactPhone: ['contactPhone', 'contact_phone', 'هاتف التواصل', 'رقم التواصل', 'Contact Phone', 'هاتف', 'رقم هاتف', 'جوال'],
    teamMember: ['teamMember', 'team_member', 'فريق العمل المختص', 'فريق العمل', 'Team Member', 'فريق', 'فريق عمل'],
    notes: ['notes', 'Notes', 'ملاحظات', 'التعليقات', 'تعليق', 'ملحوظات']
  }
};

// Enhanced helper function with better fuzzy matching for Arabic text
const mapHeaderToField = (header: string, entityType: 'companies' | 'contracts' | 'contractsAdvanced' | 'branches'): string | null => {
  const mappings = COLUMN_MAPPINGS[entityType];
  const cleanHeader = header.trim();

  // First try exact matching
  for (const [fieldName, variations] of Object.entries(mappings)) {
    if (variations.some(variation => 
      variation.toLowerCase() === cleanHeader.toLowerCase() ||
      variation === cleanHeader
    )) {
      return fieldName;
    }
  }

  // Then try partial matching with Arabic support
  for (const [fieldName, variations] of Object.entries(mappings)) {
    if (variations.some(variation => {
      const cleanVariation = variation.toLowerCase().replace(/\*/g, '');
      const cleanHeaderLower = cleanHeader.toLowerCase().replace(/\*/g, '');
      
      // Check if header contains the variation or vice versa
      return cleanHeaderLower.includes(cleanVariation) || 
             cleanVariation.includes(cleanHeaderLower) ||
             // Arabic-specific matching (remove diacritics and common prefixes)
             cleanHeaderLower.replace(/[أإآ]/g, 'ا').includes(cleanVariation.replace(/[أإآ]/g, 'ا'));
    })) {
      return fieldName;
    }
  }

  // Final fallback: check if any key Arabic words match
  const arabicKeywords = {
    phone: ['هاتف', 'جوال', 'موبايل', 'رقم'],
    address: ['عنوان', 'موقع', 'مكان'],
    city: ['مدينة', 'محافظة'],
    name: ['اسم', 'اسم'],
    email: ['ايميل', 'بريد', 'email']
  };

  for (const [fieldGroup, keywords] of Object.entries(arabicKeywords)) {
    if (keywords.some(keyword => cleanHeader.includes(keyword))) {
      // Map to specific field based on entity type
      if (fieldGroup === 'phone' && entityType === 'companies') return 'phone';
      if (fieldGroup === 'address' && entityType === 'companies') return 'address';
      if (fieldGroup === 'city') return 'city';
      if (fieldGroup === 'name' && entityType === 'companies') return 'companyName';
      if (fieldGroup === 'email' && entityType === 'companies') return 'email';
    }
  }

  return null;
};

// Helper function to safely get Arabic names from COLUMN_MAPPINGS
const getArabicNames = (entityType: string, fieldName: string): string[] => {
  try {
    const entityMappings = COLUMN_MAPPINGS[entityType as keyof typeof COLUMN_MAPPINGS];
    if (entityMappings && fieldName in entityMappings) {
      return entityMappings[fieldName as keyof typeof entityMappings] as string[];
    }
  } catch (error) {
    console.warn('Error accessing COLUMN_MAPPINGS:', error);
  }
  return [];
};

export function ImportReview({ file, entityType, onClose, onImportComplete }: ImportReviewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [showApprovedOnly, setShowApprovedOnly] = useState(false);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [activeFilter, setActiveFilter] = useState<{
    type: 'error' | 'warning' | null;
    field: string | null;
  }>({ type: null, field: null });
  const [skippedRowsCount, setSkippedRowsCount] = useState<number>(0);

  // City management state
  const [cityManagementModal, setCityManagementModal] = useState<CityManagementModal>({
    isOpen: false,
    suggestions: [],
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [availableCities, setAvailableCities] = useState<string[]>([...SAUDI_CITIES]);

  // Get data for validation
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();

  // Field validation configurations
  const validationConfigs = useMemo(() => ({
    companies: {
      required: ['companyName'],
      validations: {
        companyName: { maxLength: 100, pattern: /^.{1,100}$/ },
        email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        phone: { pattern: /^[\d\s\-\+\(\)]{7,15}$/ },
        address: { maxLength: 200 },
        city: { enum: availableCities },
        contactPerson: { maxLength: 100 },
        notes: { maxLength: 500 }
      }
    },
    contracts: {
      required: ['companyId', 'contractStartDate', 'contractEndDate', 'regularVisitsPerYear', 'emergencyVisitsPerYear'],
      validations: {
        companyId: { pattern: /^\d{4}$/ },
        contractStartDate: { pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
        contractEndDate: { pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
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
    contractsAdvanced: {
      required: ['companyId', 'contractStartDate', 'branchIds', 'fireExtinguisherMaintenance', 'alarmSystemMaintenance', 'fireSuppressionMaintenance'],
      validations: {
        companyId: { pattern: /^\d{4}$/ },
        contractStartDate: { pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
        contractEndDate: { pattern: /^\d{1,2}-[A-Za-z]{3}-\d{2,4}$/ },
        contractPeriodMonths: { min: 1, max: 120, type: 'number' },
        contractValue: { min: 0, type: 'number' },
        branchIds: { maxLength: 500 },
        fireExtinguisherMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        alarmSystemMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        fireSuppressionMaintenance: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        gasFireSuppression: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        foamFireSuppression: { enum: ['نعم', 'لا', 'yes', 'no', 'true', 'false'] },
        regularVisitsPerYear: { min: 0, max: 365, type: 'number' },
        emergencyVisitsPerYear: { min: 0, max: 365, type: 'number' },
        emergencyVisitCost: { min: 0, type: 'number' },
        batchNotes: { maxLength: 500 },
        contractNotes: { maxLength: 500 }
      }
    },
    branches: {
      required: ['companyId', 'branchName', 'location', 'city'],
      validations: {
        companyId: { pattern: /^\d{4}$/ },
        companyName: { maxLength: 100 },
        city: { enum: availableCities },
        location: { maxLength: 100 },
        branchName: { maxLength: 100 },
        contactPerson: { maxLength: 100 },
        contactPhone: { pattern: /^[\d\s\-\+\(\)]{7,15}$/ },
        teamMember: { maxLength: 100 },
        notes: { maxLength: 500 }
      }
    }
  }), []);

  const currentConfig = useMemo(() => validationConfigs[entityType], [validationConfigs, entityType]);

  // City management functions
  const findCitySuggestions = useCallback((cityName: string): string[] => {
    if (!cityName || cityName.trim() === '') return [];
    
    const normalizedCity = cityName.trim().toLowerCase();
    const suggestions: string[] = [];
    
    // Exact match
    const exactMatch = availableCities.find(city => 
      city.toLowerCase() === normalizedCity
    );
    if (exactMatch) return [exactMatch];
    
    // Partial matches
    availableCities.forEach(city => {
      if (city.toLowerCase().includes(normalizedCity) || 
          normalizedCity.includes(city.toLowerCase())) {
        suggestions.push(city);
      }
    });
    
    // Fuzzy matching for similar names
    if (suggestions.length === 0) {
      availableCities.forEach(city => {
        const similarity = calculateSimilarity(normalizedCity, city.toLowerCase());
        if (similarity > 0.6) { // 60% similarity threshold
          suggestions.push(city);
        }
      });
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }, [availableCities]);

  const calculateSimilarity = useCallback((str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }, []);

  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }, []);

              const handleCityValidation = useCallback((cityName: string, rowNumber: number, fieldName: string): ValidationError[] => {
              const errors: ValidationError[] = [];
              
              if (!cityName || cityName.trim() === '') return errors;
              
              const cityValidation = validateSaudiCity(cityName);
              
              if (!cityValidation.isValid) {
                const suggestionText = cityValidation.suggestions && cityValidation.suggestions.length > 0 
                  ? `اقتراحات: ${cityValidation.suggestions.join(', ')}`
                  : 'يمكن إضافة المدينة الجديدة في صفحة المراجعة';
                
                errors.push({
                  row: rowNumber,
                  field: fieldName,
                  value: cityName,
                  error: `مدينة غير معترف بها: ${cityName}`,
                  suggestion: suggestionText,
                  severity: 'error'
                });
              }
              
              return errors;
            }, []);

  const openCityManagementModal = useCallback((suggestions: CitySuggestion[]) => {
    setCityManagementModal({
      isOpen: true,
      suggestions,
      onConfirm: (updatedSuggestions) => {
        // Update the available cities with new cities
        const newCities = updatedSuggestions
          .map(s => s.suggestedCity)
          .filter(city => !availableCities.includes(city));
        
        if (newCities.length > 0) {
          setAvailableCities(prev => [...prev, ...newCities]);
        }
        
        // Update the import rows with corrected city names
        setImportRows(prev => prev.map(row => {
          const updatedRow = { ...row };
          updatedSuggestions.forEach(suggestion => {
            if (suggestion.rowNumber === row.rowNumber && 
                suggestion.fieldName in updatedRow.data) {
              updatedRow.data[suggestion.fieldName] = suggestion.suggestedCity;
            }
          });
          return updatedRow;
        }));
        
        setCityManagementModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setCityManagementModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [availableCities]);

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
      
      // Only add the row if it has at least one non-empty cell
      if (row.some(cell => cell && cell.trim().length > 0)) {
      result.push(row);
      } else {
        console.log(`🚫 Skipping completely empty row during CSV parsing`);
      }
    }

    return result;
  };

  // Get field configurations for normalization
  const fieldConfigs = useMemo(() => getFieldConfig(entityType), [entityType]);

  // Validate individual field with normalization
  const validateField = useCallback((fieldName: string, value: string, rowNumber: number, rowData: Record<string, string>): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Find field configuration
    const fieldConfig = fieldConfigs.find(config => config.fieldName === fieldName);
    if (!fieldConfig) return errors;

    // Normalize the value
    const normalized = normalizeImportValue(value, fieldConfig);
    
    // Validate the normalized value
    const validation = validateNormalizedValue(normalized.normalizedValue, fieldConfig);
    
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

    // Business logic validation for companies
    if (entityType === 'companies') {
      if (fieldName === 'companyName') {
        const existingCompany = companies.find(c => 
          c.companyName.toLowerCase() === normalized.normalizedValue.toLowerCase()
        );
        if (existingCompany) {
        errors.push({
          row: rowNumber,
          field: fieldName,
            value: normalized.originalValue,
            error: 'اسم الشركة موجود مسبقاً في النظام',
            suggestion: 'استخدم اسم مختلف أو تحقق من الشركة الموجودة',
            severity: 'warning'
        });
        }
      }
    }

    // Business logic validation for contracts with enhanced companyId lookup
    if (entityType === 'contracts' || entityType === 'contractsAdvanced') {
      if (fieldName === 'companyId') {
        // Try multiple approaches to find the company
        let company = null;
        const searchValues = [
          normalized.normalizedValue, // Normalized value
          value, // Original value
          value.replace(/[^0-9]/g, '').padStart(4, '0'), // Padded numeric value
          value.replace(/^'/, ''), // Remove leading quote
          value.replace(/^'/, '').padStart(4, '0') // Remove quote and pad
        ];

        for (const searchValue of searchValues) {
          company = companies.find(c => c.companyId === searchValue);
          if (company) break;
        }

        if (!company) {
          const triedValues = searchValues.filter(v => v !== value).join(', ');
      errors.push({
        row: rowNumber,
        field: fieldName,
            value: normalized.originalValue,
            error: 'معرف الشركة غير موجود في النظام',
            suggestion: `تأكد من إضافة الشركة أولاً في إدارة العملاء. القيم المحاولة: ${triedValues}`,
            severity: 'error'
      });
        }
      }
    }

    // Business logic validation for branches with enhanced company lookup
    if (entityType === 'branches') {
      if (fieldName === 'companyId' || fieldName === 'companyName') {
        const companyId = rowData.companyId;
        const companyName = rowData.companyName;
        
        // If both are empty, that's an error
        if ((!companyId || companyId.trim() === '') && (!companyName || companyName.trim() === '')) {
          errors.push({
            row: rowNumber,
            field: fieldName,
            value: normalized.originalValue,
            error: 'يجب إدخال معرف الشركة أو اسم الشركة',
            suggestion: 'أدخل معرف الشركة (مثال: 0001) أو اسم الشركة',
            severity: 'error'
          });
        } else {
          // Enhanced company lookup
          let companyFound = false;
          
          if (companyId && companyId.trim() !== '') {
            // Try multiple approaches to find company by ID
            const searchValues = [
              companyId.trim(),
              companyId.trim().padStart(4, '0'),
              companyId.trim().replace(/^'/, ''),
              companyId.trim().replace(/^'/, '').padStart(4, '0')
            ];

            let companyById = null;
            for (const searchValue of searchValues) {
              companyById = companies.find(c => c.companyId === searchValue);
              if (companyById) break;
            }

            if (companyById) {
              // If companyName is also provided, check if it matches
              if (companyName && companyName.trim() !== '') {
                if (companyById.companyName.toLowerCase() === companyName.trim().toLowerCase()) {
                  companyFound = true;
                } else {
          errors.push({
            row: rowNumber,
            field: fieldName,
                    value: normalized.originalValue,
                    error: 'اسم الشركة لا يتطابق مع معرف الشركة',
                    suggestion: `اسم الشركة يجب أن يكون: ${companyById.companyName}`,
            severity: 'error'
          });
                }
              } else {
                companyFound = true;
              }
        } else {
          errors.push({
            row: rowNumber,
            field: fieldName,
                value: normalized.originalValue,
                error: 'معرف الشركة غير موجود في النظام',
                suggestion: 'تأكد من إضافة الشركة أولاً أو استخدم اسم الشركة',
            severity: 'error'
          });
        }
          } else if (companyName && companyName.trim() !== '') {
            const companyByName = companies.find(c => 
              c.companyName.toLowerCase() === companyName.trim().toLowerCase()
            );
            if (companyByName) {
              companyFound = true;
            } else {
      errors.push({
        row: rowNumber,
        field: fieldName,
                value: normalized.originalValue,
                error: 'اسم الشركة غير موجود في النظام',
                suggestion: 'تأكد من إضافة الشركة أولاً أو استخدم معرف الشركة',
        severity: 'error'
      });
            }
          }
        }
      }
    }

    // Business logic validation for contractsAdvanced
    if (entityType === 'contractsAdvanced') {
      // Check if either contractEndDate OR contractPeriodMonths is provided
      if (fieldName === 'contractEndDate' || fieldName === 'contractPeriodMonths') {
        const contractEndDate = rowData.contractEndDate;
        const contractPeriodMonths = rowData.contractPeriodMonths;
        
        // If both are empty, add error to both fields
        if ((!contractEndDate || contractEndDate.trim() === '') && 
            (!contractPeriodMonths || contractPeriodMonths.trim() === '')) {
      errors.push({
        row: rowNumber,
        field: fieldName,
            value: normalized.originalValue,
            error: 'تاريخ انتهاء العقد أو مدة العقد: أحدهما مطلوب',
            suggestion: 'أدخل إما تاريخ انتهاء العقد أو مدة العقد بالشهور',
        severity: 'error'
      });
        }
      }
    }

    // Enhanced city validation with suggestions
    if (fieldName === 'city' && value && value.trim() !== '') {
      console.log(`🔍 Validating city: "${value}"`);
      const cityErrors = handleCityValidation(value, rowNumber, fieldName);
      console.log(`🔍 City validation result:`, cityErrors);
      errors.push(...cityErrors);
    }

    return errors;
  }, [companies, contracts, branches, entityType, fieldConfigs, handleCityValidation]);

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

      // Debug: Log the actual headers from the CSV file
      console.log('📋 CSV Headers Found:', headers);
      console.log('📋 Entity Type:', entityType);

      // Map headers to standard field names
      const headerMapping: Record<string, string> = {};
      const mappedFields: Set<string> = new Set();

      headers.forEach(header => {
        const mappedField = mapHeaderToField(header, entityType);
        console.log(`📋 Mapping "${header}" -> "${mappedField}"`);
        if (mappedField) {
          headerMapping[header] = mappedField;
          mappedFields.add(mappedField);
        }
      });

      console.log('📋 Header Mapping Result:', headerMapping);
      console.log('📋 Mapped Fields Found:', Array.from(mappedFields));
      console.log('📋 Required Fields:', currentConfig.required);

      // Validate headers with enhanced mapping support
      const missingHeaders: string[] = [];
      const extraHeaders: string[] = [];

      // Check for missing required headers using mapped fields
      currentConfig.required.forEach((requiredField: string) => {
        if (!mappedFields.has(requiredField)) {
          // Find the Arabic name for better error messages
          const arabicNames = getArabicNames(entityType, requiredField);
          const arabicName = arabicNames?.find(name => name.includes('*')) || arabicNames?.[0] || requiredField;
          missingHeaders.push(arabicName);
        }
      });

      // Check for unknown headers
      headers.forEach(header => {
        if (header && !mapHeaderToField(header, entityType)) {
          extraHeaders.push(header);
        }
      });

      // If there are critical header issues, provide helpful error message with suggestions
      if (missingHeaders.length > 0) {
        const suggestions = currentConfig.required.map((requiredField: string) => {
          const arabicNames = getArabicNames(entityType, requiredField);
          const suggestionList = arabicNames?.slice(0, 3).join(' أو ') || requiredField;
          return `• ${requiredField}: ${suggestionList}`;
        }).join('\n');
        
        throw new Error(`أعمدة مطلوبة مفقودة: ${missingHeaders.join(', ')}.

أسماء الأعمدة المقبولة:
${suggestions}

تأكد من استخدام القالب الصحيح أو تحقق من أسماء الأعمدة.`);
      }

      console.log('📋 Import Header Validation:', {
        headers,
        missingHeaders,
        extraHeaders,
        expectedRequired: currentConfig.required,
        entityType
      });

      // Filter out completely empty rows before processing
      const nonEmptyDataRows = dataRows.filter((row, index) => {
        // Check if the row has at least one non-empty cell
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
        // Calculate the actual row number in the original CSV file
        const originalRowIndex = dataRows.indexOf(row);
        const rowNumber = originalRowIndex + 2; // +2 because we start from row 2 (after headers)
        
        const rowData: Record<string, string> = {};

        // Map row data to standard field names using the header mapping
        headers.forEach((header, headerIndex) => {
          const standardFieldName = headerMapping[header];
          if (standardFieldName) {
            rowData[standardFieldName] = row[headerIndex]?.trim() || '';
          }
        });

        // Validate each field with enhanced validation
        const allErrors: ValidationError[] = [];

        // Check for missing required fields first
        currentConfig.required.forEach((requiredField: string) => {
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

        // Validate all mapped fields that exist in the data
        Object.entries(rowData).forEach(([fieldName, value]) => {
          // All fields in rowData should now be standard field names
          if (fieldName in currentConfig.validations) {
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
    
    // Apply active filter
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
                
                {/* City Management Button */}
                {(() => {
                  const cityErrors = importRows.flatMap(row => 
                    row.errors.filter(error => error.field === 'city')
                  );
                  console.log(`🔍 City errors found:`, cityErrors);
                  if (cityErrors.length > 0) {
                    // Get unique unrecognized cities
                    const uniqueCities = [...new Set(cityErrors.map(error => error.value))];
                    console.log(`🔍 Unique cities with errors:`, uniqueCities);
                    
                    return (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Handle one city at a time
                          const firstCity = uniqueCities[0];
                          const cityValidation = validateSaudiCity(firstCity);
                          const citySuggestions: CitySuggestion[] = cityErrors
                            .filter(error => error.value === firstCity)
                            .map(error => ({
                              originalCity: error.value,
                              suggestedCity: cityValidation.suggestions?.[0] || '', // Empty if no suggestions
                              rowNumber: error.row,
                              fieldName: error.field
                            }));
                          
                          openCityManagementModal(citySuggestions);
                        }}
                        className="gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        إدارة المدن ({uniqueCities.length})
                      </Button>
                    );
                  }
                  return null;
                })()}
                
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

      {/* City Management Modal */}
      <CityManagementModal
        isOpen={cityManagementModal.isOpen}
        unrecognizedCity={cityManagementModal.suggestions[0]?.originalCity || ''}
        suggestions={cityManagementModal.suggestions.map(s => s.suggestedCity)}
        onCityResolved={(originalCity, resolvedCity) => {
          // Update the import rows with corrected city names
          setImportRows(prev => prev.map(row => {
            const updatedRow = { ...row };
            cityManagementModal.suggestions.forEach(suggestion => {
              if (suggestion.originalCity === originalCity && 
                  suggestion.rowNumber === row.rowNumber && 
                  suggestion.fieldName in updatedRow.data) {
                updatedRow.data[suggestion.fieldName] = resolvedCity;
              }
            });
            return updatedRow;
          }));
          
          setCityManagementModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          setCityManagementModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
