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

// Import Advanced Contract Management components
import { ContractActionButtons } from '@/components/contracts/ContractActionButtons';
import { ContractRenewalDialog } from '@/components/contracts/ContractRenewalDialog';
import { ContractAddendumForm } from '@/components/contracts/ContractAddendumForm';
import { ArchivedContractsView } from '@/components/contracts/ArchivedContractsView';
import { useContractRenewal } from '@/hooks/useContractRenewal';

interface ContractDetailViewProps {
  contract: Contract;
  company?: Company;
  branches: Branch[];
  companies: Company[]; // Add companies for archived contracts view
  contracts: Contract[]; // Add all contracts for archived contracts view
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hasPermission: (permission: 'admin' | 'operations_manager' | 'supervisor' | 'viewer') => boolean;
}

export function ContractDetailView({ 
  contract, 
  company, 
  branches, 
  companies,
  contracts,
  onBack, 
  onEdit, 
  onDelete, 
  hasPermission 
}: ContractDetailViewProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ url: string; name: string } | null>(null);

  // Advanced Contract Management state
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showAddendumForm, setShowAddendumForm] = useState(false);
  const [showArchivedContracts, setShowArchivedContracts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Contract renewal hook
  const { renewContract, addContractAddendum } = useContractRenewal();

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

  // Advanced Contract Management handlers
  const handleRenewContract = async (withChanges: boolean) => {
    setIsLoading(true);
    try {
      const result = await renewContract(contract, withChanges);
      if (result.success) {
        setShowRenewalDialog(false);
        // Optionally refresh the contract data or navigate to the new contract
        console.log('Contract renewed successfully:', result.newContract);
        // You can add a success notification here
      } else {
        console.error('Failed to renew contract:', result.error);
        // You can add an error notification here
      }
    } catch (error) {
      console.error('Error renewing contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddendum = async (addendumData: {
    services: {
      fireExtinguisherMaintenance: boolean;
      alarmSystemMaintenance: boolean;
      fireSuppressionMaintenance: boolean;
      gasFireSuppression: boolean;
      foamFireSuppression: boolean;
    };
    description: string;
    effectiveDate: string;
    contractValue: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await addContractAddendum(contract.contractId, addendumData);
      if (result.success) {
        setShowAddendumForm(false);
        // Optionally refresh the contract data
        console.log('Addendum added successfully');
        // You can add a success notification here
      } else {
        console.error('Failed to add addendum:', result.error);
        // You can add an error notification here
      }
      return result;
    } catch (error) {
      console.error('Error adding addendum:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewArchivedContract = (archivedContract: Contract) => {
    // Handle viewing an archived contract
    console.log('Viewing archived contract:', archivedContract);
    // You can implement this by opening a read-only view of the archived contract
  };

  // Calculate contract statistics - multiply visits per year by number of branches in each batch
  const totalRegularVisits = contract.serviceBatches?.reduce((sum, batch) => {
    const branchCount = batch.branchIds?.length || 0;
    return sum + ((batch.regularVisitsPerYear || 0) * branchCount);
  }, 0) || 0;
  const totalEmergencyVisits = contract.serviceBatches?.reduce((sum, batch) => {
    const branchCount = batch.branchIds?.length || 0;
    return sum + ((batch.emergencyVisitsPerYear || 0) * branchCount);
  }, 0) || 0;
  const totalValue = contract.contractValue || 0;

  // Get contract branches
  const contractBranches = branches.filter(branch => 
    contract.serviceBatches?.some(batch => batch.branchIds && Array.isArray(batch.branchIds) && batch.branchIds.includes(branch.branchId))
  );

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
                      
                      {/* Services for this batch */}
                      <div className="mt-3">
                        <label className="text-gray-500 text-sm">الخدمات المقدمة:</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {batch.services.fireExtinguisherMaintenance && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                              <span>🧯</span>
                              <span>طفايات</span>
                            </span>
                          )}
                          {batch.services.alarmSystemMaintenance && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                              <span>⚠️</span>
                              <span>إنذار</span>
                            </span>
                          )}
                          {batch.services.fireSuppressionMaintenance && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                              <span>💧</span>
                              <span>إطفاء</span>
                            </span>
                          )}
                          {batch.services.gasFireSuppression && (
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                              <span>🟦</span>
                              <span>غاز</span>
                            </span>
                          )}
                          {batch.services.foamFireSuppression && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                              <span>🟢</span>
                              <span>فوم</span>
                            </span>
                          )}
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

          {/* Addendums Section */}
          {contract.addendums && contract.addendums.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الإضافات المرفقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.addendums.map((addendum, index) => (
                    <div key={addendum.addendumId} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-blue-900">إضافة {index + 1}</h4>
                        <Badge variant="outline" className="text-blue-700">
                          {addendum.effectiveDate}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-blue-700">الوصف:</label>
                          <p className="text-sm text-blue-800">{addendum.description}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-blue-700">القيمة:</label>
                          <p className="text-sm text-blue-800">{addendum.contractValue.toLocaleString()} ريال</p>
                        </div>
                        {addendum.notes && (
                          <div>
                            <label className="text-sm font-medium text-blue-700">ملاحظات:</label>
                            <p className="text-sm text-blue-800">{addendum.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
          {/* Advanced Contract Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إدارة العقد المتقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <ContractActionButtons
                contract={contract}
                onRenewContract={() => setShowRenewalDialog(true)}
                onAddAddendum={() => setShowAddendumForm(true)}
                onViewArchived={() => setShowArchivedContracts(true)}
                onEditContract={onEdit}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

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
                <Badge variant="outline">
                  {contract.serviceBatches?.reduce((total, batch) => {
                    let count = 0;
                    if (batch.services.fireExtinguisherMaintenance) count++;
                    if (batch.services.alarmSystemMaintenance) count++;
                    if (batch.services.fireSuppressionMaintenance) count++;
                    if (batch.services.gasFireSuppression) count++;
                    if (batch.services.foamFireSuppression) count++;
                    return total + count;
                  }, 0) || 0}
                </Badge>
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

      {/* Advanced Contract Management Modals */}
      <ContractRenewalDialog
        contract={contract}
        isOpen={showRenewalDialog}
        onClose={() => setShowRenewalDialog(false)}
        onConfirm={handleRenewContract}
        isLoading={isLoading}
      />

      <ContractAddendumForm
        contract={contract}
        isOpen={showAddendumForm}
        onClose={() => setShowAddendumForm(false)}
        onSubmit={handleAddAddendum}
        isLoading={isLoading}
      />

      <ArchivedContractsView
        contracts={contracts}
        companies={companies}
        isOpen={showArchivedContracts}
        onClose={() => setShowArchivedContracts(false)}
        onViewContract={handleViewArchivedContract}
      />
    </div>
  );
} 