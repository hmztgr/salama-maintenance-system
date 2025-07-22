// Weekly Planning Types for Drag-and-Drop Implementation
import { Visit } from './customer';

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

// Extended Visit interface for weekly planning
export interface WeeklyVisit extends Visit {
  dayOfWeek: number; // 0-6 (Saturday to Friday)
  weekNumber: number;
  year: number;
  companyName?: string;
  branchName?: string;
}

// Week navigation and status
export interface WeekStatus {
  weekNumber: number;
  year: number;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  emergencyVisits: number;
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
}

// Quick actions for week management
export interface WeekQuickAction {
  type: 'approve' | 'complete' | 'export' | 'print';
  label: string;
  icon: string;
  disabled?: boolean;
} 