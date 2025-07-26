import React, { useState } from 'react';
import { Visit } from '@/types/customer';
import { WeeklyPlanningData, VisitAction } from '@/types/weekly-planning';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Move, CheckCircle, Edit, AlertTriangle } from 'lucide-react';

export interface ButtonBasedInterfaceProps {
  weekData: WeeklyPlanningData;
  onVisitAction: (action: VisitAction) => void;
  readonly?: boolean;
}

export function ButtonBasedInterface({
  weekData,
  onVisitAction,
  readonly = false
}: ButtonBasedInterfaceProps) {
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showMoveOptions, setShowMoveOptions] = useState(false);
  const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Group visits by day
  const visitsByDay = weekData.visits.reduce((acc, visit) => {
    const weeklyVisit = visit as any;
    const dayIndex = weeklyVisit.dayOfWeek || 0;
    if (!acc[dayIndex]) acc[dayIndex] = [];
    acc[dayIndex].push(visit);
    return acc;
  }, {} as Record<number, Visit[]>);

  const handleMoveVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowMoveOptions(true);
  };

  const handleMoveToDay = (newDay: number) => {
    if (selectedVisit) {
      const weeklyVisit = selectedVisit as any;
      onVisitAction({
        type: 'move',
        visit: selectedVisit,
        data: { fromDay: weeklyVisit.dayOfWeek || 0, toDay: newDay }
      });
    }
    setShowMoveOptions(false);
    setSelectedVisit(null);
  };

  const handleCompleteVisit = (visit: Visit) => {
    onVisitAction({ type: 'complete', visit });
  };

  const handleAddNotes = (visit: Visit) => {
    onVisitAction({ type: 'add-notes', visit });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return '🚨';
      case 'followup':
        return '📋';
      default:
        return '📅';
    }
  };

  return (
    <div className="button-based-interface">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            واجهة الأزرار (بديل للسحب والإفلات)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((dayName, dayIndex) => {
              const isWorkingDay = dayIndex !== 6;
              const dayVisits = visitsByDay[dayIndex] || [];

              return (
                <div
                  key={dayIndex}
                  className={`day-column ${!isWorkingDay ? 'holiday' : ''}`}
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
                      <div
                        key={visit.id}
                        className={`visit-card ${visit.status === 'completed' ? 'completed' : ''}`}
                      >
                        {/* Visit Header */}
                        <div className="visit-header">
                          <div className="visit-info">
                            <h4 className="visit-title">
                              {getTypeIcon(visit.type)} {visit.visitId}
                            </h4>
                            <div className="visit-meta">
                              <Badge className={getStatusColor(visit.status)}>
                                {visit.status === 'completed' ? 'مكتملة' : 'مجدولة'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Visit Details */}
                        <div className="visit-details">
                          <p className="visit-company">
                            {(visit as any).companyName || 'Unknown Company'}
                          </p>
                          <p className="visit-branch">
                            {(visit as any).branchName || 'Unknown Branch'}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        {!readonly && (
                          <div className="visit-actions">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoveVisit(visit)}
                              className="w-full mb-1"
                            >
                              <Move className="h-4 w-4 mr-1" />
                              نقل
                            </Button>
                            
                            {visit.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteVisit(visit)}
                                className="w-full mb-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                إكمال
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddNotes(visit)}
                              className="w-full"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              ملاحظات
                            </Button>
                          </div>
                        )}
                      </div>
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

          {/* Move Options Dialog */}
          {showMoveOptions && selectedVisit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  نقل زيارة {selectedVisit.visitId}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  اختر اليوم الجديد للزيارة:
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {weekDays.map((dayName, dayIndex) => {
                    const isWorkingDay = dayIndex !== 6;
                    const dayVisits = visitsByDay[dayIndex] || [];
                    const isFull = dayVisits.length >= 8;
                    const weeklyVisit = selectedVisit as any;
                    const isCurrentDay = (weeklyVisit.dayOfWeek || 0) === dayIndex;

                    return (
                      <Button
                        key={dayIndex}
                        onClick={() => handleMoveToDay(dayIndex)}
                        disabled={!isWorkingDay || isFull || isCurrentDay}
                        variant={isWorkingDay && !isFull && !isCurrentDay ? 'default' : 'outline'}
                        className="justify-between"
                      >
                        <span>{dayName}</span>
                        <span className="text-xs">
                          {dayVisits.length}/8
                        </span>
                      </Button>
                    );
                  })}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMoveOptions(false);
                      setSelectedVisit(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 