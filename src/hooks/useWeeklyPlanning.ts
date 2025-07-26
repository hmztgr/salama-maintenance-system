import { useState, useEffect, useCallback } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, VisitMovement, WeeklyVisit } from '@/types/weekly-planning';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { getWeekNumber } from '@/lib/date-handler';

export function useWeeklyPlanning(weekNumber: number, year: number) {
  const [weekData, setWeekData] = useState<WeeklyPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<VisitMovement[]>([]);

  const { visits, updateVisit: updateVisitInStore } = useVisitsFirebase();
  const { branches } = useBranchesFirebase();
  const { companies } = useCompaniesFirebase();

  // Helper function to get week number (using the same function as annual planner)
  // const getWeekNumber = (date: Date): number => {
  //   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  //   const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  //   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  // };

  // Helper function to get day of week (0-6, Saturday to Friday)
  const getDayOfWeek = (date: Date): number => {
    const day = date.getDay();
    // Convert Sunday=0 to Saturday=0
    return day === 0 ? 6 : day - 1;
  };

  // Load week data
  const loadWeekData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Weekly Planning Debug:', {
        totalVisits: visits.length,
        weekNumber,
        year,
        branchesCount: branches.length,
        companiesCount: companies.length,
        sampleVisits: visits.slice(0, 3).map(v => ({
          id: v.id,
          scheduledDate: v.scheduledDate,
          branchId: v.branchId,
          companyId: v.companyId
        }))
      });

      // Filter visits for the specific week and year
      const weekVisits = visits.filter(visit => {
        try {
          // Handle different date formats
          let visitDate: Date;
          
          if (!visit.scheduledDate) {
            console.warn('Visit has no scheduled date:', visit.id);
            return false;
          }
          
          // Check for literal "Invalid Date" string
          if (visit.scheduledDate === 'Invalid Date' || visit.scheduledDate === 'NaN') {
            // Don't log every single invalid date to avoid spam
            return false;
          }
          
          if (visit.scheduledDate.includes('-') && visit.scheduledDate.length === 10) {
            // Format: dd-mmm-yyyy (e.g., "01-Jan-2025") or dd-mm-yyyy (e.g., "01-07-2025")
            const [day, monthPart, year] = visit.scheduledDate.split('-');
            
            let monthIndex: number;
            
            // Check if month is numeric (e.g., "07" for July)
            if (/^\d{1,2}$/.test(monthPart)) {
              monthIndex = parseInt(monthPart) - 1; // Convert to 0-based index
              if (monthIndex < 0 || monthIndex > 11) {
                console.warn('Invalid numeric month:', monthPart, 'in visit:', visit.id);
                return false;
              }
            } else {
              // Handle text month names (e.g., "Jan", "Jul")
              const monthNames: Record<string, number> = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
              };
              monthIndex = monthNames[monthPart.toLowerCase()];
              
              if (monthIndex === undefined) {
                console.warn('Invalid month name:', monthPart, 'in visit:', visit.id);
                return false;
              }
            }
            
            visitDate = new Date(parseInt(year), monthIndex, parseInt(day));
          } else if (visit.scheduledDate.includes('T') && visit.scheduledDate.includes('Z')) {
            // Format: ISO string (e.g., "2024-12-30T21:00:00.000Z")
            visitDate = new Date(visit.scheduledDate);
          } else {
            // Try standard Date parsing
            visitDate = new Date(visit.scheduledDate);
          }
          
          // Validate the parsed date
          if (isNaN(visitDate.getTime())) {
            console.warn('Invalid date parsed for visit:', visit.id, 'scheduledDate:', visit.scheduledDate);
            return false;
          }
          
          const visitWeek = getWeekNumber(visitDate);
          const visitYear = visitDate.getFullYear();
          
          const isInWeek = visitWeek === weekNumber && visitYear === year;
          
          // Only log if this visit is in the target week to reduce spam
          if (isInWeek) {
            console.log('📅 Visit Week Check:', {
              visitId: visit.id,
              scheduledDate: visit.scheduledDate,
              parsedDate: visitDate.toISOString(),
              visitWeek,
              visitYear,
              targetWeek: weekNumber,
              targetYear: year,
              isInWeek
            });
          }
          
          return isInWeek;
        } catch (error) {
          console.error('Error processing visit:', visit.id, error);
          return false;
        }
      });

      // Count invalid dates for summary (only log once per session)
      const invalidDateCount = visits.filter(v => 
        v.scheduledDate === 'Invalid Date' || v.scheduledDate === 'NaN'
      ).length;
      
      // Use a ref to track if we've already logged this warning
      if (invalidDateCount > 0 && !(window as any).invalidDateWarningLogged) {
        console.warn(`⚠️ Found ${invalidDateCount} visits with invalid dates that were skipped`);
        (window as any).invalidDateWarningLogged = true;
      }
      
      console.log('✅ Filtered Week Visits:', {
        weekVisitsCount: weekVisits.length,
        totalVisits: visits.length,
        invalidDateCount,
        weekVisits: weekVisits.map(v => ({
          id: v.id,
          scheduledDate: v.scheduledDate
        }))
      });

      // Enhance visits with company and branch names
      const enhancedVisits: WeeklyVisit[] = weekVisits.map(visit => {
        try {
          const branch = branches.find(b => b.branchId === visit.branchId);
          const company = companies.find(c => c.companyId === visit.companyId);
          
          // Parse date using the same logic as above
          let visitDate: Date;
          
          // Check for literal "Invalid Date" string
          if (visit.scheduledDate === 'Invalid Date' || visit.scheduledDate === 'NaN') {
            // Don't log every single invalid date to avoid spam
            visitDate = new Date(); // Fallback to current date
          } else if (visit.scheduledDate.includes('-') && visit.scheduledDate.length === 10) {
            const [day, monthName, year] = visit.scheduledDate.split('-');
            const monthNames: Record<string, number> = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            const monthIndex = monthNames[monthName.toLowerCase()];
            
            if (monthIndex === undefined) {
              console.warn('Invalid month name in enhanced visit:', monthName);
              visitDate = new Date(); // Fallback to current date
            } else {
              visitDate = new Date(parseInt(year), monthIndex, parseInt(day));
            }
          } else {
            visitDate = new Date(visit.scheduledDate);
          }
          
          // Validate the parsed date
          if (isNaN(visitDate.getTime())) {
            console.warn('Invalid date in enhanced visit, using current date');
            visitDate = new Date();
          }
          
          return {
            ...visit,
            dayOfWeek: getDayOfWeek(visitDate),
            weekNumber,
            year,
            companyName: company?.companyName || 'Unknown Company',
            branchName: branch?.branchName || 'Unknown Branch'
          };
        } catch (error) {
          console.error('Error enhancing visit:', visit.id, error);
          // Return a fallback visit object
          return {
            ...visit,
            dayOfWeek: 0,
            weekNumber,
            year,
            companyName: 'Error Loading Company',
            branchName: 'Error Loading Branch'
          };
        }
      });

      // Create week data structure
      const weekPlanningData: WeeklyPlanningData = {
        weekNumber,
        year,
        visits: enhancedVisits,
        status: 'draft',
        lastModified: new Date().toISOString(),
        modifiedBy: 'current-user' // Get from auth context
      };

      setWeekData(weekPlanningData);
    } catch (err) {
      console.error('Error in loadWeekData:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load week data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year, visits, branches, companies]);

  // Update visit
  const updateVisit = useCallback(async (visitId: string, updates: Partial<Visit>) => {
    try {
      await updateVisitInStore(visitId, updates);
      
      // Update local week data
      setWeekData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          visits: prev.visits.map(visit =>
            visit.id === visitId ? { ...visit, ...updates } : visit
          ),
          lastModified: new Date().toISOString()
        };
      });
    } catch (err) {
      console.error('Failed to update visit:', err);
      throw err;
    }
  }, [updateVisitInStore]);

  // Move visit
  const moveVisit = useCallback(async (visitId: string, fromDay: number, toDay: number) => {
    try {
      const visit = weekData?.visits.find(v => v.id === visitId);
      if (!visit) throw new Error('Visit not found');

      // Calculate new scheduled date
      // Parse the date more robustly to handle various formats
      let currentDate: Date;
      
      try {
        // First, try to parse as ISO string (common in Firebase)
        if (visit.scheduledDate.includes('T') && visit.scheduledDate.includes('Z')) {
          currentDate = new Date(visit.scheduledDate);
        } else if (visit.scheduledDate.includes('-') && visit.scheduledDate.length === 10) {
          // Handle dd-mmm-yyyy or dd-mm-yyyy format
          const dateParts = visit.scheduledDate.split('-');
          const parsedDay = parseInt(dateParts[0]);
          const monthPart = dateParts[1];
          const parsedYear = parseInt(dateParts[2]);
          
          let monthIndex: number;
          
          // Check if month is numeric (e.g., "07" for July)
          if (/^\d{1,2}$/.test(monthPart)) {
            monthIndex = parseInt(monthPart) - 1; // Convert to 0-based index
            if (monthIndex < 0 || monthIndex > 11) {
              throw new Error(`Invalid numeric month: ${monthPart}`);
            }
          } else {
            // Handle text month names (e.g., "Jan", "Jul")
            const monthNames: Record<string, number> = {
              'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
              'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };
            monthIndex = monthNames[monthPart.toLowerCase()];
            
            if (monthIndex === undefined) {
              throw new Error(`Invalid month name: ${monthPart}`);
            }
          }
          
          if (isNaN(parsedDay) || isNaN(parsedYear)) {
            throw new Error('Invalid day or year in date');
          }
          
          currentDate = new Date(parsedYear, monthIndex, parsedDay);
        } else {
          // Try standard Date parsing as fallback
          currentDate = new Date(visit.scheduledDate);
        }
        
        // Validate the parsed date
        if (isNaN(currentDate.getTime())) {
          throw new Error('Failed to parse date');
        }
      } catch (parseError) {
        console.error('Date parsing error:', parseError, 'for visit:', visit.id, 'date:', visit.scheduledDate);
        throw new Error(`Invalid date format in visit: ${visit.scheduledDate}`);
      }
      
      const daysDiff = toDay - fromDay;
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + daysDiff);

      // Validate that the new date is reasonable (within 2 years of current date)
      const currentYear = new Date().getFullYear();
      const newYear = newDate.getFullYear();
      
      if (newYear < currentYear - 1 || newYear > currentYear + 1) {
        console.warn('⚠️ Cannot move visit too far in time:', {
          visitId,
          newDate: newDate.toISOString(),
          currentYear,
          newYear
        });
        throw new Error('Cannot move visit more than 1 year from current date');
      }
      
      // Format date in dd-mmm-yyyy format to match the system
      const day = newDate.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[newDate.getMonth()];
      const year = newDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;

      console.log('🔄 Moving visit:', {
        visitId,
        fromDay,
        toDay,
        originalDate: visit.scheduledDate,
        newDate: formattedDate,
        daysDiff,
        newDateISO: newDate.toISOString()
      });

      // Update visit
      await updateVisit(visitId, {
        scheduledDate: formattedDate
      });

      // Record movement
      const movement: VisitMovement = {
        visitId,
        fromDay,
        toDay,
        timestamp: new Date().toISOString(),
        userId: 'current-user' // Get from auth context
      };

      setMovements(prev => [...prev, movement]);

      // Refresh week data to show updated visit positions
      await loadWeekData();
    } catch (err) {
      console.error('Failed to move visit:', err);
      throw err;
    }
  }, [weekData, updateVisit]);

  // Approve week
  const approveWeek = useCallback(async () => {
    try {
      setWeekData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          status: 'approved',
          lastModified: new Date().toISOString()
        };
      });

      // Save to backend
      await saveWeekData(weekData!);
    } catch (err) {
      console.error('Failed to approve week:', err);
      throw err;
    }
  }, [weekData]);

  // Save week data
  const saveWeekData = useCallback(async (data: WeeklyPlanningData) => {
    try {
      // Save to backend (implement based on your data store)
      console.log('Saving week data:', data);
    } catch (err) {
      console.error('Failed to save week data:', err);
      throw err;
    }
  }, []);

  // Load data on mount or when week/year changes
  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  return {
    weekData,
    loading,
    error,
    movements,
    updateVisit,
    moveVisit,
    approveWeek,
    saveWeekData,
    refreshWeek: loadWeekData
  };
} 