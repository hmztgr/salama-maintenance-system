import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, VisitAction } from '@/types/weekly-planning';
import { useWeeklyPlanning } from '@/hooks/useWeeklyPlanning';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { DragDropErrorBoundary } from './DragDropErrorBoundary';
import { WeeklyPlannerGrid } from './WeeklyPlannerGrid';
import { WeekStatusOverview } from './WeekStatusOverview';
import { MoveVisitDialog } from './MoveVisitDialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WeeklyPlannerProps {
  weekNumber: number;
  year: number;
  onWeekComplete?: (weekData: WeeklyPlanningData) => void;
  readonly?: boolean;
}

export function WeeklyPlanner({
  weekNumber,
  year,
  onWeekComplete,
  readonly = false
}: WeeklyPlannerProps) {
  const [selectedWeek, setSelectedWeek] = useState({ weekNumber, year });
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [weekStatus, setWeekStatus] = useState<'draft' | 'approved'>('draft');

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
    handleDrop
  } = useDragAndDrop();

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
      case 'reschedule':
        // Handle rescheduling
        console.log('Reschedule visit:', action.visit);
        break;
      case 'add-notes':
        // Handle notes
        console.log('Add notes to visit:', action.visit);
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
      onWeekComplete?.(weekData!);
    } catch (error) {
      console.error('Failed to approve week:', error);
    }
  }, [approveWeek, weekData, onWeekComplete]);

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

  if (!weekData) {
    return (
      <div className="flex justify-center p-8 text-gray-600">
        لا توجد بيانات للأسبوع المحدد
      </div>
    );
  }

  return (
    <DragDropErrorBoundary>
      <div className="weekly-planner">
        {/* Week Navigation */}
        <div className="week-navigation mb-6">
          <div className="flex justify-between items-center">
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
                <ChevronLeft className="h-4 w-4 mr-1" />
                الأسبوع السابق
              </Button>
              <Button
                onClick={() => handleWeekChange(selectedWeek.weekNumber + 1, selectedWeek.year)}
                disabled={selectedWeek.weekNumber >= 52}
                variant="outline"
                size="sm"
              >
                الأسبوع التالي
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week Status Overview */}
        <WeekStatusOverview
          weekData={weekData}
          onQuickAction={handleVisitAction}
          onApprove={handleWeekApproval}
          readonly={readonly}
        />

        {/* Main Planning Grid */}
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

        {/* Move Visit Dialog */}
        {showMoveDialog && selectedVisit && (
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