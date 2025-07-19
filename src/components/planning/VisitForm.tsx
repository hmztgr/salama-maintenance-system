'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle, Save, X, Calendar, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Visit } from '@/types/customer';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { formatDateForInput, convertInputDateToStandard } from '@/lib/date-handler';
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

interface VisitFormProps {
  visit?: Visit;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VisitForm({ visit, onSuccess, onCancel }: VisitFormProps) {
  const { addVisit, updateVisit } = useVisitsFirebase();
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();

  const [formData, setFormData] = useState({
    companyId: visit?.companyId || '',
    contractId: visit?.contractId || '',
    branchId: visit?.branchId || '',
    type: visit?.type || 'regular' as Visit['type'],
    status: visit?.status || 'scheduled' as Visit['status'],
    scheduledDate: visit?.scheduledDate || '',
    scheduledTime: visit?.scheduledTime || '',
    duration: visit?.duration?.toString() || '60',
    assignedTeam: visit?.assignedTeam || '',
    assignedTechnician: visit?.assignedTechnician || '',
    notes: visit?.notes || '',
    services: {
      fireExtinguisher: visit?.services?.fireExtinguisher || false,
      alarmSystem: visit?.services?.alarmSystem || false,
      fireSuppression: visit?.services?.fireSuppression || false,
      gasSystem: visit?.services?.gasSystem || false,
      foamSystem: visit?.services?.foamSystem || false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [visitAttachments, setVisitAttachments] = useState<UploadedFile[]>(
    visit?.attachments || []
  );

  // Filter data based on selections
  const availableContracts = contracts.filter(contract =>
    contract.companyId === formData.companyId && !contract.isArchived
  );

  const availableBranches = branches.filter(branch =>
    branch.companyId === formData.companyId &&
    (formData.contractId ? 
      contracts.some(contract => 
        contract.contractId === formData.contractId &&
        contract.serviceBatches?.some(batch => 
          batch.branchIds.includes(branch.branchId)
        )
      ) : true
    ) &&
    !branch.isArchived
  );

  const selectedContract = contracts.find(c => c.contractId === formData.contractId);

  // Check if visit date is within contract period
  const checkContractDateValidity = useCallback(() => {
    console.log('🔍 Checking contract date validity:', {
      contractId: formData.contractId,
      scheduledDate: formData.scheduledDate,
      contractsCount: contracts.length
    });

    if (!formData.contractId || !formData.scheduledDate) {
      setWarnings(prev => ({ ...prev, contractDate: '' }));
      return;
    }

    const contract = contracts.find(c => c.contractId === formData.contractId);
    console.log('📋 Found contract:', contract);

    if (!contract) {
      setWarnings(prev => ({ ...prev, contractDate: '' }));
      return;
    }

    // Parse dates properly - scheduledDate might be in different format
    const visitDate = new Date(formData.scheduledDate);
    const contractStart = new Date(contract.contractStartDate);
    const contractEnd = new Date(contract.contractEndDate);

    console.log('📅 Date comparison:', {
      visitDate: visitDate.toISOString(),
      contractStart: contractStart.toISOString(),
      contractEnd: contractEnd.toISOString(),
      isOutside: visitDate < contractStart || visitDate > contractEnd
    });

    if (visitDate < contractStart || visitDate > contractEnd) {
      const warningMessage = `⚠️ تحذير: تاريخ الزيارة خارج فترة العقد (${contract.contractStartDate} - ${contract.contractEndDate}). يمكن حفظ الزيارة لكنها لن تُحسب ضمن إحصائيات العقد.`;
      console.log('⚠️ Setting warning:', warningMessage);
      setWarnings(prev => ({
        ...prev,
        contractDate: warningMessage
      }));
    } else {
      console.log('✅ Date is within contract period');
      setWarnings(prev => ({ ...prev, contractDate: '' }));
    }
  }, [formData.contractId, formData.scheduledDate, contracts]);

  // Trigger contract date validation when contract or date changes
  useEffect(() => {
    checkContractDateValidity();
  }, [formData.contractId, formData.scheduledDate, contracts, checkContractDateValidity]); // Added checkContractDateValidity

  // Auto-populate services based on selected contract
  useEffect(() => {
    if (selectedContract && !visit) {
      setFormData(prev => ({
        ...prev,
        services: {
          fireExtinguisher: selectedContract.serviceBatches?.[0]?.services?.fireExtinguisherMaintenance || false,
          alarmSystem: selectedContract.serviceBatches?.[0]?.services?.alarmSystemMaintenance || false,
          fireSuppression: selectedContract.serviceBatches?.[0]?.services?.fireSuppressionMaintenance || false,
          gasSystem: selectedContract.serviceBatches?.[0]?.services?.gasFireSuppression || false,
          foamSystem: selectedContract.serviceBatches?.[0]?.services?.foamFireSuppression || false,
        }
      }));
    }
  }, [selectedContract, visit]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyId.trim()) {
      newErrors.companyId = 'اختيار الشركة مطلوب';
    }

    if (!formData.contractId.trim()) {
      newErrors.contractId = 'اختيار العقد مطلوب';
    }

    if (!formData.branchId.trim()) {
      newErrors.branchId = 'اختيار الفرع مطلوب';
    }

    if (!formData.scheduledDate.trim()) {
      newErrors.scheduledDate = 'تاريخ الزيارة مطلوب';
    }

    if (formData.scheduledTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.scheduledTime)) {
      newErrors.scheduledTime = 'صيغة الوقت غير صحيحة (HH:MM)';
    }

    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0)) {
      newErrors.duration = 'مدة الزيارة يجب أن تكون رقم صحيح موجب';
    }

    const hasAnyService = Object.values(formData.services).some(service => service);
    if (!hasAnyService) {
      newErrors.services = 'يجب اختيار خدمة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const visitData = {
        ...formData,
        scheduledDate: convertInputDateToStandard(formData.scheduledDate),
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        attachments: visitAttachments,
        createdBy: 'current-user', // This should come from auth context
      };

      if (visit) {
        // Update existing visit
        const success = await updateVisit(visit.id, visitData);
        if (success) {
          setSuccessMessage('تم تحديث بيانات الزيارة بنجاح');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setErrorMessage('فشل في تحديث بيانات الزيارة');
        }
      } else {
        // Add new visit
        const result = await addVisit(visitData);
        if (result.success) {
          setSuccessMessage('تم إضافة الزيارة بنجاح');
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setErrorMessage(result.error || 'فشل في إضافة الزيارة');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrorMessage('حدث خطأ أثناء العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | Record<string, boolean>) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset dependent fields when parent changes
    if (field === 'companyId') {
      setFormData(prev => ({ ...prev, contractId: '', branchId: '' }));
    } else if (field === 'contractId') {
      setFormData(prev => ({ ...prev, branchId: '' }));
    }
  };

  const handleServiceChange = (serviceKey: string, checked: boolean) => {
    const updatedServices = { ...formData.services, [serviceKey]: checked };
    handleInputChange('services', updatedServices);

    // Clear services error when any service is selected
    if (checked && errors.services) {
      setErrors(prev => ({ ...prev, services: '' }));
    }
  };

  // Handle file uploads
  const handleFilesUploaded = (files: UploadedFile[]) => {
    setVisitAttachments(prev => [...prev, ...files]);
  };

  const handleFileDeleted = (filePath: string) => {
    setVisitAttachments(prev => prev.filter(file => file.path !== filePath));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-right">
            {visit ? 'تعديل الزيارة' : 'إضافة زيارة جديدة'}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label htmlFor="companyId" className="text-right block">
                  الشركة *
                </Label>
                <Select
                  value={formData.companyId}
                  onValueChange={(value) => handleInputChange('companyId', value)}
                  dir="rtl"
                >
                  <SelectTrigger className={errors.companyId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.filter(c => !c.isArchived).map((company) => (
                      <SelectItem key={company.companyId} value={company.companyId}>
                        {company.companyName} ({company.companyId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-sm text-red-500 text-right">{errors.companyId}</p>
                )}
              </div>

              {/* Contract Selection */}
              <div className="space-y-2">
                <Label htmlFor="contractId" className="text-right block">
                  العقد *
                </Label>
                <Select
                  value={formData.contractId}
                  onValueChange={(value) => handleInputChange('contractId', value)}
                  disabled={!formData.companyId}
                  dir="rtl"
                >
                  <SelectTrigger className={errors.contractId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر العقد" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContracts.map((contract) => (
                      <SelectItem key={contract.contractId} value={contract.contractId}>
                        عقد {contract.contractId} ({contract.contractStartDate} - {contract.contractEndDate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contractId && (
                  <p className="text-sm text-red-500 text-right">{errors.contractId}</p>
                )}
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label htmlFor="branchId" className="text-right block">
                  الفرع *
                </Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(value) => handleInputChange('branchId', value)}
                  disabled={!formData.companyId}
                  dir="rtl"
                >
                  <SelectTrigger className={errors.branchId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.branchName} ({branch.branchId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && (
                  <p className="text-sm text-red-500 text-right">{errors.branchId}</p>
                )}
              </div>

              {/* Visit Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-right block">
                  نوع الزيارة *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                  dir="rtl"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">🔧 زيارة عادية</SelectItem>
                    <SelectItem value="emergency">🚨 زيارة طارئة</SelectItem>
                    <SelectItem value="followup">📋 زيارة متابعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate" className="text-right block">
                  تاريخ الزيارة *
                </Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formatDateForInput(formData.scheduledDate)}
                  onChange={(e) => handleInputChange('scheduledDate', convertInputDateToStandard(e.target.value))}
                  className={`text-right ${errors.scheduledDate ? 'border-red-500' : ''}`}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-red-500 text-right">{errors.scheduledDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime" className="text-right block">
                  وقت الزيارة
                </Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                  className={`text-right ${errors.scheduledTime ? 'border-red-500' : ''}`}
                />
                {errors.scheduledTime && (
                  <p className="text-sm text-red-500 text-right">{errors.scheduledTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-right block">
                  المدة المتوقعة (دقيقة)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="60"
                  className={`text-right ${errors.duration ? 'border-red-500' : ''}`}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500 text-right">{errors.duration}</p>
                )}
              </div>
            </div>

            {/* Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTeam" className="text-right block">
                  الفريق المختص
                </Label>
                <Input
                  id="assignedTeam"
                  value={formData.assignedTeam}
                  onChange={(e) => handleInputChange('assignedTeam', e.target.value)}
                  placeholder="اسم الفريق المختص"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTechnician" className="text-right block">
                  التقني المختص
                </Label>
                <Input
                  id="assignedTechnician"
                  value={formData.assignedTechnician}
                  onChange={(e) => handleInputChange('assignedTechnician', e.target.value)}
                  placeholder="اسم التقني المختص"
                  className="text-right"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-3">
              <Label className="text-right block">خدمات السلامة المطلوبة *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                        { key: 'fireExtinguisher', label: '🧯 صيانة طفايات الحريق', enabled: selectedContract?.serviceBatches?.[0]?.services?.fireExtinguisherMaintenance || false },
      { key: 'alarmSystem', label: '⚠️ صيانة نظام الإنذار', enabled: selectedContract?.serviceBatches?.[0]?.services?.alarmSystemMaintenance || false },
      { key: 'fireSuppression', label: '💧 صيانة نظام الإطفاء', enabled: selectedContract?.serviceBatches?.[0]?.services?.fireSuppressionMaintenance || false },
      { key: 'gasSystem', label: '🟦 نظام الإطفاء بالغاز', enabled: selectedContract?.serviceBatches?.[0]?.services?.gasFireSuppression || false },
      { key: 'foamSystem', label: '🟢 نظام الإطفاء بالفوم', enabled: selectedContract?.serviceBatches?.[0]?.services?.foamFireSuppression || false },
                ].map(({ key, label, enabled }) => (
                  <div key={key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={key}
                      checked={formData.services[key as keyof typeof formData.services]}
                      onCheckedChange={(checked) => handleServiceChange(key, !!checked)}
                      disabled={enabled === false}
                    />
                    <Label
                      htmlFor={key}
                      className={`text-sm ${enabled === false ? 'text-gray-400' : ''}`}
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.services && (
                <p className="text-sm text-red-500 text-right">{errors.services}</p>
              )}
              {selectedContract && (
                <p className="text-xs text-gray-500 text-right">
                  الخدمات المتاحة محددة حسب العقد المختار
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right block">
                ملاحظات
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="أي ملاحظات إضافية حول الزيارة"
                className="text-right min-h-[100px]"
                dir="rtl"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label className="text-right block">
                مرفقات الزيارة
              </Label>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                onFileDeleted={handleFileDeleted}
                existingFiles={visitAttachments}
                folder={`visits/${formData.branchId || 'temp'}`}
                maxFiles={10}
                maxSize={25}
                allowedTypes={['image', 'pdf', 'doc', 'docx']}
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 text-right">
                يمكنك رفع صور الزيارة والتقارير والمستندات الداعمة
              </p>
            </div>

            {/* Warning Messages */}
            {warnings.contractDate && (
              <Alert className="border-yellow-500 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 text-right">
                  {warnings.contractDate}
                </AlertDescription>
              </Alert>
            )}

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
                {isSubmitting ? 'جاري الحفظ...' : (visit ? 'تحديث' : 'إضافة')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
