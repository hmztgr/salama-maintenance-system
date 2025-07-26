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
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

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

  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<UploadedFile[]>(
    Array.isArray(visit.attachments) 
      ? visit.attachments
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
    // Update existing attachments when visit changes
    setExistingAttachments(
      Array.isArray(visit.attachments) 
        ? visit.attachments
        : []
    );
  }, [visit, convertToInputDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Combine existing and new attachments
      const allAttachments = [...existingAttachments, ...attachments];
      
      const results: Visit['results'] = {
        overallStatus: formData.overallStatus,
        issues: formData.issues.length > 0 ? formData.issues : undefined,
        recommendations: formData.recommendations.length > 0 ? formData.recommendations : undefined,
        nextVisitDate: formData.nextVisitDate ? convertFromInputDate(formData.nextVisitDate) : undefined,
      };

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

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setAttachments(files);
  };

  const handleFileDeleted = (filePath: string) => {
    setAttachments(prev => prev.filter(file => file.path !== filePath));
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

              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                onFileDeleted={handleFileDeleted}
                existingFiles={existingAttachments}
                folder={`visits/${visit.id}/completion`}
                maxFiles={10}
                maxSize={25}
                allowedTypes={['image', 'pdf', 'doc', 'docx']}
                  accept="image/*,.pdf,.doc,.docx"
                multiple={true}
              />
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
