'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { Company } from '@/types/customer';
import { generateCompanyId } from '@/lib/id-generator';
export function useCompaniesFirebase() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isListenerActiveRef = useRef(false);
  const componentMountedRef = useRef(true);
  // Real-time listener for companies with robust conflict prevention
  useEffect(() => {
    if (!authState.user) {
      setLoading(false);
      return;
    }
    // Prevent multiple listeners and ensure cleanup
    if (isListenerActiveRef.current && unsubscribeRef.current) {
      console.log('🏢 Listener already active, cleaning up first...');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      isListenerActiveRef.current = false;
      // Wait a moment before setting up new listener
      setTimeout(() => {
        if (componentMountedRef.current) {
          setupListener();
        }
      }, 500);
      return;
    }
    setupListener();
    function setupListener() {
      if (!componentMountedRef.current) return;
      console.log('🏢 Setting up Firebase companies listener...');
      isListenerActiveRef.current = true;
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!componentMountedRef.current) return;
          console.log('🔥 Companies snapshot received:', snapshot.size, 'documents');
          const companiesData = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                companyId: data.companyId,
                companyName: data.companyName,
                unifiedNumber: data.unifiedNumber || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                contactPerson: data.contactPerson || '',
                isArchived: data.isArchived || false,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
              } as Company;
            })
            .filter(company => !company.isArchived);
          setCompanies(companiesData);
          setLoading(false);
          setError(null);
          console.log('✅ Companies state updated:', companiesData.length, 'companies');
        },
        (error) => {
          if (!componentMountedRef.current) return;
          console.error('❌ Companies listener error:', error);
          // Handle "already-exists" error gracefully with backoff
          if (error.code === 'already-exists') {
            console.log('🔄 Target ID conflict detected, using fallback strategy...');
            // Cleanup current listener
            if (unsubscribeRef.current) {
              unsubscribeRef.current();
              unsubscribeRef.current = null;
            }
            isListenerActiveRef.current = false;
            // Use one-time read as fallback
            getDocs(q)
              .then((snapshot) => {
                if (!componentMountedRef.current) return;
                const companiesData = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      companyId: data.companyId,
                      companyName: data.companyName,
                      unifiedNumber: data.unifiedNumber || '',
                      email: data.email || '',
                      phone: data.phone || '',
                      address: data.address || '',
                      contactPerson: data.contactPerson || '',
                      isArchived: data.isArchived || false,
                      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    } as Company;
                  })
                  .filter(company => !company.isArchived);
                setCompanies(companiesData);
                setLoading(false);
                setError(null);
                console.log('✅ Companies loaded via one-time read fallback:', companiesData.length, 'companies');
              })
              .catch((fallbackError) => {
                if (!componentMountedRef.current) return;
                console.error('❌ Fallback read also failed:', fallbackError);
                setError(`Failed to load companies: ${fallbackError.message}`);
                setLoading(false);
              });
          } else {
            setError(`Failed to load companies: ${error.code} - ${error.message}`);
            setLoading(false);
          }
        }
      );
      unsubscribeRef.current = unsubscribe;
    }
    return () => {
      console.log('🏢 Cleaning up companies listener...');
      componentMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isListenerActiveRef.current = false;
    };
  }, [authState.user]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
    };
  }, []);
  const addCompany = useCallback(
    async (
      companyData: Omit<Company, 'id' | 'companyId' | 'isArchived' | 'createdAt' | 'updatedAt'>,
      manualIdOverride?: string
    ): Promise<{ success: boolean; company?: Company; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }
        console.log('🏢 Adding company to Firebase:', companyData.companyName);
        const companyId = manualIdOverride || generateCompanyId(companies);
        const userId = authState.user.uid || authState.user.email;
        if (!userId) {
          return {
            success: false,
            warnings: ['لا يمكن تحديد هوية المستخدم - تأكد من تسجيل الدخول']
          };
        }
        const now = new Date().toISOString();
        const newCompanyData = {
          companyId,
          companyName: companyData.companyName,
          unifiedNumber: companyData.unifiedNumber || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          address: companyData.address || '',
          contactPerson: companyData.contactPerson || '',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        const docRef = await addDoc(collection(db, 'companies'), newCompanyData);
        console.log('✅ Company added to Firebase with ID:', docRef.id);
        const newCompany: Company = {
          id: docRef.id,
          ...newCompanyData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          company: newCompany
        };
      } catch (error) {
        console.error('❌ Error adding company to Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في إضافة الشركة إلى Firebase: ${error}`]
        };
      }
    },
    [companies, authState.user]
  );
  const updateCompany = useCallback(
    async (
      companyId: string,
      updates: Partial<Company>
    ): Promise<{ success: boolean; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }
        console.log('🏢 Updating company in Firebase:', companyId);
        const company = companies.find(c => c.companyId === companyId);
        if (!company) {
          return { success: false, warnings: ['الشركة غير موجودة'] };
        }
        const userId = authState.user.uid || authState.user.email;
        if (!userId) {
          return { success: false, warnings: ['لا يمكن تحديد هوية المستخدم'] };
        }
        const updateData = {
          ...updates,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: userId,
        };
        await updateDoc(doc(db, 'companies', company.id), updateData);
        console.log('✅ Company updated in Firebase');
        return { success: true };
      } catch (error) {
        console.error('❌ Error updating company in Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في تحديث الشركة في Firebase: ${error}`]
        };
      }
    },
    [companies, authState.user]
  );
  const deleteCompany = useCallback(
    async (companyId: string): Promise<boolean> => {
      try {
        if (!authState.user) {
          console.error('❌ User not authenticated');
          return false;
        }
        console.log('🏢 Deleting company from Firebase:', companyId);
        const company = companies.find(c => c.companyId === companyId);
        if (!company) {
          console.error('❌ Company not found:', companyId);
          return false;
        }
        await deleteDoc(doc(db, 'companies', company.id));
        console.log('✅ Company deleted from Firebase');
        return true;
      } catch (error) {
        console.error('❌ Error deleting company from Firebase:', error);
        return false;
      }
    },
    [companies, authState.user]
  );
  const archiveCompany = useCallback(
    async (companyId: string): Promise<boolean> => {
      try {
        const result = await updateCompany(companyId, { isArchived: true });
        return result.success;
      } catch (error) {
        console.error('❌ Error archiving company:', error);
        return false;
      }
    },
    [updateCompany]
  );
  const restoreCompany = useCallback(
    async (companyId: string): Promise<boolean> => {
      try {
        const result = await updateCompany(companyId, { isArchived: false });
        return result.success;
      } catch (error) {
        console.error('❌ Error restoring company:', error);
        return false;
      }
    },
    [updateCompany]
  );
  return {
    companies,
    loading,
    error,
    addCompany,
    updateCompany,
    deleteCompany,
    archiveCompany,
    restoreCompany,
  };
}