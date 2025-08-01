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
import { useFirebaseStorage } from './useFirebaseStorage';
export function useCompaniesFirebase() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { uploadFile } = useFirebaseStorage();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isListenerActiveRef = useRef(false);
  const componentMountedRef = useRef(true);
  // Real-time listener for companies with robust conflict prevention
  useEffect(() => {
    console.log('🏢 Companies useEffect triggered:', {
      hasUser: !!authState.user,
      userId: authState.user?.uid,
      isListenerActive: isListenerActiveRef.current,
      hasUnsubscribe: !!unsubscribeRef.current
    });
    
    if (!authState.user) {
      console.log('🏢 No user, setting loading to false');
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
    
    console.log('🏢 Setting up initial listener...');
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
              console.log('📁 Raw Firebase data for company:', doc.id, data);
              const mappedCompany = {
                id: doc.id,
                companyId: data.companyId,
                companyName: data.companyName,
                unifiedNumber: data.unifiedNumber || '',
                commercialRegistration: data.commercialRegistration || '',
                commercialRegistrationFile: data.commercialRegistrationFile || '',
                vatNumber: data.vatNumber || '',
                vatFile: data.vatFile || '',
                nationalAddressFile: data.nationalAddressFile || '',
                email: data.email || '',
                phone: data.phone || '',
                mobile: data.mobile || '',
                address: data.address || '',
                website: data.website || '',
                contactPerson: data.contactPerson || '',
                contactPersonTitle: data.contactPersonTitle || '',
                notes: data.notes || '',
                isArchived: data.isArchived || false,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
              } as Company;
              console.log('📁 Mapped company data:', mappedCompany.companyId, {
                commercialRegistrationFile: mappedCompany.commercialRegistrationFile,
                vatFile: mappedCompany.vatFile,
                nationalAddressFile: mappedCompany.nationalAddressFile
              });
              return mappedCompany;
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
                    console.log('📁 Raw Firebase data (fallback) for company:', doc.id, data);
                    const mappedCompany = {
                      id: doc.id,
                      companyId: data.companyId,
                      companyName: data.companyName,
                      unifiedNumber: data.unifiedNumber || '',
                      commercialRegistration: data.commercialRegistration || '',
                      commercialRegistrationFile: data.commercialRegistrationFile || '',
                      vatNumber: data.vatNumber || '',
                      vatFile: data.vatFile || '',
                      nationalAddressFile: data.nationalAddressFile || '',
                      email: data.email || '',
                      phone: data.phone || '',
                      mobile: data.mobile || '',
                      address: data.address || '',
                      website: data.website || '',
                      contactPerson: data.contactPerson || '',
                      contactPersonTitle: data.contactPersonTitle || '',
                      notes: data.notes || '',
                      isArchived: data.isArchived || false,
                      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    } as Company;
                    console.log('📁 Mapped company data (fallback):', mappedCompany.companyId, {
                      commercialRegistrationFile: mappedCompany.commercialRegistrationFile,
                      vatFile: mappedCompany.vatFile,
                      nationalAddressFile: mappedCompany.nationalAddressFile
                    });
                    return mappedCompany;
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
      console.log('🏢 Cleaning up companies listener...', {
        componentMounted: componentMountedRef.current,
        hasUnsubscribe: !!unsubscribeRef.current,
        isListenerActive: isListenerActiveRef.current
      });
      componentMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      isListenerActiveRef.current = false;
    };
  }, [authState.user?.uid || authState.user?.email]); // Use user ID or email as fallback
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

        // Handle file uploads
        const warnings: string[] = [];
        let commercialRegistrationUrl = '';
        let vatFileUrl = '';
        let nationalAddressFileUrl = '';

        console.log('📁 Processing file data from CompanyForm:', {
          commercialRegistrationFile: companyData.commercialRegistrationFile,
          vatFile: companyData.vatFile,
          nationalAddressFile: companyData.nationalAddressFile
        });

        // Handle file data from CompanyForm (pipe-separated URLs)
        if (companyData.commercialRegistrationFile && typeof companyData.commercialRegistrationFile === 'string') {
          commercialRegistrationUrl = companyData.commercialRegistrationFile;
          console.log('📁 Using commercial registration URL:', commercialRegistrationUrl);
        } else if (companyData.commercialRegistrationFile && companyData.commercialRegistrationFile instanceof File) {
          try {
            console.log('📤 Uploading commercial registration file...');
            const uploadedFile = await uploadFile(companyData.commercialRegistrationFile, {
              folder: `companies/${companyId}/documents`,
              customName: 'commercial_registration'
            });
            commercialRegistrationUrl = uploadedFile.url;
          } catch (error) {
            warnings.push(`فشل في رفع السجل التجاري: ${error}`);
          }
        }

        if (companyData.vatFile && typeof companyData.vatFile === 'string') {
          vatFileUrl = companyData.vatFile;
          console.log('📁 Using VAT file URL:', vatFileUrl);
        } else if (companyData.vatFile && companyData.vatFile instanceof File) {
        try {
            console.log('📤 Uploading VAT file...');
            const uploadedFile = await uploadFile(companyData.vatFile, {
              folder: `companies/${companyId}/documents`,
              customName: 'vat_certificate'
            });
            vatFileUrl = uploadedFile.url;
          } catch (error) {
            warnings.push(`فشل في رفع شهادة الضريبة: ${error}`);
          }
        }

        if (companyData.nationalAddressFile && typeof companyData.nationalAddressFile === 'string') {
          nationalAddressFileUrl = companyData.nationalAddressFile;
          console.log('📁 Using national address file URL:', nationalAddressFileUrl);
        } else if (companyData.nationalAddressFile && companyData.nationalAddressFile instanceof File) {
        try {
            console.log('📤 Uploading national address file...');
            const uploadedFile = await uploadFile(companyData.nationalAddressFile, {
              folder: `companies/${companyId}/documents`,
              customName: 'national_address'
            });
            nationalAddressFileUrl = uploadedFile.url;
          } catch (error) {
            warnings.push(`فشل في رفع العنوان الوطني: ${error}`);
          }
        }

        const now = new Date().toISOString();
        const newCompanyData = {
          companyId,
          companyName: companyData.companyName,
          unifiedNumber: companyData.unifiedNumber || '',
          commercialRegistration: companyData.commercialRegistration || '',
          commercialRegistrationFile: commercialRegistrationUrl,
          vatNumber: companyData.vatNumber || '',
          vatFile: vatFileUrl,
          nationalAddressFile: nationalAddressFileUrl,
          email: companyData.email || '',
          phone: companyData.phone || '',
          mobile: companyData.mobile || '',
          address: companyData.address || '',
          website: companyData.website || '',
          contactPerson: companyData.contactPerson || '',
          contactPersonTitle: companyData.contactPersonTitle || '',
          notes: companyData.notes || '',
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        
        console.log('📁 Saving company data to Firebase with files:', {
          commercialRegistrationFile: newCompanyData.commercialRegistrationFile,
          vatFile: newCompanyData.vatFile,
          nationalAddressFile: newCompanyData.nationalAddressFile
        });
        
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
          company: newCompany,
          warnings: warnings.length > 0 ? warnings : undefined
        };
      } catch (error) {
        console.error('❌ Error adding company to Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في إضافة الشركة إلى Firebase: ${error}`]
        };
      }
    },
    [companies, authState.user, uploadFile]
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

        // Handle file uploads
        const warnings: string[] = [];
        let commercialRegistrationUrl = company.commercialRegistrationFile || '';
        let vatFileUrl = company.vatFile || '';
        let nationalAddressFileUrl = company.nationalAddressFile || '';

        // Process file uploads if they are provided as strings (from FileUpload component)
        if (updates.commercialRegistrationFile && typeof updates.commercialRegistrationFile === 'string') {
          commercialRegistrationUrl = updates.commercialRegistrationFile;
        }
        if (updates.vatFile && typeof updates.vatFile === 'string') {
          vatFileUrl = updates.vatFile;
        }
        if (updates.nationalAddressFile && typeof updates.nationalAddressFile === 'string') {
          nationalAddressFileUrl = updates.nationalAddressFile;
        }

        // Filter out file fields from updates since we handle them separately
        const { commercialRegistrationFile, vatFile, nationalAddressFile, ...otherUpdates } = updates;
        
        // Filter out undefined values to prevent Firebase errors
        const filteredUpdates = Object.fromEntries(
          Object.entries(otherUpdates).filter(([_, value]) => value !== undefined)
        );
        
        const updateData = {
          ...filteredUpdates,
          commercialRegistrationFile: commercialRegistrationUrl,
          vatFile: vatFileUrl,
          nationalAddressFile: nationalAddressFileUrl,
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