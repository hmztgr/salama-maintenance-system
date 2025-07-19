'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileSpreadsheet, Info, CheckCircle } from 'lucide-react';
import { ImportReview } from './ImportReview';

interface ImportTemplateProps {
  entityType: 'companies' | 'contracts' | 'branches';
  onClose?: () => void;
}

interface ImportResults {
  totalRows: number;
  successfulRows: number;
  errorRows: number;
  warningRows: number;
  importedData: Record<string, string>[];
}

export function ImportTemplate({ entityType, onClose }: ImportTemplateProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);

  // Template configurations for different entity types
  const templateConfigs = {
    companies: {
      title: 'استيراد بيانات الشركات',
      description: 'قالب لاستيراد بيانات الشركات مع قواعد التحقق والأمثلة',
      headers: [
        'companyName',
        'email',
        'phone',
        'address',
        'city',
        'contactPerson',
        'notes'
      ],
      headerLabels: [
        'اسم الشركة*',
        'البريد الإلكتروني',
        'رقم الهاتف*',
        'العنوان*',
        'المدينة*',
        'الشخص المسؤول',
        'ملاحظات'
      ],
      sampleData: [
        'شركة السلامة المحدودة',
        'info@salama.com',
        '0112345678',
        'طريق الملك فهد، حي الملز',
        'الرياض',
        'أحمد محمد',
        'شركة رائدة في مجال السلامة'
      ],
      validationRules: [
        'اسم الشركة: مطلوب، أقل من 100 حرف',
        'البريد الإلكتروني: تنسيق email صحيح',
        'رقم الهاتف: مطلوب، أرقام ورموز فقط',
        'العنوان: مطلوب، أقل من 200 حرف',
        'المدينة: مطلوب، يجب أن تكون من المدن السعودية',
        'الشخص المسؤول: اختياري، أقل من 100 حرف',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    },
    contracts: {
      title: 'استيراد بيانات العقود',
      description: 'قالب لاستيراد بيانات العقود مع تواريخ وخدمات السلامة',
      headers: [
        'companyId',
        'contractStartDate',
        'contractEndDate',
        'regularVisitsPerYear',
        'emergencyVisitsPerYear',
        'contractValue',
        'fireExtinguisherMaintenance',
        'alarmSystemMaintenance',
        'fireSuppressionMaintenance',
        'gasFireSuppression',
        'foamFireSuppression',
        'notes'
      ],
      headerLabels: [
        'معرف الشركة*',
        'تاريخ بداية العقد*',
        'تاريخ انتهاء العقد*',
        'عدد الزيارات العادية سنوياً*',
        'عدد الزيارات الطارئة سنوياً*',
        'قيمة العقد',
        'صيانة الطفايات*',
        'صيانة نظام الإنذار*',
        'صيانة نظام الإطفاء*',
        'نظام الإطفاء بالغاز*',
        'نظام الإطفاء بالفوم*',
        'ملاحظات'
      ],
      sampleData: [
        '0001',
        '01-Jan-2024',
        '31-Dec-2024',
        '12',
        '4',
        '50000',
        'نعم',
        'نعم',
        'لا',
        'لا',
        'لا',
        'عقد صيانة سنوي شامل'
      ],
      validationRules: [
        'معرف الشركة: مطلوب، يجب أن يكون موجود في النظام',
        'تاريخ بداية العقد: مطلوب، تنسيق dd-mmm-yyyy (مثال: 15-Jan-2024)',
        'تاريخ انتهاء العقد: مطلوب، يجب أن يكون بعد تاريخ البداية',
        'عدد الزيارات العادية: مطلوب، رقم من 0 إلى 365',
        'عدد الزيارات الطارئة: مطلوب، رقم من 0 إلى 365',
        'قيمة العقد: اختياري، رقم موجب',
        'خدمات السلامة: نعم/لا، يجب اختيار خدمة واحدة على الأقل',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    },
    branches: {
      title: 'استيراد بيانات الفروع',
      description: 'قالب لاستيراد بيانات الفروع مع المواقع وتفاصيل التواصل',
      headers: [
        'companyId',
        'contractIds',
        'city',
        'location',
        'branchName',
        'address',
        'contactPerson',
        'contactPhone',
        'teamMember',
        'notes'
      ],
      headerLabels: [
        'معرف الشركة*',
        'معرفات العقود*',
        'المدينة*',
        'الموقع*',
        'اسم الفرع*',
        'العنوان التفصيلي',
        'الشخص المسؤول',
        'هاتف التواصل',
        'فريق العمل المختص',
        'ملاحظات'
      ],
      sampleData: [
        '0001',
        'CON-0001-001,CON-0001-002',
        'الرياض',
        'حي الملز',
        'الفرع الرئيسي',
        'طريق الملك فهد، مبنى رقم 123',
        'سالم أحمد',
        '0501234567',
        'فريق الرياض',
        'الفرع الرئيسي للشركة'
      ],
      validationRules: [
        'معرف الشركة: مطلوب، يجب أن يكون موجود في النظام',
        'معرفات العقود: مطلوب، مفصولة بفاصلة، يجب أن تكون موجودة',
        'المدينة: مطلوب، يجب أن تكون من المدن السعودية',
        'الموقع: مطلوب، أقل من 100 حرف',
        'اسم الفرع: مطلوب، أقل من 100 حرف',
        'العنوان التفصيلي: اختياري، أقل من 200 حرف',
        'الشخص المسؤول: اختياري، أقل من 100 حرف',
        'هاتف التواصل: اختياري، أرقام ورموز فقط',
        'فريق العمل: اختياري، أقل من 100 حرف',
        'ملاحظات: اختياري، أقل من 500 حرف'
      ]
    }
  };

  const currentConfig = templateConfigs[entityType];

  const generateCSVTemplate = () => {
    setIsGenerating(true);

    try {
      // Create comprehensive CSV content with UTF-8 BOM for Arabic support
      const BOM = '\uFEFF';

      let content = `${BOM}`;

      // Add title and description as comments
      content += `# ${currentConfig.title}\n`;
      content += `# ${currentConfig.description}\n`;
      content += `# تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}\n\n`;

      // Add simple header comment
      content += '# قالب استيراد بيانات ' + currentConfig.title.replace('استيراد بيانات ', '') + '\n';
      content += '# يرجى ملء البيانات في الصفوف أدناه\n';
      content += '\n';

      // Add headers
      content += currentConfig.headerLabels.join(',') + '\n';

      // Add sample data
      content += currentConfig.sampleData.map(field => `"${field}"`).join(',') + '\n';

      // Add empty rows for user input
      for (let i = 0; i < 5; i++) {
        content += new Array(currentConfig.headers.length).fill('').join(',') + '\n';
      }

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `template_${entityType}_import.csv`);
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

  const processImport = () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    // Here we would implement the actual import logic
    // For now, just simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('تم معالجة الملف بنجاح! (هذه نسخة تجريبية)');
    }, 2000);
  };

  const handleReviewClose = () => {
    setShowReview(false);
    setUploadedFile(null);
    setImportResults(null);
  };

  const handleImportComplete = (results: ImportResults) => {
    setImportResults(results);
    setShowReview(false);

    // Here you would typically save the imported data to your data store
    console.log('Import completed:', results);

    // Show success message
    const message = `تم الاستيراد بنجاح!\n\n` +
      `إجمالي السجلات: ${results.totalRows}\n` +
      `تم استيراد: ${results.successfulRows}\n` +
      `أخطاء: ${results.errorRows}\n` +
      `تحذيرات: ${results.warningRows}`;

    alert(message);
  };

  // Show review modal if file is uploaded
  if (showReview && uploadedFile) {
    return (
      <ImportReview
        file={uploadedFile}
        entityType={entityType}
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
            <span>{currentConfig.title}</span>
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
              {currentConfig.description}
            </AlertDescription>
          </Alert>

          {/* Import Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Download Template */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-blue-50">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="font-medium text-lg">تحميل القالب</h3>
              <Button
                onClick={generateCSVTemplate}
                disabled={isGenerating}
                className="gap-2 w-full"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'جاري التحميل...' : 'تحميل قالب CSV'}
              </Button>
              <p className="text-sm text-gray-600">
                احفظ القالب وامملأه بالبيانات<br/>
                يمكن حفظه كـ CSV أو Excel
              </p>
            </div>

            {/* Step 2: Upload File */}
            <div className="text-center space-y-4 border rounded-lg p-6 bg-green-50">
              <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="font-medium text-lg">رفع الملف المملوء</h3>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="import-file-input"
                />
                <Button
                  onClick={() => document.getElementById('import-file-input')?.click()}
                  className="gap-2 w-full"
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Upload className="w-4 h-4" />
                  اختيار ملف للاستيراد
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
            <h3 className="text-lg font-medium text-right">هيكل البيانات المطلوبة:</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentConfig.headerLabels.map((label, index) => (
                <div key={index} className="border rounded p-3 bg-gray-50">
                  <div className="font-medium text-right text-blue-800">{label}</div>
                  <div className="text-sm text-gray-600 text-right mt-1">
                    مثال: {currentConfig.sampleData[index]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-right">قواعد التحقق والتحقق من صحة البيانات:</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <ul className="space-y-2 text-right">
                {currentConfig.validationRules.map((rule, index) => (
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
                تم إنشاء وتحميل القالب بنجاح! يمكنك الآن ملء البيانات ورفع الملف للاستيراد.
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-medium text-blue-800 text-right mb-2">ملاحظات مهمة:</h4>
            <ul className="space-y-1 text-sm text-blue-700 text-right">
              <li>• احفظ الملف بترميز UTF-8 للدعم الصحيح للنص العربي</li>
              <li>• استخدم التنسيق dd-mmm-yyyy للتواريخ (مثال: 15-Jan-2024)</li>
              <li>• الحقول المحددة بعلامة * مطلوبة</li>
              <li>• تأكد من صحة معرفات الشركات والعقود الموجودة</li>
              <li>• يمكن استخدام "نعم" أو "لا" لحقول الخدمات</li>
              <li>• يمكن حفظ القالب المملوء كـ CSV أو Excel - كلاهما مقبول</li>
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
