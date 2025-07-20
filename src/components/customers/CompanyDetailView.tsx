'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  Users, 
  ArrowLeft,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import { Company } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface CompanyDetailViewProps {
  company: Company;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddBranch?: () => void;
  onAddContract?: () => void;
  onViewVisits?: () => void;
  hasPermission: (permission: 'admin' | 'supervisor' | 'viewer') => boolean;
}

export function CompanyDetailView({ 
  company, 
  onBack, 
  onEdit, 
  onDelete, 
  onAddBranch,
  onAddContract,
  onViewVisits,
  hasPermission 
}: CompanyDetailViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const handleDocumentView = (documentUrl: string) => {
    setSelectedDocument(documentUrl);
  };

  const handleDocumentDownload = (documentUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
            <p className="text-gray-600">معرف الشركة: {company.companyId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('supervisor') && (
            <Button onClick={onEdit} variant="outline" size="sm">
              تعديل
            </Button>
          )}
          {hasPermission('admin') && (
            <Button onClick={onDelete} variant="destructive" size="sm">
              حذف
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                معلومات الشركة الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">اسم الشركة</label>
                  <p className="text-gray-900">{company.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">معرف الشركة</label>
                  <p className="text-gray-900 font-mono">{company.companyId}</p>
                </div>
                {company.unifiedNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">الرقم الموحد</label>
                    <p className="text-gray-900">{company.unifiedNumber}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <Badge variant={company.isArchived ? "secondary" : "default"}>
                    {company.isArchived ? "مؤرشف" : "نشط"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                    <p className="text-gray-900">{company.email || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                    <p className="text-gray-900">{company.phone || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                المستندات المرفقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // Parse file URLs from pipe-separated strings
                const commercialRegFiles = typeof company.commercialRegistrationFile === 'string' && company.commercialRegistrationFile
                  ? company.commercialRegistrationFile.split('|').filter(url => url.trim())
                  : [];
                const vatFiles = typeof company.vatFile === 'string' && company.vatFile
                  ? company.vatFile.split('|').filter(url => url.trim())
                  : [];
                const nationalAddressFiles = typeof company.nationalAddressFile === 'string' && company.nationalAddressFile
                  ? company.nationalAddressFile.split('|').filter(url => url.trim())
                  : [];
                
                const allFiles = [...commercialRegFiles, ...vatFiles, ...nationalAddressFiles];
                
                if (allFiles.length === 0) {
                  return <p className="text-gray-500 text-center py-4">لا توجد مستندات مرفقة</p>;
                }
                
                return (
                  <div className="space-y-3">
                    {/* Commercial Registration Files */}
                    {commercialRegFiles.map((fileUrl, index) => (
                      <div key={`commercial-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">السجل التجاري {commercialRegFiles.length > 1 ? `(${index + 1})` : ''}</p>
                            <p className="text-sm text-gray-500">مستند مرفق</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = `commercial_registration_${index + 1}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* VAT Files */}
                    {vatFiles.map((fileUrl, index) => (
                      <div key={`vat-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">شهادة ضريبة القيمة المضافة {vatFiles.length > 1 ? `(${index + 1})` : ''}</p>
                            <p className="text-sm text-gray-500">مستند مرفق</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = `vat_certificate_${index + 1}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* National Address Files */}
                    {nationalAddressFiles.map((fileUrl, index) => (
                      <div key={`national-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium">العنوان الوطني {nationalAddressFiles.length > 1 ? `(${index + 1})` : ''}</p>
                            <p className="text-sm text-gray-500">مستند مرفق</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => window.open(fileUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              link.download = `national_address_${index + 1}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                            تحميل
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد العقود</span>
                <Badge variant="outline">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد الفروع</span>
                <Badge variant="outline">0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">تاريخ الإنشاء</span>
                <span className="text-sm text-gray-500">
                  {company.createdAt ? formatDateForDisplay(company.createdAt) : 'غير محدد'}
                </span>
              </div>
              {company.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">آخر تحديث</span>
                  <span className="text-sm text-gray-500">
                    {formatDateForDisplay(company.updatedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={onAddBranch || (() => {
                  console.log('Add branch for company:', company.companyId);
                  alert('سيتم إضافة هذه الميزة قريباً');
                })}
              >
                <Users className="w-4 h-4 ml-2" />
                إضافة فرع جديد
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={onAddContract || (() => {
                  console.log('Add contract for company:', company.companyId);
                  alert('سيتم إضافة هذه الميزة قريباً');
                })}
              >
                <FileText className="w-4 h-4 ml-2" />
                إضافة عقد جديد
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={onViewVisits || (() => {
                  console.log('View visits for company:', company.companyId);
                  alert('سيتم إضافة هذه الميزة قريباً');
                })}
              >
                <Calendar className="w-4 h-4 ml-2" />
                عرض الزيارات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">عرض المستند</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocument(null)}
              >
                إغلاق
              </Button>
            </div>
            <div className="h-[70vh] overflow-auto">
              {selectedDocument.endsWith('.pdf') ? (
                <iframe
                  src={selectedDocument}
                  className="w-full h-full border-0"
                  title="Document Viewer"
                />
              ) : selectedDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={selectedDocument}
                  alt="Document"
                  className="w-full h-auto max-h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا يمكن عرض هذا النوع من الملفات</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open(selectedDocument, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 ml-2" />
                      فتح في نافذة جديدة
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 