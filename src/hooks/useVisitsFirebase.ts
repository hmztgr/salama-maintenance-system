import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Visit, WeeklyPlanningGrid, DailyPlan, PlanningFilters } from '@/types/customer';
import { getCurrentDate, addWeeksToDate, getWeekStartDate, getWeekEndDate, getWeekNumber } from '@/lib/date-handler';

export function useVisitsFirebase() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current state and avoid staleness
  const visitsRef = useRef<Visit[]>([]);

  // Update ref whenever visits state changes
  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);

  // Convert Firestore timestamp to date string
  const convertTimestamp = (timestamp: any): string => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).replace(/ /g, '-');
    }
    return getCurrentDate();
  };

  // Convert Firestore document to Visit object
  const convertDocToVisit = (doc: any): Visit => {
    const data = doc.data();
    return {
      id: doc.id,
      visitId: data.visitId || `LEGACY-${doc.id}`, // Provide fallback for legacy visits without visitId
      branchId: data.branchId,
      contractId: data.contractId,
      companyId: data.companyId,
      type: data.type,
      status: data.status,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      completedDate: data.completedDate,
      completedTime: data.completedTime,
      duration: data.duration,
      assignedTeam: data.assignedTeam,
      assignedTechnician: data.assignedTechnician,
      notes: data.notes,
      services: data.services || {},
      results: data.results,
      attachments: data.attachments || [],
      isArchived: data.isArchived || false,
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  };

  // Real-time listener for visits
  useEffect(() => {
    console.log('🔥 Setting up Firebase real-time listener for visits...');
    setLoading(true);

    const visitsQuery = query(
      collection(db, 'visits'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      visitsQuery,
      (snapshot) => {
        try {
          console.log('🔥 Firebase visits snapshot received:', snapshot.size, 'documents');
          
          const visitsData = snapshot.docs.map(convertDocToVisit);
          
          console.log('📊 Processed visits data:', visitsData.length, 'visits');
          setVisits(visitsData);
          visitsRef.current = visitsData;
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error('❌ Error processing visits snapshot:', err);
          setError('فشل في تحميل بيانات الزيارات');
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Firebase visits listener error:', err);
        setError('فشل في الاتصال بقاعدة البيانات');
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase visits listener');
      unsubscribe();
    };
  }, []);

  // Generate unique visit ID
  const generateVisitId = useCallback((currentVisits?: Visit[]): string => {
    const year = new Date().getFullYear();
    const visitsToCheck = currentVisits || visitsRef.current;
    const existingVisits = visitsToCheck.filter(v => v.visitId && v.visitId.includes(`VISIT-${year}`));
    const nextNumber = (existingVisits.length + 1).toString().padStart(4, '0');
    return `VISIT-${year}-${nextNumber}`;
  }, []);

  // Add new visit
  const addVisit = useCallback(
    async (
      visitData: Omit<Visit, 'id' | 'visitId' | 'isArchived' | 'createdAt' | 'updatedAt'>
    ): Promise<{ success: boolean; visit?: Visit; error?: string }> => {
      try {
        console.log('➕ Adding new visit for branch:', visitData.branchId);

        // Use visitsRef.current to get the MOST current state
        const currentVisits = visitsRef.current;
        console.log('📊 Current visits count in ref:', currentVisits.length);

        const newVisitData = {
          ...visitData,
          visitId: generateVisitId(currentVisits),
          isArchived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Filter out undefined values that Firebase doesn't accept
        const filteredVisitData = Object.fromEntries(
          Object.entries(newVisitData).filter(([_, value]) => value !== undefined)
        );

        console.log(
          `💾 Adding visit with VisitID: ${newVisitData.visitId}, Branch: ${newVisitData.branchId}`
        );

        const docRef = await addDoc(collection(db, 'visits'), filteredVisitData);
        console.log('✅ Visit added to Firebase with ID:', docRef.id);

        // Create the visit object with the generated ID
        const newVisit: Visit = {
          ...newVisitData,
          id: docRef.id,
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        console.log(`✅ Visit saved successfully. ID: ${docRef.id}`);

        return { success: true, visit: newVisit };
      } catch (err) {
        console.error('❌ Failed to add visit:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إضافة الزيارة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [generateVisitId]
  );

  // Update visit
  const updateVisit = useCallback(
    async (visitId: string, updates: Partial<Visit>): Promise<boolean> => {
      try {
        console.log('🔄 updateVisit called with:', { visitId, updates });

        // Find the visit in current state
        const currentVisits = visitsRef.current;
        const visit = currentVisits.find(v => v.id === visitId);

        if (!visit) {
          console.error('❌ Visit not found:', visitId);
          setError('الزيارة غير موجودة');
          return false;
        }

        // Prepare update data (exclude id and other non-updatable fields)
        const { id, visitId: vId, createdAt, ...updateData } = updates;
        const updatePayload = {
          ...updateData,
          updatedAt: serverTimestamp(),
        };

        // Filter out undefined values that Firebase doesn't accept
        const filteredUpdatePayload = Object.fromEntries(
          Object.entries(updatePayload).filter(([_, value]) => value !== undefined)
        );

        console.log('📝 Updating visit with payload:', filteredUpdatePayload);

        const visitRef = doc(db, 'visits', visitId);
        await updateDoc(visitRef, filteredUpdatePayload);

        console.log('✅ Visit updated successfully in Firebase');
        setError(null);
        return true;
      } catch (err) {
        console.error('❌ Failed to update visit:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في تحديث بيانات الزيارة';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Delete visit
  const deleteVisit = useCallback(
    async (visitId: string): Promise<boolean> => {
      try {
        console.log('🗑️ Deleting visit ID:', visitId);

        const visitRef = doc(db, 'visits', visitId);
        await deleteDoc(visitRef);

        console.log('✅ Visit deleted successfully from Firebase');
        setError(null);
        return true;
      } catch (err) {
        console.error('❌ Failed to delete visit:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في حذف الزيارة';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Get visits by branch
  const getVisitsByBranch = useCallback(
    (branchId: string): Visit[] => {
      return visitsRef.current.filter(v => v.branchId === branchId && !v.isArchived);
    },
    []
  );

  // Get visits by contract
  const getVisitsByContract = useCallback(
    (contractId: string): Visit[] => {
      return visitsRef.current.filter(v => v.contractId === contractId && !v.isArchived);
    },
    []
  );

  // Get visits by company
  const getVisitsByCompany = useCallback(
    (companyId: string): Visit[] => {
      return visitsRef.current.filter(v => v.companyId === companyId && !v.isArchived);
    },
    []
  );

  // Get visits by date
  const getVisitsByDate = useCallback(
    (date: string): Visit[] => {
      return visitsRef.current.filter(v => v.scheduledDate === date && !v.isArchived);
    },
    []
  );

  // Get visits by date range
  const getVisitsByDateRange = useCallback(
    (startDate: string, endDate: string): Visit[] => {
      return visitsRef.current.filter(v => {
        const visitDate = new Date(v.scheduledDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return visitDate >= start && visitDate <= end && !v.isArchived;
      });
    },
    []
  );

  // Get weekly plan
  const getWeeklyPlan = useCallback(
    (weekStartDate: string): WeeklyPlanningGrid => {
      const startDate = new Date(weekStartDate);
      const endDate = getWeekEndDate(weekStartDate);
      const weekNumber = getWeekNumber(startDate);
      const year = startDate.getFullYear();

      const weekVisits = getVisitsByDateRange(weekStartDate, endDate);

      const dailyPlans: { [date: string]: DailyPlan } = {};

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/ /g, '-');

        const dayVisits = getVisitsByDate(dateStr);
        const dayNames = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];

        dailyPlans[dateStr] = {
          date: dateStr,
          dayOfWeek: dayNames[currentDate.getDay()] as DailyPlan['dayOfWeek'],
          visits: dayVisits,
          totalVisits: dayVisits.length,
          totalDuration: dayVisits.reduce((sum, visit) => sum + (visit.duration || 0), 0),
          availableTeams: [],
          workingHours: { start: '08:00', end: '17:00' },
        };
      }

      return {
        weekStartDate,
        weekEndDate: endDate,
        weekNumber,
        year,
        visits: weekVisits,
        dailyPlans,
      };
    },
    [getVisitsByDateRange, getVisitsByDate]
  );

  // Schedule visit
  const scheduleVisit = useCallback(
    async (visitId: string, newDate: string, newTime?: string): Promise<boolean> => {
      return updateVisit(visitId, {
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'scheduled',
      });
    },
    [updateVisit]
  );

  // Complete visit
  const completeVisit = useCallback(
    async (visitId: string, results: Visit['results']): Promise<boolean> => {
      console.log('🔄 completeVisit called with:', { visitId, results });
      const result = await updateVisit(visitId, {
        status: 'completed',
        completedDate: getCurrentDate(),
        results,
      });
      console.log('✅ completeVisit result:', result);
      return result;
    },
    [updateVisit]
  );

  // Cancel visit
  const cancelVisit = useCallback(
    async (visitId: string, reason?: string): Promise<boolean> => {
      return updateVisit(visitId, {
        status: 'cancelled',
        notes: reason ? `ملغي: ${reason}` : 'ملغي',
      });
    },
    [updateVisit]
  );

  // Reschedule visit
  const rescheduleVisit = useCallback(
    async (visitId: string, newDate: string, newTime?: string, reason?: string): Promise<boolean> => {
      return updateVisit(visitId, {
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'rescheduled',
        notes: reason ? `تم إعادة جدولة الزيارة: ${reason}` : 'تم إعادة جدولة الزيارة',
      });
    },
    [updateVisit]
  );

  // Filter visits
  const filterVisits = useCallback(
    (filters: PlanningFilters): Visit[] => {
      return visitsRef.current.filter(visit => {
        if (filters.dateRange) {
          const visitDate = new Date(visit.scheduledDate);
          const start = new Date(filters.dateRange.start);
          const end = new Date(filters.dateRange.end);
          if (visitDate < start || visitDate > end) return false;
        }

        if (filters.branchId && visit.branchId !== filters.branchId) return false;
        if (filters.companyId && visit.companyId !== filters.companyId) return false;
        if (filters.contractId && visit.contractId !== filters.contractId) return false;
        if (filters.visitType && visit.type !== filters.visitType) return false;
        if (filters.visitStatus && visit.status !== filters.visitStatus) return false;
        if (filters.assignedTeam && visit.assignedTeam !== filters.assignedTeam) return false;
        if (filters.assignedTechnician && visit.assignedTechnician !== filters.assignedTechnician) return false;

        return !visit.isArchived;
      });
    },
    []
  );

  // Refresh visits (force re-fetch)
  const refreshVisits = useCallback(() => {
    // With real-time listeners, this isn't needed, but keeping for compatibility
    console.log('🔄 Refresh visits called (real-time listeners handle this automatically)');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    visits,
    loading,
    error,
    addVisit,
    updateVisit,
    deleteVisit,
    getVisitsByBranch,
    getVisitsByContract,
    getVisitsByCompany,
    getVisitsByDate,
    getVisitsByDateRange,
    getWeeklyPlan,
    scheduleVisit,
    completeVisit,
    cancelVisit,
    rescheduleVisit,
    filterVisits,
    refreshVisits,
    clearError,
  };
} 