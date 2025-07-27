'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentWeekStart, getWeekNumber, getWeekStartDateByNumber } from '@/lib/date-handler';

interface WeekNavigationContextType {
  currentWeek: string;
  setCurrentWeek: (week: string) => void;
  currentWeekNumber: number;
  currentYear: number;
}

const WeekNavigationContext = createContext<WeekNavigationContextType | undefined>(undefined);

export function WeekNavigationProvider({ children }: { children: ReactNode }) {
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());
  
  // Get search params safely
  let searchParams: any = null;
  try {
    searchParams = useSearchParams();
  } catch (error) {
    // Ignore errors during build time
    console.log('WeekNavigationContext: useSearchParams not available during build');
  }

  // Get week number and year from current week
  const currentWeekNumber = (() => {
    try {
      // Parse the dd-mmm-yyyy format properly
      const [day, month, year] = currentWeek.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex === -1) {
        console.warn('Invalid month in currentWeek:', currentWeek);
        return 1;
      }
      
      const date = new Date(parseInt(year), monthIndex, parseInt(day));
      return getWeekNumber(date);
    } catch (error) {
      console.error('Error calculating week number:', error);
      return 1;
    }
  })();

  const currentYear = (() => {
    try {
      const [day, month, year] = currentWeek.split('-');
      return parseInt(year);
    } catch (error) {
      console.error('Error getting current year:', error);
      return new Date().getFullYear();
    }
  })();

  // Handle URL parameters for week navigation
  useEffect(() => {
    if (!searchParams) return;
    
    try {
      const weekParam = searchParams.get('week');
      const yearParam = searchParams.get('year');
      
              if (weekParam && yearParam) {
          const week = parseInt(weekParam);
          const year = parseInt(yearParam);
          
          if (week >= 1 && week <= 52 && year >= 2020 && year <= 2030) {
            // Use the proper week calculation functions
            const weekStartDate = getWeekStartDateByNumber(week, year);
            setCurrentWeek(weekStartDate);
          }
        }
    } catch (error) {
      // Ignore errors during build time
      console.log('WeekNavigationContext: Error reading search params during build');
    }
  }, [searchParams]);

  const value = {
    currentWeek,
    setCurrentWeek,
    currentWeekNumber,
    currentYear
  };

  return (
    <WeekNavigationContext.Provider value={value}>
      {children}
    </WeekNavigationContext.Provider>
  );
}

export function useWeekNavigation() {
  const context = useContext(WeekNavigationContext);
  if (context === undefined) {
    throw new Error('useWeekNavigation must be used within a WeekNavigationProvider');
  }
  return context;
} 