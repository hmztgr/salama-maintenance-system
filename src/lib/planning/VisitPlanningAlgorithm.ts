import { Branch, Contract, ContractServiceBatch, Visit } from '@/types/customer';
import { parseStandardDate, getCurrentDate } from '@/lib/date-handler';

export interface PlanningOptions {
  maxVisitsPerDay: number;
  preferredWeekStart: 'saturday' | 'sunday';
  minDaysBetweenVisits: number;
  includeExistingVisits: boolean;
  conflictResolution: 'skip' | 'reschedule' | 'error';
  batchSize: number;
}

export interface VisitPlanningData {
  branch: Branch;
  contract: Contract;
  serviceBatch: ContractServiceBatch;
  requiredVisits: number;
  contractStart: Date;
  contractEnd: Date;
  existingVisits: Visit[];
  completedVisits: Visit[];
}

export interface VisitSchedule {
  branchId: string;
  contractId: string;
  scheduledDates: string[];
  visitSpacing: number;
  weeklyDistribution: number;
}

export interface VisitConflict {
  date: string;
  existingVisits: number;
  maxDailyVisits: number;
  alternativeDates: string[];
}

export interface PlanningResult {
  success: boolean;
  plannedVisits: Visit[];
  conflicts: VisitConflict[];
  summary: {
    totalPlanned: number;
    totalConflicts: number;
    totalSkipped: number;
    planningTime: number;
  };
  errors: string[];
}

export class VisitPlanningAlgorithm {
  private options: PlanningOptions;

  constructor(options: Partial<PlanningOptions> = {}) {
    this.options = {
      maxVisitsPerDay: 5,
      preferredWeekStart: 'saturday',
      minDaysBetweenVisits: 1,
      includeExistingVisits: true,
      conflictResolution: 'reschedule',
      batchSize: 50,
      ...options
    };
  }

  /**
   * Generate automated visits for a company
   */
  public generateAutomatedVisits(
    companyId: string,
    contracts: Contract[],
    branches: Branch[],
    existingVisits: Visit[]
  ): PlanningResult {
    const startTime = Date.now();
    const plannedVisits: Visit[] = [];
    const conflicts: VisitConflict[] = [];
    const errors: string[] = [];

    try {
      // 1. Collect planning data
      const planningData = this.collectPlanningData(companyId, contracts, branches, existingVisits);
      
      // 2. Calculate visit requirements
      const visitRequirements = this.calculateVisitRequirements(planningData);
      
      // 3. Generate optimal schedules
      const schedules = this.generateOptimalSchedules(visitRequirements);
      
      // 4. Resolve conflicts
      const resolvedSchedules = this.resolveConflicts(schedules, existingVisits);
      
      // 5. Create visit objects
      const visits = this.createVisitObjects(resolvedSchedules, contracts, branches);
      
      plannedVisits.push(...visits);
      
    } catch (error) {
      errors.push(`Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const planningTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      plannedVisits,
      conflicts,
      summary: {
        totalPlanned: plannedVisits.length,
        totalConflicts: conflicts.length,
        totalSkipped: 0,
        planningTime
      },
      errors
    };
  }

  /**
   * Collect all planning data for a company
   */
  private collectPlanningData(
    companyId: string,
    contracts: Contract[],
    branches: Branch[],
    existingVisits: Visit[]
  ): VisitPlanningData[] {
    const planningData: VisitPlanningData[] = [];

    // Get company branches
    const companyBranches = branches.filter(branch => 
      branch.companyId === companyId && !branch.isArchived
    );

    // Get active contracts for the company
    const companyContracts = contracts.filter(contract => 
      contract.companyId === companyId && !contract.isArchived
    );

    for (const branch of companyBranches) {
      // Find contracts that include this branch in their service batches
      const branchContracts = companyContracts.filter(contract =>
        contract.serviceBatches?.some(batch =>
          batch.branchIds.includes(branch.branchId)
        )
      );

      for (const contract of branchContracts) {
        // Find the service batch that includes this branch
        const serviceBatch = contract.serviceBatches?.find(batch =>
          batch.branchIds.includes(branch.branchId)
        );

                  if (serviceBatch && serviceBatch.regularVisitsPerYear > 0) {
            const contractStart = parseStandardDate(contract.contractStartDate);
            const contractEnd = parseStandardDate(contract.contractEndDate);
            
            // Skip if dates are invalid
            if (!contractStart || !contractEnd) {
              console.warn(`Invalid contract dates for contract ${contract.contractId}`);
              continue;
            }
            
            // Get existing visits for this branch and contract
            const branchVisits = existingVisits.filter(visit =>
              visit.branchId === branch.branchId &&
              visit.contractId === contract.contractId &&
              !visit.isArchived
            );

            const completedVisits = branchVisits.filter(visit =>
              visit.status === 'completed' && visit.type === 'regular'
            );

            planningData.push({
              branch,
              contract,
              serviceBatch,
              requiredVisits: serviceBatch.regularVisitsPerYear,
              contractStart,
              contractEnd,
              existingVisits: branchVisits,
              completedVisits
            });
          }
      }
    }

    return planningData;
  }

  /**
   * Calculate visit requirements for each branch
   */
  private calculateVisitRequirements(planningData: VisitPlanningData[]): VisitSchedule[] {
    const schedules: VisitSchedule[] = [];

    for (const data of planningData) {
      const { contractStart, contractEnd, requiredVisits, completedVisits } = data;
      
      // Calculate how many visits are still needed
      const completedCount = completedVisits.length;
      const remainingVisits = Math.max(0, requiredVisits - completedCount);

      if (remainingVisits > 0) {
        // Calculate optimal spacing
        const contractDays = Math.ceil((contractEnd.getTime() - contractStart.getTime()) / (1000 * 60 * 60 * 24));
        const visitSpacing = Math.floor(contractDays / remainingVisits);
        const weeklyDistribution = Math.ceil(remainingVisits / Math.ceil(contractDays / 7));

        // Generate scheduled dates
        const scheduledDates = this.generateScheduledDates(
          contractStart,
          contractEnd,
          remainingVisits,
          visitSpacing
        );

        schedules.push({
          branchId: data.branch.branchId,
          contractId: data.contract.contractId,
          scheduledDates,
          visitSpacing,
          weeklyDistribution
        });
      }
    }

    return schedules;
  }

  /**
   * Generate scheduled dates with optimal distribution
   */
  private generateScheduledDates(
    startDate: Date,
    endDate: Date,
    visitCount: number,
    spacing: number
  ): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    // Adjust to preferred week start (Saturday)
    if (this.options.preferredWeekStart === 'saturday') {
      const dayOfWeek = currentDate.getDay();
      const daysToSaturday = (6 - dayOfWeek + 7) % 7;
      currentDate.setDate(currentDate.getDate() + daysToSaturday);
    }

    for (let i = 0; i < visitCount && currentDate <= endDate; i++) {
      dates.push(this.formatDateForVisit(currentDate));
      
      // Move to next visit date
      currentDate.setDate(currentDate.getDate() + spacing);
      
      // Ensure we don't exceed the contract end date
      if (currentDate > endDate) break;
    }

    return dates;
  }

  /**
   * Generate optimal schedules
   */
  private generateOptimalSchedules(visitRequirements: VisitSchedule[]): VisitSchedule[] {
    // For now, return the requirements as-is
    // Future enhancement: optimize for even weekly distribution
    return visitRequirements;
  }

  /**
   * Resolve conflicts with existing visits
   */
  private resolveConflicts(
    schedules: VisitSchedule[],
    existingVisits: Visit[]
  ): VisitSchedule[] {
    const resolvedSchedules: VisitSchedule[] = [];

    for (const schedule of schedules) {
      const resolvedDates: string[] = [];
      const conflicts: VisitConflict[] = [];

      for (const date of schedule.scheduledDates) {
        // Check for existing visits on this date
        const existingVisitsOnDate = existingVisits.filter(visit =>
          visit.scheduledDate === date &&
          visit.status !== 'cancelled'
        );

        if (existingVisitsOnDate.length >= this.options.maxVisitsPerDay) {
          // Conflict detected
          const conflict: VisitConflict = {
            date,
            existingVisits: existingVisitsOnDate.length,
            maxDailyVisits: this.options.maxVisitsPerDay,
            alternativeDates: this.findAlternativeDates(date, existingVisits)
          };

          conflicts.push(conflict);

          if (this.options.conflictResolution === 'reschedule') {
            // Use the first alternative date
            if (conflict.alternativeDates.length > 0) {
              resolvedDates.push(conflict.alternativeDates[0]);
            }
          } else if (this.options.conflictResolution === 'skip') {
            // Skip this date
            continue;
          } else {
            // Error mode - skip this date
            continue;
          }
        } else {
          resolvedDates.push(date);
        }
      }

      resolvedSchedules.push({
        ...schedule,
        scheduledDates: resolvedDates
      });
    }

    return resolvedSchedules;
  }

  /**
   * Find alternative dates for conflicts
   */
  private findAlternativeDates(conflictDate: string, existingVisits: Visit[]): string[] {
    const alternatives: string[] = [];
    const baseDate = parseStandardDate(conflictDate);

    // Skip if date is invalid
    if (!baseDate) {
      console.warn(`Invalid conflict date: ${conflictDate}`);
      return alternatives;
    }

    // Look for dates within ±7 days
    for (let offset = -7; offset <= 7; offset++) {
      if (offset === 0) continue; // Skip the conflict date

      const alternativeDate = new Date(baseDate);
      alternativeDate.setDate(alternativeDate.getDate() + offset);

      const alternativeDateStr = this.formatDateForVisit(alternativeDate);
      
      // Check if this date has fewer visits
      const visitsOnDate = existingVisits.filter(visit =>
        visit.scheduledDate === alternativeDateStr &&
        visit.status !== 'cancelled'
      );

      if (visitsOnDate.length < this.options.maxVisitsPerDay) {
        alternatives.push(alternativeDateStr);
      }
    }

    return alternatives.slice(0, 3); // Return up to 3 alternatives
  }

  /**
   * Create visit objects from schedules
   */
  private createVisitObjects(
    schedules: VisitSchedule[],
    contracts: Contract[],
    branches: Branch[]
  ): Visit[] {
    const visits: Visit[] = [];
    let visitCounter = 1;

    for (const schedule of schedules) {
      const contract = contracts.find(c => c.contractId === schedule.contractId);
      const branch = branches.find(b => b.branchId === schedule.branchId);

      if (!contract || !branch) continue;

      // Find the service batch for this branch
      const serviceBatch = contract.serviceBatches?.find(batch =>
        batch.branchIds.includes(branch.branchId)
      );

      if (!serviceBatch) continue;

      for (const date of schedule.scheduledDates) {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${visitCounter++}`;
        const visitId = `VISIT-${new Date().getFullYear()}-${String(visitCounter).padStart(4, '0')}`;

        const visit: Visit = {
          id: uniqueId,
          visitId,
          branchId: branch.branchId,
          contractId: contract.contractId,
          companyId: branch.companyId,
          type: 'regular',
          status: 'scheduled',
          scheduledDate: date,
          services: {
            fireExtinguisher: serviceBatch.services.fireExtinguisherMaintenance,
            alarmSystem: serviceBatch.services.alarmSystemMaintenance,
            fireSuppression: serviceBatch.services.fireSuppressionMaintenance,
            gasSystem: serviceBatch.services.gasFireSuppression,
            foamSystem: serviceBatch.services.foamFireSuppression,
          },
          isArchived: false,
          createdAt: getCurrentDate(),
          updatedAt: getCurrentDate(),
          createdBy: 'system-automated-planning'
        };

        visits.push(visit);
      }
    }

    return visits;
  }

  /**
   * Format date for visit storage
   */
  private formatDateForVisit(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
} 