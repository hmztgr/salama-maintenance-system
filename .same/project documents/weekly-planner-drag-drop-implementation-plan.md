# Weekly Planner Drag-and-Drop Implementation Plan
## Safe Implementation Strategy with Fallback Options

### 📋 **Document Overview**
- **Feature**: Weekly Planner with Safe Drag-and-Drop
- **Version**: 1.0 (Initial Implementation)
- **Date**: January 2025
- **Status**: Planning Phase
- **Risk Level**: Medium (with safety measures)

---

## 🎯 **IMPLEMENTATION STRATEGY**

### **Core Philosophy**
- **Progressive Enhancement**: Start with buttons, add drag-and-drop as enhancement
- **Safety First**: Error boundaries and fallback mechanisms
- **User Choice**: Both drag-and-drop and button interfaces available
- **Mobile Friendly**: Touch-optimized interactions

### **Key Principles**
1. **No Complex Libraries**: Use native HTML5 drag-and-drop only
2. **Limited Scope**: Drag within same day or to adjacent days only
3. **Error Recovery**: Automatic fallback to button interface
4. **Performance**: Debounced updates and optimized re-renders
5. **Accessibility**: Full keyboard navigation support

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Component Structure**
```
src/components/planning/
├── WeeklyPlanner.tsx              # Main weekly planner component
├── WeeklyPlannerGrid.tsx          # Week grid with drag zones
├── VisitCard.tsx                  # Individual visit with drag/buttons
├── DragDropErrorBoundary.tsx      # Error boundary for drag operations
├── ButtonBasedInterface.tsx       # Fallback button interface
├── MoveVisitDialog.tsx            # Dialog for move confirmation
├── WeekStatusOverview.tsx         # Week status and quick actions
└── hooks/
    ├── useWeeklyPlanning.ts       # Weekly planning logic
    ├── useDragAndDrop.ts          # Drag-and-drop utilities
    └── useVisitMovement.ts        # Visit movement logic
```

### **Data Flow**
```
Annual Planner → Weekly Planner → Individual Visit Management
     ↓              ↓                    ↓
Planned Visits → Week Grid → Drag/Button Interface
     ↓              ↓                    ↓
Visit Data → State Management → Firebase Update
```

---

## 📝 **DETAILED IMPLEMENTATION REQUIREMENTS**

### **1. Core Types and Interfaces**

```typescript
// types/weekly-planning.ts
export interface WeeklyPlanningData {
  weekNumber: number;
  year: number;
  visits: Visit[];
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
  lastModified: string;
  modifiedBy: string;
}

export interface VisitMovement {
  visitId: string;
  fromDay: number;
  toDay: number;
  timestamp: string;
  userId: string;
}

export interface DayAvailability {
  dayIndex: number;
  dayName: string;
  visitCount: number;
  maxVisits: number;
  isAvailable: boolean;
  conflicts: string[];
}

export interface DragDropState {
  isDragging: boolean;
  draggedVisitId: string | null;
  dragSourceDay: number | null;
  dragTargetDay: number | null;
  isDragSupported: boolean;
}

export interface VisitAction {
  type: 'move' | 'complete' | 'reschedule' | 'add-notes';
  visit: Visit;
  data?: any;
}
```

### **2. Main Weekly Planner Component**

```typescript
// components/planning/WeeklyPlanner.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Visit, WeeklyPlanningData, VisitAction } from '@/types/weekly-planning';
import { useWeeklyPlanning } from '@/hooks/useWeeklyPlanning';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { DragDropErrorBoundary } from './DragDropErrorBoundary';
import { WeeklyPlannerGrid } from './WeeklyPlannerGrid';
import { WeekStatusOverview } from './WeekStatusOverview';
import { MoveVisitDialog } from './MoveVisitDialog';

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
        break;
      case 'add-notes':
        // Handle notes
        break;
    }
  }, [updateVisit]);

  // Move visit confirmation
  const handleMoveConfirm = useCallback((visit: Visit, newDay: number) => {
    moveVisit(visit.id, visit.dayOfWeek, newDay);
    setShowMoveDialog(false);
    setSelectedVisit(null);
  }, [moveVisit]);

  // Week approval
  const handleWeekApproval = useCallback(async () => {
    try {
      await approveWeek();
      setWeekStatus('approved');
      onWeekComplete?.(weekData);
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
              >
                الأسبوع السابق
              </Button>
              <Button
                onClick={() => handleWeekChange(selectedWeek.weekNumber + 1, selectedWeek.year)}
                disabled={selectedWeek.weekNumber >= 52}
              >
                الأسبوع التالي
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
```

### **3. Weekly Planner Grid Component**

```typescript
// components/planning/WeeklyPlannerGrid.tsx
import React, { useMemo } from 'react';
import { Visit, WeeklyPlanningData, DragDropState, VisitAction } from '@/types/weekly-planning';
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
    const grouped: Record<number, Visit[]> = {};
    weekDays.forEach((_, index) => {
      grouped[index] = [];
    });

    weekData.visits.forEach(visit => {
      if (visit.dayOfWeek >= 0 && visit.dayOfDay < 7) {
        grouped[visit.dayOfWeek].push(visit);
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
                  <VisitCard
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
```

### **4. Visit Card Component**

```typescript
// components/planning/VisitCard.tsx
import React, { useState } from 'react';
import { Visit, VisitAction } from '@/types/weekly-planning';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Move, CheckCircle, Edit } from 'lucide-react';

export interface VisitCardProps {
  visit: Visit;
  dayIndex: number;
  isDragging: boolean;
  onDragStart: (visitId: string, dayIndex: number) => void;
  onDragEnd: () => void;
  onVisitAction: (action: VisitAction) => void;
  readonly?: boolean;
  isDragSupported: boolean;
}

export function VisitCard({
  visit,
  dayIndex,
  isDragging,
  onDragStart,
  onDragEnd,
  onVisitAction,
  readonly = false,
  isDragSupported
}: VisitCardProps) {
  const [showActions, setShowActions] = useState(false);

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
          <h4 className="visit-title">{visit.branchName}</h4>
          <div className="visit-meta">
            <Badge variant={visit.type === 'emergency' ? 'destructive' : 'default'}>
              {visit.type === 'emergency' ? '🚨 طارئة' : '📅 عادية'}
            </Badge>
            {visit.status === 'completed' && (
              <Badge variant="secondary">✅ مكتملة</Badge>
            )}
          </div>
        </div>

        {!readonly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Visit Details */}
      <div className="visit-details">
        <p className="visit-company">{visit.companyName}</p>
        {visit.notes && (
          <p className="visit-notes text-sm text-gray-600">{visit.notes}</p>
        )}
      </div>

      {/* Action Buttons (Fallback for non-drag) */}
      {!isDragSupported && !readonly && (
        <div className="visit-actions">
          <Button size="sm" onClick={handleMove}>
            <Move className="h-4 w-4 mr-1" />
            نقل
          </Button>
          {visit.status !== 'completed' && (
            <Button size="sm" variant="outline" onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-1" />
              إكمال
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAddNotes}>
            <Edit className="h-4 w-4 mr-1" />
            ملاحظات
          </Button>
        </div>
      )}

      {/* Dropdown Actions (For drag-enabled interface) */}
      {showActions && isDragSupported && !readonly && (
        <div className="visit-dropdown-actions">
          <Button size="sm" onClick={handleMove}>
            <Move className="h-4 w-4 mr-1" />
            نقل
          </Button>
          {visit.status !== 'completed' && (
            <Button size="sm" variant="outline" onClick={handleComplete}>
              <CheckCircle className="h-4 w-4 mr-1" />
              إكمال
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleAddNotes}>
            <Edit className="h-4 w-4 mr-1" />
            ملاحظات
          </Button>
        </div>
      )}
    </div>
  );
}
```

### **5. Custom Hooks**

```typescript
// hooks/useWeeklyPlanning.ts
import { useState, useEffect, useCallback } from 'react';
import { Visit, WeeklyPlanningData, VisitMovement } from '@/types/weekly-planning';
import { useVisits } from '@/hooks/useVisits';
import { useBranches } from '@/hooks/useBranches';

export function useWeeklyPlanning(weekNumber: number, year: number) {
  const [weekData, setWeekData] = useState<WeeklyPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movements, setMovements] = useState<VisitMovement[]>([]);

  const { visits, updateVisit: updateVisitInStore } = useVisits();
  const { branches } = useBranches();

  // Load week data
  const loadWeekData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Filter visits for the specific week and year
      const weekVisits = visits.filter(visit => {
        const visitDate = new Date(visit.scheduledDate);
        const visitWeek = getWeekNumber(visitDate);
        const visitYear = visitDate.getFullYear();
        
        return visitWeek === weekNumber && visitYear === year;
      });

      // Create week data structure
      const weekPlanningData: WeeklyPlanningData = {
        weekNumber,
        year,
        visits: weekVisits,
        status: 'draft',
        lastModified: new Date().toISOString(),
        modifiedBy: 'current-user' // Get from auth context
      };

      setWeekData(weekPlanningData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load week data');
    } finally {
      setLoading(false);
    }
  }, [weekNumber, year, visits]);

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
      const currentDate = new Date(visit.scheduledDate);
      const daysDiff = toDay - fromDay;
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + daysDiff);

      // Update visit
      await updateVisit(visitId, {
        dayOfWeek: toDay,
        scheduledDate: newDate.toISOString()
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

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
```

```typescript
// hooks/useDragAndDrop.ts
import { useState, useEffect, useCallback } from 'react';
import { DragDropState } from '@/types/weekly-planning';

export function useDragAndDrop() {
  const [isDragSupported, setIsDragSupported] = useState(false);
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    draggedVisitId: null,
    dragSourceDay: null,
    dragTargetDay: null,
    isDragSupported: false
  });

  // Check if drag-and-drop is supported
  useEffect(() => {
    const testElement = document.createElement('div');
    testElement.draggable = true;
    
    const supported = 'draggable' in testElement && 
                     'ondragstart' in testElement &&
                     'ondrop' in testElement;
    
    setIsDragSupported(supported);
    setDragState(prev => ({ ...prev, isDragSupported: supported }));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((visitId: string, dayIndex: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedVisitId: visitId,
      dragSourceDay: dayIndex,
      dragTargetDay: null
    }));
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((dayIndex: number) => {
    setDragState(prev => ({
      ...prev,
      dragTargetDay: dayIndex
    }));
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedVisitId: null,
      dragSourceDay: null,
      dragTargetDay: null
    }));
  }, []);

  // Handle drop
  const handleDrop = useCallback((visitId: string, fromDay: number, toDay: number) => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedVisitId: null,
      dragSourceDay: null,
      dragTargetDay: null
    }));
  }, []);

  return {
    isDragSupported,
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop
  };
}
```

### **6. Error Boundary Component**

```typescript
// components/planning/DragDropErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DragDropErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Drag and drop error:', error, errorInfo);
    
    // Log to error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="drag-drop-error">
          <div className="error-content">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              حدث خطأ في واجهة السحب والإفلات
            </h3>
            <p className="text-gray-600 mb-4">
              تم تفعيل الواجهة البديلة باستخدام الأزرار
            </p>
            <Button onClick={this.handleRetry}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **7. Move Visit Dialog**

```typescript
// components/planning/MoveVisitDialog.tsx
import React, { useMemo } from 'react';
import { Visit, WeeklyPlanningData, DayAvailability } from '@/types/weekly-planning';
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
      const dayVisits = weekData.visits.filter(v => v.dayOfWeek === dayIndex);
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
            <h4 className="font-semibold">{visit.branchName}</h4>
            <p className="text-sm text-gray-600">{visit.companyName}</p>
            <p className="text-sm text-gray-600">
              من {weekDays[visit.dayOfWeek]} إلى:
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
                  disabled={!day.isAvailable || day.dayIndex === visit.dayOfWeek}
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
```

---

## 🎨 **CSS STYLES**

```css
/* styles/weekly-planner.css */
.weekly-planner {
  @apply space-y-6;
}

.weekly-planner-grid {
  @apply bg-white rounded-lg shadow-sm border;
}

.day-column {
  @apply p-4 border-r border-gray-200 min-h-[400px];
}

.day-column:last-child {
  @apply border-r-0;
}

.day-column.holiday {
  @apply bg-red-50;
}

.day-column.drag-over {
  @apply bg-blue-50 border-blue-300;
}

.day-header {
  @apply mb-4 pb-2 border-b border-gray-200;
}

.day-header h3 {
  @apply text-lg font-semibold text-gray-900;
}

.visit-list {
  @apply space-y-2;
}

.visit-card {
  @apply p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move;
  @apply hover:shadow-md transition-shadow duration-200;
}

.visit-card.dragging {
  @apply opacity-50 transform rotate-2;
}

.visit-card.completed {
  @apply bg-green-50 border-green-200;
}

.visit-header {
  @apply flex justify-between items-start mb-2;
}

.visit-title {
  @apply font-medium text-gray-900;
}

.visit-meta {
  @apply flex gap-1 mt-1;
}

.visit-details {
  @apply space-y-1;
}

.visit-company {
  @apply text-sm text-gray-600;
}

.visit-notes {
  @apply text-xs text-gray-500 italic;
}

.visit-actions {
  @apply flex gap-1 mt-3;
}

.visit-dropdown-actions {
  @apply absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10;
  @apply flex flex-col gap-1;
}

.empty-visit-slot {
  @apply p-4 text-center border-2 border-dashed border-gray-300 rounded-lg;
}

.drag-drop-error {
  @apply flex justify-center items-center p-8;
}

.error-content {
  @apply text-center;
}

.week-navigation {
  @apply bg-white rounded-lg shadow-sm border p-4;
}

.week-status-overview {
  @apply bg-white rounded-lg shadow-sm border p-4;
}

.status-cards {
  @apply grid grid-cols-4 gap-4 mb-4;
}

.status-card {
  @apply p-3 bg-gray-50 rounded-lg text-center;
}

.quick-actions {
  @apply flex gap-2;
}

.day-options {
  @apply grid grid-cols-2 gap-2;
}

.day-option.available {
  @apply opacity-100;
}

.day-option.unavailable {
  @apply opacity-50;
}

.dialog-actions {
  @apply flex justify-end gap-2 pt-4 border-t border-gray-200;
}
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests**
```typescript
// __tests__/components/WeeklyPlanner.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyPlanner } from '@/components/planning/WeeklyPlanner';

describe('WeeklyPlanner', () => {
  it('renders week navigation correctly', () => {
    render(<WeeklyPlanner weekNumber={1} year={2025} />);
    expect(screen.getByText('تخطيط الأسبوع 1 - 2025')).toBeInTheDocument();
  });

  it('handles week navigation', () => {
    render(<WeeklyPlanner weekNumber={1} year={2025} />);
    const nextButton = screen.getByText('الأسبوع التالي');
    fireEvent.click(nextButton);
    expect(screen.getByText('تخطيط الأسبوع 2 - 2025')).toBeInTheDocument();
  });
});
```

### **Integration Tests**
```typescript
// __tests__/integration/WeeklyPlanning.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeeklyPlanner } from '@/components/planning/WeeklyPlanner';

describe('Weekly Planning Integration', () => {
  it('allows moving visits between days', async () => {
    render(<WeeklyPlanner weekNumber={1} year={2025} />);
    
    // Find a visit and drag it
    const visitCard = screen.getByText('Branch Name');
    const targetDay = screen.getByText('الأحد');
    
    fireEvent.dragStart(visitCard);
    fireEvent.dragOver(targetDay);
    fireEvent.drop(targetDay);
    
    await waitFor(() => {
      expect(targetDay).toHaveTextContent('1 زيارات');
    });
  });
});
```

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation (Week 1)**
- [ ] Create basic types and interfaces
- [ ] Implement WeeklyPlanner component structure
- [ ] Add week navigation
- [ ] Create basic grid layout
- [ ] Add button-based visit management

### **Phase 2: Drag-and-Drop (Week 2)**
- [ ] Implement useDragAndDrop hook
- [ ] Add drag-and-drop to VisitCard
- [ ] Create drop zones in WeeklyPlannerGrid
- [ ] Add visual feedback during drag
- [ ] Implement error boundary

### **Phase 3: Enhanced Features (Week 3)**
- [ ] Add MoveVisitDialog
- [ ] Implement conflict detection
- [ ] Add week status overview
- [ ] Create undo functionality
- [ ] Add auto-save feature

### **Phase 4: Polish & Testing (Week 4)**
- [ ] Add comprehensive tests
- [ ] Optimize performance
- [ ] Improve accessibility
- [ ] Add mobile touch support
- [ ] User acceptance testing

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
- ✅ Users can move visits between days using drag-and-drop
- ✅ Button interface works as fallback
- ✅ Week navigation works correctly
- ✅ Visit status updates properly
- ✅ Conflicts are detected and prevented

### **Performance Requirements**
- ✅ Page loads in <2 seconds
- ✅ Drag operations are smooth (60fps)
- ✅ No memory leaks during drag operations
- ✅ Auto-save doesn't block UI

### **Usability Requirements**
- ✅ Mobile-friendly touch interactions
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Clear visual feedback

### **Technical Requirements**
- ✅ No React infinite loops
- ✅ Error boundaries catch and handle errors
- ✅ Progressive enhancement works
- ✅ Code is maintainable and testable

---

## 🚨 **RISK MITIGATION**

### **Technical Risks**
1. **React State Issues**: Use immutable state updates and debouncing
2. **Performance Problems**: Implement virtualization for large datasets
3. **Mobile Compatibility**: Test on multiple devices and browsers
4. **Accessibility Issues**: Follow WCAG guidelines and test with screen readers

### **User Experience Risks**
1. **Learning Curve**: Provide clear visual cues and help text
2. **Error Recovery**: Implement undo functionality and clear error messages
3. **Data Loss**: Auto-save and confirmation dialogs
4. **Confusion**: Progressive disclosure and contextual help

### **Business Risks**
1. **Adoption**: Provide training materials and user guides
2. **Productivity**: Ensure the interface is faster than manual methods
3. **Data Integrity**: Comprehensive validation and backup strategies
4. **Support**: Document common issues and solutions

---

This implementation plan provides a comprehensive roadmap for building a safe, user-friendly weekly planner with drag-and-drop functionality while maintaining system stability and providing fallback options. 