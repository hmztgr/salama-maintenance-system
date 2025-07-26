import React, { useMemo } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, DayAvailability } from '@/types/weekly-planning';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface MoveVisitDialogProps {
  visit: Visit;
  weekData: WeeklyPlanningData;
  onMove: (visit: Visit, newDay: number) => void;
  onCancel: () => void;
}

export function MoveVisitDialog({
  visit,
  weekData,
  onMove,
  onCancel
}: MoveVisitDialogProps) {
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Calculate day availability
  const dayAvailability = useMemo((): DayAvailability[] => {
    return weekDays.map((dayName, dayIndex) => {
      const isWorkingDay = dayIndex !== 6; // Friday is holiday
      const dayVisits = weekData.visits.filter(v => {
        const weeklyVisit = v as any;
        return weeklyVisit.dayOfWeek === dayIndex;
      });
      const maxVisits = 8; // Maximum visits per day
      const conflicts = dayVisits.length >= maxVisits ? ['عدد الزيارات يتجاوز الحد الأقصى'] : [];

      return {
        dayIndex,
        dayName,
        visitCount: dayVisits.length,
        maxVisits,
        isAvailable: isWorkingDay && dayVisits.length < maxVisits,
        conflicts
      };
    });
  }, [weekData.visits]);

  const handleMove = (newDay: number) => {
    onMove(visit, newDay);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>نقل زيارة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="visit-info">
            <h4 className="font-semibold">{visit.visitId}</h4>
            <p className="text-sm text-gray-600">
              من {weekDays[(visit as any).dayOfWeek || 0]} إلى:
            </p>
          </div>

          <div className="day-options">
            {dayAvailability.map(day => (
              <div
                key={day.dayIndex}
                className={`day-option ${day.isAvailable ? 'available' : 'unavailable'}`}
              >
                <Button
                  onClick={() => handleMove(day.dayIndex)}
                  disabled={!day.isAvailable || day.dayIndex === ((visit as any).dayOfWeek || 0)}
                  variant={day.isAvailable ? 'default' : 'outline'}
                  className="w-full justify-between"
                >
                  <span>{day.dayName}</span>
                  <span className="text-sm">
                    {day.visitCount}/{day.maxVisits} زيارات
                  </span>
                </Button>
                
                {day.conflicts.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    {day.conflicts.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="dialog-actions">
            <Button variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 