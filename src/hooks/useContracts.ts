import { useState, useEffect, useCallback, useRef } from 'react';
import { Contract } from '@/types/customer';
import { generateContractId } from '@/lib/id-generator';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current state and avoid staleness
  const contractsRef = useRef<Contract[]>([]);

  // Update ref whenever contracts state changes
  useEffect(() => {
    contractsRef.current = contracts;
  }, [contracts]);

  // Safe localStorage operations
  const loadContracts = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<Contract[]>('contracts', []);
      const contractArray = Array.isArray(stored) ? stored : [];
      setContracts(contractArray);
      contractsRef.current = contractArray;
      setError(null);
    } catch (err) {
      console.error('Failed to load contracts:', err);
      setContracts([]);
      contractsRef.current = [];
      setError('فشل في تحميل بيانات العقود');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveContracts = useCallback((newContracts: Contract[]) => {
    try {
      const success = SafeStorage.set('contracts', newContracts);
      if (success) {
        setContracts(newContracts);
        contractsRef.current = newContracts;
        setError(null);
      } else {
        setError('فشل في حفظ بيانات العقود');
      }
    } catch (err) {
      console.error('Failed to save contracts:', err);
      setError('فشل في حفظ بيانات العقود');
    }
  }, []);

  const addContract = useCallback(
    (
      contractData: Omit<
        Contract,
        'id' | 'contractId' | 'isArchived' | 'createdAt' | 'updatedAt'
      >
    ): { success: boolean; contract?: Contract; warnings?: string[] } => {
      try {
        console.log('➕ Adding new contract for company:', contractData.companyId);

        // Use contractsRef.current to get the MOST current state
        const currentContracts = contractsRef.current;
        console.log('📊 Current contracts count in ref:', currentContracts.length);

        // Create the contract object using fresh current state
        const contractId = generateContractId(contractData.companyId, currentContracts);
        console.log('🆔 Generated contract ID:', contractId);

        const newContract: Contract = {
          ...contractData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          contractId,
          isArchived: false,
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        console.log('📋 Created contract object:', newContract.contractId);

        // Add to contracts array
        const updatedContracts = [...currentContracts, newContract];
        console.log('📊 Contracts count after add:', updatedContracts.length);

        // Save to localStorage first
        try {
          const saveSuccess = SafeStorage.set('contracts', updatedContracts);
          if (!saveSuccess) {
            console.error('❌ Failed to save contracts to localStorage');
            setError('فشل في حفظ بيانات العقود');
            return { success: false };
          }

          console.log('✅ Successfully saved contracts to localStorage');

          // Update React state and ref
          setContracts(updatedContracts);
          contractsRef.current = updatedContracts;
          setError(null);

          console.log('🎯 FINAL SUCCESS: Successfully added contract:', newContract.contractId);
          return {
            success: true,
            contract: newContract,
          };
        } catch (saveErr) {
          console.error('💥 Error saving contracts:', saveErr);
          setError('فشل في حفظ بيانات العقود');
          return { success: false };
        }
      } catch (err) {
        console.error('💥 Failed to add contract:', err);
        setError('فشل في إضافة العقد');
        return { success: false };
      }
    },
    [setError]
  );

  const updateContract = useCallback(
    (contractId: string, updates: Partial<Contract>): boolean => {
      try {
        const currentContracts = contractsRef.current;
        const contractIndex = currentContracts.findIndex((c) => c.id === contractId);
        if (contractIndex === -1) {
          setError('العقد غير موجود');
          return false;
        }

        const updatedContract = {
          ...currentContracts[contractIndex],
          ...updates,
          updatedAt: getCurrentDate(),
        };

        const updatedContracts = [...currentContracts];
        updatedContracts[contractIndex] = updatedContract;
        saveContracts(updatedContracts);

        return true;
      } catch (err) {
        console.error('Failed to update contract:', err);
        setError('فشل في تحديث بيانات العقد');
        return false;
      }
    },
    [saveContracts]
  );

  const archiveContract = useCallback(
    (contractId: string, archivedBy: string): boolean => {
      try {
        const currentContracts = contractsRef.current;
        const contractIndex = currentContracts.findIndex((c) => c.id === contractId);
        if (contractIndex === -1) {
          setError('العقد غير موجود');
          return false;
        }

        const updatedContract = {
          ...currentContracts[contractIndex],
          isArchived: true,
          archivedBy,
          archivedAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        const updatedContracts = [...currentContracts];
        updatedContracts[contractIndex] = updatedContract;
        saveContracts(updatedContracts);

        return true;
      } catch (err) {
        console.error('Failed to archive contract:', err);
        setError('فشل في أرشفة العقد');
        return false;
      }
    },
    [saveContracts]
  );

  const unarchiveContract = useCallback(
    (contractId: string): boolean => {
      try {
        const currentContracts = contractsRef.current;
        const contractIndex = currentContracts.findIndex((c) => c.id === contractId);
        if (contractIndex === -1) {
          setError('العقد غير موجود');
          return false;
        }

        const updatedContract = {
          ...currentContracts[contractIndex],
          isArchived: false,
          archivedBy: undefined,
          archivedAt: undefined,
          updatedAt: getCurrentDate(),
        };

        const updatedContracts = [...currentContracts];
        updatedContracts[contractIndex] = updatedContract;
        saveContracts(updatedContracts);

        return true;
      } catch (err) {
        console.error('Failed to unarchive contract:', err);
        setError('فشل في إلغاء أرشفة العقد');
        return false;
      }
    },
    [saveContracts]
  );

  const deleteContract = useCallback(
    (contractId: string): boolean => {
      try {
        console.log('🗑️ Deleting contract ID:', contractId);
        console.log('📊 Current contracts count before delete:', contractsRef.current.length);

        // Use functional update to get fresh state
        setContracts((currentContracts) => {
          const updatedContracts = currentContracts.filter((c) => c.id !== contractId);
          contractsRef.current = updatedContracts;
          console.log('📊 Contracts count after delete:', updatedContracts.length);

          // Save to localStorage
          try {
            const success = SafeStorage.set('contracts', updatedContracts);
            if (!success) {
              console.error('❌ Failed to save contracts to localStorage');
              setError('فشل في حفظ بيانات العقود');
            } else {
              console.log('✅ Successfully saved contracts to localStorage');
              setError(null);
            }
          } catch (saveErr) {
            console.error('💥 Error saving contracts:', saveErr);
            setError('فشل في حفظ بيانات العقود');
          }

          return updatedContracts;
        });

        return true;
      } catch (err) {
        console.error('💥 Failed to delete contract:', err);
        setError('فشل في حذف العقد');
        return false;
      }
    },
    [setError]
  );

  const getContractById = useCallback(
    (contractId: string): Contract | undefined => {
      return contractsRef.current.find((c) => c.contractId === contractId);
    },
    []
  );

  const getContractsByCompany = useCallback(
    (companyId: string): Contract[] => {
      return contractsRef.current.filter((c) => c.companyId === companyId);
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount - only once
  useEffect(() => {
    loadContracts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    contracts,
    loading,
    error,
    addContract,
    updateContract,
    archiveContract,
    unarchiveContract,
    deleteContract,
    getContractById,
    getContractsByCompany,
    refreshContracts: loadContracts,
    clearError,
  };
}
