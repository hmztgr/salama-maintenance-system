'use client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Archive, Eye, Edit } from 'lucide-react';
import { Contract } from '@/types/customer';

interface ContractActionButtonsProps {
  contract: Contract;
  onRenewContract: () => void;
  onAddAddendum: () => void;
  onViewArchived: () => void;
  onEditContract: () => void;
  isLoading?: boolean;
}

export function ContractActionButtons({
  contract,
  onRenewContract,
  onAddAddendum,
  onViewArchived,
  onEditContract,
  isLoading = false
}: ContractActionButtonsProps) {
  // Check if contract is active and can be renewed
  const canRenew = contract.status === 'active' && !contract.isArchived;
  
  // Check if contract can have addendums added
  const canAddAddendum = contract.status === 'active' && !contract.isArchived;

  return (
    <div className="space-y-3">
      {/* Contract Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">حالة العقد:</span>
          <Badge 
            variant={
              contract.status === 'active' ? 'default' :
              contract.status === 'archived' ? 'secondary' :
              contract.status === 'expired' ? 'destructive' :
              'outline'
            }
          >
            {contract.status === 'active' ? 'نشط' :
             contract.status === 'archived' ? 'مؤرشف' :
             contract.status === 'expired' ? 'منتهي الصلاحية' :
             contract.status === 'cancelled' ? 'ملغي' : contract.status}
          </Badge>
        </div>
        
        {contract.isRenewed && (
          <Badge variant="outline" className="text-xs">
            مجدد
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Renew Contract Button */}
        {canRenew && (
          <Button
            onClick={onRenewContract}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            تجديد العقد
          </Button>
        )}

        {/* Add Addendum Button */}
        {canAddAddendum && (
          <Button
            onClick={onAddAddendum}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            إضافة إضافة
          </Button>
        )}

        {/* Edit Contract Button */}
        <Button
          onClick={onEditContract}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <Edit className="h-4 w-4 mr-2" />
          تعديل العقد
        </Button>

        {/* View Archived Contracts Button */}
        <Button
          onClick={onViewArchived}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <Archive className="h-4 w-4 mr-2" />
          العقود المؤرشفة
        </Button>
      </div>

      {/* Contract Information */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">معرف العقد:</span>
            <span className="font-mono font-medium">{contract.contractId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاريخ البداية:</span>
            <span>{contract.contractStartDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاريخ الانتهاء:</span>
            <span>{contract.contractEndDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">قيمة العقد:</span>
            <span className="font-medium">{contract.contractValue?.toLocaleString()} ريال</span>
          </div>
          {contract.addendums && contract.addendums.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">عدد الإضافات:</span>
              <Badge variant="outline" className="text-xs">
                {contract.addendums.length}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Addendums Summary */}
      {contract.addendums && contract.addendums.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">الإضافات المرفقة</h4>
          <div className="space-y-2">
            {contract.addendums.slice(0, 3).map((addendum, index) => (
              <div key={addendum.addendumId} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-blue-700 font-medium">
                    {addendum.description}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {addendum.effectiveDate}
                  </Badge>
                </div>
                <div className="text-blue-600">
                  {addendum.contractValue.toLocaleString()} ريال
                </div>
              </div>
            ))}
            {contract.addendums.length > 3 && (
              <div className="text-xs text-blue-600">
                + {contract.addendums.length - 3} إضافات أخرى
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract History Summary */}
      {contract.contractHistory && contract.contractHistory.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">سجل العقد</h4>
          <div className="space-y-1">
            {contract.contractHistory.slice(-3).map((entry, index) => (
              <div key={index} className="text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{entry.description}</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
            {contract.contractHistory.length > 3 && (
              <div className="text-xs text-gray-500">
                + {contract.contractHistory.length - 3} إجراءات أخرى
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 