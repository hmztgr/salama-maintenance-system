// LEGACY Customer type (to be phased out)
export interface CustomerOriginal {
  id: string;
  customerId: string; // Enhanced format: ####-###-###-####
  name: string;
  location: string;
  branch: string;
  area: string;
  contractStartDate?: string; // Format: dd-mmm-yyyy (e.g., 15-Jan-2024)
  contractEndDate?: string; // Format: dd-mmm-yyyy (e.g., 14-Jan-2025)
  regularVisitsPerYear: number;
  emergencyVisitsPerYear: number;
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string; // Format: dd-mmm-yyyy
  teamMember?: string;
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
  weeklyPlan: Record<string, boolean | VisitPlan>; // Week number to visit plan

  // Fire safety services as per BRD specifications
  fireExtinguisherMaintenance: boolean; // صيانة الطفايات
  alarmSystemMaintenance: boolean; // صيانة نظام الانذار
  fireSuppressionMaintenance: boolean; // صيانة نظام الاطفاء
  gasFireSuppression: boolean; // نظام الاطفاء بنظام الغاز
  foamFireSuppression: boolean; // صيانة نظام الاطفاء بنظام الفوم
}

// NEW RESTRUCTURED ENTITIES

export interface Company {
  id: string;
  companyId: string; // Format: 0001, 0002, 0003...
  companyName: string;
  unifiedNumber?: string;
  commercialRegistration?: string;
  commercialRegistrationFile?: File | string; // File for uploads, string URL for storage
  vatNumber?: string;
  vatFile?: File | string; // File for uploads, string URL for storage
  nationalAddressFile?: File | string; // File for uploads, string URL for storage
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactPersonTitle?: string;
  notes?: string;
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string; // Format: dd-mmm-yyyy
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
}

// Service batch for specific branches within a contract
export interface ContractServiceBatch {
  batchId: string; // Unique identifier within contract
  branchIds: string[]; // Array of branch IDs affected by this service batch
  services: {
    fireExtinguisherMaintenance: boolean;
    alarmSystemMaintenance: boolean;
    fireSuppressionMaintenance: boolean;
    gasFireSuppression: boolean;
    foamFireSuppression: boolean;
  };
  regularVisitsPerYear: number;
  emergencyVisitsPerYear: number;
  emergencyVisitCost?: number; // Cost per emergency visit after free visits
  notes?: string;
}

export interface Contract {
  id: string;
  contractId: string; // Format: 0001-001, 0001-002, 0002-001...
  companyId: string; // Reference to company
  contractStartDate: string; // Format: dd-mmm-yyyy
  contractEndDate: string; // Format: dd-mmm-yyyy
  contractPeriodMonths?: number;
  contractDocument?: File | string; // File for uploads, string URL for storage
  contractValue?: number;
  notes?: string;
  // NEW: Service batches per branch instead of global services
  serviceBatches: ContractServiceBatch[];
  
  // NEW: Advanced Contract Management System fields
  status: 'active' | 'archived' | 'expired' | 'cancelled';
  isRenewed: boolean;
  originalContractId?: string; // For renewed contracts
  renewedContractId?: string; // For contracts that were renewed
  addendums: ContractAddendum[];
  archiveReason?: string;
  contractHistory: ContractHistoryEntry[];
  
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string; // Format: dd-mmm-yyyy
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
}

// NEW: Contract Addendum for Advanced Contract Management
export interface ContractAddendum {
  addendumId: string;
  addedAt: string; // Format: dd-mmm-yyyy
  addedBy: string;
  services: {
    fireExtinguisherMaintenance: boolean;
    alarmSystemMaintenance: boolean;
    fireSuppressionMaintenance: boolean;
    gasFireSuppression: boolean;
    foamFireSuppression: boolean;
  };
  description: string;
  effectiveDate: string; // Format: dd-mmm-yyyy
  contractValue: number;
  notes?: string;
}

// NEW: Contract History Entry for Advanced Contract Management
export interface ContractHistoryEntry {
  action: 'created' | 'renewed' | 'modified' | 'addendum_added' | 'archived';
  timestamp: string; // Format: dd-mmm-yyyy
  performedBy: string;
  description: string;
  details?: any;
}

export interface Branch {
  id: string;
  branchId: string; // Format: 0001-JED-001-0001, 0001-JED-001-0002...
  companyId: string; // Reference to company
  city: string;
  location: string;
  branchName: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  teamMember?: string;
  // NEW: Future feature
  snagListEnabled?: boolean; // For future snag list functionality
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string; // Format: dd-mmm-yyyy
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
  weeklyPlan: Record<string, boolean | VisitPlan>; // Week number to visit plan
}



// Update Customer to use the original type for now, will be fully migrated later
export type Customer = CustomerOriginal;

// SUPPORTING TYPES (kept for compatibility)

export interface Location {
  id: string;
  locationId: string; // Format: JED-001
  name: string;
  city: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
}

export interface VisitPlan {
  type: 'planned' | 'completed' | 'emergency';
  notes?: string;
  attachments?: string[];
  assignedTo?: string;
  scheduledDate?: string; // Format: dd-mmm-yyyy
  completedDate?: string; // Format: dd-mmm-yyyy
}

// NEW VISIT MANAGEMENT TYPES

export interface Visit {
  id: string;
  visitId: string; // Generated ID: VISIT-YYYY-####
  branchId: string; // Reference to branch
  contractId: string; // Reference to contract
  companyId: string; // Reference to company
  type: 'regular' | 'emergency' | 'followup';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  scheduledDate: string; // Format: dd-mmm-yyyy
  scheduledTime?: string; // Format: HH:mm
  completedDate?: string; // Format: dd-mmm-yyyy
  completedTime?: string; // Format: HH:mm
  duration?: number; // In minutes
  assignedTeam?: string;
  assignedTechnician?: string;
  notes?: string;
  // Service types from contract
  services: {
    fireExtinguisher?: boolean;
    alarmSystem?: boolean;
    fireSuppression?: boolean;
    gasSystem?: boolean;
    foamSystem?: boolean;
  };
  // Visit results
  results?: {
    overallStatus: 'passed' | 'failed' | 'partial';
    issues?: string[];
    recommendations?: string[];
    nextVisitDate?: string;
  };
  attachments?: {
    name: string;
    url: string;
    path: string;
    size: number;
    type: string;
    uploadedAt: string;
  }[];
  isArchived: boolean;
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
  createdBy: string;
  updatedBy?: string;
}

export interface WeeklyPlanningGrid {
  weekStartDate: string; // Format: dd-mmm-yyyy
  weekEndDate: string; // Format: dd-mmm-yyyy
  weekNumber: number;
  year: number;
  visits: Visit[];
  dailyPlans: {
    [date: string]: DailyPlan; // date in dd-mmm-yyyy format
  };
}

export interface DailyPlan {
  date: string; // Format: dd-mmm-yyyy
  dayOfWeek: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  visits: Visit[];
  totalVisits: number;
  totalDuration: number; // In minutes
  availableTeams: string[];
  workingHours: {
    start: string; // Format: HH:mm
    end: string; // Format: HH:mm
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'supervisor' | 'technician' | 'lead_technician';
  specializations: string[];
  isActive: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

export interface PlanningFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  branchId?: string;
  companyId?: string;
  contractId?: string;
  visitType?: 'regular' | 'emergency' | 'followup';
  visitStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  assignedTeam?: string;
  assignedTechnician?: string;
}

export interface CustomerFormData {
  name: string;
  location: string;
  branch: string;
  area: string;
  contractStartDate?: string;
  contractEndDate?: string;
  regularVisitsPerYear: number;
  emergencyVisitsPerYear: number;
  teamMember?: string;
  // Fire safety services
  fireExtinguisherMaintenance: boolean;
  alarmSystemMaintenance: boolean;
  fireSuppressionMaintenance: boolean;
  gasFireSuppression: boolean;
  foamFireSuppression: boolean;
}

export interface CustomerSearchFilters {
  searchTerm?: string;
  area?: string;
  teamMember?: string;
  isArchived?: boolean;
  contractStatus?: 'active' | 'expired' | 'expiring-soon';
}

// Types for 4-step customer creation process (updated for new structure)

export interface CustomerBasicInfo {
  companyName: string; // mandatory
  unifiedNumber?: string; // الرقم الموحد
  commercialRegistration?: string;
  commercialRegistrationFile?: File;
  vatNumber?: string;
  vatFile?: File;
  nationalAddressFile?: File; // العنوان الوطني
  // Contact information (all optional)
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  contactPersonTitle?: string;
  notes?: string;
}

export interface ContractInfo {
  id: string;
  contractStartDate: string; // mandatory
  contractEndDate: string; // mandatory
  contractPeriodMonths?: number; // alternative to end date
  regularVisitsPerYear: number; // mandatory
  emergencyVisitsPerYear: number; // mandatory
  contractDocument?: File;
  // Fire safety services
  fireExtinguisherMaintenance: boolean;
  alarmSystemMaintenance: boolean;
  fireSuppressionMaintenance: boolean;
  gasFireSuppression: boolean;
  foamFireSuppression: boolean;
  // Additional contract details
  contractValue?: number;
  notes?: string;
  // Contract-specific branches
  branches: BranchInfo[];
}

export interface BranchInfo {
  id: string;
  city: string; // mandatory
  location: string; // mandatory
  branchName: string; // mandatory
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

export interface MultiStepCustomerData {
  basicInfo: CustomerBasicInfo;
  contracts: ContractInfo[];
  branches: BranchInfo[]; // Global branches (legacy, for backward compatibility)
}

export type CustomerCreationStep = 'basic' | 'contract' | 'branches' | 'review';

export interface CustomerCreationState {
  currentStep: CustomerCreationStep;
  data: MultiStepCustomerData;
  isEditing: boolean;
  editingContractId?: string;
}
