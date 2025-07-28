'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { generateBranchId } from '@/lib/id-generator';
import { Branch } from '@/types/customer';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export function BranchIdFixer() {
  const { hasPermission } = useAuth();
  const { branches, updateBranch } = useBranchesFirebase();
  const [isFixing, setIsFixing] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{
    baseId: string;
    branches: Branch[];
  }>>([]);
  const [fixedCount, setFixedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check permissions
  if (!hasPermission('admin')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إصلاح معرفات الفروع المكررة</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تحتاج إلى صلاحيات المدير للوصول إلى هذه الصفحة
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Find duplicate branch IDs
  useEffect(() => {
    const duplicates = new Map<string, Branch[]>();
    
    branches.forEach(branch => {
      const existing = duplicates.get(branch.branchId) || [];
      existing.push(branch);
      duplicates.set(branch.branchId, existing);
    });

    const duplicateGroups = Array.from(duplicates.entries())
      .filter(([_, branches]) => branches.length > 1)
      .map(([baseId, branches]) => ({
        baseId,
        branches: branches.sort((a, b) => a.branchName.localeCompare(b.branchName))
      }));

    setDuplicateGroups(duplicateGroups);
  }, [branches]);

  const fixDuplicateIds = async () => {
    setIsFixing(true);
    setError(null);
    let fixed = 0;

    try {
      for (const group of duplicateGroups) {
        // Keep the first branch with the original ID, fix the rest
        const branchesToFix = group.branches.slice(1);
        
        for (const branch of branchesToFix) {
          // Generate a new unique ID for this branch
          const otherBranches = branches.filter(b => b.branchId !== branch.branchId);
          const { branchId: newBranchId } = generateBranchId(
            branch.companyId,
            branch.city,
            branch.location,
            otherBranches
          );

          if (newBranchId && newBranchId !== branch.branchId) {
            // Update the branch with the new ID
            const updatedBranch = { ...branch, branchId: newBranchId };
            const result = await updateBranch(branch.id, updatedBranch);
            
            if (result.success) {
              fixed++;
              console.log(`✅ Fixed branch ${branch.branchName}: ${branch.branchId} → ${newBranchId}`);
            } else {
              console.error(`❌ Failed to fix branch ${branch.branchName}:`, result.warnings);
            }
          }
        }
      }

      setFixedCount(fixed);
      
    } catch (err) {
      setError(`خطأ أثناء إصلاح المعرفات: ${err}`);
      console.error('Error fixing branch IDs:', err);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          إصلاح معرفات الفروع المكررة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fixedCount > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              تم إصلاح {fixedCount} معرف فرع مكرر بنجاح
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            تم العثور على {duplicateGroups.length} مجموعة من الفروع المكررة المعرفات
          </p>
          
          {duplicateGroups.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">الفروع المكررة:</h4>
              {duplicateGroups.map((group, index) => (
                <div key={index} className="p-3 bg-orange-50 rounded-md border">
                  <p className="font-medium text-orange-800">المعرف المكرر: {group.baseId}</p>
                  <ul className="mt-2 space-y-1">
                    {group.branches.map((branch, branchIndex) => (
                      <li key={branchIndex} className="text-sm text-orange-700">
                        • {branch.branchName} ({branch.city}) - {branch.companyId}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {duplicateGroups.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                لا توجد معرفات فروع مكررة في النظام
              </AlertDescription>
            </Alert>
          )}
        </div>

        {duplicateGroups.length > 0 && (
          <Button
            onClick={fixDuplicateIds}
            disabled={isFixing}
            className="w-full"
            variant="destructive"
          >
            {isFixing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري الإصلاح...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                إصلاح المعرفات المكررة
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 