import { IssueCategory, IssuePriority } from '@/types/issues';

// Arabic form labels and placeholders
export const ARABIC_LABELS = {
  // Form sections
  basicInfo: 'المعلومات الأساسية',
  descriptionSection: 'وصف المشكلة',
  categorization: 'تصنيف المشكلة',
  attachmentsSection: 'المرفقات',
  environment: 'معلومات البيئة',
  
  // Fields
  title: 'عنوان المشكلة',
  titlePlaceholder: 'اكتب عنواناً مختصراً وواضحاً للمشكلة',
  description: 'وصف تفصيلي',
  descriptionPlaceholder: 'اشرح المشكلة بالتفصيل مع خطوات التكرار',
  category: 'نوع المشكلة',
  priority: 'الأولوية',
  tags: 'العلامات',
  tagsPlaceholder: 'أضف علامات لتصنيف المشكلة (اختياري)',
  attachments: 'المرفقات',
  attachmentsPlaceholder: 'اسحب الملفات هنا أو انقر للاختيار',
  
  // Categories
  categories: {
    bug: 'خطأ في النظام',
    feature: 'طلب ميزة جديدة',
    enhancement: 'تحسين ميزة موجودة',
    documentation: 'مشكلة في التوثيق',
    other: 'أخرى'
  },
  
  // Priorities
  priorities: {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    critical: 'حرجة'
  },
  
  // Buttons
  submit: 'إرسال المشكلة',
  cancel: 'إلغاء',
  saveDraft: 'حفظ كمسودة',
  addAttachment: 'إضافة مرفق',
  removeAttachment: 'إزالة المرفق',
  
  // Messages
  submitting: 'جاري إرسال المشكلة...',
  success: 'تم إرسال المشكلة بنجاح',
  error: 'حدث خطأ أثناء إرسال المشكلة',
  fileTooLarge: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)',
  invalidFileType: 'نوع الملف غير مدعوم',
  maxAttachments: 'يمكن إرفاق 5 ملفات كحد أقصى'
};

// Pre-filled description template in Arabic
export const DESCRIPTION_TEMPLATE = `**المشكلة**: [وصف مختصر للمشكلة]

**الصفحة**: [رابط الصفحة أو مسار التنقل]

**خطوات التكرار**:
1. [الخطوة الأولى]
2. [الخطوة الثانية]
3. [الخطوة الثالثة]

**النتيجة المتوقعة**: [ما يجب أن يحدث]

**النتيجة الفعلية**: [ما يحدث فعلاً]

**معلومات إضافية**: [أي معلومات ذات صلة]

**بيئة التشغيل**: [المتصفح، نظام التشغيل، الجهاز]`;

// Status labels
export const STATUS_LABELS = {
  open: 'مفتوحة',
  'in-progress': 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلقة'
};

// Priority colors
export const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

// Category icons
export const CATEGORY_ICONS = {
  bug: '🐛',
  feature: '✨',
  enhancement: '🚀',
  documentation: '📚',
  other: '📋'
};

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  maxFiles: 5,
  maxSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}; 