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
import { Branch } from '@/types/customer';
import { generateBranchId } from '@/lib/id-generator';
import { getCurrentDate } from '@/lib/date-handler';

export function useBranchesFirebase() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isListenerActiveRef = useRef(false);
  const componentMountedRef = useRef(true);

  // Real-time listener for branches with robust conflict prevention
  useEffect(() => {
    if (!authState.user) {
      setLoading(false);
      return;
    }

    // Prevent multiple listeners and ensure cleanup
    if (isListenerActiveRef.current && unsubscribeRef.current) {
      console.log('🏪 Listener already active, cleaning up first...');
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

      console.log('🏪 Setting up Firebase branches listener...');
      isListenerActiveRef.current = true;
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!componentMountedRef.current) return;
          console.log('🔥 Branches snapshot received:', snapshot.size, 'documents');

          const branchesData = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                branchId: data.branchId,
                companyId: data.companyId,
                city: data.city,
                location: data.location,
                branchName: data.branchName,
                address: data.address || '',
                contactPerson: data.contactPerson || '',
                contactPhone: data.contactPhone || '',
                notes: data.notes || '',
                teamMember: data.teamMember || '',
                isArchived: data.isArchived || false,
                archivedBy: data.archivedBy,
                archivedAt: data.archivedAt,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                weeklyPlan: data.weeklyPlan || {},
              } as Branch;
            })
            .filter(branch => !branch.isArchived);

          setBranches(branchesData);
          setLoading(false);
          setError(null);
          console.log('✅ Branches state updated:', branchesData.length, 'branches');
        },
        (error) => {
          if (!componentMountedRef.current) return;
          console.error('❌ Branches listener error:', error);
          
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
                const branchesData = snapshot.docs
                  .map(doc => {
                    const data = doc.data();
                    return {
                      id: doc.id,
                      branchId: data.branchId,
                      companyId: data.companyId,
      
                      city: data.city,
                      location: data.location,
                      branchName: data.branchName,
                      address: data.address || '',
                      contactPerson: data.contactPerson || '',
                      contactPhone: data.contactPhone || '',
                      notes: data.notes || '',
                      teamMember: data.teamMember || '',
                      isArchived: data.isArchived || false,
                      archivedBy: data.archivedBy,
                      archivedAt: data.archivedAt,
                      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
                      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                      weeklyPlan: data.weeklyPlan || {},
                    } as Branch;
                  })
                  .filter(branch => !branch.isArchived);

                setBranches(branchesData);
                setLoading(false);
                setError(null);
                console.log('✅ Branches loaded via one-time read fallback:', branchesData.length, 'branches');
              })
              .catch((fallbackError) => {
                if (!componentMountedRef.current) return;
                console.error('❌ Fallback read also failed:', fallbackError);
                setError(`Failed to load branches: ${fallbackError.message}`);
                setLoading(false);
              });
          } else {
            setError(`Failed to load branches: ${error.code} - ${error.message}`);
            setLoading(false);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    }

    return () => {
      console.log('🏪 Cleaning up branches listener...');
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

  const addBranch = useCallback(
    async (
      branchData: Omit<Branch, 'id' | 'branchId' | 'isArchived' | 'createdAt' | 'updatedAt' | 'weeklyPlan'>
    ): Promise<{ success: boolean; branch?: Branch; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }

        console.log('🏪 Adding branch to Firebase:', branchData.branchName);

        // Generate branch ID with current state
        const idResult = generateBranchId(
          branchData.companyId,
          branchData.city,
          branchData.location,
          branches
        );

        if (!idResult.branchId) {
          console.error('❌ Failed to generate branch ID:', idResult.warnings.join(', '));
          return { success: false, warnings: idResult.warnings };
        }

        const userId = authState.user.uid || authState.user.email;
        if (!userId) {
          return {
            success: false,
            warnings: ['لا يمكن تحديد هوية المستخدم - تأكد من تسجيل الدخول']
          };
        }

        const now = getCurrentDate();
        
        // Create branch data with proper undefined filtering for Firebase
        const newBranchData = {
          branchId: idResult.branchId,
          companyId: branchData.companyId,
          city: branchData.city,
          location: branchData.location,
          branchName: branchData.branchName,
          address: branchData.address || '',
          contactPerson: branchData.contactPerson || '',
          contactPhone: branchData.contactPhone || '',
          notes: branchData.notes || '',
          teamMember: branchData.teamMember || '',
          isArchived: false,
          weeklyPlan: {},
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };

        // Filter out any undefined values that might have slipped through
        Object.keys(newBranchData).forEach(key => {
          if (newBranchData[key as keyof typeof newBranchData] === undefined) {
            delete newBranchData[key as keyof typeof newBranchData];
          }
        });

        const docRef = await addDoc(collection(db, 'branches'), newBranchData);
        console.log('✅ Branch added to Firebase with ID:', docRef.id);

        const newBranch: Branch = {
          id: docRef.id,
          ...newBranchData,
        };

        return {
          success: true,
          branch: newBranch,
          warnings: idResult.warnings
        };

      } catch (error) {
        console.error('❌ Error adding branch to Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في إضافة الفرع إلى Firebase: ${error}`]
        };
      }
    },
    [branches, authState.user]
  );

  const updateBranch = useCallback(
    async (
      branchId: string,
      updates: Partial<Branch>
    ): Promise<{ success: boolean; warnings?: string[] }> => {
      try {
        if (!authState.user) {
          return { success: false, warnings: ['المستخدم غير مصادق'] };
        }

        console.log('🏪 Updating branch in Firebase:', branchId);

        const branch = branches.find(b => b.id === branchId);
        if (!branch) {
          return { success: false, warnings: ['الفرع غير موجود'] };
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

        await updateDoc(doc(db, 'branches', branch.id), updateData);
        console.log('✅ Branch updated in Firebase');

        return { success: true };

      } catch (error) {
        console.error('❌ Error updating branch in Firebase:', error);
        return {
          success: false,
          warnings: [`فشل في تحديث الفرع في Firebase: ${error}`]
        };
      }
    },
    [branches, authState.user]
  );

  const deleteBranch = useCallback(
    async (branchId: string): Promise<boolean> => {
      try {
        if (!authState.user) {
          console.error('❌ User not authenticated');
          return false;
        }

        console.log('🏪 Deleting branch from Firebase:', branchId);

        const branch = branches.find(b => b.id === branchId);
        if (!branch) {
          console.error('❌ Branch not found:', branchId);
          return false;
        }

        await deleteDoc(doc(db, 'branches', branch.id));
        console.log('✅ Branch deleted from Firebase');

        return true;

      } catch (error) {
        console.error('❌ Error deleting branch from Firebase:', error);
        return false;
      }
    },
    [branches, authState.user]
  );

  const archiveBranch = useCallback(
    async (branchId: string, archivedBy: string): Promise<boolean> => {
      try {
        const result = await updateBranch(branchId, { 
          isArchived: true,
          archivedBy,
          archivedAt: getCurrentDate()
        });
        return result.success;
      } catch (error) {
        console.error('❌ Error archiving branch:', error);
        return false;
      }
    },
    [updateBranch]
  );

  const unarchiveBranch = useCallback(
    async (branchId: string): Promise<boolean> => {
      try {
        const result = await updateBranch(branchId, { 
          isArchived: false,
          archivedBy: undefined,
          archivedAt: undefined
        });
        return result.success;
      } catch (error) {
        console.error('❌ Error unarchiving branch:', error);
        return false;
      }
    },
    [updateBranch]
  );

  const getBranchesByCompany = useCallback(
    (companyId: string): Branch[] => {
      return branches.filter((b) => b.companyId === companyId);
    },
    [branches]
  );

  // Note: getBranchesByContract removed - incompatible with new serviceBatches architecture

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    branches,
    loading,
    error,
    addBranch,
    updateBranch,
    deleteBranch,
    archiveBranch,
    unarchiveBranch,
    getBranchesByCompany,
    clearError,
  };
} 