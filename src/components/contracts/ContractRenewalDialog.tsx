'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Calendar, FileText, RefreshCw } from 'lucide-react';
import { Contract } from '@/types/customer';
import { parseStandardDate, formatDateForDisplay, addDays, addMonths } from '@/lib/date-handler';

interface ContractRenewalDialogProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (withChanges: boolean) => void;
  isLoading?: boolean;
}

export function ContractRenewalDialog({
  contract,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: ContractRenewalDialogProps) {
  const [withChanges, setWithChanges] = useState(false);

  // Calculate new contract dates
  const currentEndDate = parseStandardDate(contract.contractEndDate);
  const newStartDate = addDays(currentEndDate, 1);
  const contractDuration = contract.contractPeriodMonths || 12;
  const newEndDate = addMonths(newStartDate, contractDuration);

  const handleConfirm = () => {
    onConfirm(withChanges);
  };

  const handleClose = () => {
    setWithChanges(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            تجديد العقد
          </DialogTitle>
          <DialogDescription>
            تأكيد تجديد العقد {contract.contractId} للشركة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">العقد الحالي</CardTitle>
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
                  <span className="font-medium">قيمة العقد:</span>
                  <span className="mr-2">{contract.contractValue?.toLocaleString()} ريال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                العقد الجديد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">تاريخ البداية الجديد:</span>
                  <span className="mr-2 text-green-600 font-semibold">
                    {formatDateForDisplay(newStartDate)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">تاريخ الانتهاء الجديد:</span>
                  <span className="mr-2 text-green-600 font-semibold">
                    {formatDateForDisplay(newEndDate)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">مدة العقد:</span>
                  <span className="mr-2">{contractDuration} شهر</span>
                </div>
                <div>
                  <span className="font-medium">قيمة العقد:</span>
                  <span className="mr-2">{contract.contractValue?.toLocaleString()} ريال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Information */}
          {contract.serviceBatches && contract.serviceBatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الخدمات المدرجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contract.serviceBatches.map((batch, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium mb-1">دفعة الخدمة {index + 1}:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>الزيارات السنوية: {batch.regularVisitsPerYear}</div>
                        <div>الزيارات الطارئة: {batch.emergencyVisitsPerYear}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">خيارات التجديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="renew-same"
                  name="renewal-type"
                  checked={!withChanges}
                  onChange={() => setWithChanges(false)}
                  className="ml-2"
                />
                <label htmlFor="renew-same" className="text-sm">
                  تجديد بنفس الشروط (بدون تغييرات)
                </label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="renew-changes"
                  name="renewal-type"
                  checked={withChanges}
                  onChange={() => setWithChanges(true)}
                  className="ml-2"
                />
                <label htmlFor="renew-changes" className="text-sm">
                  تجديد مع تعديل الشروط
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="space-y-1">
                <div>• سيتم أرشفة العقد الحالي تلقائياً</div>
                <div>• سيتم نسخ جميع البيانات والخدمات إلى العقد الجديد</div>
                <div>• يمكن تعديل العقد الجديد بعد إنشائه</div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'جاري التجديد...' : 'تأكيد التجديد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 