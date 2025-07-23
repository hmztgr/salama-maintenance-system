import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, VisitAction, WeeklyVisit } from '@/types/weekly-planning';
import { useWeeklyPlanning } from '@/hooks/useWeeklyPlanning';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { DragDropErrorBoundary } from './DragDropErrorBoundary';
import { WeeklyPlannerGrid } from './WeeklyPlannerGrid';
import { ButtonBasedInterface } from './ButtonBasedInterface';
import { WeekStatusOverview } from './WeekStatusOverview';
import { MoveVisitDialog } from './MoveVisitDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Download, Printer, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';

export interface WeeklyPlannerProps {
  weekNumber?: number;
  year?: number;
  onWeekComplete?: (weekData: WeeklyPlanningData) => void;
  readonly?: boolean;
}

export function WeeklyPlanner({
  weekNumber: initialWeekNumber,
  year: initialYear,
  onWeekComplete,
  readonly = false
}: WeeklyPlannerProps) {
  // Get current week and year as default
  const getCurrentWeekAndYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    return { weekNumber: currentWeek, year: currentYear };
  };

  const { weekNumber: currentWeek, year: currentYear } = getCurrentWeekAndYear();
  const { authState } = useAuth();
  
  const [selectedWeek, setSelectedWeek] = useState({ 
    weekNumber: initialWeekNumber || currentWeek, 
    year: initialYear || currentYear 
  });
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [weekStatus, setWeekStatus] = useState<'draft' | 'approved'>('draft');

  // Helper function to get week number
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Custom hooks
  const {
    weekData,
    loading,
    error,
    updateVisit,
    moveVisit,
    approveWeek,
    saveWeekData
  } = useWeeklyPlanning(selectedWeek.weekNumber, selectedWeek.year);

  const {
    isDragSupported,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop: handleDropEvent
  } = useDragAndDrop();

  // Enhanced drop handler with validation and feedback
  const handleDrop = useCallback((visitId: string, fromDay: number, toDay: number) => {
    try {
      // Validate the move
      const visit = weekData?.visits.find(v => v.id === visitId);
      if (!visit) {
        console.error('Visit not found');
        return;
      }

      // Check if it's a valid move
      if (fromDay === toDay) {
        console.log('No movement needed');
        return;
      }

      // Allow moving to Friday (removed restriction)
      // if (toDay === 6) {
      //   console.warn('Cannot move visits to Friday (holiday)');
      //   return;
      // }

      // Check capacity of target day (but allow Friday)
      const targetDayVisits = weekData?.visits.filter(v => {
        const weeklyVisit = v as any;
        return weeklyVisit.dayOfWeek === toDay;
      }) || [];
      
      if (targetDayVisits.length >= 8) {
        console.warn('Target day is at maximum capacity');
        return;
      }

      // Move the visit
      moveVisit(visitId, fromDay, toDay);
      
      // Update drag state
      handleDropEvent(visitId, fromDay, toDay);
      
      console.log(`Visit ${visitId} moved from day ${fromDay} to day ${toDay}`);
    } catch (error) {
      console.error('Error moving visit:', error);
    }
  }, [weekData, moveVisit, handleDropEvent]);

  // Week navigation
  const handleWeekChange = useCallback((newWeek: number, newYear: number) => {
    setSelectedWeek({ weekNumber: newWeek, year: newYear });
  }, []);

  // Visit actions
  const handleVisitAction = useCallback((action: VisitAction) => {
    switch (action.type) {
      case 'move':
        setSelectedVisit(action.visit);
        setShowMoveDialog(true);
        break;
      case 'complete':
        updateVisit(action.visit.id, { status: 'completed' });
        break;
      case 'cancel':
        // Navigate to cancellation form
        window.location.href = `/planning/visit-cancellation?visitId=${action.visit.id}`;
        break;
      case 'reschedule':
        // Handle rescheduling
        break;
      case 'add-notes':
        // Handle notes
        break;
    }
  }, [updateVisit]);

  // Move visit confirmation
  const handleMoveConfirm = useCallback((visit: Visit, newDay: number) => {
    const weeklyVisit = visit as any;
    moveVisit(visit.id, weeklyVisit.dayOfWeek || 0, newDay);
    setShowMoveDialog(false);
    setSelectedVisit(null);
  }, [moveVisit]);

  // Week approval
  const handleWeekApproval = useCallback(async () => {
    try {
      await approveWeek();
      setWeekStatus('approved');
      if (weekData) {
        onWeekComplete?.(weekData);
      }
    } catch (error) {
      console.error('Failed to approve week:', error);
    }
  }, [approveWeek, weekData, onWeekComplete]);

  // Week export
  const handleWeekExport = useCallback(async () => {
    try {
      if (!weekData) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      // Create CSV content
      const csvContent = [
        ['Day', 'Visit ID', 'Branch', 'Company', 'Type', 'Status', 'Date'],
        ...weekData.visits.map(visit => {
          const weeklyVisit = visit as WeeklyVisit;
          const visitDate = new Date(visit.scheduledDate);
          const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
          return [
            dayNames[weeklyVisit.dayOfWeek] || 'Unknown',
            visit.visitId,
            weeklyVisit.branchName || 'Unknown',
            weeklyVisit.companyName || 'Unknown',
            visit.type === 'emergency' ? 'Emergency' : 'Regular',
            visit.status,
            visitDate.toLocaleDateString('en-GB')
          ];
        })
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `week-${weekData.weekNumber}-${weekData.year}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Export week data');
    } catch (error) {
      console.error('Failed to export week:', error);
      alert('فشل في تصدير الأسبوع');
    }
  }, [weekData]);

  // Week print
  const handleWeekPrint = useCallback(async () => {
    try {
      if (!weekData) {
        alert('لا توجد بيانات للطباعة');
        return;
      }

      // Create print-friendly content
      const printContent = `
        <html>
          <head>
            <title>Weekly Plan - Week ${weekData.weekNumber} ${weekData.year}</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; }
              .header { text-align: center; margin-bottom: 20px; }
              .day { margin-bottom: 15px; border: 1px solid #ccc; padding: 10px; }
              .visit { margin: 5px 0; padding: 5px; background: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>خطة الأسبوع ${weekData.weekNumber} - ${weekData.year}</h1>
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
            ${['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, index) => {
              const dayVisits = weekData.visits.filter(v => {
                const weeklyVisit = v as WeeklyVisit;
                return weeklyVisit.dayOfWeek === index;
              });
              return `
                <div class="day">
                  <h3>${dayName}</h3>
                  ${dayVisits.length === 0 ? '<p>لا توجد زيارات</p>' : 
                    dayVisits.map(visit => {
                      const weeklyVisit = visit as WeeklyVisit;
                      return `
                        <div class="visit">
                          <strong>${visit.visitId}</strong> - ${weeklyVisit.branchName || 'Unknown'} - ${weeklyVisit.companyName || 'Unknown'}
                        </div>
                      `;
                    }).join('')
                  }
                </div>
              `;
            }).join('')}
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
      
      console.log('Print week data');
    } catch (error) {
      console.error('Failed to print week:', error);
      alert('فشل في طباعة الأسبوع');
    }
  }, [weekData]);

  // Auto-save on changes
  useEffect(() => {
    if (weekData && weekData.status === 'draft') {
      const timeoutId = setTimeout(() => {
        saveWeekData(weekData);
      }, 2000); // Debounce auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [weekData, saveWeekData]);

  if (loading) {
    return <div className="flex justify-center p-8">جاري تحميل بيانات الأسبوع...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center p-8 text-red-600">
        خطأ في تحميل بيانات الأسبوع: {error}
      </div>
    );
  }

  return (
    <DragDropErrorBoundary>
      <div className="weekly-planner">
        {/* Week Selection Buttons */}
        <div className="week-selection mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from({ length: 52 }, (_, i) => i + 1).map(weekNum => (
              <Button
                key={weekNum}
                onClick={() => handleWeekChange(weekNum, selectedWeek.year)}
                variant={selectedWeek.weekNumber === weekNum ? 'default' : 'outline'}
                size="sm"
                className="min-w-[60px]"
              >
                {weekNum}
              </Button>
            ))}
          </div>
        </div>

        {/* Week Header */}
        <div className="week-header mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              تخطيط الأسبوع {selectedWeek.weekNumber} - {selectedWeek.year}
            </h2>
          </div>
        </div>

        {/* Week Status Overview */}
        {weekData && (
          <WeekStatusOverview
            weekData={weekData}
            onQuickAction={handleVisitAction}
            onApprove={handleWeekApproval}
            onExport={handleWeekExport}
            onPrint={handleWeekPrint}
            readonly={readonly}
            userName={authState.user?.displayName || authState.user?.email || 'مستخدم النظام'}
          />
        )}

        {/* Main Planning Grid */}
        {weekData && (
          <WeeklyPlannerGrid
            weekData={weekData}
            dragState={dragState}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onVisitAction={handleVisitAction}
            readonly={readonly}
            isDragSupported={isDragSupported}
          />
        )}

        {/* Move Visit Dialog */}
        {showMoveDialog && selectedVisit && weekData && (
          <MoveVisitDialog
            visit={selectedVisit}
            weekData={weekData}
            onMove={handleMoveConfirm}
            onCancel={() => {
              setShowMoveDialog(false);
              setSelectedVisit(null);
            }}
          />
        )}
      </div>
    </DragDropErrorBoundary>
  );
} 