'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Save, X, Upload, FileText } from 'lucide-react';
import { Visit } from '@/types/customer';
import { useVisits } from '@/hooks/useVisits';
import { formatDateForDisplay, formatDateForInput, convertInputDateToStandard, getCurrentDate } from '@/lib/date-handler';

interface VisitCompletionFormProps {
  visit: Visit;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VisitCompletionForm({ visit, onSuccess, onCancel }: VisitCompletionFormProps) {
  const { completeVisit, updateVisit } = useVisits();

  // Helper functions to convert date formats using the proper date-handler functions
  const convertToInputDate = useCallback((ddMmmYyyy: string): string => {
    return formatDateForInput(ddMmmYyyy);
  }, []);

  const convertFromInputDate = useCallback((yyyyMmDd: string): string => {
    return convertInputDateToStandard(yyyyMmDd);
  }, []);

  const [formData, setFormData] = useState({
    overallStatus: (visit.results?.overallStatus || 'passed') as 'passed' | 'failed' | 'partial',
    issues: visit.results?.issues || [] as string[],
    recommendations: visit.results?.recommendations || [] as string[],
    nextVisitDate: convertToInputDate(visit.results?.nextVisitDate || ''),
    completionNotes: visit.notes || '',
    newIssue: '',
    newRecommendation: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    Array.isArray(visit.attachments) 
      ? visit.attachments.map(att => typeof att === 'string' ? att : att.url || att.name || att.path || '') 
      : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Update form data when visit prop changes (e.g., after completion)
  useEffect(() => {
    setFormData({
      overallStatus: (visit.results?.overallStatus || 'passed') as 'passed' | 'failed' | 'partial',
      issues: visit.results?.issues || [] as string[],
      recommendations: visit.results?.recommendations || [] as string[],
      nextVisitDate: convertToInputDate(visit.results?.nextVisitDate || ''),
      completionNotes: visit.notes || '',
      newIssue: '',
      newRecommendation: '',
    });
    setExistingAttachments(
      Array.isArray(visit.attachments) 
        ? visit.attachments.map(att => typeof att === 'string' ? att : att.url || att.name || att.path || '') 
        : []
    );
  }, [visit, convertToInputDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const results: Visit['results'] = {
        overallStatus: formData.overallStatus,
        issues: formData.issues.length > 0 ? formData.issues : undefined,
        recommendations: formData.recommendations.length > 0 ? formData.recommendations : undefined,
        nextVisitDate: formData.nextVisitDate ? convertFromInputDate(formData.nextVisitDate) : undefined,
      };

      // Convert existing attachments (strings) and new attachments (Files) to proper format
      const existingAttachmentObjects = existingAttachments.map(name => ({
        name,
        url: name, // In demo mode, use name as URL
        path: name,
        size: 0,
        type: 'unknown',
        uploadedAt: getCurrentDate()
      }));
      
      const newAttachmentObjects = attachments.map(file => ({
        name: file.name,
        url: file.name, // In production, this would be the uploaded file URL
        path: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: getCurrentDate()
      }));
      
      const allAttachments = [...existingAttachmentObjects, ...newAttachmentObjects];

      console.log('🚀 Starting visit completion:', { visitId: visit.id, results });

      // Complete the visit with all data in a single update to prevent race conditions
      const success = updateVisit(visit.id, {
        status: 'completed',
        completedDate: getCurrentDate(),
        results,
        notes: formData.completionNotes,
        attachments: allAttachments,
      });
      console.log('📋 Complete visit result:', success);

      if (success) {
        // Success handling
        console.log('✅ Visit completed successfully');
        setSuccessMessage('تم إكمال الزيارة بنجاح');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        console.error('❌ Failed to complete visit');
        setErrorMessage('فشل في إكمال الزيارة');
      }
    } catch (error) {
      console.error('Completion error:', error);
      setErrorMessage('حدث خطأ أثناء إكمال الزيارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addIssue = () => {
    if (formData.newIssue.trim()) {
      setFormData(prev => ({
        ...prev,
        issues: [...prev.issues, prev.newIssue.trim()],
        newIssue: ''
      }));
    }
  };

  const removeIssue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  const addRecommendation = () => {
    if (formData.newRecommendation.trim()) {
      setFormData(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, prev.newRecommendation.trim()],
        newRecommendation: ''
      }));
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Add new files to existing attachments instead of replacing
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
      // Clear the input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-right">
            إكمال الزيارة - {visit.visitId}
          </CardTitle>
          <div className="text-sm text-gray-600 text-right">
            التاريخ: {visit.scheduledDate} | الوقت: {visit.scheduledTime || 'غير محدد'}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Overall Status */}
            <div className="space-y-3">
              <Label className="text-right block font-medium">
                حالة الزيارة العامة *
              </Label>
              <div className="flex gap-4 justify-end">
                {[
                  { value: 'passed', label: 'نجح', color: 'bg-green-100 text-green-800' },
                  { value: 'partial', label: 'جزئي', color: 'bg-yellow-100 text-yellow-800' },
                  { value: 'failed', label: 'فشل', color: 'bg-red-100 text-red-800' }
                ].map(status => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleInputChange('overallStatus', status.value)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.overallStatus === status.value
                        ? `border-blue-500 ${status.color}`
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues Found */}
            <div className="space-y-3">
              <Label className="text-right block font-medium">
                المشاكل المكتشفة
              </Label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={addIssue}
                  size="sm"
                  variant="outline"
                >
                  إضافة
                </Button>
                <Input
                  value={formData.newIssue}
                  onChange={(e) => handleInputChange('newIssue', e.target.value)}
                  placeholder="اكتب المشكلة المكتشفة"
                  className="text-right"
                  dir="rtl"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIssue())}
                />
              </div>

              {formData.issues.length > 0 && (
                <div className="space-y-2">
                  {formData.issues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                      <Button
                        type="button"
                        onClick={() => removeIssue(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-right flex-1 mr-2">{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <Label className="text-right block font-medium">
                التوصيات
              </Label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={addRecommendation}
                  size="sm"
                  variant="outline"
                >
                  إضافة
                </Button>
                <Input
                  value={formData.newRecommendation}
                  onChange={(e) => handleInputChange('newRecommendation', e.target.value)}
                  placeholder="اكتب التوصية"
                  className="text-right"
                  dir="rtl"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecommendation())}
                />
              </div>

              {formData.recommendations.length > 0 && (
                <div className="space-y-2">
                  {formData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                      <Button
                        type="button"
                        onClick={() => removeRecommendation(index)}
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-right flex-1 mr-2">{recommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Next Visit Date */}
            <div className="space-y-2">
              <Label htmlFor="nextVisitDate" className="text-right block">
                موعد الزيارة القادمة المقترح
              </Label>
              <Input
                id="nextVisitDate"
                type="date"
                value={formData.nextVisitDate}
                onChange={(e) => handleInputChange('nextVisitDate', e.target.value)}
                className="text-right"
              />
            </div>

            {/* Completion Notes */}
            <div className="space-y-2">
              <Label htmlFor="completionNotes" className="text-right block">
                ملاحظات إكمال الزيارة
              </Label>
              <Textarea
                id="completionNotes"
                value={formData.completionNotes}
                onChange={(e) => handleInputChange('completionNotes', e.target.value)}
                placeholder="اكتب ملاحظات تفصيلية حول الزيارة والأعمال المنجزة"
                className="text-right min-h-[100px]"
                dir="rtl"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-3">
              <Label className="text-right block font-medium">
                المرفقات (صور، تقارير، مستندات)
              </Label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">انقر لإضافة ملفات أو اسحب وأفلت هنا</p>
                  <p className="text-xs text-gray-400">الصور والمستندات مدعومة</p>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <Button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 text-right">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errorMessage && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-right">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'جاري الحفظ...' : 'إكمال الزيارة'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
