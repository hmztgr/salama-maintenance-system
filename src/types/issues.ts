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