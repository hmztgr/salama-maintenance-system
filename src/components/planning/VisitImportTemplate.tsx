'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileSpreadsheet, Info, CheckCircle } from 'lucide-react';
import { VisitImportReview } from './VisitImportReview';

interface VisitImportTemplateProps {
  onClose?: () => void;
}

interface ImportResults {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
  warningRows: number;
  importedData: Record<string, string>[];
}

export function VisitImportTemplate({ onClose }: VisitImportTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  // Modern visit template configuration aligned with current Visit interface
  const templateConfig = {
    title: 'استيراد بيانات الزيارات التاريخية',
    description: 'قالب لاستيراد بيانات الزيارات التاريخية مع التحقق من العقود والفروع والخدمات',
    headers: [
      'branchId',
      'contractId',
      'companyId',
      'visitType',
      'status',
      'scheduledDate',
      'scheduledTime',
      'completedDate',
      'completedTime',
      'duration',
      'assignedTeam',
      'assignedTechnician',
      'fireExtinguisher',
      'alarmSystem',
      'fireSuppression',
      'gasSystem',
      'foamSystem',
      'overallStatus',
      'issues',
      'recommendations',
      'nextVisitDate',
      'notes',
      'createdBy'
    ],
    headerLabels: [
      'معرف الفرع*',
      'معرف العقد*',
      'معرف الشركة*',
      'نوع الزيارة*',
      'حالة الزيارة*',
      'تاريخ الجدولة*',
      'وقت الجدولة',
      'تاريخ التنفيذ',
      'وقت التنفيذ',
      'مدة الزيارة (دقائق)',
      'الفريق المختص',
      'الفني المختص',
      'صيانة الطفايات',
      'صيانة نظام الإنذار',
      'صيانة نظام الإطفاء',
      'نظام الغاز',
      'نظام الفوم',
      'النتيجة العامة',
      'المشاكل المكتشفة',
      'التوصيات',
      'تاريخ الزيارة القادمة',
      'ملاحظات',
      'تم الإنشاء بواسطة'
    ],
    sampleData: [
      '0001-RIY-001-0001',
      'CON-0001-001',
      '0001',
      'regular',
      'completed',
      '15-Jan-2024',
      '09:00',
      '15-Jan-2024',
      '11:30',
      '150',
      'فريق الرياض',
      'أحمد محمد',
      'نعم',
      'نعم',
      'لا',
      'لا',
      'لا',
      'passed',
      'بطارية طفاية منتهية الصلاحية',
      'استبدال البطارية في الطفاية رقم 3',
      '15-Apr-2024',
      'زيارة صيانة دورية ناجحة',
      'system-import'
    ],
    validationRules: [
      'معرف الفرع: مطلوب، يجب أن يكون موجود في النظام (تنسيق: 0001-RIY-001-0001)',
      'معرف العقد: مطلوب، يجب أن يكون مرتبط بالفرع والشركة',
      'معرف الشركة: مطلوب، يجب أن يكون موجود في النظام (تنسيق: 0001)',
      'نوع الزيارة: مطلوب، regular/emergency/followup',
      'حالة الزيارة: مطلوب، scheduled/completed/cancelled/in_progress/rescheduled',
      'تاريخ الجدولة: مطلوب، تنسيق d-mmm-yyyy أو dd-mmm-yyyy أو d-mmm-yy أو dd-mmm-yy',
      'وقت الجدولة: اختياري، تنسيق HH:mm',
      'تاريخ التنفيذ: اختياري، للزيارات المكتملة',
      'وقت التنفيذ: اختياري، تنسيق HH:mm',
      'مدة الزيارة: اختياري، بالدقائق (رقم صحيح)',
      'الخدمات: نعم/لا، يجب أن تتطابق مع خدمات العقد',
      'النتيجة العامة: passed/failed/partial للزيارات المكتملة فقط',
      'التواريخ: يجب أن تكون ضمن فترة العقد',
      'المشاكل والتوصيات: للزيارات المكتملة فقط'
    ]
  };

  const generateCSVTemplate = () => {
    setIsGenerating(true);

    try {
      // Create comprehensive CSV content with UTF-8 BOM for Arabic support
      const BOM = '\uFEFF';

      let content = `${BOM}`;

      // Add title and description as comments
      content += `# ${templateConfig.title}\n`;
      content += `# ${templateConfig.description}\n`;
      content += `# تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}\n`;
      content += `# نظام إدارة الصيانة - سلمة\n\n`;

      // Add validation rules as comments
      content += '# قواعد التحقق والتحقق من صحة البيانات:\n';
      templateConfig.validationRules.forEach(rule => {
        content += `# ${rule}\n`;
      });
      content += '\n';

      // Add field descriptions
      content += '# وصف الحقول:\n';
      content += '# نوع الزيارة: regular (دورية), emergency (طارئة), followup (متابعة)\n';
      content += '# حالة الزيارة: scheduled (مجدولة), completed (مكتملة), cancelled (ملغية), in_progress (قيد التنفيذ), rescheduled (إعادة جدولة)\n';
      content += '# النتيجة العامة: passed (ناجح), failed (فاشل), partial (جزئي)\n';
      content += '# الخدمات: نعم/لا أو yes/no أو true/false\n';
      content += '# التواريخ: تنسيق d-mmm-yyyy أو dd-mmm-yyyy أو d-mmm-yy أو dd-mmm-yy\n';
      content += '# الأوقات: تنسيق HH:mm (مثال: 09:00, 14:30)\n\n';

      // Add headers
      content += templateConfig.headerLabels.join(',') + '\n';

      // Add sample data
      content += templateConfig.sampleData.map(field => `"${field}"`).join(',') + '\n';

      // Add empty rows for user input
      for (let i = 0; i < 5; i++) {
        content += new Array(templateConfig.headers.length).fill('').join(',') + '\n';
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `template_visits_import_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGeneratedTemplate('CSV');
    } catch (error) {
      console.error('Error generating CSV template:', error);
      alert('حدث خطأ في إنشاء قالب CSV');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowReview(true);
      console.log('File selected for review:', file.name, file.type, file.size);
    }
  };

  const handleReviewClose = () => {
    setShowReview(false);
    setUploadedFile(null);
    setImportResults(null);
  };

  const handleImportComplete = (results: ImportResults) => {
    setImportResults(results);
    setShowReview(false);

    // Show success message
    const message = `تم استيراد الزيارات بنجاح!\n\n` +
      `إجمالي السجلات: ${results.totalRows}\n` +
      `تم استيراد: ${results.successfulRows}\n` +
      `أخطاء: ${results.errorRows}\n` +
      `تحذيرات: ${results.warningRows}`;

    alert(message);
  };

  // Show review modal if file is uploaded
  if (showReview && uploadedFile) {
    return (
      <VisitImportReview
        file={uploadedFile}
        onClose={handleReviewClose}
        onImportComplete={handleImportComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>{templateConfig.title}</span>
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="p-2">
                ✕
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-right">
              {templateConfig.description}
            </AlertDescription>
          </Alert>

          {/* Import Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Download Template */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-blue-50">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-medium text-lg">تحميل قالب الزيارات</h3>
              <Button
                onClick={generateCSVTemplate}
                disabled={isGenerating}
                className="gap-2 w-full"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'جاري التحميل...' : 'تحميل قالب الزيارات'}
              </Button>
              <p className="text-sm text-gray-600">
                احفظ القالب وامملأه ببيانات الزيارات<br/>
                يمكن حفظه كـ CSV أو Excel
              </p>
            </div>

            {/* Step 2: Upload File */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-green-50">
              <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-medium text-lg">رفع ملف الزيارات</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="visit-import-file-input"
                />
                <Button
                  onClick={() => document.getElementById('visit-import-file-input')?.click()}
                  className="gap-2 w-full"
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Upload className="w-4 h-4" />
                  اختيار ملف الزيارات
                </Button>
                <p className="text-sm text-gray-600">
                  يقبل ملفات CSV و Excel<br/>
                  (.csv, .xlsx, .xls)
                </p>
              </div>

              {uploadedFile && !showReview && (
                <div className="text-sm text-green-700 bg-white p-3 rounded border">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>تم اختيار الملف - سيتم فتح صفحة المراجعة...</span>
                  </div>
                </div>
              )}

              {importResults && (
                <div className="space-y-3">
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-medium mb-2">نتائج الاستيراد الأخيرة:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>إجمالي السجلات: {importResults.totalRows}</div>
                      <div>تم استيراد: {importResults.successfulRows}</div>
                      <div>أخطاء: {importResults.errorRows}</div>
                      <div>تحذيرات: {importResults.warningRows}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Field Structure Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">هيكل بيانات الزيارات المطلوبة:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateConfig.headerLabels.map((label, index) => (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="font-medium text-right text-blue-800">{label}</div>
                  <div className="text-sm text-gray-600 text-right mt-1">
                    مثال: {templateConfig.sampleData[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">قواعد التحقق وصحة البيانات:</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <ul className="space-y-2 text-right">
                {templateConfig.validationRules.map((rule, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    • {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Success Message */}
          {generatedTemplate && (
            <Alert className="border-green-500 bg-green-50">
              <Download className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 text-right">
                تم إنشاء وتحميل قالب الزيارات بنجاح! يمكنك الآن ملء بيانات الزيارات ورفع الملف للاستيراد.
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-medium text-blue-800 text-right mb-2">ملاحظات مهمة للزيارات:</h4>
            <ul className="space-y-1 text-sm text-blue-700 text-right">
              <li>• معرفات الفروع والعقود والشركات يجب أن تكون موجودة في النظام</li>
              <li>• تواريخ الزيارات يجب أن تكون ضمن فترة العقد</li>
              <li>• نوع الزيارة: regular (دورية), emergency (طارئة), followup (متابعة)</li>
              <li>• حالة الزيارة: scheduled, completed, cancelled, in_progress, rescheduled</li>
              <li>• الخدمات المطلوبة يجب أن تتطابق مع خدمات العقد</li>
              <li>• النتيجة العامة مطلوبة فقط للزيارات المكتملة</li>
              <li>• استخدم تنسيق d-mmm-yyyy أو dd-mmm-yyyy أو d-mmm-yy أو dd-mmm-yy للتواريخ و HH:mm للأوقات</li>
              <li>• مدة الزيارة بالدقائق (رقم صحيح)</li>
              <li>• المشاكل والتوصيات للزيارات المكتملة فقط</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                إغلاق
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
