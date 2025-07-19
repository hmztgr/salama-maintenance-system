'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Save, X, Plus, Trash2, Building, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Contract, Company, Branch, ContractServiceBatch } from '@/types/customer';
import { convertInputDateToStandard, parseStandardDate } from '@/lib/date-handler';

interface EnhancedContractFormProps {
  contract?: Contract;
  companies: Company[];
  branches: Branch[];
  onSubmit: (contractData: Omit<Contract, 'id' | 'contractId' | 'isArchived' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; contract?: Contract; warnings?: string[] }>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EnhancedContractForm({ 
  contract, 
  companies, 
  branches, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: EnhancedContractFormProps) {
  const [formData, setFormData] = useState({
    companyId: contract?.companyId || '',
    contractStartDate: contract?.contractStartDate || '',
    contractEndDate: contract?.contractEndDate || '',
    contractPeriodMonths: contract?.contractPeriodMonths || 12,
    contractValue: contract?.contractValue || 0,
    notes: contract?.notes || '',
    contractDocument: undefined as File | undefined,
  });

  const [serviceBatches, setServiceBatches] = useState<ContractServiceBatch[]>(
    contract?.serviceBatches || []
  );

  const [currentBatch, setCurrentBatch] = useState<Partial<ContractServiceBatch>>({
    branchIds: [],
    services: {
      fireExtinguisherMaintenance: false,
      alarmSystemMaintenance: false,
      fireSuppressionMaintenance: false,
      gasFireSuppression: false,
      foamFireSuppression: false,
    },
    regularVisitsPerYear: 12,
    emergencyVisitsPerYear: 4,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usePeriod, setUsePeriod] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);

  const isEditing = !!contract;

  // Get available branches for selected company
  const availableBranches = branches.filter(branch => 
    branch.companyId === formData.companyId && !branch.isArchived
  );

  // Get already selected branch IDs from existing batches
  const selectedBranchIds = new Set(
    serviceBatches.flatMap(batch => batch.branchIds)
  );

  // Get unassigned branches (available for new batches)
  const unassignedBranches = availableBranches.filter(branch => 
    !selectedBranchIds.has(branch.branchId)
  );

  const selectedCompany = companies.find(c => c.companyId === formData.companyId);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyId.trim()) {
      newErrors.companyId = 'اختيار الشركة مطلوب';
    }

    if (!formData.contractStartDate.trim()) {
      newErrors.contractStartDate = 'تاريخ بداية العقد مطلوب';
    }

    if (!formData.contractEndDate.trim()) {
      newErrors.contractEndDate = 'تاريخ نهاية العقد مطلوب';
    }

    if (serviceBatches.length === 0) {
      newErrors.serviceBatches = 'يجب إضافة مجموعة خدمات واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentBatch = (): boolean => {
    if (!currentBatch.branchIds || currentBatch.branchIds.length === 0) {
      alert('يجب اختيار فرع واحد على الأقل');
      return false;
    }

    const hasAnyService = currentBatch.services && Object.values(currentBatch.services).some(service => service);
    if (!hasAnyService) {
      alert('يجب اختيار خدمة واحدة على الأقل');
      return false;
    }

    return true;
  };

  const handleInputChange = (field: string, value: string | number) => {
    let processedValue = value;

    // Convert date values from input format (yyyy-mm-dd) to standard format (dd-mmm-yyyy)
    if ((field === 'contractStartDate' || field === 'contractEndDate') && typeof value === 'string') {
      processedValue = convertInputDateToStandard(value);
    }

    setFormData(prev => {
      const newData = { ...prev, [field]: processedValue };

      // Auto-calculate end date if using period
      if ((field === 'contractStartDate' || field === 'contractPeriodMonths') && usePeriod) {
        const startDateValue = field === 'contractStartDate' ? processedValue as string : newData.contractStartDate;
        const monthsValue = field === 'contractPeriodMonths' ? processedValue as number : newData.contractPeriodMonths;

        if (startDateValue && monthsValue && monthsValue > 0) {
          const startDate = parseStandardDate(startDateValue);
          if (startDate) {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + monthsValue);
            const endDateString = convertInputDateToStandard(endDate.toISOString().split('T')[0]);
            newData.contractEndDate = endDateString;
          }
        }
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset batches when company changes
    if (field === 'companyId') {
      setServiceBatches([]);
      setCurrentBatch({
        branchIds: [],
        services: {
          fireExtinguisherMaintenance: false,
          alarmSystemMaintenance: false,
          fireSuppressionMaintenance: false,
          gasFireSuppression: false,
          foamFireSuppression: false,
        },
        regularVisitsPerYear: 12,
        emergencyVisitsPerYear: 4,
        notes: '',
      });
    }
  };

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, contractDocument: file || undefined }));
  };

  const handleBranchToggle = (branchId: string) => {
    setCurrentBatch(prev => ({
      ...prev,
      branchIds: prev.branchIds?.includes(branchId)
        ? prev.branchIds.filter(id => id !== branchId)
        : [...(prev.branchIds || []), branchId]
    }));
  };

  const handleServiceToggle = (serviceName: keyof ContractServiceBatch['services']) => {
    setCurrentBatch(prev => ({
      ...prev,
      services: {
        ...prev.services!,
        [serviceName]: !prev.services![serviceName]
      }
    }));
  };

  const addServiceBatch = () => {
    if (!validateCurrentBatch()) return;

    const newBatch: ContractServiceBatch = {
      batchId: `batch-${Date.now()}`,
      branchIds: currentBatch.branchIds!,
      services: currentBatch.services!,
      regularVisitsPerYear: currentBatch.regularVisitsPerYear || 12,
      emergencyVisitsPerYear: currentBatch.emergencyVisitsPerYear || 4,
      notes: currentBatch.notes || '',
    };

    setServiceBatches(prev => [...prev, newBatch]);
    
    // Reset current batch
    setCurrentBatch({
      branchIds: [],
      services: {
        fireExtinguisherMaintenance: false,
        alarmSystemMaintenance: false,
        fireSuppressionMaintenance: false,
        gasFireSuppression: false,
        foamFireSuppression: false,
      },
      regularVisitsPerYear: 12,
      emergencyVisitsPerYear: 4,
      notes: '',
    });
    
    setShowAddBatch(false);
  };

  const removeBatch = (batchId: string) => {
    setServiceBatches(prev => prev.filter(batch => batch.batchId !== batchId));
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.branchId === branchId);
    return branch ? `${branch.branchName} (${branch.city})` : branchId;
  };

  const getServiceBadges = (services: ContractServiceBatch['services']) => {
    const activeServices = [];
    if (services.fireExtinguisherMaintenance) activeServices.push({ name: 'طفايات', icon: '🧯' });
    if (services.alarmSystemMaintenance) activeServices.push({ name: 'إنذار', icon: '⚠️' });
    if (services.fireSuppressionMaintenance) activeServices.push({ name: 'إطفاء', icon: '💧' });
    if (services.gasFireSuppression) activeServices.push({ name: 'غاز', icon: '🟦' });
    if (services.foamFireSuppression) activeServices.push({ name: 'فوم', icon: '🟢' });
    return activeServices;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const contractData = {
      ...formData,
      serviceBatches,
    };

    try {
      const result = await onSubmit(contractData);
      if (result.success) {
        // Success will be handled by parent component
      }
    } catch (error) {
      console.error('Contract submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <Building className="h-5 w-5" />
            {isEditing ? 'تعديل العقد' : 'إنشاء عقد جديد'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Contract Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">معلومات العقد الأساسية</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="companyId">الشركة *</Label>
                  <select
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => handleInputChange('companyId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.companyId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading || isEditing}
                  >
                    <option value="">اختر الشركة</option>
                    {companies.filter(c => !c.isArchived).map(company => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.companyId} - {company.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && (
                    <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
                  )}
                  {selectedCompany && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedCompany.companyName}
                      {selectedCompany.email && ` - ${selectedCompany.email}`}
                    </p>
                  )}
                </div>

                {/* Contract Dates */}
                <div>
                  <Label htmlFor="contractStartDate">تاريخ بداية العقد *</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate ? parseStandardDate(formData.contractStartDate)?.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                    className={errors.contractStartDate ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  {errors.contractStartDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractStartDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contractEndDate">تاريخ نهاية العقد *</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={formData.contractEndDate ? parseStandardDate(formData.contractEndDate)?.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                    className={errors.contractEndDate ? 'border-red-500' : ''}
                    disabled={isLoading || usePeriod}
                  />
                  {errors.contractEndDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.contractEndDate}</p>
                  )}
                </div>

                {/* Contract Value */}
                <div>
                  <Label htmlFor="contractValue">قيمة العقد (ريال سعودي)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => handleInputChange('contractValue', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    disabled={isLoading}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="contractDocument">وثيقة العقد</Label>
                  <Input
                    id="contractDocument"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <Label htmlFor="notes">ملاحظات العقد</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="أي ملاحظات إضافية حول العقد"
                    className="min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Service Batches Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">مجموعات الخدمات والفروع</h3>
                {formData.companyId && unassignedBranches.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddBatch(true)}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة مجموعة خدمات
                  </Button>
                )}
              </div>

              {errors.serviceBatches && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {errors.serviceBatches}
                  </AlertDescription>
                </Alert>
              )}

              {/* Display existing service batches */}
              <div className="space-y-3">
                {serviceBatches.map((batch) => (
                  <Card key={batch.batchId} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">الفروع المشمولة:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {batch.branchIds.map(branchId => (
                              <Badge key={branchId} variant="outline">
                                {getBranchName(branchId)}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="mb-2">
                            <span className="font-medium">الخدمات:</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {getServiceBadges(batch.services).map((service, index) => (
                              <Badge key={index} className="bg-green-100 text-green-800">
                                {service.icon} {service.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <span>زيارات دورية: {batch.regularVisitsPerYear} سنوياً</span>
                            <span className="mx-2">•</span>
                            <span>زيارات طارئة: {batch.emergencyVisitsPerYear} سنوياً</span>
                          </div>
                          
                          {batch.notes && (
                            <p className="text-sm text-gray-600 mt-2">{batch.notes}</p>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBatch(batch.batchId)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add new service batch form */}
              {showAddBatch && (
                <Card className="border-2 border-dashed border-gray-300">
                  <CardHeader>
                    <CardTitle className="text-base">إضافة مجموعة خدمات جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Branch Selection */}
                    <div>
                      <Label>اختر الفروع *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {unassignedBranches.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-2">
                            جميع الفروع مخصصة بالفعل لمجموعات خدمات أخرى
                          </p>
                        ) : (
                          unassignedBranches.map((branch) => (
                            <div key={branch.branchId} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`branch-${branch.branchId}`}
                                checked={currentBatch.branchIds?.includes(branch.branchId) || false}
                                onCheckedChange={() => handleBranchToggle(branch.branchId)}
                              />
                              <Label htmlFor={`branch-${branch.branchId}`} className="text-sm">
                                {branch.branchName} ({branch.city})
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Service Selection */}
                    <div>
                      <Label>الخدمات المشمولة *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="fireExtinguisher"
                            checked={currentBatch.services?.fireExtinguisherMaintenance || false}
                            onCheckedChange={() => handleServiceToggle('fireExtinguisherMaintenance')}
                          />
                          <Label htmlFor="fireExtinguisher">🧯 صيانة طفايات الحريق</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="alarmSystem"
                            checked={currentBatch.services?.alarmSystemMaintenance || false}
                            onCheckedChange={() => handleServiceToggle('alarmSystemMaintenance')}
                          />
                          <Label htmlFor="alarmSystem">⚠️ صيانة أنظمة الإنذار</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="fireSuppression"
                            checked={currentBatch.services?.fireSuppressionMaintenance || false}
                            onCheckedChange={() => handleServiceToggle('fireSuppressionMaintenance')}
                          />
                          <Label htmlFor="fireSuppression">💧 صيانة أنظمة إطفاء الحريق</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="gasFireSuppression"
                            checked={currentBatch.services?.gasFireSuppression || false}
                            onCheckedChange={() => handleServiceToggle('gasFireSuppression')}
                          />
                          <Label htmlFor="gasFireSuppression">🟦 أنظمة إطفاء بالغاز</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id="foamFireSuppression"
                            checked={currentBatch.services?.foamFireSuppression || false}
                            onCheckedChange={() => handleServiceToggle('foamFireSuppression')}
                          />
                          <Label htmlFor="foamFireSuppression">🟢 أنظمة إطفاء بالفوم</Label>
                        </div>
                      </div>
                    </div>

                    {/* Visit Frequencies */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="regularVisits">الزيارات الدورية (سنوياً)</Label>
                        <Input
                          id="regularVisits"
                          type="number"
                          value={currentBatch.regularVisitsPerYear || 12}
                          onChange={(e) => setCurrentBatch(prev => ({ 
                            ...prev, 
                            regularVisitsPerYear: parseInt(e.target.value) || 12 
                          }))}
                          min="1"
                          max="52"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="emergencyVisits">الزيارات الطارئة (سنوياً)</Label>
                        <Input
                          id="emergencyVisits"
                          type="number"
                          value={currentBatch.emergencyVisitsPerYear || 4}
                          onChange={(e) => setCurrentBatch(prev => ({ 
                            ...prev, 
                            emergencyVisitsPerYear: parseInt(e.target.value) || 4 
                          }))}
                          min="0"
                          max="52"
                        />
                      </div>
                    </div>

                    {/* Batch Notes */}
                    <div>
                      <Label htmlFor="batchNotes">ملاحظات المجموعة</Label>
                      <Textarea
                        id="batchNotes"
                        value={currentBatch.notes || ''}
                        onChange={(e) => setCurrentBatch(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="أي ملاحظات خاصة بهذه المجموعة من الخدمات"
                        className="min-h-[60px]"
                      />
                    </div>

                    {/* Batch Actions */}
                    <div className="flex gap-2 justify-end pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddBatch(false)}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        onClick={addServiceBatch}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        حفظ المجموعة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No company selected message */}
              {!formData.companyId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    اختر شركة أولاً لإضافة مجموعات الخدمات والفروع
                  </AlertDescription>
                </Alert>
              )}

              {/* No branches available message */}
              {formData.companyId && availableBranches.length === 0 && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    لا توجد فروع متاحة لهذه الشركة. يرجى إضافة فروع أولاً قبل إنشاء العقد.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.companyId || serviceBatches.length === 0}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'جاري الحفظ...' : (isEditing ? 'تحديث العقد' : 'إنشاء العقد')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 