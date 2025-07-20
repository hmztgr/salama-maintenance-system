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
import { Contract } from '@/types/customer';
import { generateContractId } from '@/lib/id-generator';
import { getCurrentDate } from '@/lib/date-handler';
import { useFirebaseStorage } from './useFirebaseStorage';

export function useContractsFirebase() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { uploadFile } = useFirebaseStorage();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isListenerActiveRef = useRef(false);
  const componentMountedRef = useRef(true);

  // Real-time listener for contracts with robust conflict prevention
  useEffect(() => {
    if (!authState.user) {
      setLoading(false);
      return;
    }

    // Prevent multiple listeners and ensure cleanup
    if (isListenerActiveRef.current && unsubscribeRef.current) {
      console.log('📄 Listener already active, cleaning up first...');
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

      console.log('📄 Setting up Firebase contracts listener...');
      isListenerActiveRef.current = true;
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!componentMountedRef.current) return;
          console.log('🔥 Contracts snapshot received:', snapshot.size, 'documents');

          const contractsData = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                contractId: data.contractId,
                companyId: data.companyId,
                contractStartDate: data.contractStartDate,
                contractEndDate: data.contractEndDate,
                contractPeriodMonths: data.contractPeriodMonths,
                contractDocument: data.contractDocument,
                contractValue: data.contractValue,
                notes: data.notes || '',
                // NEW: Handle service batches (with backward compatibility)
                serviceBatches: data.serviceBatches || [],
                isArchived: data.isArchived || false,
                archivedBy: data.archivedBy,
                archivedAt: data.archivedAt,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
              } as Contract;
            })
            .filter(contract => !contract.isArchived);

          setContracts(contractsData);
          setLoading(false);
          setError(null);
          console.log('✅ Contracts state updated:', contractsData.length, 'contracts');
        },
        (error) => {
          if (!componentMountedRef.current) return;
          console.error('❌ Contracts listener error:', error);
          
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
                const contractsData = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      contractId: data.contractId,
                      companyId: data.companyId,
                      contractStartDate: data.contractStartDate,
                      contractEndDate: data.contractEndDate,
                      contractPeriodMonths: data.contractPeriodMonths,
                      contractDocument: data.contractDocument,
                      contractValue: data.contractValue,
                      notes: data.notes || '',
                      // NEW: Handle service batches (fallback compatibility)
                      serviceBatches: data.serviceBatches || [],
                      isArchived: data.isArchived || false,
                      archivedBy: data.archivedBy,
                      archivedAt: data.archivedAt,
                      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    } as Contract;
                  })
                  .filter(contract => !contract.isArchived);

                setContracts(contractsData);
                setLoading(false);
                setError(null);
                console.log('✅ Contracts loaded via one-time read fallback:', contractsData.length, 'contracts');
              })
              .catch((fallbackError) => {
                if (!componentMountedRef.current) return;
                console.error('❌ Fallback read also failed:', fallbackError);
                setError(`Failed to load contracts: ${fallbackError.message}`);
                setLoading(false);
              });
          } else {
            setError(`Failed to load contracts: ${error.code} - ${error.message}`);
            setLoading(false);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    }

    return () => {
      console.log('📄 Cleaning up contracts listener...');
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

  const addContract = useCallback(
    async (
      contractData: Omit<Contract, 'id' | 'contractId' | 'isArchived' | 'createdAt' | 'updatedAt'>
    ): Promise<{ success: boolean; contract?: Contract; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }

        console.log('📄 Adding contract to Firebase for company:', contractData.companyId);

        const contractId = generateContractId(contractData.companyId, contracts);
        const userId = authState.user.uid || authState.user.email;

        if (!userId) {
          return {
            success: false,
            warnings: ['لا يمكن تحديد هوية المستخدم - تأكد من تسجيل الدخول']
          };
        }

        // Handle file uploads
        const warnings: string[] = [];
        let contractDocumentUrl = '';

        try {
          if (contractData.contractDocument && contractData.contractDocument instanceof File) {
            console.log('📤 Uploading contract document...');
            const uploadedFile = await uploadFile(contractData.contractDocument, {
              folder: `contracts/${contractId}/documents`,
              customName: 'contract_document'
            });
            contractDocumentUrl = uploadedFile.url;
          } else if (typeof contractData.contractDocument === 'string') {
            contractDocumentUrl = contractData.contractDocument;
          }
        } catch (error) {
          warnings.push(`فشل في رفع وثيقة العقد: ${error}`);
        }

        const now = getCurrentDate();
        
        // Create base contract data - filter out undefined values for Firebase
        const baseContractData = {
          contractId,
          companyId: contractData.companyId,
          contractStartDate: contractData.contractStartDate,
          contractEndDate: contractData.contractEndDate,
          contractPeriodMonths: contractData.contractPeriodMonths,
          contractDocument: contractDocumentUrl,
          contractValue: contractData.contractValue,
          notes: contractData.notes || '',
          // NEW: Service batches structure instead of individual service flags
          serviceBatches: contractData.serviceBatches || [],
          isArchived: false,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };

        const newContractData = baseContractData;

        const docRef = await addDoc(collection(db, 'contracts'), newContractData);
        console.log('✅ Contract added to Firebase with ID:', docRef.id);

        const newContract: Contract = {
          id: docRef.id,
          ...newContractData,
        };

        return {
          success: true,
          contract: newContract
        };

      } catch (error) {
        console.error('❌ Error adding contract to Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في إضافة العقد إلى Firebase: ${error}`]
        };
      }
    },
    [contracts, authState.user]
  );

  const updateContract = useCallback(
    async (
      contractId: string,
      updates: Partial<Contract>
    ): Promise<{ success: boolean; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }

        console.log('📄 Updating contract in Firebase:', contractId);

        const contract = contracts.find(c => c.id === contractId);
        if (!contract) {
          return { success: false, warnings: ['العقد غير موجود'] };
        }

        const userId = authState.user.uid || authState.user.email;
        if (!userId) {
          return { success: false, warnings: ['لا يمكن تحديد هوية المستخدم'] };
        }

        const updateData = {
          ...updates,
          updatedAt: getCurrentDate(),
          lastModifiedBy: userId,
        };

        await updateDoc(doc(db, 'contracts', contract.id), updateData);
        console.log('✅ Contract updated in Firebase');

        return { success: true };

      } catch (error) {
        console.error('❌ Error updating contract in Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في تحديث العقد في Firebase: ${error}`]
        };
      }
    },
    [contracts, authState.user]
  );

  const deleteContract = useCallback(
    async (contractId: string): Promise<boolean> => {
      try {
        if (!authState.user) {
          console.error('❌ User not authenticated');
          return false;
        }

        console.log('📄 Deleting contract from Firebase:', contractId);

        const contract = contracts.find(c => c.id === contractId);
        if (!contract) {
          console.error('❌ Contract not found:', contractId);
          return false;
        }

        await deleteDoc(doc(db, 'contracts', contract.id));
        console.log('✅ Contract deleted from Firebase');

        return true;

      } catch (error) {
        console.error('❌ Error deleting contract from Firebase:', error);
        return false;
      }
    },
    [contracts, authState.user]
  );

  const archiveContract = useCallback(
    async (contractId: string, archivedBy: string): Promise<boolean> => {
      try {
        const result = await updateContract(contractId, { 
          isArchived: true,
          archivedBy,
          archivedAt: getCurrentDate()
        });
        return result.success;
      } catch (error) {
        console.error('❌ Error archiving contract:', error);
        return false;
      }
    },
    [updateContract]
  );

  const unarchiveContract = useCallback(
    async (contractId: string): Promise<boolean> => {
      try {
        const result = await updateContract(contractId, { 
          isArchived: false,
          archivedBy: undefined,
          archivedAt: undefined
        });
        return result.success;
      } catch (error) {
        console.error('❌ Error unarchiving contract:', error);
        return false;
      }
    },
    [updateContract]
  );

  const getContractById = useCallback(
    (contractId: string): Contract | undefined => {
      return contracts.find((c) => c.contractId === contractId);
    },
    [contracts]
  );

  const getContractsByCompany = useCallback(
    (companyId: string): Contract[] => {
      return contracts.filter((c) => c.companyId === companyId);
    },
    [contracts]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    contracts,
    loading,
    error,
    addContract,
    updateContract,
    deleteContract,
    archiveContract,
    unarchiveContract,
    getContractById,
    getContractsByCompany,
    clearError,
  };
} 