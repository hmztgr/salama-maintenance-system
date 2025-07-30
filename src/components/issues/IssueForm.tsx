import React, { useState } from 'react';
import { useIssues } from '@/hooks/useIssues';
import { useIssueAttachments } from '@/hooks/useIssueAttachments';
import { IssueFormData, IssueCategory, IssuePriority } from '@/types/issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ARABIC_LABELS, DESCRIPTION_TEMPLATE, CATEGORY_ICONS } from '@/lib/constants/issues';
import { X, Upload, FileText, Image, File } from 'lucide-react';

interface IssueFormProps {
  onSuccess?: (issueId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<IssueFormData>;
  consoleLogs?: string;
}

export function IssueForm({ onSuccess, onCancel, initialData, consoleLogs }: IssueFormProps) {
  const { createIssue, loading } = useIssues();
  const { uploadAttachments, uploading, uploadProgress } = useIssueAttachments();
  
  const [formData, setFormData] = useState<IssueFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'bug',
    priority: initialData?.priority || 'medium',
    tags: initialData?.tags || [],
    attachments: initialData?.attachments || [],
    customFields: initialData?.customFields || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

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

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  // Remove file
  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Prepare description with console logs if available
      let finalDescription = formData.description;
      if (consoleLogs && consoleLogs.trim()) {
        finalDescription += `\n\n**سجلات وحدة التحكم**:\n\`\`\`\n${consoleLogs}\n\`\`\``;
      }

      // Create issue first
      const issueData = {
        ...formData,
        description: finalDescription,
        attachments: [], // We'll update this after uploading
        environment: {
          browser: navigator.userAgent,
          os: navigator.platform,
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          url: window.location.href
        }
      };

      const issueId = await createIssue(issueData);

      // Upload attachments if any
      if (formData.attachments.length > 0) {
        await uploadAttachments(formData.attachments, issueId);
      }

      onSuccess?.(issueId);
    } catch (error) {
      console.error('Failed to create issue:', error);
      setErrors({ submit: 'حدث خطأ أثناء إرسال المشكلة' });
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Basic Information */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold border-b pb-1">
              {ARABIC_LABELS.basicInfo}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
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
                <label className="block text-sm font-medium mb-1">
                  {ARABIC_LABELS.description}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={ARABIC_LABELS.descriptionPlaceholder}
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Categorization */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold border-b pb-1">
              {ARABIC_LABELS.categorization}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {ARABIC_LABELS.category}
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value: IssueCategory) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ARABIC_LABELS.categories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span>{CATEGORY_ICONS[key as IssueCategory]}</span>
                          <span>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {ARABIC_LABELS.priority}
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: IssuePriority) => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ARABIC_LABELS.priorities).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {ARABIC_LABELS.tags}
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={ARABIC_LABELS.tagsPlaceholder}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  إضافة
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold border-b pb-1">
              {ARABIC_LABELS.attachmentsSection}
            </h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-3">
                {ARABIC_LABELS.attachmentsPlaceholder}
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept="image/*,application/pdf,text/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>اختيار الملفات</span>
                </Button>
              </label>
            </div>

            {/* File list */}
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">الملفات المرفقة:</h4>
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file)}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.attachments && (
              <p className="text-red-500 text-sm">{errors.attachments}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || uploading}
            >
              {ARABIC_LABELS.cancel}
            </Button>
            
            <Button
              type="submit"
              disabled={loading || uploading}
            >
              {loading || uploading ? ARABIC_LABELS.submitting : ARABIC_LABELS.submit}
            </Button>
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 