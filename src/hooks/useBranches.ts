import { useState, useEffect, useCallback, useRef } from 'react';
import { Branch } from '@/types/customer';
import { generateBranchId } from '@/lib/id-generator';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current state and avoid staleness
  const branchesRef = useRef<Branch[]>([]);

  // Update ref whenever branches state changes
  useEffect(() => {
    branchesRef.current = branches;
  }, [branches]);

  // Safe localStorage operations
  const loadBranches = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<Branch[]>('branches', []);
      const branchArray = Array.isArray(stored) ? stored : [];
      setBranches(branchArray);
      branchesRef.current = branchArray;
      setError(null);
    } catch (err) {
      console.error('Failed to load branches:', err);
      setBranches([]);
      branchesRef.current = [];
      setError('فشل في تحميل بيانات الفروع');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBranches = useCallback((newBranches: Branch[]) => {
    try {
      const success = SafeStorage.set('branches', newBranches);
      if (success) {
        setBranches(newBranches);
        branchesRef.current = newBranches;
        setError(null);
      } else {
        setError('فشل في حفظ بيانات الفروع');
      }
    } catch (err) {
      console.error('Failed to save branches:', err);
      setError('فشل في حفظ بيانات الفروع');
    }
  }, []);

  const addBranch = useCallback(
    (
      branchData: Omit<
        Branch,
        'id' | 'branchId' | 'isArchived' | 'createdAt' | 'updatedAt' | 'weeklyPlan'
      >
    ): { success: boolean; branch?: Branch; warnings?: string[] } => {
      try {
        console.log('➕ Adding new branch:', branchData.branchName);

        // Use branchesRef.current to get the MOST current state
        const currentBranches = branchesRef.current;
        console.log('📊 Current branches count in ref:', currentBranches.length);

        // Generate branch ID with current state
        const idResult = generateBranchId(
          branchData.companyId,
          branchData.city,
          branchData.location,
          currentBranches
        );

        if (!idResult.branchId) {
          console.error('❌ Failed to generate branch ID:', idResult.warnings.join(', '));
          setError('فشل في إنشاء رقم الفرع: ' + idResult.warnings.join(', '));
          return { success: false, warnings: idResult.warnings };
        }

        console.log('🆔 Generated branch ID:', idResult.branchId);

        const newBranch: Branch = {
          ...branchData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          branchId: idResult.branchId,
          isArchived: false,
          weeklyPlan: {},
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        console.log('🏪 Created branch object:', newBranch.branchName);

        // Add to branches array
        const updatedBranches = [...currentBranches, newBranch];
        console.log('📊 Branches count after add:', updatedBranches.length);

        // Save to localStorage first
        try {
          const saveSuccess = SafeStorage.set('branches', updatedBranches);
          if (!saveSuccess) {
            console.error('❌ Failed to save branches to localStorage');
            setError('فشل في حفظ بيانات الفروع');
            return { success: false, warnings: idResult.warnings };
          }

          console.log('✅ Successfully saved branches to localStorage');

          // Update React state and ref
          setBranches(updatedBranches);
          branchesRef.current = updatedBranches;
          setError(null);

          console.log('🎯 FINAL SUCCESS: Successfully added branch:', newBranch.branchName);
          return {
            success: true,
            branch: newBranch,
            warnings: idResult.warnings,
          };
        } catch (saveErr) {
          console.error('💥 Error saving branches:', saveErr);
          setError('فشل في حفظ بيانات الفروع');
          return { success: false, warnings: idResult.warnings };
        }
      } catch (err) {
        console.error('💥 Failed to add branch:', err);
        setError('فشل في إضافة الفرع');
        return { success: false };
      }
    },
    [setError]
  );

  const updateBranch = useCallback(
    (branchId: string, updates: Partial<Branch>): boolean => {
      try {
        const currentBranches = branchesRef.current;
        const branchIndex = currentBranches.findIndex(b => b.id === branchId);
        if (branchIndex === -1) {
          setError('الفرع غير موجود');
          return false;
        }

        const updatedBranch = {
          ...currentBranches[branchIndex],
          ...updates,
          updatedAt: getCurrentDate(),
        };

        const updatedBranches = [...currentBranches];
        updatedBranches[branchIndex] = updatedBranch;
        saveBranches(updatedBranches);

        return true;
      } catch (err) {
        console.error('Failed to update branch:', err);
        setError('فشل في تحديث بيانات الفرع');
        return false;
      }
    },
    [saveBranches]
  );

  const archiveBranch = useCallback(
    (branchId: string, archivedBy: string): boolean => {
      try {
        const currentBranches = branchesRef.current;
        const branchIndex = currentBranches.findIndex(b => b.id === branchId);
        if (branchIndex === -1) {
          setError('الفرع غير موجود');
          return false;
        }

        const updatedBranch = {
          ...currentBranches[branchIndex],
          isArchived: true,
          archivedBy,
          archivedAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        const updatedBranches = [...currentBranches];
        updatedBranches[branchIndex] = updatedBranch;
        saveBranches(updatedBranches);

        return true;
      } catch (err) {
        console.error('Failed to archive branch:', err);
        setError('فشل في أرشفة الفرع');
        return false;
      }
    },
    [saveBranches]
  );

  const unarchiveBranch = useCallback(
    (branchId: string): boolean => {
      try {
        const currentBranches = branchesRef.current;
        const branchIndex = currentBranches.findIndex(b => b.id === branchId);
        if (branchIndex === -1) {
          setError('الفرع غير موجود');
          return false;
        }

        const updatedBranch = {
          ...currentBranches[branchIndex],
          isArchived: false,
          archivedBy: undefined,
          archivedAt: undefined,
          updatedAt: getCurrentDate(),
        };

        const updatedBranches = [...currentBranches];
        updatedBranches[branchIndex] = updatedBranch;
        saveBranches(updatedBranches);

        return true;
      } catch (err) {
        console.error('Failed to unarchive branch:', err);
        setError('فشل في إلغاء أرشفة الفرع');
        return false;
      }
    },
    [saveBranches]
  );

  const deleteBranch = useCallback(
    (branchId: string): boolean => {
      try {
        console.log('🗑️ Deleting branch ID:', branchId);
        console.log('📊 Current branches count before delete:', branchesRef.current.length);

        // Use functional update to get fresh state
        setBranches(currentBranches => {
          const updatedBranches = currentBranches.filter(b => b.id !== branchId);
          console.log('📊 Branches count after delete:', updatedBranches.length);

          // Save to localStorage
          try {
            const success = SafeStorage.set('branches', updatedBranches);
            if (!success) {
              console.error('❌ Failed to save branches to localStorage');
              setError('فشل في حفظ بيانات الفروع');
            } else {
              console.log('✅ Successfully saved branches to localStorage');
              setError(null);
            }
            branchesRef.current = updatedBranches;
          } catch (saveErr) {
            console.error('💥 Error saving branches:', saveErr);
            setError('فشل في حفظ بيانات الفروع');
            branchesRef.current = updatedBranches;
          }

          return updatedBranches;
        });

        return true;
      } catch (err) {
        console.error('💥 Failed to delete branch:', err);
        setError('فشل في حذف الفرع');
        return false;
      }
    },
    [setError]
  );

  const getBranchById = useCallback(
    (branchId: string): Branch | undefined => {
      return branchesRef.current.find(b => b.branchId === branchId);
    },
    []
  );

  const getBranchesByCompany = useCallback(
    (companyId: string): Branch[] => {
      return branchesRef.current.filter(b => b.companyId === companyId);
    },
    []
  );

  // Note: Contract-branch relationship functions removed as they're incompatible 
  // with new serviceBatches architecture where branches are linked through 
  // contract serviceBatches rather than branch contractIds

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount - only once
  useEffect(() => {
    loadBranches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    branches,
    loading,
    error,
    addBranch,
    updateBranch,
    archiveBranch,
    unarchiveBranch,
    deleteBranch,
    getBranchById,
    getBranchesByCompany,
    refreshBranches: loadBranches,
    clearError,
  };
}
