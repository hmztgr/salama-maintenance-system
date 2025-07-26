import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, CheckCircle, Download } from 'lucide-react';
import { generateImportGuide } from '@/lib/import-utils';

interface ImportGuideProps {
  entityType: 'companies' | 'contracts' | 'contractsAdvanced' | 'branches';
  onDownloadTemplate?: () => void;
}

export function ImportGuide({ entityType, onDownloadTemplate }: ImportGuideProps) {
  const [showDetailedGuide, setShowDetailedGuide] = React.useState(false);

  const getEntityName = (type: string) => {
    switch (type) {
      case 'companies': return 'الشركات';
      case 'contracts': return 'العقود البسيطة';
      case 'contractsAdvanced': return 'العقود المتقدمة';
      case 'branches': return 'الفروع';
      default: return type;
    }
  };

  const getCommonIssues = () => [
    {
      issue: 'معرفات الأرقام تبدأ بصفر',
      description: 'Excel يحذف الأصفار في البداية تلقائياً (مثل 0017 تصبح 17)',
      solution: 'استخدم علامة اقتباس مفردة قبل الرقم (\'0017) أو استخدم تنسيق نص',
      example: '0017 → 17 أو \'0017'
    },
    {
      issue: 'علامة اقتباس مفردة في بداية المعرف',
      description: 'Excel يضيف علامة اقتباس مفردة لإجبار تنسيق النص',
      solution: 'سيتم إزالتها تلقائياً أثناء الاستيراد',
      example: '\'0017 → 0017'
    },
    {
      issue: 'تنسيق التواريخ',
      description: 'Excel قد يغير تنسيق التواريخ',
      solution: 'استخدم تنسيق DD-MMM-YYYY (مثل 01-Jan-2024)',
      example: '01/01/2024 → 01-Jan-2024'
    },
    {
      issue: 'الأرقام مع فواصل',
      description: 'Excel يضيف فواصل للأرقام الكبيرة',
      solution: 'سيتم إزالة الفواصل تلقائياً',
      example: '1,234 → 1234'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Guide Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            دليل استيراد {getEntityName(entityType)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>مشاكل Excel الشائعة:</strong> قد تواجه مشاكل في تنسيق البيانات عند الاستيراد من Excel، خاصة مع المعرفات التي تبدأ بصفر.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ ما يعمل بشكل جيد:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• ملفات CSV منسقة بشكل صحيح</li>
                <li>• المعرفات بدون أصفار في البداية</li>
                <li>• التواريخ بتنسيق DD-MMM-YYYY</li>
                <li>• النصوص والبيانات النصية</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚠️ المشاكل المحتملة:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• حذف الأصفار في بداية المعرفات</li>
                <li>• إضافة علامات اقتباس مفردة</li>
                <li>• تغيير تنسيق التواريخ</li>
                <li>• إضافة فواصل للأرقام</li>
              </ul>
            </div>
          </div>

          {onDownloadTemplate && (
            <div className="flex justify-center">
              <Button 
                onClick={onDownloadTemplate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                تحميل قالب CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Issues Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            المشاكل الشائعة وحلولها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCommonIssues().map((issue, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    مشكلة {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800">{issue.issue}</h4>
                    <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    <div className="mt-2">
                      <span className="text-sm font-medium text-green-700">الحل:</span>
                      <span className="text-sm text-gray-700 ml-1">{issue.solution}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-sm font-medium text-blue-700">مثال:</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded ml-1">
                        {issue.example}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            نصائح للاستيراد الناجح
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-800">✅ أفضل الممارسات:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>استخدم قالب CSV المقدم من النظام</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>تأكد من تنسيق المعرفات بشكل صحيح</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>استخدم التواريخ بتنسيق DD-MMM-YYYY</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>تحقق من البيانات قبل الاستيراد</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-red-800">❌ تجنب:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>تعديل أسماء الأعمدة في القالب</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>استخدام تنسيقات تاريخ مختلفة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>ترك خلايا مطلوبة فارغة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>استيراد ملفات Excel مباشرة</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 نصيحة مهمة:</h4>
              <p className="text-sm text-blue-700">
                إذا كنت تستخدم Excel، احفظ الملف كـ CSV قبل الاستيراد. هذا يضمن تنسيق البيانات بشكل صحيح 
                ويقلل من مشاكل التنسيق التلقائي في Excel.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show/Hide Detailed Guide */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowDetailedGuide(!showDetailedGuide)}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          {showDetailedGuide ? 'إخفاء الدليل التفصيلي' : 'عرض الدليل التفصيلي'}
        </Button>
      </div>

      {showDetailedGuide && (
        <Card>
          <CardHeader>
            <CardTitle>الدليل التفصيلي للاستيراد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded-lg overflow-x-auto">
                {generateImportGuide(entityType)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 