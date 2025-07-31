'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, FileText, Calendar } from 'lucide-react';
import { Contract } from '@/types/customer';
import { formatDateForInput } from '@/lib/date-handler';

interface ContractAddendumFormProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addendumData: {
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
  }) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export function ContractAddendumForm({
  contract,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: ContractAddendumFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    effectiveDate: formatDateForInput(new Date()),
    contractValue: 0,
    notes: '',
    services: {
      fireExtinguisherMaintenance: false,
      alarmSystemMaintenance: false,
      fireSuppressionMaintenance: false,
      gasFireSuppression: false,
      foamFireSuppression: false,
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: checked
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'وصف الإضافة مطلوب';
    }

    if (!formData.effectiveDate) {
      newErrors.effectiveDate = 'تاريخ السريان مطلوب';
    }

    if (formData.contractValue <= 0) {
      newErrors.contractValue = 'قيمة العقد يجب أن تكون أكبر من صفر';
    }

    // Check if at least one service is selected
    const hasServices = Object.values(formData.services).some(service => service);
    if (!hasServices) {
      newErrors.services = 'يجب اختيار خدمة واحدة على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await onSubmit(formData);
    
    if (result.success) {
      // Reset form
      setFormData({
        description: '',
        effectiveDate: formatDateForInput(new Date()),
        contractValue: 0,
        notes: '',
        services: {
          fireExtinguisherMaintenance: false,
          alarmSystemMaintenance: false,
          fireSuppressionMaintenance: false,
          gasFireSuppression: false,
          foamFireSuppression: false,
        }
      });
      setErrors({});
      onClose();
    } else {
      setErrors({ submit: result.error || 'حدث خطأ أثناء إضافة الإضافة' });
    }
  };

  const handleClose = () => {
    setFormData({
      description: '',
      effectiveDate: formatDateForInput(new Date()),
      contractValue: 0,
      notes: '',
      services: {
        fireExtinguisherMaintenance: false,
        alarmSystemMaintenance: false,
        fireSuppressionMaintenance: false,
        gasFireSuppression: false,
        foamFireSuppression: false,
      }
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            إضافة إضافة للعقد
          </DialogTitle>
          <DialogDescription>
            إضافة خدمات جديدة للعقد {contract.contractId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">معلومات العقد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">معرف العقد:</span>
                  <Badge variant="outline" className="mr-2">{contract.contractId}</Badge>
                </div>
                <div>
                  <span className="font-medium">تاريخ البداية:</span>
                  <span className="mr-2">{contract.contractStartDate}</span>
                </div>
                <div>
                  <span className="font-medium">تاريخ الانتهاء:</span>
                  <span className="mr-2">{contract.contractEndDate}</span>
                </div>
                <div>
                  <span className="font-medium">قيمة العقد الحالية:</span>
                  <span className="mr-2">{contract.contractValue?.toLocaleString()} ريال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addendum Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">تفاصيل الإضافة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <Label htmlFor="description">وصف الإضافة *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="وصف الخدمات الجديدة المضافة للعقد..."
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Effective Date */}
              <div>
                <Label htmlFor="effectiveDate">تاريخ السريان *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  className={errors.effectiveDate ? 'border-red-500' : ''}
                />
                {errors.effectiveDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.effectiveDate}</p>
                )}
              </div>

              {/* Contract Value */}
              <div>
                <Label htmlFor="contractValue">قيمة الإضافة (ريال) *</Label>
                <Input
                  id="contractValue"
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => handleInputChange('contractValue', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.contractValue ? 'border-red-500' : ''}
                />
                {errors.contractValue && (
                  <p className="text-red-500 text-xs mt-1">{errors.contractValue}</p>
                )}
              </div>

              {/* Services */}
              <div>
                <Label>الخدمات المضافة *</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="fireExtinguisher"
                      checked={formData.services.fireExtinguisherMaintenance}
                      onCheckedChange={(checked) => handleServiceChange('fireExtinguisherMaintenance', checked === true)}
                    />
                    <Label htmlFor="fireExtinguisher" className="text-sm">صيانة الطفايات</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="alarmSystem"
                      checked={formData.services.alarmSystemMaintenance}
                      onCheckedChange={(checked) => handleServiceChange('alarmSystemMaintenance', checked === true)}
                    />
                    <Label htmlFor="alarmSystem" className="text-sm">صيانة نظام الإنذار</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="fireSuppression"
                      checked={formData.services.fireSuppressionMaintenance}
                      onCheckedChange={(checked) => handleServiceChange('fireSuppressionMaintenance', checked === true)}
                    />
                    <Label htmlFor="fireSuppression" className="text-sm">صيانة نظام الإطفاء</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="gasSystem"
                      checked={formData.services.gasFireSuppression}
                      onCheckedChange={(checked) => handleServiceChange('gasFireSuppression', checked === true)}
                    />
                    <Label htmlFor="gasSystem" className="text-sm">نظام الإطفاء بالغاز</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="foamSystem"
                      checked={formData.services.foamFireSuppression}
                      onCheckedChange={(checked) => handleServiceChange('foamFireSuppression', checked === true)}
                    />
                    <Label htmlFor="foamSystem" className="text-sm">صيانة نظام الإطفاء بالفوم</Label>
                  </div>
                </div>
                {errors.services && (
                  <p className="text-red-500 text-xs mt-1">{errors.services}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="ملاحظات إضافية حول الإضافة..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <div>• ستتم إضافة الإضافة إلى العقد الحالي</div>
                <div>• سيتم تحديث قيمة العقد الإجمالية</div>
                <div>• يمكن تعديل الإضافة لاحقاً</div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'جاري الإضافة...' : 'إضافة الإضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 