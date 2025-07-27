'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Building, 
  MapPin, 
  Users, 
  ArrowLeft,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Contract, Company, Branch } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';
import { FileViewer } from '@/components/ui/file-viewer';

interface ContractDetailViewProps {
  contract: Contract;
  company?: Company;
  branches: Branch[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
      hasPermission: (permission: 'admin' | 'operations_manager' | 'supervisor' | 'viewer') => boolean;
}

export function ContractDetailView({ 
  contract, 
  company, 
  branches, 
  onBack, 
  onEdit, 
  onDelete, 
  hasPermission 
}: ContractDetailViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);

  const handleDocumentView = (documentUrl: string, fileName: string = 'Document') => {
    setCurrentFile({ url: documentUrl, name: fileName });
    setIsFileViewerOpen(true);
  };

  const handleDocumentDownload = (documentUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.click();
  };

  // Calculate contract statistics
  const totalRegularVisits = contract.serviceBatches?.reduce((sum, batch) => sum + (batch.regularVisitsPerYear || 0), 0) || 0;
  const totalEmergencyVisits = contract.serviceBatches?.reduce((sum, batch) => sum + (batch.emergencyVisitsPerYear || 0), 0) || 0;
  const totalValue = contract.contractValue || 0;

  // Get contract branches
  const contractBranches = branches.filter(branch => 
    contract.serviceBatches?.some(batch => batch.branchIds.includes(branch.branchId))
  );

  // Extract services from all service batches
  const services: Array<{name: string; icon: string; color: string}> = [];
  const serviceSet = new Set<string>();
  
  contract.serviceBatches?.forEach(batch => {
    if (batch.services.fireExtinguisherMaintenance && !serviceSet.has('fireExtinguisher')) {
      services.push({
        name: 'طفايات',
        icon: '🧯',
        color: 'bg-red-100 text-red-800 border-red-200'
      });
      serviceSet.add('fireExtinguisher');
    }
    if (batch.services.alarmSystemMaintenance && !serviceSet.has('alarm')) {
      services.push({
        name: 'إنذار',
        icon: '⚠️',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      });
      serviceSet.add('alarm');
    }
    if (batch.services.fireSuppressionMaintenance && !serviceSet.has('suppression')) {
      services.push({
        name: 'إطفاء',
        icon: '💧',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      });
      serviceSet.add('suppression');
    }
    if (batch.services.gasFireSuppression && !serviceSet.has('gas')) {
      services.push({
        name: 'غاز',
        icon: '🟦',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
      });
      serviceSet.add('gas');
    }
    if (batch.services.foamFireSuppression && !serviceSet.has('foam')) {
      services.push({
        name: 'فوم',
        icon: '🟢',
        color: 'bg-green-100 text-green-800 border-green-200'
      });
      serviceSet.add('foam');
    }
  });

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
            <h1 className="text-2xl font-bold text-gray-900">عقد {contract.contractId}</h1>
            <p className="text-gray-600">{company?.companyName || 'شركة غير معروفة'}</p>
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
        {/* Contract Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                معلومات العقد الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">معرف العقد</label>
                  <p className="text-gray-900 font-mono">{contract.contractId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الشركة</label>
                  <p className="text-gray-900">{company?.companyName || 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ البداية</label>
                  <p className="text-gray-900">{formatDateForDisplay(contract.contractStartDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">تاريخ الانتهاء</label>
                  <p className="text-gray-900">{formatDateForDisplay(contract.contractEndDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">قيمة العقد</label>
                  <p className="text-gray-900 font-semibold">{totalValue.toLocaleString('ar-SA')} ر.س</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">الحالة</label>
                  <Badge variant={contract.isArchived ? "secondary" : "default"}>
                    {contract.isArchived ? "مؤرشف" : "نشط"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                الخدمات المقدمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {services.map(service => (
                    <span
                      key={service.name}
                      className={`text-sm px-3 py-1 rounded-full border ${service.color} flex items-center gap-2`}
                    >
                      <span>{service.icon}</span>
                      <span>{service.name}</span>
                    </span>
                  ))}
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">الزيارات العادية</label>
                      <p className="text-gray-900">{totalRegularVisits} زيارة/سنة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">الزيارات الطارئة</label>
                      <p className="text-gray-900">{totalEmergencyVisits} زيارة/سنة</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Batches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                دفعات الخدمات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contract.serviceBatches && contract.serviceBatches.length > 0 ? (
                <div className="space-y-4">
                  {contract.serviceBatches.map((batch, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">دفعة {index + 1}</h4>
                        <Badge variant="outline">دفعة {index + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-gray-500">الزيارات العادية:</label>
                          <p>{batch.regularVisitsPerYear || 0} زيارة/سنة</p>
                        </div>
                        <div>
                          <label className="text-gray-500">الزيارات الطارئة:</label>
                          <p>{batch.emergencyVisitsPerYear || 0} زيارة/سنة</p>
                        </div>
                        <div>
                          <label className="text-gray-500">تكلفة الزيارة الطارئة:</label>
                          <p>{batch.emergencyVisitCost?.toLocaleString('ar-SA') || 0} ر.س</p>
                        </div>
                        <div>
                          <label className="text-gray-500">الفروع:</label>
                          <p>{batch.branchIds.length} فرع</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد دفعات خدمات</p>
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
              {typeof contract.contractDocument === 'string' && contract.contractDocument ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">مستند العقد</p>
                        <p className="text-sm text-gray-500">مستند مرفق</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleDocumentView(contract.contractDocument as string, 'contract_document.pdf')}
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleDocumentDownload(contract.contractDocument as string, 'contract_document.pdf')}
                      >
                        <Download className="w-4 h-4" />
                        تحميل
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد مستندات مرفقة</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إحصائيات العقد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">إجمالي الزيارات</span>
                <Badge variant="outline">{totalRegularVisits + totalEmergencyVisits}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد الفروع</span>
                <Badge variant="outline">{contractBranches.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد الخدمات</span>
                <Badge variant="outline">{services.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">تاريخ الإنشاء</span>
                <span className="text-sm text-gray-500">
                  {contract.createdAt ? formatDateForDisplay(contract.createdAt) : 'غير محدد'}
                </span>
              </div>
              {contract.updatedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">آخر تحديث</span>
                  <span className="text-sm text-gray-500">
                    {formatDateForDisplay(contract.updatedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Branches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">فروع العقد</CardTitle>
            </CardHeader>
            <CardContent>
              {contractBranches.length > 0 ? (
                <div className="space-y-2">
                  {contractBranches.map(branch => (
                    <div key={branch.branchId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{branch.branchName}</p>
                        <p className="text-xs text-gray-500">{branch.city} - {branch.location}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {branch.branchId}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">لا توجد فروع مرتبطة</p>
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
                  console.log('Schedule visit for contract:', contract.contractId);
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
                  console.log('Add document for contract:', contract.contractId);
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
                  console.log('Add branch for contract:', contract.contractId);
                  // This would open the branch form with contract pre-selected
                  // You can implement this by passing a callback prop
                }}
              >
                <Users className="w-4 h-4 ml-2" />
                إضافة فرع
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {isFileViewerOpen && currentFile && (
        <FileViewer
          file={{
            name: currentFile.name,
            url: currentFile.url,
            type: currentFile.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
          }}
          isOpen={isFileViewerOpen}
          onClose={() => setIsFileViewerOpen(false)}
        />
      )}
    </div>
  );
} 