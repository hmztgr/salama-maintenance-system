import { useState, useEffect, useCallback, useRef } from 'react';
import { Company } from '@/types/customer';
import { generateCompanyId } from '@/lib/id-generator';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current state and avoid staleness
  const companiesRef = useRef<Company[]>([]);

  // Update ref whenever companies state changes
  useEffect(() => {
    companiesRef.current = companies;
  }, [companies]);

  // Safe localStorage operations
  const loadCompanies = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<Company[]>('companies', []);
      const companyArray = Array.isArray(stored) ? stored : [];
      setCompanies(companyArray);
      companiesRef.current = companyArray;
      setError(null);
    } catch (err) {
      console.error('Failed to load companies:', err);
      setCompanies([]);
      companiesRef.current = [];
      setError('فشل في تحميل بيانات الشركات');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCompanies = useCallback((newCompanies: Company[]) => {
    try {
      const success = SafeStorage.set('companies', newCompanies);
      if (success) {
        setCompanies(newCompanies);
        companiesRef.current = newCompanies;
        setError(null);
      } else {
        setError('فشل في حفظ بيانات الشركات');
      }
    } catch (err) {
      console.error('Failed to save companies:', err);
      setError('فشل في حفظ بيانات الشركات');
    }
  }, []);

  const addCompany = useCallback(
    (
      companyData: Omit<Company, 'id' | 'companyId' | 'isArchived' | 'createdAt' | 'updatedAt'>,
      manualIdOverride?: string
    ): { success: boolean; company?: Company; warnings?: string[] } => {
      try {
        console.log('➕ Adding new company:', companyData.companyName);

        // Use companiesRef.current to get the MOST current state
        const currentCompanies = companiesRef.current;
        console.log('📊 Current companies count in ref:', currentCompanies.length);

        // Create the company object using the fresh current state
        const companyId = manualIdOverride || generateCompanyId(currentCompanies);
        console.log('🆔 Generated company ID:', companyId);

        const newCompany: Company = {
          ...companyData,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          companyId,
          isArchived: false,
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        console.log('🏢 Created company object:', newCompany.companyName);

        // Add to companies array using fresh state
        const updatedCompanies = [...currentCompanies, newCompany];
        console.log('📊 Companies count after add:', updatedCompanies.length);

        // Save to localStorage
        try {
          const saveSuccess = SafeStorage.set('companies', updatedCompanies);
          if (!saveSuccess) {
            console.error('❌ Failed to save companies to localStorage');
            setError('فشل في حفظ بيانات الشركات');
            return { success: false };
          }

          console.log('✅ Successfully saved companies to localStorage');

          // Update both state and ref immediately
          setCompanies(updatedCompanies);
          companiesRef.current = updatedCompanies;
          setError(null);

          console.log('🎯 FINAL SUCCESS: Successfully added company:', newCompany.companyName);
          console.log('📊 Updated ref count:', companiesRef.current.length);

          return {
            success: true,
            company: newCompany,
          };
        } catch (saveErr) {
          console.error('💥 Error saving companies:', saveErr);
          setError('فشل في حفظ بيانات الشركات');
          return { success: false };
        }
      } catch (err) {
        console.error('💥 Failed to add company:', err);
        setError('فشل في إضافة الشركة');
        return { success: false };
      }
    },
    [setError]
  );

  const updateCompany = useCallback(
    (companyId: string, updates: Partial<Company>): boolean => {
      try {
        const currentCompanies = companiesRef.current;
        const companyIndex = currentCompanies.findIndex(c => c.id === companyId);
        if (companyIndex === -1) {
          setError('الشركة غير موجودة');
          return false;
        }

        const updatedCompany = {
          ...currentCompanies[companyIndex],
          ...updates,
          updatedAt: getCurrentDate(),
        };

        const updatedCompanies = [...currentCompanies];
        updatedCompanies[companyIndex] = updatedCompany;
        saveCompanies(updatedCompanies);

        return true;
      } catch (err) {
        console.error('Failed to update company:', err);
        setError('فشل في تحديث بيانات الشركة');
        return false;
      }
    },
    [saveCompanies]
  );

  const archiveCompany = useCallback(
    (companyId: string, archivedBy: string): boolean => {
      try {
        const currentCompanies = companiesRef.current;
        const companyIndex = currentCompanies.findIndex(c => c.id === companyId);
        if (companyIndex === -1) {
          setError('الشركة غير موجودة');
          return false;
        }

        const updatedCompany = {
          ...currentCompanies[companyIndex],
          isArchived: true,
          archivedBy,
          archivedAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        const updatedCompanies = [...currentCompanies];
        updatedCompanies[companyIndex] = updatedCompany;
        saveCompanies(updatedCompanies);

        return true;
      } catch (err) {
        console.error('Failed to archive company:', err);
        setError('فشل في أرشفة الشركة');
        return false;
      }
    },
    [saveCompanies]
  );

  const unarchiveCompany = useCallback(
    (companyId: string): boolean => {
      try {
        const currentCompanies = companiesRef.current;
        const companyIndex = currentCompanies.findIndex(c => c.id === companyId);
        if (companyIndex === -1) {
          setError('الشركة غير موجودة');
          return false;
        }

        const updatedCompany = {
          ...currentCompanies[companyIndex],
          isArchived: false,
          archivedBy: undefined,
          archivedAt: undefined,
          updatedAt: getCurrentDate(),
        };

        const updatedCompanies = [...currentCompanies];
        updatedCompanies[companyIndex] = updatedCompany;
        saveCompanies(updatedCompanies);

        return true;
      } catch (err) {
        console.error('Failed to unarchive company:', err);
        setError('فشل في إلغاء أرشفة الشركة');
        return false;
      }
    },
    [saveCompanies]
  );

  const deleteCompany = useCallback(
    (companyId: string): boolean => {
      try {
        console.log('🗑️ Deleting company ID:', companyId);
        // Use functional update to get fresh state
        setCompanies(currentCompanies => {
          const updatedCompanies = currentCompanies.filter(c => c.id !== companyId);
          console.log('📊 Companies count after delete:', updatedCompanies.length);

          // Save to localStorage
          try {
            const success = SafeStorage.set('companies', updatedCompanies);
            if (!success) {
              console.error('❌ Failed to save companies to localStorage');
              setError('فشل في حفظ بيانات الشركات');
            } else {
              console.log('✅ Successfully saved companies to localStorage');
              setError(null);
            }
            companiesRef.current = updatedCompanies;
          } catch (saveErr) {
            console.error('💥 Error saving companies:', saveErr);
            setError('فشل في حفظ بيانات الشركات');
          }

          return updatedCompanies;
        });

        return true;
      } catch (err) {
        console.error('💥 Failed to delete company:', err);
        setError('فشل في حذف الشركة');
        return false;
      }
    },
    [setError]
  );

  const getCompanyById = useCallback(
    (companyId: string): Company | undefined => {
      return companiesRef.current.find(c => c.companyId === companyId);
    },
    []
  );

  const getCompanyByName = useCallback(
    (companyName: string): Company | undefined => {
      return companiesRef.current.find(c => c.companyName.toLowerCase() === companyName.toLowerCase());
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount - only once
  useEffect(() => {
    loadCompanies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    companies,
    loading,
    error,
    addCompany,
    updateCompany,
    archiveCompany,
    unarchiveCompany,
    deleteCompany,
    getCompanyById,
    getCompanyByName,
    refreshCompanies: loadCompanies,
    clearError,
  };
}
