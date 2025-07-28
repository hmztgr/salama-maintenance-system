import { useState, useEffect, useCallback, useRef } from 'react';
import { Visit, WeeklyPlanningGrid, DailyPlan, PlanningFilters } from '@/types/customer';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate, addWeeksToDate, getWeekStartDate, getWeekEndDate, getWeekNumber } from '@/lib/date-handler';

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track current state and avoid staleness
  const visitsRef = useRef<Visit[]>([]);

  // Update ref whenever visits state changes
  useEffect(() => {
    visitsRef.current = visits;
  }, [visits]);

  // Safe localStorage operations
  const loadVisits = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<Visit[]>('visits', []);
      const visitArray = Array.isArray(stored) ? stored : [];
      setVisits(visitArray);
      visitsRef.current = visitArray;
      setError(null);
    } catch (err) {
      console.error('Failed to load visits:', err);
      setVisits([]);
      visitsRef.current = [];
      setError('فشل في تحميل بيانات الزيارات');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveVisits = useCallback((newVisits: Visit[]): boolean => {
    try {
      const success = SafeStorage.set('visits', newVisits);
      if (success) {
        setVisits(newVisits);
        visitsRef.current = newVisits;
        setError(null);
        return true;
      } else {
        setError('فشل في حفظ بيانات الزيارات');
        return false;
      }
    } catch (err) {
      console.error('Failed to save visits:', err);
      setError('فشل في حفظ بيانات الزيارات');
      return false;
    }
  }, []);

  const generateVisitId = useCallback((currentVisits?: Visit[]): string => {
    const year = new Date().getFullYear();
    const visitsToCheck = currentVisits || visitsRef.current;
    const existingVisits = visitsToCheck.filter(v => v.visitId && v.visitId.includes(`VISIT-${year}`));
    const nextNumber = (existingVisits.length + 1).toString().padStart(4, '0');
    return `VISIT-${year}-${nextNumber}`;
  }, []);

  const addVisit = useCallback(
    (
      visitData: Omit<Visit, 'id' | 'visitId' | 'isArchived' | 'createdAt' | 'updatedAt'>
    ): { success: boolean; visit?: Visit; error?: string } => {
      try {
        console.log('➕ Adding new visit for branch:', visitData.branchId);

        // Use visitsRef.current to get the MOST current state
        const currentVisits = visitsRef.current;
        console.log('📊 Current visits count in ref:', currentVisits.length);

        // Generate unique ID with microsecond precision to avoid collisions
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newVisit: Visit = {
          ...visitData,
          id: uniqueId,
          visitId: generateVisitId(currentVisits),
          isArchived: false,
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
        };

        console.log(
          `💾 Adding visit with ID: ${newVisit.id}, VisitID: ${newVisit.visitId}, Branch: ${newVisit.branchId}`
        );

        const updatedVisits = [...currentVisits, newVisit];

        // Save immediately and update state
        const saveSuccess = saveVisits(updatedVisits);

        if (!saveSuccess) {
          throw new Error('Failed to save visit to storage');
        }

        console.log(`✅ Visit saved successfully. Total visits now: ${updatedVisits.length}`);

        return { success: true, visit: newVisit };
      } catch (err) {
        console.error('Failed to add visit:', err);
        const errorMessage = err instanceof Error ? err.message : 'فشل في إضافة الزيارة';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [generateVisitId, saveVisits]
  );

  const updateVisit = useCallback(
    (visitId: string, updates: Partial<Visit>): boolean => {
      try {
        // Always use the latest visits from ref
        const currentVisits = visitsRef.current;
        console.log('🔄 updateVisit called with:', { visitId, updates, visitsCount: currentVisits.length });

        const visitIndex = currentVisits.findIndex(v => v.id === visitId);
        console.log('🔍 Found visit at index:', visitIndex);

        if (visitIndex === -1) {
          console.error('❌ Visit not found:', visitId);
          setError('الزيارة غير موجودة');
          return false;
        }

        const updatedVisit = {
          ...currentVisits[visitIndex],
          ...updates,
          updatedAt: getCurrentDate(),
        };
        console.log('📝 Updated visit:', updatedVisit);

        const updatedVisits = [...currentVisits];
        updatedVisits[visitIndex] = updatedVisit;

        const saveResult = saveVisits(updatedVisits);
        console.log('💾 Save result:', saveResult);

        return true;
      } catch (err) {
        console.error('Failed to update visit:', err);
        setError('فشل في تحديث بيانات الزيارة');
        return false;
      }
    },
    [saveVisits]
  );

  const deleteVisit = useCallback(
    (visitId: string): boolean => {
      try {
        console.log('🗑️ Deleting visit ID:', visitId);
        // Always use the latest visits from ref
        const currentVisits = visitsRef.current;
        console.log('📊 Current visits count before delete:', currentVisits.length);

        const updatedVisits = currentVisits.filter(v => v.id !== visitId);
        console.log('📊 Visits count after delete:', updatedVisits.length);

        // Save to localStorage
        try {
          const success = SafeStorage.set('visits', updatedVisits);
          if (!success) {
            console.error('❌ Failed to save visits to localStorage');
            setError('فشل في حفظ بيانات الزيارات');
          } else {
            setVisits(updatedVisits);
            visitsRef.current = updatedVisits;
            console.log('✅ Successfully saved visits to localStorage');
            setError(null);
          }
        } catch (saveErr) {
          console.error('💥 Error saving visits:', saveErr);
          setError('فشل في حفظ بيانات الزيارات');
        }

        return true;
      } catch (err) {
        console.error('💥 Failed to delete visit:', err);
        setError('فشل في حذف الزيارة');
        return false;
      }
    },
    []
  );

  const getVisitsByBranch = useCallback(
    (branchId: string): Visit[] => {
      return visitsRef.current.filter(v => v.branchId === branchId && !v.isArchived);
    },
    []
  );

  const getVisitsByContract = useCallback(
    (contractId: string): Visit[] => {
      return visitsRef.current.filter(v => v.contractId === contractId && !v.isArchived);
    },
    []
  );

  const getVisitsByCompany = useCallback(
    (companyId: string): Visit[] => {
      return visitsRef.current.filter(v => v.companyId === companyId && !v.isArchived);
    },
    []
  );

  const getVisitsByDate = useCallback(
    (date: string): Visit[] => {
      return visitsRef.current.filter(v => v.scheduledDate === date && !v.isArchived);
    },
    []
  );

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

  const scheduleVisit = useCallback(
    (visitId: string, newDate: string, newTime?: string): boolean => {
      return updateVisit(visitId, {
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'scheduled',
      });
    },
    [updateVisit]
  );

  const completeVisit = useCallback(
    (visitId: string, results: Visit['results']): boolean => {
      console.log('🔄 completeVisit called with:', { visitId, results });
      const result = updateVisit(visitId, {
        status: 'completed',
        completedDate: getCurrentDate(),
        results,
      });
      console.log('✅ completeVisit result:', result);
      return result;
    },
    [updateVisit]
  );

  const cancelVisit = useCallback(
    (visitId: string, reason?: string): boolean => {
      return updateVisit(visitId, {
        status: 'cancelled',
        notes: reason ? `ملغي: ${reason}` : 'ملغي',
      });
    },
    [updateVisit]
  );

  const rescheduleVisit = useCallback(
    (visitId: string, newDate: string, newTime?: string, reason?: string): boolean => {
      return updateVisit(visitId, {
        scheduledDate: newDate,
        scheduledTime: newTime,
        status: 'rescheduled',
        notes: reason ? `تم إعادة جدولة الزيارة: ${reason}` : 'تم إعادة جدولة الزيارة',
      });
    },
    [updateVisit]
  );

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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount - only once
  useEffect(() => {
    loadVisits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    refreshVisits: loadVisits,
    clearError,
  };
}
