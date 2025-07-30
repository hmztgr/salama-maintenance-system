'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { generateBranchId } from '@/lib/id-generator';

export function BranchIdFixer() {
  const { branches, updateBranch } = useBranchesFirebase();
  const { companies } = useCompaniesFirebase();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    totalBranches: number;
    fixedBranches: number;
    errors: string[];
  }>({ totalBranches: 0, fixedBranches: 0, errors: [] });

  const findDuplicateBranchIds = () => {
    const branchIdCounts = new Map<string, string[]>();
    
    branches.forEach(branch => {
      if (!branchIdCounts.has(branch.branchId)) {
        branchIdCounts.set(branch.branchId, []);
      }
      branchIdCounts.get(branch.branchId)!.push(branch.id);
    });

    const duplicates = Array.from(branchIdCounts.entries())
      .filter(([_, branchIds]) => branchIds.length > 1)
      .map(([branchId, branchIds]) => ({ branchId, branchIds }));

    return duplicates;
  };

  const fixDuplicateBranchIds = async () => {
    setIsRunning(true);
    setResults({ totalBranches: 0, fixedBranches: 0, errors: [] });

    try {
      const duplicates = findDuplicateBranchIds();
      console.log('🔍 Found duplicate branch IDs:', duplicates);

      if (duplicates.length === 0) {
        setResults({ totalBranches: branches.length, fixedBranches: 0, errors: ['لا توجد معرفات فروع مكررة'] });
        return;
      }

      let fixedCount = 0;
      const errors: string[] = [];

      for (const duplicate of duplicates) {
        const { branchId, branchIds } = duplicate;
        console.log(`🔧 Fixing duplicate branch ID: ${branchId} (${branchIds.length} branches)`);

        // Get all branches with this ID
        const branchesToFix = branches.filter(b => b.branchId === branchId);
        
        // Group by company to handle each company's branches separately
        const branchesByCompany = new Map<string, typeof branchesToFix>();
        branchesToFix.forEach(branch => {
          if (!branchesByCompany.has(branch.companyId)) {
            branchesByCompany.set(branch.companyId, []);
          }
          branchesByCompany.get(branch.companyId)!.push(branch);
        });

        for (const [companyId, companyBranches] of branchesByCompany) {
          // Get existing branches for this company to pass to generateBranchId
          const existingBranches = branches.filter(b => b.companyId === companyId);
          
          for (let i = 0; i < companyBranches.length; i++) {
            const branch = companyBranches[i];
            
            try {
              // Generate new branch ID
              const { branchId: newBranchId, warnings } = generateBranchId(
                branch.companyId,
                branch.city,
                branch.location,
                existingBranches
              );

              if (warnings.length > 0) {
                errors.push(`تحذير لفرع ${branch.branchName}: ${warnings.join(', ')}`);
                continue;
              }

              if (newBranchId && newBranchId !== branch.branchId) {
                console.log(`🔄 Updating branch ${branch.branchName}: ${branch.branchId} → ${newBranchId}`);
                
                // Update the branch with new ID
                const success = await updateBranch(branch.id, { branchId: newBranchId });
                
                if (success) {
                  fixedCount++;
                  console.log(`✅ Successfully updated branch ${branch.branchName}`);
                } else {
                  errors.push(`فشل في تحديث الفرع ${branch.branchName}`);
                }
              }
            } catch (error) {
              console.error(`❌ Error fixing branch ${branch.branchName}:`, error);
              errors.push(`خطأ في إصلاح الفرع ${branch.branchName}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
            }
          }
        }
      }

      setResults({
        totalBranches: branches.length,
        fixedBranches: fixedCount,
        errors
      });

    } catch (error) {
      console.error('❌ Error in fixDuplicateBranchIds:', error);
      setResults({
        totalBranches: branches.length,
        fixedBranches: 0,
        errors: [`خطأ عام: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  const duplicates = findDuplicateBranchIds();

  return (
    <Card>
      <CardHeader>
        <CardTitle>إصلاح معرفات الفروع المكررة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          هذا الأداة تكتشف وتصلح معرفات الفروع المكررة باستخدام الخوارزمية المحسنة.
        </div>

        {duplicates.length > 0 && (
          <Alert>
            <AlertDescription>
              تم العثور على {duplicates.length} معرف فرع مكرر:
              <ul className="mt-2 list-disc list-inside">
                {duplicates.slice(0, 5).map((duplicate, index) => (
                  <li key={index}>
                    {duplicate.branchId} ({duplicate.branchIds.length} فرع)
                  </li>
                ))}
                {duplicates.length > 5 && <li>...و {duplicates.length - 5} آخرين</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {duplicates.length === 0 && branches.length > 0 && (
          <Alert>
            <AlertDescription>
              ✅ لا توجد معرفات فروع مكررة. جميع الفروع {branches.length} لها معرفات فريدة.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={fixDuplicateBranchIds}
          disabled={isRunning || duplicates.length === 0}
          className="w-full"
        >
          {isRunning ? 'جاري الإصلاح...' : `إصلاح ${duplicates.length} معرف مكرر`}
        </Button>

        {results.totalBranches > 0 && (
          <div className="space-y-2">
            <div className="text-sm">
              <strong>النتائج:</strong>
              <ul className="mt-1 list-disc list-inside">
                <li>إجمالي الفروع: {results.totalBranches}</li>
                <li>الفروع المصلحة: {results.fixedBranches}</li>
              </ul>
            </div>

            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>الأخطاء:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {results.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 