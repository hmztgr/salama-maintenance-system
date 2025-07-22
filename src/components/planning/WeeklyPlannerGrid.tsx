import React, { useMemo } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, DragDropState, VisitAction, WeeklyVisit } from '@/types/weekly-planning';
import { VisitCard } from './VisitCard';

export interface WeeklyPlannerGridProps {
  weekData: WeeklyPlanningData;
  dragState: DragDropState;
  onDragStart: (visitId: string, dayIndex: number) => void;
  onDragOver: (dayIndex: number) => void;
  onDragEnd: () => void;
  onDrop: (visitId: string, fromDay: number, toDay: number) => void;
  onVisitAction: (action: VisitAction) => void;
  readonly?: boolean;
  isDragSupported: boolean;
}

export function WeeklyPlannerGrid({
  weekData,
  dragState,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onVisitAction,
  readonly = false,
  isDragSupported
}: WeeklyPlannerGridProps) {
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Group visits by day
  const visitsByDay = useMemo(() => {
    const grouped: Record<number, WeeklyVisit[]> = {};
    weekDays.forEach((_, index) => {
      grouped[index] = [];
    });

    weekData.visits.forEach(visit => {
      const weeklyVisit = visit as WeeklyVisit;
      if (weeklyVisit.dayOfWeek >= 0 && weeklyVisit.dayOfWeek < 7) {
        grouped[weeklyVisit.dayOfWeek].push(weeklyVisit);
      }
    });

    return grouped;
  }, [weekData.visits]);

  // Handle drop events
  const handleDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const visitId = e.dataTransfer.getData('visitId');
    const fromDay = parseInt(e.dataTransfer.getData('fromDay'));

    if (visitId && fromDay !== dayIndex) {
      onDrop(visitId, fromDay, dayIndex);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
    onDragOver(dayIndex);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  };

  return (
    <div className="weekly-planner-grid">
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((dayName, dayIndex) => {
          const isWorkingDay = dayIndex !== 6; // Friday is holiday
          const dayVisits = visitsByDay[dayIndex] || [];
          const isDragTarget = dragState.dragTargetDay === dayIndex;

          return (
            <div
              key={dayIndex}
              className={`day-column ${!isWorkingDay ? 'holiday' : ''} ${
                isDragTarget ? 'drag-target' : ''
              }`}
              onDragOver={(e) => isWorkingDay && handleDragOver(e, dayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => isWorkingDay && handleDrop(e, dayIndex)}
            >
              {/* Day Header */}
              <div className="day-header">
                <h3 className="text-lg font-semibold">{dayName}</h3>
                <span className="text-sm text-gray-600">
                  {dayVisits.length} زيارات
                </span>
                {!isWorkingDay && (
                  <span className="text-sm text-red-600">عطلة</span>
                )}
              </div>

              {/* Visit List */}
              <div className="visit-list">
                {dayVisits.map((visit) => (
                  <WeeklyVisitCard
                    key={visit.id}
                    visit={visit}
                    dayIndex={dayIndex}
                    isDragging={dragState.draggedVisitId === visit.id}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onVisitAction={onVisitAction}
                    readonly={readonly}
                    isDragSupported={isDragSupported}
                  />
                ))}

                {/* Empty State */}
                {dayVisits.length === 0 && isWorkingDay && (
                  <div className="empty-visit-slot">
                    <span className="text-gray-400 text-sm">
                      لا توجد زيارات مخططة
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Weekly Visit Card Component (enhanced version of VisitCard for weekly planning)
interface WeeklyVisitCardProps {
  visit: WeeklyVisit;
  dayIndex: number;
  isDragging: boolean;
  onDragStart: (visitId: string, dayIndex: number) => void;
  onDragEnd: () => void;
  onVisitAction: (action: VisitAction) => void;
  readonly?: boolean;
  isDragSupported: boolean;
}

function WeeklyVisitCard({
  visit,
  dayIndex,
  isDragging,
  onDragStart,
  onDragEnd,
  onVisitAction,
  readonly = false,
  isDragSupported
}: WeeklyVisitCardProps) {
  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDragSupported || readonly) return;

    e.dataTransfer.setData('visitId', visit.id);
    e.dataTransfer.setData('fromDay', dayIndex.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    onDragStart(visit.id, dayIndex);
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnd();
  };

  // Quick action handlers
  const handleMove = () => {
    onVisitAction({ type: 'move', visit });
  };

  const handleComplete = () => {
    onVisitAction({ type: 'complete', visit });
  };

  const handleAddNotes = () => {
    onVisitAction({ type: 'add-notes', visit });
  };

  return (
    <div
      className={`visit-card ${isDragging ? 'dragging' : ''} ${
        visit.status === 'completed' ? 'completed' : ''
      }`}
      draggable={isDragSupported && !readonly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Visit Header */}
      <div className="visit-header">
        <div className="visit-info">
          <h4 className="visit-title">{visit.branchName || 'Unknown Branch'}</h4>
          <div className="visit-meta">
            <span className={`badge ${visit.type === 'emergency' ? 'badge-emergency' : 'badge-regular'}`}>
              {visit.type === 'emergency' ? '🚨 طارئة' : '📅 عادية'}
            </span>
            {visit.status === 'completed' && (
              <span className="badge badge-completed">✅ مكتملة</span>
            )}
          </div>
        </div>
      </div>

      {/* Visit Details */}
      <div className="visit-details">
        <p className="visit-company">{visit.companyName || 'Unknown Company'}</p>
        {visit.notes && (
          <p className="visit-notes text-sm text-gray-600">{visit.notes}</p>
        )}
      </div>

      {/* Action Buttons (Fallback for non-drag) */}
      {!isDragSupported && !readonly && (
        <div className="visit-actions">
          <button className="btn btn-sm btn-move" onClick={handleMove}>
            نقل
          </button>
          {visit.status !== 'completed' && (
            <button className="btn btn-sm btn-complete" onClick={handleComplete}>
              إكمال
            </button>
          )}
          <button className="btn btn-sm btn-notes" onClick={handleAddNotes}>
            ملاحظات
          </button>
        </div>
      )}
    </div>
  );
} 