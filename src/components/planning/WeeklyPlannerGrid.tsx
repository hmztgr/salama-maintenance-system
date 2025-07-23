import React, { useMemo, useState } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, DragDropState, VisitAction, WeeklyVisit } from '@/types/weekly-planning';
import { VisitCard } from './VisitCard';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showAddVisitDialog, setShowAddVisitDialog] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Calculate dates for the week
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const startOfWeek = getStartOfWeek(weekData.weekNumber, weekData.year);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, [weekData.weekNumber, weekData.year]);

  // Helper function to get start of week
  function getStartOfWeek(weekNumber: number, year: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const startOfWeek = new Date(firstDayOfYear);
    startOfWeek.setDate(firstDayOfYear.getDate() + (weekNumber - 1) * 7);
    
    // Adjust to Saturday (day 6 in our system)
    const dayOfWeek = startOfWeek.getDay();
    const daysToSaturday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - daysToSaturday);
    
    return startOfWeek;
  }

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
    e.currentTarget.classList.remove('drag-over', 'drag-over-invalid');

    const visitId = e.dataTransfer.getData('visitId');
    const fromDay = parseInt(e.dataTransfer.getData('fromDay'));

    if (visitId && fromDay !== dayIndex) {
      // Allow drops to any day including Friday with no restrictions
      console.log('🔄 Dropping visit:', { visitId, fromDay, toDay: dayIndex });
      onDrop(visitId, fromDay, dayIndex);
    }
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    
    // Allow drops on all days including Friday with no capacity limits
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    
    onDragOver(dayIndex);
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over', 'drag-over-invalid');
  };

  // Handle add visit button click
  const handleAddVisit = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setShowAddVisitDialog(true);
  };

  // Handle visit type selection
  const handleVisitTypeSelection = (type: 'planned' | 'completed' | 'emergency') => {
    if (selectedDayIndex === null) return;

    const date = weekDates[selectedDayIndex];
    const dateString = date.toLocaleDateString('ar-SA');
    const dayName = weekDays[selectedDayIndex];

    switch (type) {
      case 'planned':
        // Add new planned visit to that day
        alert(`إضافة زيارة مخططة لـ ${dayName} (${dateString})\n\nهذه الميزة قيد التطوير. سيتم إضافتها قريباً.`);
        break;
      case 'completed':
        // Open visit completion form with pre-filled date
        window.location.href = `/planning/visit-completion?date=${date.toISOString()}&day=${selectedDayIndex}&dayName=${dayName}`;
        break;
      case 'emergency':
        // Open emergency visit form
        window.location.href = `/planning/emergency-visit?date=${date.toISOString()}&day=${selectedDayIndex}&dayName=${dayName}`;
        break;
    }

    setShowAddVisitDialog(false);
    setSelectedDayIndex(null);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <>
      <div className="weekly-planner-grid">
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((dayName, dayIndex) => {
            const date = weekDates[dayIndex];
            const dayVisits = visitsByDay[dayIndex] || [];
            const isDragTarget = dragState.dragTargetDay === dayIndex;
            const isFriday = dayIndex === 6;

            return (
              <div
                key={dayIndex}
                className={`day-column ${isDragTarget ? 'drag-target' : ''}`}
                onDragOver={(e) => handleDragOver(e, dayIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayIndex)}
              >
                {/* Day Header */}
                <div className="day-header">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">{dayName}</h3>
                    {!readonly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddVisit(dayIndex)}
                        className="h-6 w-6 p-0"
                        title={`إضافة زيارة لـ ${dayName}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {formatDate(date)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dayVisits.length} زيارات
                  </div>
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
                  {dayVisits.length === 0 && (
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

      {/* Add Visit Dialog */}
      <Dialog open={showAddVisitDialog} onOpenChange={setShowAddVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة زيارة جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center text-gray-600 mb-4">
              {selectedDayIndex !== null && selectedDayIndex < weekDays.length && weekDates[selectedDayIndex] && (
                <p>اختر نوع الزيارة لـ {weekDays[selectedDayIndex]} ({weekDates[selectedDayIndex].toLocaleDateString('ar-SA')})</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={() => handleVisitTypeSelection('planned')}
                className="flex items-center justify-start gap-3 h-12"
                variant="outline"
              >
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="text-right">
                  <div className="font-medium">زيارة مخططة</div>
                  <div className="text-sm text-gray-500">إضافة زيارة مخططة جديدة</div>
                </div>
              </Button>

              <Button
                onClick={() => handleVisitTypeSelection('completed')}
                className="flex items-center justify-start gap-3 h-12"
                variant="outline"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-right">
                  <div className="font-medium">زيارة مكتملة</div>
                  <div className="text-sm text-gray-500">إكمال زيارة موجودة</div>
                </div>
              </Button>

              <Button
                onClick={() => handleVisitTypeSelection('emergency')}
                className="flex items-center justify-start gap-3 h-12"
                variant="outline"
              >
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="text-right">
                  <div className="font-medium">زيارة طارئة</div>
                  <div className="text-sm text-gray-500">إنشاء زيارة طارئة جديدة</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

    // Set drag data
    e.dataTransfer.setData('visitId', visit.id);
    e.dataTransfer.setData('fromDay', dayIndex.toString());
    e.dataTransfer.setData('visitType', visit.type);
    e.dataTransfer.setData('visitStatus', visit.status);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set drag image (optional - creates a custom drag preview)
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.7';
    dragImage.style.transform = 'rotate(5deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Remove the temporary element after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    onDragStart(visit.id, dayIndex);
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Clean up any temporary elements
    const tempElements = document.querySelectorAll('.temp-drag-image');
    tempElements.forEach(el => el.remove());
    
    onDragEnd();
  };

  // Quick action handlers
  const handleMove = () => {
    onVisitAction({ type: 'move', visit });
  };

  const handleComplete = () => {
    onVisitAction({ type: 'complete', visit });
  };

  const handleCancel = () => {
    onVisitAction({ type: 'cancel', visit });
  };

  const handleAddNotes = () => {
    onVisitAction({ type: 'add-notes', visit });
  };

  // Get display names with better fallbacks
  const getDisplayName = (name: string | undefined, fallback: string, id: string) => {
    if (name && name !== 'Unknown Company' && name !== 'Unknown Branch') {
      return name;
    }
    // If we have an ID but no name, show a more helpful message
    if (id) {
      return `${fallback} (ID: ${id})`;
    }
    return fallback;
  };

  const displayBranchName = getDisplayName(visit.branchName, 'فرع غير محدد', visit.branchId);
  const displayCompanyName = getDisplayName(visit.companyName, 'شركة غير محددة', visit.companyId);

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
          <h4 className="visit-title">{displayBranchName}</h4>
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
        <p className="visit-company">{displayCompanyName}</p>
        {visit.notes && (
          <p className="visit-notes text-sm text-gray-600">{visit.notes}</p>
        )}
      </div>

      {/* Action Buttons */}
      {!readonly && (
        <div className="visit-actions">
          {visit.status !== 'completed' && visit.status !== 'cancelled' && (
            <>
              <button 
                className="btn btn-sm btn-complete" 
                onClick={handleComplete}
                title="إكمال الزيارة"
              >
                ✅
              </button>
              <button 
                className="btn btn-sm btn-cancel" 
                onClick={handleCancel}
                title="إلغاء الزيارة"
              >
                ❌
              </button>
            </>
          )}
          <button 
            className="btn btn-sm btn-move" 
            onClick={handleMove}
            title="نقل الزيارة"
          >
            🔄
          </button>
        </div>
      )}

      {/* Fallback for non-drag browsers */}
      {!isDragSupported && !readonly && (
        <div className="visit-actions-fallback">
          <button className="btn btn-sm btn-move" onClick={handleMove}>
            نقل
          </button>
        </div>
      )}
    </div>
  );
} 