# Basic Issue Tracker Implementation Plan
## Salama Maintenance System - Option 1 Implementation

### 📋 **Document Overview**
- **Feature**: Basic In-App Issue Tracker
- **Implementation**: Option 1 from Bug/Issue Reporting System Case Study
- **Complexity**: 🟢 **LOW** | **Risk**: 🟢 **LOW** | **Timeline**: 1-2 weeks
- **Date**: January 24, 2025
- **Status**: Implementation Planning
- **Document Type**: Technical Implementation Plan

---

## 🎯 **EXECUTIVE SUMMARY**

This document provides a comprehensive implementation plan for the Basic In-App Issue Tracker (Option 1) for the Salama Maintenance System. This implementation will provide immediate value to users while establishing a foundation for future enhancements.

### **Key Features**
- ✅ Simple issue submission form with Arabic interface
- ✅ File attachments (screenshots, documents)
- ✅ Basic issue categorization and priority levels
- ✅ Email notifications to administrators
- ✅ Status tracking and basic workflow
- ✅ Comment system for issue discussion
- ✅ Role-based access control
- ✅ Export functionality for Cursor development workflow

### **Success Criteria**
- Issue submission takes <30 seconds
- File attachments up to 10MB per issue
- Email notifications delivered within 5 minutes
- 99% uptime for issue tracking system
- User satisfaction >90%
- Export generation takes <10 seconds

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Database Schema Design**

#### **Firestore Collections**

```javascript
// Issues Collection
issues/ {
  [issueId]: {
    title: string;                    // Issue title in Arabic
    description: string;              // Detailed description in Arabic
    category: IssueCategory;          // Bug, Feature, Enhancement, Documentation
    priority: IssuePriority;          // Low, Medium, High, Critical
    status: IssueStatus;              // Open, In Progress, Resolved, Closed
    reportedBy: string;               // User UID
    reportedByName: string;           // User display name
    assignedTo?: string;              // Assigned user UID
    assignedByName?: string;          // Assigned user display name
    createdAt: Timestamp;             // Creation timestamp
    updatedAt: Timestamp;             // Last update timestamp
    resolvedAt?: Timestamp;           // Resolution timestamp
    closedAt?: Timestamp;             // Closure timestamp
    tags: string[];                   // Custom tags
    attachments: string[];            // Array of attachment IDs
    customFields: Record<string, any>; // Future extensibility
    environment: {                    // User environment info
      browser: string;
      os: string;
      device: string;
      url: string;
    };
  }
}

// Issue Comments Collection
issue_comments/ {
  [commentId]: {
    issueId: string;                  // Reference to issue
    authorId: string;                 // Comment author UID
    authorName: string;               // Comment author display name
    content: string;                  // Comment content in Arabic
    createdAt: Timestamp;             // Comment timestamp
    isInternal: boolean;              // Internal comment flag
    attachments: string[];            // Comment attachments
    editedAt?: Timestamp;             // Edit timestamp
    editedBy?: string;                // Editor UID
  }
}

// Issue Attachments Collection
issue_attachments/ {
  [attachmentId]: {
    issueId: string;                  // Reference to issue
    commentId?: string;               // Reference to comment (optional)
    fileName: string;                 // Original filename
    fileType: string;                 // MIME type
    fileSize: number;                 // File size in bytes
    uploadedBy: string;               // Uploader UID
    uploadedByName: string;           // Uploader display name
    uploadedAt: Timestamp;            // Upload timestamp
    storagePath: string;              // Firebase Storage path
    downloadUrl: string;              // Download URL
    thumbnailUrl?: string;            // Thumbnail URL (for images)
    isImage: boolean;                 // Image flag for preview
  }
}

// Issue Notifications Collection
issue_notifications/ {
  [notificationId]: {
    issueId: string;                  // Reference to issue
    userId: string;                   // Target user UID
    type: NotificationType;           // New Issue, Comment, Status Change, Assignment
    title: string;                    // Notification title in Arabic
    message: string;                  // Notification message in Arabic
    isRead: boolean;                  // Read status
    createdAt: Timestamp;             // Creation timestamp
    readAt?: Timestamp;               // Read timestamp
    actionUrl: string;                // Direct link to issue
  }
}

// Issue Exports Collection
issue_exports/ {
  [exportId]: {
    exportedBy: string;               // User UID who created export
    exportedByName: string;           // User display name
    exportType: ExportType;           // Single Issue, Multiple Issues, Report
    format: ExportFormat;             // JSON, CSV, Markdown, PDF
    filters: ExportFilters;           // Applied filters
    issues: string[];                 // Array of issue IDs
    fileUrl: string;                  // Download URL for export file
    fileSize: number;                 // File size in bytes
    createdAt: Timestamp;             // Export timestamp
    expiresAt: Timestamp;             // Expiry timestamp (7 days)
    status: ExportStatus;             // Processing, Completed, Failed
  }
}
```

#### **TypeScript Interfaces**

```typescript
// src/types/issues.ts

export type IssueCategory = 'bug' | 'feature' | 'enhancement' | 'documentation' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type NotificationType = 'new_issue' | 'comment' | 'status_change' | 'assignment' | 'resolution';
export type ExportType = 'single_issue' | 'multiple_issues' | 'report';
export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf';
export type ExportStatus = 'processing' | 'completed' | 'failed';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  reportedBy: string;
  reportedByName: string;
  assignedTo?: string;
  assignedByName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  tags: string[];
  attachments: string[];
  customFields: Record<string, any>;
  environment: {
    browser: string;
    os: string;
    device: string;
    url: string;
  };
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
  attachments: string[];
  editedAt?: string;
  editedBy?: string;
}

export interface IssueAttachment {
  id: string;
  issueId: string;
  commentId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  isImage: boolean;
}

export interface IssueNotification {
  id: string;
  issueId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl: string;
}

export interface IssueExport {
  id: string;
  exportedBy: string;
  exportedByName: string;
  exportType: ExportType;
  format: ExportFormat;
  filters: ExportFilters;
  issues: string[];
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  status: ExportStatus;
}

export interface ExportFilters {
  categories?: IssueCategory[];
  priorities?: IssuePriority[];
  statuses?: IssueStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  assignedTo?: string;
  reportedBy?: string;
  tags?: string[];
}

export interface IssueFormData {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  tags: string[];
  attachments: File[];
  customFields: Record<string, any>;
}
```

### **Firebase Security Rules**

```javascript
// firestore.rules - Add to existing rules

// Issues collection
match /issues/{issueId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    isAdmin() || 
    resource.data.reportedBy == request.auth.uid ||
    resource.data.assignedTo == request.auth.uid
  );
  allow delete: if isAdmin();
}

// Issue comments collection
match /issue_comments/{commentId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    isAdmin() || 
    resource.data.authorId == request.auth.uid
  );
  allow delete: if isAdmin();
}

// Issue attachments collection
match /issue_attachments/{attachmentId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && (
    isAdmin() || 
    resource.data.uploadedBy == request.auth.uid
  );
  allow delete: if isAdmin() || 
    resource.data.uploadedBy == request.auth.uid;
}

// Issue notifications collection
match /issue_notifications/{notificationId} {
  allow read: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && 
    resource.data.userId == request.auth.uid;
  allow delete: if isAdmin();
}

// Issue exports collection
match /issue_exports/{exportId} {
  allow read: if isAuthenticated() && 
    resource.data.exportedBy == request.auth.uid;
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && 
    resource.data.exportedBy == request.auth.uid;
  allow delete: if isAdmin() || 
    resource.data.exportedBy == request.auth.uid;
}
```

```javascript
// storage.rules - Add to existing rules

match /issue-attachments/{issueId}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    request.resource.size < 10 * 1024 * 1024 && // 10MB limit
    request.resource.contentType.matches('image/.*|application/pdf|text/.*|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
```

---

## 🎨 **USER INTERFACE DESIGN**

### **Arabic Issue Reporting Format**

Based on the existing `ISSUE_REPORTING_FORMAT.md`, we'll implement a structured Arabic interface:

#### **Issue Submission Form Structure**

```typescript
// Arabic form labels and placeholders
const ARABIC_LABELS = {
  // Form sections
  basicInfo: 'المعلومات الأساسية',
  description: 'وصف المشكلة',
  categorization: 'تصنيف المشكلة',
  attachments: 'المرفقات',
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
```

#### **Structured Description Template**

```typescript
// Pre-filled description template in Arabic
const DESCRIPTION_TEMPLATE = `**المشكلة**: [وصف مختصر للمشكلة]

**الصفحة**: [رابط الصفحة أو مسار التنقل]

**خطوات التكرار**:
1. [الخطوة الأولى]
2. [الخطوة الثانية]
3. [الخطوة الثالثة]

**النتيجة المتوقعة**: [ما يجب أن يحدث]

**النتيجة الفعلية**: [ما يحدث فعلاً]

**معلومات إضافية**: [أي معلومات ذات صلة]

**بيئة التشغيل**: [المتصفح، نظام التشغيل، الجهاز]`;
```

### **Component Architecture**

```typescript
// src/components/issues/
├── IssueForm.tsx              // Main issue submission form
├── IssueList.tsx              // Issue listing with filters
├── IssueDetail.tsx            // Issue detail view
├── IssueComment.tsx           // Comment component
├── IssueAttachment.tsx        // File attachment handling
├── IssueStatus.tsx            // Status management
├── IssueNotification.tsx      // Notification component
├── IssueReporting.tsx         // Basic reporting
├── IssueFilters.tsx           // Filtering and search
├── IssueExport.tsx            // Export functionality
├── ExportFormats.tsx          // Export format options
└── ExportHistory.tsx          // Export history and downloads
```

---

## 🔧 **IMPLEMENTATION PHASES**

### **Phase 1: Core Infrastructure (Days 1-3)**

#### **Day 1: Database Setup**
- [ ] Create Firestore collections schema
- [ ] Implement security rules
- [ ] Set up Firebase Storage rules
- [ ] Create TypeScript interfaces
- [ ] Test database connectivity

#### **Day 2: Basic Hooks**
- [ ] Create `useIssues.ts` hook for CRUD operations
- [ ] Create `useIssueComments.ts` hook
- [ ] Create `useIssueAttachments.ts` hook
- [ ] Create `useIssueNotifications.ts` hook
- [ ] Create `useIssueExports.ts` hook for export functionality
- [ ] Implement real-time updates

#### **Day 3: File Upload System**
- [ ] Implement Firebase Storage integration
- [ ] Create file upload utilities
- [ ] Add file validation (size, type)
- [ ] Implement image thumbnail generation
- [ ] Test file upload functionality

### **Phase 2: User Interface (Days 4-7)**

#### **Day 4: Issue Submission Form**
- [ ] Create `IssueForm.tsx` component
- [ ] Implement Arabic form labels
- [ ] Add form validation
- [ ] Integrate file upload
- [ ] Add environment detection

#### **Day 5: Issue Listing**
- [ ] Create `IssueList.tsx` component
- [ ] Implement filtering and search
- [ ] Add pagination
- [ ] Create issue cards
- [ ] Add sorting options

#### **Day 6: Issue Detail View**
- [ ] Create `IssueDetail.tsx` component
- [ ] Implement comment system
- [ ] Add status management
- [ ] Create attachment viewer
- [ ] Add edit functionality

#### **Day 7: Navigation Integration**
- [ ] Add issue tracker to main navigation
- [ ] Create issue dashboard
- [ ] Implement notification badges
- [ ] Add breadcrumb navigation
- [ ] Test user flow

### **Phase 3: Notifications & Polish (Days 8-10)**

#### **Day 8: Email Notifications**
- [ ] Integrate with existing EmailJS system
- [ ] Create email templates in Arabic
- [ ] Implement notification triggers
- [ ] Add notification preferences
- [ ] Test email delivery

#### **Day 9: In-App Notifications**
- [ ] Create notification component
- [ ] Implement real-time notifications
- [ ] Add notification center
- [ ] Create notification settings
- [ ] Test notification flow

#### **Day 10: Testing & Documentation**
- [ ] Comprehensive testing
- [ ] Bug fixes and refinements
- [ ] Create user documentation
- [ ] Performance optimization
- [ ] Final deployment

---

## 📝 **DETAILED COMPONENT IMPLEMENTATION**

### **IssueForm Component**

```typescript
// src/components/issues/IssueForm.tsx

import React, { useState } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { useIssueAttachments } from '@/hooks/useIssueAttachments';
import { IssueFormData, IssueCategory, IssuePriority } from '@/types/issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/common/FileUpload';
import { ARABIC_LABELS, DESCRIPTION_TEMPLATE } from '@/lib/constants/issues';

interface IssueFormProps {
  onSuccess?: (issueId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<IssueFormData>;
}

export function IssueForm({ onSuccess, onCancel, initialData }: IssueFormProps) {
  const { createIssue, loading } = useIssues();
  const { uploadAttachments } = useIssueAttachments();
  
  const [formData, setFormData] = useState<IssueFormData>({
    title: initialData?.title || '',
    description: initialData?.description || DESCRIPTION_TEMPLATE,
    category: initialData?.category || 'bug',
    priority: initialData?.priority || 'medium',
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || [],
    customFields: initialData?.customFields || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'عنوان المشكلة مطلوب';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف المشكلة مطلوب';
    }

    if (formData.attachments.length > 5) {
      newErrors.attachments = 'يمكن إرفاق 5 ملفات كحد أقصى';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Upload attachments first
      const attachmentIds: string[] = [];
      if (formData.attachments.length > 0) {
        const uploadResults = await uploadAttachments(formData.attachments);
        attachmentIds.push(...uploadResults.map(r => r.id));
      }

      // Create issue
      const issueData = {
        ...formData,
        attachments: attachmentIds,
        environment: {
          browser: navigator.userAgent,
          os: navigator.platform,
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          url: window.location.href
        }
      };

      const issueId = await createIssue(issueData);
      onSuccess?.(issueId);
    } catch (error) {
      console.error('Failed to create issue:', error);
      setErrors({ submit: 'حدث خطأ أثناء إرسال المشكلة' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{ARABIC_LABELS.basicInfo}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {ARABIC_LABELS.title}
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={ARABIC_LABELS.titlePlaceholder}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {ARABIC_LABELS.description}
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={ARABIC_LABELS.descriptionPlaceholder}
                rows={8}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Categorization */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{ARABIC_LABELS.categorization}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {ARABIC_LABELS.category}
              </label>
              <Select
                value={formData.category}
                onValueChange={(value: IssueCategory) => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                {Object.entries(ARABIC_LABELS.categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {ARABIC_LABELS.priority}
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value: IssuePriority) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                {Object.entries(ARABIC_LABELS.priorities).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <h3 className="text-lg font-semibold mb-4">{ARABIC_LABELS.attachments}</h3>
          
          <FileUpload
            files={formData.attachments}
            onFilesChange={(files) => setFormData(prev => ({ ...prev, attachments: files }))}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
            acceptedTypes={['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            placeholder={ARABIC_LABELS.attachmentsPlaceholder}
          />
          {errors.attachments && (
            <p className="text-red-500 text-sm mt-1">{errors.attachments}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 space-x-reverse">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {ARABIC_LABELS.cancel}
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? ARABIC_LABELS.submitting : ARABIC_LABELS.submit}
        </Button>
      </div>

      {errors.submit && (
        <p className="text-red-500 text-sm text-center">{errors.submit}</p>
      )}
    </form>
  );
}
```

### **useIssues Hook**

```typescript
// src/hooks/useIssues.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { Issue, IssueFormData } from '@/types/issues';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();

  // Create new issue
  const createIssue = useCallback(async (issueData: IssueFormData): Promise<string> => {
    try {
      if (!authState.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const issueDoc = {
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        priority: issueData.priority,
        status: 'open' as const,
        reportedBy: authState.user.uid,
        reportedByName: authState.user.displayName || 'مستخدم',
        assignedTo: undefined,
        assignedByName: undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resolvedAt: undefined,
        closedAt: undefined,
        tags: issueData.tags,
        attachments: issueData.attachments,
        customFields: issueData.customFields,
        environment: issueData.environment
      };

      const docRef = await addDoc(collection(db, 'issues'), issueDoc);
      
      // Send email notification to admins
      await sendIssueNotification(docRef.id, issueData);
      
      return docRef.id;
    } catch (err) {
      console.error('Failed to create issue:', err);
      throw new Error('فشل في إنشاء المشكلة');
    }
  }, [authState.user]);

  // Update issue
  const updateIssue = useCallback(async (issueId: string, updates: Partial<Issue>): Promise<void> => {
    try {
      if (!authState.user) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Failed to update issue:', err);
      throw new Error('فشل في تحديث المشكلة');
    }
  }, [authState.user]);

  // Delete issue (admin only)
  const deleteIssue = useCallback(async (issueId: string): Promise<void> => {
    try {
      if (!authState.user || authState.user.role !== 'admin') {
        throw new Error('ليس لديك صلاحية لحذف المشاكل');
      }

      const issueRef = doc(db, 'issues', issueId);
      await deleteDoc(issueRef);
    } catch (err) {
      console.error('Failed to delete issue:', err);
      throw new Error('فشل في حذف المشكلة');
    }
  }, [authState.user]);

  // Load issues with real-time updates
  useEffect(() => {
    if (!authState.user) {
      setIssues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Build query based on user role
    let issuesQuery = query(
      collection(db, 'issues'),
      orderBy('createdAt', 'desc')
    );

    // Non-admin users see only their issues or assigned issues
    if (authState.user.role !== 'admin') {
      issuesQuery = query(
        collection(db, 'issues'),
        where('reportedBy', '==', authState.user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const issuesData: Issue[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          issuesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || data.resolvedAt,
            closedAt: data.closedAt?.toDate?.()?.toISOString() || data.closedAt,
          } as Issue);
        });
        setIssues(issuesData);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load issues:', err);
        setError('فشل في تحميل المشاكل');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [authState.user]);

  return {
    issues,
    loading,
    error,
    createIssue,
    updateIssue,
    deleteIssue
  };
}

// Email notification function
async function sendIssueNotification(issueId: string, issueData: IssueFormData) {
  try {
    // Get admin users
    const adminQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin')
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    const adminEmails = adminSnapshot.docs.map(doc => doc.data().email);

    // Send email to admins
    for (const email of adminEmails) {
      await emailService.sendIssueNotification({
        to_email: email,
        issue_title: issueData.title,
        issue_category: issueData.category,
        issue_priority: issueData.priority,
        reporter_name: authState.user?.displayName || 'مستخدم',
        issue_url: `${window.location.origin}/issues/${issueId}`
      });
    }
  } catch (error) {
    console.error('Failed to send issue notification:', error);
  }
}
```

---

## 📧 **EMAIL NOTIFICATION SYSTEM**

### **Email Templates in Arabic**

```typescript
// src/lib/email/issueTemplates.ts

export const ISSUE_EMAIL_TEMPLATES = {
  newIssue: {
    subject: 'مشكلة جديدة تم الإبلاغ عنها - نظام سلامة',
    template: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">مشكلة جديدة تم الإبلاغ عنها</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">{{issue_title}}</h3>
          <p style="margin: 5px 0;"><strong>النوع:</strong> {{issue_category}}</p>
          <p style="margin: 5px 0;"><strong>الأولوية:</strong> {{issue_priority}}</p>
          <p style="margin: 5px 0;"><strong>المبلغ:</strong> {{reporter_name}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{issue_url}}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            عرض المشكلة
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          تم إرسال هذا البريد الإلكتروني تلقائياً من نظام سلامة للصيانة
        </p>
      </div>
    `
  },

  statusChange: {
    subject: 'تحديث حالة المشكلة - نظام سلامة',
    template: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">تحديث حالة المشكلة</h2>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">{{issue_title}}</h3>
          <p style="margin: 5px 0;"><strong>الحالة الجديدة:</strong> {{new_status}}</p>
          <p style="margin: 5px 0;"><strong>تم التحديث بواسطة:</strong> {{updated_by}}</p>
          <p style="margin: 5px 0;"><strong>التعليق:</strong> {{comment}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{issue_url}}" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            عرض المشكلة
          </a>
        </div>
      </div>
    `
  },

  assignment: {
    subject: 'تم تعيين مشكلة لك - نظام سلامة',
    template: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">تم تعيين مشكلة لك</h2>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">{{issue_title}}</h3>
          <p style="margin: 5px 0;"><strong>النوع:</strong> {{issue_category}}</p>
          <p style="margin: 5px 0;"><strong>الأولوية:</strong> {{issue_priority}}</p>
          <p style="margin: 5px 0;"><strong>تم التعيين بواسطة:</strong> {{assigned_by}}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{issue_url}}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            عرض المشكلة
          </a>
        </div>
      </div>
    `
  }
};
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**

```typescript
// src/__tests__/components/issues/IssueForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IssueForm } from '@/components/issues/IssueForm';
import { useIssues } from '@/hooks/useIssues';
import { useIssueAttachments } from '@/hooks/useIssueAttachments';

// Mock hooks
jest.mock('@/hooks/useIssues');
jest.mock('@/hooks/useIssueAttachments');

describe('IssueForm', () => {
  const mockCreateIssue = jest.fn();
  const mockUploadAttachments = jest.fn();

  beforeEach(() => {
    (useIssues as jest.Mock).mockReturnValue({
      createIssue: mockCreateIssue,
      loading: false
    });
    
    (useIssueAttachments as jest.Mock).mockReturnValue({
      uploadAttachments: mockUploadAttachments
    });
  });

  it('renders form with Arabic labels', () => {
    render(<IssueForm />);
    
    expect(screen.getByText('المعلومات الأساسية')).toBeInTheDocument();
    expect(screen.getByText('عنوان المشكلة')).toBeInTheDocument();
    expect(screen.getByText('وصف المشكلة')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<IssueForm />);
    
    const submitButton = screen.getByText('إرسال المشكلة');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('عنوان المشكلة مطلوب')).toBeInTheDocument();
      expect(screen.getByText('وصف المشكلة مطلوب')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockCreateIssue.mockResolvedValue('issue-123');
    mockUploadAttachments.mockResolvedValue([]);
    
    const onSuccess = jest.fn();
    render(<IssueForm onSuccess={onSuccess} />);
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('اكتب عنواناً مختصراً وواضحاً للمشكلة'), {
      target: { value: 'مشكلة في النظام' }
    });
    
    fireEvent.change(screen.getByPlaceholderText('اشرح المشكلة بالتفصيل مع خطوات التكرار'), {
      target: { value: 'وصف المشكلة' }
    });
    
    // Submit
    const submitButton = screen.getByText('إرسال المشكلة');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateIssue).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith('issue-123');
    });
  });
});
```

### **Integration Tests**

```typescript
// src/__tests__/hooks/useIssues.test.ts

import { renderHook, act } from '@testing-library/react';
import { useIssues } from '@/hooks/useIssues';
import { useAuth } from '@/contexts/AuthContextFirebase';

jest.mock('@/contexts/AuthContextFirebase');
jest.mock('firebase/firestore');

describe('useIssues', () => {
  const mockUser = {
    uid: 'user-123',
    displayName: 'مستخدم تجريبي',
    role: 'supervisor'
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      authState: { user: mockUser }
    });
  });

  it('creates issue successfully', async () => {
    const { result } = renderHook(() => useIssues());
    
    const issueData = {
      title: 'مشكلة تجريبية',
      description: 'وصف المشكلة',
      category: 'bug' as const,
      priority: 'medium' as const,
      tags: [],
      attachments: [],
      customFields: {}
    };
    
    await act(async () => {
      const issueId = await result.current.createIssue(issueData);
      expect(issueId).toBeDefined();
    });
  });
});
```

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Lazy Loading**

```typescript
// src/app/issues/page.tsx

import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const IssueList = lazy(() => import('@/components/issues/IssueList'));
const IssueForm = lazy(() => import('@/components/issues/IssueForm'));

export default function IssuesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">نظام تتبع المشاكل</h1>
      
      <Suspense fallback={<LoadingSpinner />}>
        <IssueList />
      </Suspense>
      
      <Suspense fallback={<LoadingSpinner />}>
        <IssueForm />
      </Suspense>
    </div>
  );
}
```

### **Pagination**

```typescript
// src/hooks/useIssues.ts - Add pagination

const ITEMS_PER_PAGE = 20;

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const query = lastDoc 
      ? query(
          collection(db, 'issues'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        )
      : query(
          collection(db, 'issues'),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
    
    const snapshot = await getDocs(query);
    const newIssues = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setIssues(prev => [...prev, ...newIssues]);
    setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  }, [hasMore, loading, lastDoc]);
  
  return { issues, hasMore, loadMore, loading };
}
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Security rules tested
- [ ] File upload limits configured
- [ ] Email templates tested
- [ ] Arabic text rendering verified
- [ ] Mobile responsiveness tested
- [ ] Performance benchmarks met

### **Deployment Steps**
- [ ] Update Firestore security rules
- [ ] Update Firebase Storage rules
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing
- [ ] Deploy to production
- [ ] Monitor error rates and performance
- [ ] Send user notification about new feature

### **Post-Deployment**
- [ ] Monitor issue creation rates
- [ ] Track user adoption metrics
- [ ] Collect user feedback
- [ ] Monitor email delivery rates
- [ ] Check file upload success rates
- [ ] Review security logs

---

## 📈 **SUCCESS METRICS**

### **Technical Metrics**
- **Response Time**: <2 seconds for all operations
- **Uptime**: 99.9% availability
- **Error Rate**: <1% error rate
- **File Upload Success**: >95% success rate
- **Email Delivery**: >90% delivery rate

### **User Metrics**
- **Issue Creation Time**: <30 seconds average
- **User Satisfaction**: >90% satisfaction rate
- **Feature Adoption**: >80% of active users
- **Issue Resolution Time**: <48 hours average
- **User Engagement**: >70% return usage

### **Business Metrics**
- **Support Ticket Reduction**: 50% reduction in manual support
- **Issue Visibility**: 100% of issues tracked
- **Response Time Improvement**: 80% faster issue identification
- **User Communication**: 90% improvement in issue reporting quality

---

## 🔄 **FUTURE ENHANCEMENTS**

### **Phase 2 Features** (After 3 months)
- Advanced workflow management
- Issue templates and forms
- Automated issue assignment
- Advanced reporting and analytics
- Integration with external tools

### **Phase 3 Features** (After 6 months)
- AI-powered issue categorization
- Predictive issue resolution
- Advanced automation rules
- Customer portal integration
- Mobile app support

---

## 📤 **EXPORT FUNCTIONALITY FOR CURSOR DEVELOPMENT**

### **Export Features Overview**
The export functionality is specifically designed to support development workflows in Cursor, providing structured data that can be easily imported and used for issue resolution.

### **Supported Export Formats**

#### **1. JSON Format (Recommended for Cursor)**
- **Purpose**: Structured data for development tools
- **Use Case**: Import into Cursor for issue analysis and resolution
- **Features**: Complete issue data with comments and metadata
- **Cursor Integration**: Can be parsed and displayed in Cursor's issue tracking

```json
{
  "exportInfo": {
    "exportedAt": "2025-01-24T10:30:00Z",
    "exportedBy": "user@example.com",
    "totalIssues": 5,
    "format": "json"
  },
  "issues": [
    {
      "id": "issue-123",
      "title": "مشكلة في النموذج",
      "description": "وصف المشكلة بالتفصيل...",
      "category": "bug",
      "priority": "high",
      "status": "open",
      "reportedBy": "user@example.com",
      "reportedByName": "مستخدم تجريبي",
      "createdAt": "2025-01-24T09:00:00Z",
      "environment": {
        "browser": "Chrome 120.0.0.0",
        "os": "Windows 11",
        "device": "desktop",
        "url": "https://app.example.com/form"
      },
      "comments": [
        {
          "id": "comment-456",
          "authorName": "مطور النظام",
          "content": "تم تحديد المشكلة في الكود...",
          "createdAt": "2025-01-24T10:00:00Z",
          "isInternal": true
        }
      ],
      "attachments": [
        {
          "fileName": "screenshot.png",
          "fileType": "image/png",
          "fileSize": 245760,
          "downloadUrl": "https://storage.example.com/attachments/issue-123/screenshot.png"
        }
      ]
    }
  ]
}
```

#### **2. Markdown Format**
- **Purpose**: Human-readable documentation
- **Use Case**: Issue documentation and team communication
- **Features**: Formatted text with issue details and comments
- **Cursor Integration**: Can be viewed and edited in Cursor's markdown editor

```markdown
# تقرير المشاكل - نظام سلامة

**تاريخ التصدير**: 24 يناير 2025  
**المصدر**: نظام سلامة للصيانة  
**عدد المشاكل**: 5

---

## المشكلة #issue-123: مشكلة في النموذج

**النوع**: خطأ في النظام  
**الأولوية**: عالية  
**الحالة**: مفتوحة  
**المبلغ**: مستخدم تجريبي  
**التاريخ**: 24 يناير 2025

### الوصف
وصف المشكلة بالتفصيل مع خطوات التكرار...

### بيئة التشغيل
- **المتصفح**: Chrome 120.0.0.0
- **نظام التشغيل**: Windows 11
- **الجهاز**: سطح المكتب
- **الرابط**: https://app.example.com/form

### التعليقات
1. **مطور النظام** (24 يناير 2025 - 10:00 ص)
   تم تحديد المشكلة في الكود...

### المرفقات
- screenshot.png (240 KB)

---
```

#### **3. CSV Format**
- **Purpose**: Data analysis and reporting
- **Use Case**: Import into Excel or other analysis tools
- **Features**: Tabular data format
- **Cursor Integration**: Can be processed by data analysis scripts

```csv
ID,Title,Category,Priority,Status,ReportedBy,CreatedAt,Description,Comments,Attachments
issue-123,مشكلة في النموذج,bug,high,open,user@example.com,2025-01-24T09:00:00Z,"وصف المشكلة...",2,1
issue-124,طلب ميزة جديدة,feature,medium,open,user2@example.com,2025-01-24T08:30:00Z,"وصف الميزة...",0,0
```

#### **4. PDF Format**
- **Purpose**: Official reports and documentation
- **Use Case**: Management reports and archiving
- **Features**: Professional formatting with charts and tables
- **Cursor Integration**: Reference documentation

### **Cursor-Specific Features**

#### **1. Issue Context Preservation**
- **Environment Information**: Browser, OS, device details
- **User Actions**: Step-by-step reproduction steps
- **Timestamps**: Precise timing for debugging
- **File Attachments**: Screenshots and documents with download links

#### **2. Developer-Friendly Data Structure**
- **Structured JSON**: Easy to parse and process
- **Consistent Format**: Standardized field names and types
- **Metadata**: Export information and filtering details
- **Relationships**: Links between issues, comments, and attachments

#### **3. Integration Capabilities**
- **API Endpoints**: RESTful endpoints for programmatic access
- **Webhook Support**: Real-time notifications for new issues
- **Bulk Operations**: Export multiple issues at once
- **Filtering**: Export specific categories, priorities, or date ranges

### **Export Workflow for Cursor**

#### **Step 1: Issue Selection**
```typescript
// Select issues to export
const selectedIssues = [
  'issue-123',
  'issue-124',
  'issue-125'
];

// Or use filters
const filters = {
  categories: ['bug'],
  priorities: ['high', 'critical'],
  dateRange: {
    start: '2025-01-01',
    end: '2025-01-24'
  }
};
```

#### **Step 2: Export Configuration**
```typescript
const exportConfig = {
  format: 'json', // or 'markdown', 'csv', 'pdf'
  includeComments: true,
  includeAttachments: true,
  includeEnvironment: true,
  includeMetadata: true
};
```

#### **Step 3: Generate Export**
```typescript
const exportId = await createExport({
  exportType: 'multiple_issues',
  format: 'json',
  filters: filters,
  issues: selectedIssues,
  options: exportConfig
});
```

#### **Step 4: Download and Use in Cursor**
```typescript
// Download the export file
const downloadUrl = await getExportDownloadUrl(exportId);

// In Cursor, you can:
// 1. Parse the JSON file
// 2. Display issues in a structured format
// 3. Link to original issues
// 4. Track resolution progress
// 5. Generate development tasks
```

### **Cursor Integration Examples**

#### **1. Issue Import Script**
```typescript
// cursor-issue-import.ts
import { readFileSync } from 'fs';
import { parse } from 'jsonc-parser';

interface CursorIssue {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  metadata: {
    originalId: string;
    reportedBy: string;
    createdAt: string;
    environment: any;
  };
}

function importIssuesFromExport(exportFilePath: string): CursorIssue[] {
  const exportData = JSON.parse(readFileSync(exportFilePath, 'utf8'));
  
  return exportData.issues.map((issue: any) => ({
    title: issue.title,
    description: formatDescriptionForCursor(issue),
    priority: issue.priority,
    category: issue.category,
    metadata: {
      originalId: issue.id,
      reportedBy: issue.reportedByName,
      createdAt: issue.createdAt,
      environment: issue.environment
    }
  }));
}

function formatDescriptionForCursor(issue: any): string {
  let description = issue.description + '\n\n';
  
  if (issue.environment) {
    description += `**Environment**:\n`;
    description += `- Browser: ${issue.environment.browser}\n`;
    description += `- OS: ${issue.environment.os}\n`;
    description += `- URL: ${issue.environment.url}\n\n`;
  }
  
  if (issue.attachments && issue.attachments.length > 0) {
    description += `**Attachments**:\n`;
    issue.attachments.forEach((attachment: any) => {
      description += `- ${attachment.fileName}: ${attachment.downloadUrl}\n`;
    });
    description += '\n';
  }
  
  if (issue.comments && issue.comments.length > 0) {
    description += `**Comments**:\n`;
    issue.comments.forEach((comment: any) => {
      description += `- ${comment.authorName}: ${comment.content}\n`;
    });
  }
  
  return description;
}
```

#### **2. Issue Tracking Dashboard**
```typescript
// cursor-issue-dashboard.tsx
import React from 'react';

interface IssueDashboardProps {
  issues: CursorIssue[];
}

export function IssueDashboard({ issues }: IssueDashboardProps) {
  const highPriorityIssues = issues.filter(issue => 
    issue.priority === 'high' || issue.priority === 'critical'
  );
  
  const bugIssues = issues.filter(issue => issue.category === 'bug');
  
  return (
    <div className="issue-dashboard">
      <h2>Issue Dashboard</h2>
      
      <div className="stats">
        <div className="stat">
          <h3>Total Issues</h3>
          <span>{issues.length}</span>
        </div>
        <div className="stat">
          <h3>High Priority</h3>
          <span>{highPriorityIssues.length}</span>
        </div>
        <div className="stat">
          <h3>Bugs</h3>
          <span>{bugIssues.length}</span>
        </div>
      </div>
      
      <div className="issue-list">
        {highPriorityIssues.map(issue => (
          <div key={issue.metadata.originalId} className="issue-card">
            <h4>{issue.title}</h4>
            <p>{issue.description}</p>
            <div className="metadata">
              <span>Priority: {issue.priority}</span>
              <span>Reported by: {issue.metadata.reportedBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **Export API Endpoints**

#### **1. Create Export**
```typescript
POST /api/issues/export
{
  "exportType": "multiple_issues",
  "format": "json",
  "filters": {
    "categories": ["bug"],
    "priorities": ["high", "critical"],
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-24"
    }
  },
  "issues": ["issue-123", "issue-124"],
  "options": {
    "includeComments": true,
    "includeAttachments": true
  }
}

Response:
{
  "exportId": "export-456",
  "status": "processing",
  "estimatedTime": "30 seconds"
}
```

#### **2. Get Export Status**
```typescript
GET /api/issues/export/{exportId}

Response:
{
  "exportId": "export-456",
  "status": "completed",
  "fileUrl": "https://storage.example.com/exports/export-456/issues.json",
  "fileSize": 245760,
  "expiresAt": "2025-01-31T10:30:00Z"
}
```

#### **3. Download Export**
```typescript
GET /api/issues/export/{exportId}/download

Response: File download
```

### **Export Security and Privacy**

#### **1. Access Control**
- Only authenticated users can create exports
- Users can only export issues they have access to
- Admin users can export all issues
- Exports expire after 7 days

#### **2. Data Protection**
- Sensitive information is filtered out
- Internal comments are marked appropriately
- File attachments are referenced by URL only
- Export history is logged for audit purposes

#### **3. Rate Limiting**
- Maximum 10 exports per user per day
- Maximum 1000 issues per export
- File size limit of 50MB per export

---

## 📚 **DOCUMENTATION**

### **User Documentation**
- [ ] Issue reporting guide in Arabic
- [ ] File attachment guidelines
- [ ] Priority level explanations
- [ ] Status tracking guide
- [ ] FAQ section
- [ ] Export functionality guide

### **Technical Documentation**
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Security rules explanation
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Cursor integration guide

---

**Document Version**: 1.0  
**Last Updated**: January 24, 2025  
**Next Review**: February 7, 2025  
**Maintained By**: Development Team 