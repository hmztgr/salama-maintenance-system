'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentWeekStart } from '@/lib/date-handler';

interface WeekNavigationContextType {
  currentWeek: string;
  setCurrentWeek: (week: string) => void;
  currentWeekNumber: number;
  currentYear: number;
}

const WeekNavigationContext = createContext<WeekNavigationContextType | undefined>(undefined);

export function WeekNavigationProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekStart());

  // Get week number and year from current week
  const currentWeekNumber = (() => {
    const date = new Date(currentWeek);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + yearStart.getDay() + 1) / 7);
  })();

  const currentYear = new Date(currentWeek).getFullYear();

  // Handle URL parameters for week navigation
  useEffect(() => {
    const weekParam = searchParams.get('week');
    const yearParam = searchParams.get('year');
    
    if (weekParam && yearParam) {
      const week = parseInt(weekParam);
      const year = parseInt(yearParam);
      
      if (week >= 1 && week <= 52 && year >= 2020 && year <= 2030) {
        const yearStart = new Date(year, 0, 1);
        const targetWeekStart = new Date(yearStart);
        targetWeekStart.setDate(yearStart.getDate() + (week - 1) * 7);
        
        // Format as YYYY-MM-DD
        const formattedWeek = targetWeekStart.toISOString().split('T')[0];
        setCurrentWeek(formattedWeek);
      }
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