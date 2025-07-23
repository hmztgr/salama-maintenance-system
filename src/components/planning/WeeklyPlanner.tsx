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

      // Perform the move
      moveVisit(visitId, fromDay, toDay);
      
      // Show success feedback
      console.log(`Visit ${visitId} moved from day ${fromDay} to day ${toDay}`);
      
    } catch (error) {
      console.error('Error moving visit:', error);
    }
  }, [weekData, moveVisit]);

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
        // Navigate to visit completion form
        window.location.href = `/planning/visit-completion?visitId=${action.visit.id}`;
        break;
      case 'cancel':
        // Navigate to visit cancellation form
        window.location.href = `/planning/visit-cancellation?visitId=${action.visit.id}`;
        break;
      case 'reschedule':
        // Handle rescheduling
        break;
      case 'add-notes':
        // Handle notes
        break;
    }
  }, []);

  // Week approval
  const handleWeekApproval = useCallback(async () => {
    try {
      await approveWeek();
      setWeekStatus('approved');
      if (weekData) {
        onWeekComplete?.(weekData);
      }
      
      // Show success message
      alert('تمت الموافقة على الأسبوع بنجاح');
    } catch (error) {
      console.error('Failed to approve week:', error);
      alert('فشل في الموافقة على الأسبوع');
    }
  }, [approveWeek, weekData, onWeekComplete]);

  // Week export
  const handleWeekExport = useCallback(async () => {
    try {
      if (!weekData) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      // Create CSV data
      const csvData = [
        ['Week', 'Year', 'Day', 'Visit ID', 'Branch', 'Company', 'Type', 'Status', 'Date'],
        ...weekData.visits.map(visit => {
          const weeklyVisit = visit as WeeklyVisit;
          return [
            weekData.weekNumber,
            weekData.year,
            ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][weeklyVisit.dayOfWeek || 0],
            visit.visitId,
            weeklyVisit.branchName || 'Unknown',
            weeklyVisit.companyName || 'Unknown',
            visit.type,
            visit.status,
            visit.scheduledDate
          ];
        })
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
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
              <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
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
        {/* Week Navigation */}
        <div className="week-navigation mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                تخطيط الأسبوع {selectedWeek.weekNumber} - {selectedWeek.year}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleWeekChange(selectedWeek.weekNumber - 1, selectedWeek.year)}
                  disabled={selectedWeek.weekNumber <= 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                  الأسبوع السابق
                </Button>
                <Button
                  onClick={() => handleWeekChange(selectedWeek.weekNumber + 1, selectedWeek.year)}
                  disabled={selectedWeek.weekNumber >= 52}
                  variant="outline"
                  size="sm"
                >
                  الأسبوع التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setSelectedWeek({ weekNumber: currentWeek, year: currentYear })}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="h-4 w-4" />
                  الأسبوع الحالي
                </Button>
              </div>
            </div>
            
            {/* Week Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleWeekApproval}
                disabled={weekStatus === 'approved' || readonly}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                موافقة على الأسبوع
              </Button>
              <Button
                onClick={handleWeekExport}
                variant="outline"
                disabled={!weekData || weekData.visits.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                تصدير الأسبوع
              </Button>
              <Button
                onClick={handleWeekPrint}
                variant="outline"
                disabled={!weekData || weekData.visits.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                طباعة الأسبوع
              </Button>
            </div>
          </div>
        </div>

        {/* Week Status Overview */}
        {weekData && (
          <WeekStatusOverview
            weekData={weekData}
            onQuickAction={handleVisitAction}
            onApprove={handleWeekApproval}
            readonly={readonly}
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
            weekData={weekData as WeeklyPlanningData}
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

  // Move visit confirmation
  function handleMoveConfirm(visit: Visit, newDay: number) {
    const weeklyVisit = visit as WeeklyVisit;
    moveVisit(visit.id, weeklyVisit.dayOfWeek || 0, newDay);
    setShowMoveDialog(false);
    setSelectedVisit(null);
  }
} 