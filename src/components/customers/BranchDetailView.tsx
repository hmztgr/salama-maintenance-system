'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  Users, 
  ArrowLeft,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Branch, Company, Contract } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface BranchDetailViewProps {
  branch: Branch;
  company?: Company;
  contracts: Contract[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hasPermission: (permission: 'admin' | 'supervisor' | 'viewer') => boolean;
}

export function BranchDetailView({ 
  branch, 
  company, 
  contracts, 
  onBack, 
  onEdit, 
  onDelete, 
  hasPermission 
}: BranchDetailViewProps) {
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

  // Get branch contracts
  const branchContracts = contracts.filter(contract => 
    contract.serviceBatches?.some(batch => batch.branchIds.includes(branch.branchId))
  );

  // Calculate branch statistics
  const totalContracts = branchContracts.length;
  const totalValue = branchContracts.reduce((sum, contract) => sum + (contract.contractValue || 0), 0);

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
            <h1 className="text-2xl font-bold text-gray-900">{branch.branchName}</h1>
            <p className="text-gray-600">معرف الفرع: {branch.branchId}</p>
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
        {/* Branch Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                معلومات الفرع الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">اسم الفرع</label>
                  <p className="text-gray-900">{branch.branchName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">معرف الفرع</label>
                  <p className="text-gray-900 font-mono">{branch.branchId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الشركة</label>
                  <p className="text-gray-900">{company?.companyName || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <Badge variant={branch.isArchived ? "secondary" : "default"}>
                    {branch.isArchived ? "مؤرشف" : "نشط"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                معلومات الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">المدينة</label>
                    <p className="text-gray-900">{branch.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">الموقع</label>
                    <p className="text-gray-900">{branch.location}</p>
                  </div>
                </div>
                {branch.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">العنوان التفصيلي</label>
                    <p className="text-gray-900">{branch.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                    <p className="text-gray-900">{branch.contactPhone || 'غير محدد'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">الشخص المسؤول</label>
                    <p className="text-gray-900">{branch.contactPerson || 'غير محدد'}</p>
                  </div>
                </div>
                {branch.contactPerson && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">الشخص المسؤول</label>
                    <p className="text-gray-900">{branch.contactPerson}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branch Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                عقود الفرع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {branchContracts.length > 0 ? (
                <div className="space-y-3">
                  {branchContracts.map(contract => (
                    <div key={contract.contractId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{contract.contractId}</h4>
                        <Badge variant="outline">{contract.contractValue?.toLocaleString('ar-SA')} ر.س</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-gray-500">تاريخ البداية:</label>
                          <p>{formatDateForDisplay(contract.contractStartDate)}</p>
                        </div>
                        <div>
                          <label className="text-gray-500">تاريخ الانتهاء:</label>
                          <p>{formatDateForDisplay(contract.contractEndDate)}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="text-gray-500 text-sm">الخدمات:</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contract.serviceBatches?.map((batch, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              دفعة {index + 1}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد عقود مرتبطة بهذا الفرع</p>
              )}
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
              <p className="text-gray-500 text-center py-4">لا توجد مستندات مرفقة</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات الفرع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد العقود</span>
                <Badge variant="outline">{totalContracts}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">إجمالي قيمة العقود</span>
                <Badge variant="outline">{totalValue.toLocaleString('ar-SA')} ر.س</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">تاريخ الإنشاء</span>
                <span className="text-sm text-gray-500">
                  {branch.createdAt ? formatDateForDisplay(branch.createdAt) : 'غير محدد'}
                </span>
              </div>
              {branch.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">آخر تحديث</span>
                  <span className="text-sm text-gray-500">
                    {formatDateForDisplay(branch.updatedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branch Services */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">الخدمات المقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              {branchContracts.length > 0 ? (
                <div className="space-y-2">
                  {branchContracts.map(contract => 
                    contract.serviceBatches?.map((batch, batchIndex) => (
                      <div key={`${contract.contractId}-${batchIndex}`} className="p-2 border rounded">
                        <p className="font-medium text-sm">{contract.contractId}</p>
                        <div className="text-xs text-gray-500 mt-1">
                          <p>زيارات عادية: {batch.regularVisitsPerYear || 0}</p>
                          <p>زيارات طارئة: {batch.emergencyVisitsPerYear || 0}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد خدمات</p>
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
                onClick={() => {
                  console.log('Schedule visit for branch:', branch.branchId);
                  // This would open the visit scheduling form
                  // You can implement this by passing a callback prop
                }}
              >
                <Calendar className="w-4 h-4 ml-2" />
                جدولة زيارة
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  console.log('Add document for branch:', branch.branchId);
                  // This would open the document upload form
                  // You can implement this by passing a callback prop
                }}
              >
                <FileText className="w-4 h-4 ml-2" />
                إضافة مستند
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  console.log('Add contract for branch:', branch.branchId);
                  // This would open the contract form with branch pre-selected
                  // You can implement this by passing a callback prop
                }}
              >
                <Users className="w-4 h-4 ml-2" />
                إضافة عقد
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