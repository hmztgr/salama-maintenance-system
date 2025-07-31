'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileViewer } from '@/components/ui/file-viewer';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  User, 
  FileText, 
  Eye, 
  Download,
  ArrowRight,
  Calendar,
  Users,
  ClipboardList
} from 'lucide-react';
import { Company, Contract, Branch } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface CompanyDetailViewProps {
  company: Company;
  contracts?: Contract[];
  branches?: Branch[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddBranch?: () => void;
  onAddContract?: () => void;
  onViewVisits?: () => void;
      hasPermission: (permission: 'admin' | 'operations_manager' | 'supervisor' | 'viewer') => boolean;
}

export function CompanyDetailView({ 
  company, 
  contracts = [],
  branches = [],
  onBack, 
  onEdit, 
  onDelete, 
  onAddBranch,
  onAddContract,
  onViewVisits,
  hasPermission 
}: CompanyDetailViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<{
    name: string;
    url: string;
    type: string;
    size?: number;
  } | null>(null);

  // Add debugging for file data
  console.log('🏢 CompanyDetailView received company:', {
    companyId: company.companyId,
    companyName: company.companyName,
    commercialRegistrationFile: company.commercialRegistrationFile,
    vatFile: company.vatFile,
    nationalAddressFile: company.nationalAddressFile
  });

  const handleDocumentView = (documentUrl: string, fileName: string, fileType: string = 'application/pdf') => {
    setViewingFile({
      name: fileName,
      url: documentUrl,
      type: fileType,
      size: 0
    });
  };

  const handleDocumentDownload = (documentUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.click();
  };

  // Calculate company statistics
  const companyContracts = contracts.filter(contract => contract.companyId === company.companyId);
  const companyBranches = branches.filter(branch => branch.companyId === company.companyId);

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
            <ArrowRight className="w-4 h-4" />
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
                <Building2 className="w-5 h-5" />
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
                
                console.log('📁 CompanyDetailView processing files:', {
                  commercialRegFiles,
                  vatFiles,
                  nationalAddressFiles,
                  allFiles: [...commercialRegFiles, ...vatFiles, ...nationalAddressFiles]
                });
                
                const allFiles = [...commercialRegFiles, ...vatFiles, ...nationalAddressFiles];
                
                if (allFiles.length === 0) {
                  console.log('📁 No files found in CompanyDetailView');
                  return <p className="text-gray-500 text-center py-4">لا توجد مستندات مرفقة</p>;
                }
                
                console.log('📁 Found files in CompanyDetailView:', allFiles.length);
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
                            onClick={() => handleDocumentView(fileUrl, `commercial_registration_${index + 1}.pdf`)}
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                            onClick={() => handleDocumentDownload(fileUrl, `commercial_registration_${index + 1}.pdf`)}
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
                            onClick={() => handleDocumentView(fileUrl, `vat_certificate_${index + 1}.pdf`)}
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                            onClick={() => handleDocumentDownload(fileUrl, `vat_certificate_${index + 1}.pdf`)}
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
                            onClick={() => handleDocumentView(fileUrl, `national_address_${index + 1}.pdf`)}
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                            onClick={() => handleDocumentDownload(fileUrl, `national_address_${index + 1}.pdf`)}
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
                <Badge variant="outline">{companyContracts.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد الفروع</span>
                <Badge variant="outline">{companyBranches.length}</Badge>
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
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
} 