'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Calendar, Filter, Download, Users, Zap, Trash2, X } from 'lucide-react';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useSearch } from '@/hooks/useSearch';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { formatDateForDisplay, getWeekStartDate, getWeekEndDate, getWeekNumber, getCurrentDate } from '@/lib/date-handler';
import { SafeStorage } from '@/lib/storage';
import { Branch, Visit } from '@/types/customer';
import { AutomatedVisitPlanner } from './AutomatedVisitPlanner';

// Helper function to parse our custom date format (dd-mmm-yyyy)
const parseCustomDate = (dateStr: string): Date => {
  if (!dateStr) {
    console.warn('🗓️ Empty date string provided to parseCustomDate');
    return new Date();
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.warn('🗓️ Invalid date format (should be dd-mmm-yyyy):', dateStr);
    return new Date();
  }

  const [day, month, year] = parts;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = monthNames.indexOf(month);

  if (monthIndex === -1) {
    console.warn('🗓️ Invalid month name in date:', dateStr, 'month:', month);
    return new Date();
  }

  const dayNum = parseInt(day);
  const yearNum = parseInt(year);

  if (isNaN(dayNum) || isNaN(yearNum)) {
    console.warn('🗓️ Invalid day or year in date:', dateStr);
    return new Date();
  }

  const parsedDate = new Date(yearNum, monthIndex, dayNum);

  // Additional debug logging
  console.log('🗓️ parseCustomDate:', {
    input: dateStr,
    day: dayNum,
    month: month,
    monthIndex: monthIndex,
    year: yearNum,
    result: parsedDate.toISOString()
  });

  return parsedDate;
};

export interface AnnualSchedulerProps {
  className?: string;
}

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  branches: {
    branch: Branch;
    visits: Visit[];
    status: 'planned' | 'partial' | 'done' | 'emergency' | 'none';
  }[];
}

export function AnnualScheduler({ className = '' }: AnnualSchedulerProps) {
  const { hasPermission } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);

  // Visit selection and bulk operations
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [visitClickCount, setVisitClickCount] = useState<Map<string, number>>(new Map());

  // Data hooks
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();
  const { visits, addVisit, refreshVisits, deleteVisit } = useVisitsFirebase();

  // Search functionality for branches with contract type filtering
  const branchSearchConfig = {
    searchFields: ['branchName', 'branchId', 'address', 'contactPerson', 'companyName'] as (keyof (Branch & { 
      companyName: string;
      fireExtinguisherMaintenance: boolean;
      alarmSystemMaintenance: boolean;
      fireSuppressionMaintenance: boolean;
      gasFireSuppression: boolean;
      foamFireSuppression: boolean;
    }))[],
    statusField: 'isArchived' as keyof Branch,
    cityField: 'city' as keyof Branch,
    locationField: 'location' as keyof Branch,
    teamMemberField: 'teamMember' as keyof Branch,
  };

  // Enhanced branch search with contract type filtering using new serviceBatches structure
  const enhancedBranches = useMemo(() => {
    return branches.map(branch => {
      // Find company name for this branch
      const company = companies.find(c => c.companyId === branch.companyId);
      
      // Find contracts that include this branch in their service batches
      const branchContracts = contracts.filter(contract => 
        contract.serviceBatches?.some(batch => 
          batch.branchIds.includes(branch.branchId)
        )
      );
      
      // Aggregate services from all service batches that include this branch
      const aggregatedServices = {
        fireExtinguisherMaintenance: false,
        alarmSystemMaintenance: false,
        fireSuppressionMaintenance: false,
        gasFireSuppression: false,
        foamFireSuppression: false,
      };

      branchContracts.forEach(contract => {
        contract.serviceBatches?.forEach(batch => {
          if (batch.branchIds.includes(branch.branchId)) {
            Object.keys(aggregatedServices).forEach(service => {
              if (batch.services[service as keyof typeof batch.services]) {
                aggregatedServices[service as keyof typeof aggregatedServices] = true;
              }
            });
          }
        });
      });

      // Calculate total regular visits for this branch
      const totalRegularVisits = branchContracts.reduce((sum, contract) => {
        return sum + contract.serviceBatches?.reduce((batchSum, batch) => {
          return batch.branchIds.includes(branch.branchId) ? 
            batchSum + (batch.regularVisitsPerYear || 0) : batchSum;
        }, 0) || 0;
      }, 0);

      // Count existing visits for this branch in the selected year
      const existingVisitsCount = visits.filter(visit => 
        visit.branchId === branch.branchId && 
        !visit.isArchived &&
        new Date(visit.scheduledDate).getFullYear() === selectedYear
      ).length;

      // Calculate visit status flags for filtering
      const branchVisits = visits.filter(visit => 
        visit.branchId === branch.branchId && 
        !visit.isArchived &&
        new Date(visit.scheduledDate).getFullYear() === selectedYear
      );

      const hasPlannedVisits = branchVisits.some(visit => visit.status === 'scheduled' && visit.type === 'regular');
      const hasEmergencyVisits = branchVisits.some(visit => visit.type === 'emergency');
      const hasCompletedVisits = branchVisits.some(visit => visit.status === 'completed');
      const hasAnyVisits = hasPlannedVisits || hasEmergencyVisits || hasCompletedVisits;

      return {
        ...branch,
        // Add company name for search
        companyName: company?.companyName || 'شركة غير معروفة',
        // Add contract type flags for filtering
        ...aggregatedServices,
        // Add visit counts for filtering
        totalRegularVisits,
        existingVisitsCount,
        // Add visit status flags for filtering
        hasPlannedVisits,
        hasEmergencyVisits,
        hasCompletedVisits,
        hasAnyVisits,
      };
    });
  }, [branches, contracts, companies, visits, selectedYear]);

  const branchSearch = useSearch(enhancedBranches as unknown as (Branch & {
    companyName: string;
    fireExtinguisherMaintenance: boolean;
    alarmSystemMaintenance: boolean;
    fireSuppressionMaintenance: boolean;
    gasFireSuppression: boolean;
    foamFireSuppression: boolean;
    totalRegularVisits: number;
    existingVisitsCount: number;
    hasPlannedVisits: boolean;
    hasEmergencyVisits: boolean;
    hasCompletedVisits: boolean;
    hasAnyVisits: boolean;
  })[], branchSearchConfig);

  // Generate available years (previous, current, next for contract continuity)
  const availableYears = [selectedYear - 1, selectedYear, selectedYear + 1];

  // Use search results for filtered branches with additional visit count filtering
  const filteredBranches = useMemo(() => {
    console.log('🔍 AnnualScheduler search debug:', {
      totalEnhancedBranches: enhancedBranches.length,
      searchFilteredData: branchSearch.filteredData.length,
      searchTerm: branchSearch.filters.searchTerm,
      searchResultCount: branchSearch.resultCount,
      regularVisitsFilter: branchSearch.filters.regularVisits
    });
    
    let filtered = branchSearch.filteredData.filter(branch => !branch.isArchived);
    
    // Apply visit count filtering
    if (branchSearch.filters.regularVisits.min || branchSearch.filters.regularVisits.max) {
      const minVisits = branchSearch.filters.regularVisits.min ? parseInt(branchSearch.filters.regularVisits.min) : 0;
      const maxVisits = branchSearch.filters.regularVisits.max ? parseInt(branchSearch.filters.regularVisits.max) : Infinity;
      
      filtered = filtered.filter(branch => {
        const visitCount = (branch as any).totalRegularVisits || 0;
        return visitCount >= minVisits && visitCount <= maxVisits;
      });
      
      console.log('🔍 After visit count filtering:', filtered.length, { minVisits, maxVisits });
    }
    
    console.log('🔍 Final filtered branches for display:', filtered.length);
    
    return filtered;
  }, [branchSearch.filteredData, enhancedBranches.length, branchSearch.filters.searchTerm, branchSearch.resultCount, branchSearch.filters.regularVisits]);

  // Debug rendering
  useEffect(() => {
    console.log('🔍 AnnualScheduler rendering branches:', filteredBranches.length, filteredBranches.map(b => ({ id: b.branchId, name: b.branchName, company: b.companyName })));
    console.log('🔍 AnnualScheduler table key:', `table-${filteredBranches.length}-${branchSearch.filters.searchTerm}`);
  }, [filteredBranches, branchSearch.filters.searchTerm]);

  // Generate 52-week planning grid
  const weeklyData = useMemo(() => {
    const weeks: WeekData[] = [];

    for (let weekNum = 1; weekNum <= 52; weekNum++) {
      // Calculate week start/end dates for the selected year
      const yearStart = new Date(selectedYear, 0, 1);
      const weekStart = new Date(yearStart);
      weekStart.setDate(yearStart.getDate() + (weekNum - 1) * 7);

      const startDate = formatDateForDisplay(weekStart);
      const endDate = getWeekEndDate(startDate);

      // Enhanced debug logging for multiple weeks
      if (weekNum <= 3 || weekNum === 26 || weekNum === 52) {
        console.log(`🗓️ Week ${weekNum} date calculation:`, {
          yearStart: yearStart.toISOString(),
          weekStart: weekStart.toISOString(),
          startDate,
          endDate,
          selectedYear,
          weekStartDay: weekStart.getDay(), // 0=Sunday, 1=Monday, etc.
          parsedStartDate: parseCustomDate(startDate).toISOString(),
          parsedEndDate: parseCustomDate(endDate).toISOString()
        });
      }

      // Get visits for this week
      const weekVisits = visits.filter(visit => {
        const visitDate = parseCustomDate(visit.scheduledDate);
        const start = parseCustomDate(startDate);
        const end = parseCustomDate(endDate);

        // Enhanced debug logging for multiple weeks
        const debugCondition = (weekNum <= 5 || weekNum === 26 || weekNum === 52) && visitDate.getFullYear() === selectedYear;

        if (debugCondition) {
          console.log(`🗓️ Week ${weekNum} visit check:`, {
            visitId: visit.visitId,
            branchId: visit.branchId,
            visitScheduledDate: visit.scheduledDate,
            visitDate: visitDate.toISOString(),
            visitYear: visitDate.getFullYear(),
            start: start.toISOString(),
            startDate: startDate,
            end: end.toISOString(),
            endDate: endDate,
            inRange: visitDate >= start && visitDate <= end,
            isArchived: visit.isArchived,
            passed: visitDate >= start && visitDate <= end && !visit.isArchived
          });
        }

        const isInRange = visitDate >= start && visitDate <= end && !visit.isArchived;
        return isInRange;
      });

      // Calculate status for each branch
      const branchData = filteredBranches.map(branch => {
        const branchVisits = weekVisits.filter(v => v.branchId === branch.branchId);

        let status: 'planned' | 'partial' | 'done' | 'emergency' | 'none' = 'none';

        if (branchVisits.length > 0) {
          const hasEmergency = branchVisits.some(v => v.type === 'emergency');
          const completedCount = branchVisits.filter(v => v.status === 'completed').length;
          const totalCount = branchVisits.length;

          if (hasEmergency) {
            status = 'emergency';
          } else if (completedCount === totalCount) {
            status = 'done';
          } else if (completedCount > 0) {
            status = 'partial';
          } else {
            status = 'planned';
          }
        }

        return {
          branch,
          visits: branchVisits,
          status
        };
      });

      weeks.push({
        weekNumber: weekNum,
        startDate,
        endDate,
        branches: branchData
      });
    }

    // Enhanced debug logging for total visits found
    const totalVisitsFound = weeks.reduce((sum, week) => sum + week.branches.reduce((branchSum, branch) => branchSum + branch.visits.length, 0), 0);

    // Debug sample of visits to check date formats
    const sampleVisits = visits.slice(0, 5);
    const visitYearCounts = visits.reduce((counts, visit) => {
      const visitYear = parseCustomDate(visit.scheduledDate).getFullYear();
      counts[visitYear] = (counts[visitYear] || 0) + 1;
      return counts;
    }, {} as Record<number, number>);

    console.log('🗓️ Annual Scheduler Enhanced Debug:', {
      selectedYear,
      totalVisitsInSystem: visits.length,
      totalVisitsFoundInYear: totalVisitsFound,
      filteredBranchesCount: filteredBranches.length,
      weeksGenerated: weeks.length,
      sampleVisits: sampleVisits.map(v => ({
        id: v.visitId,
        scheduledDate: v.scheduledDate,
        branchId: v.branchId,
        isArchived: v.isArchived
      })),
      visitsByYear: visitYearCounts,
      weeksSummary: weeks.slice(0, 3).map(w => ({
        weekNum: w.weekNumber,
        visitsCount: w.branches.reduce((sum, b) => sum + b.visits.length, 0),
        branchesCount: w.branches.length,
        startDate: w.startDate,
        endDate: w.endDate
      }))
    });

    return weeks;
  }, [selectedYear, filteredBranches, visits]);

  // Handle one-click planning for individual branch per week
  const handlePlanBranch = async (branch: Branch, weekData: WeekData) => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لجدولة الزيارات');
      return;
    }

    // Get the branch's contracts that include this branch in their service batches
    const branchContracts = contracts.filter(contract => 
      contract.serviceBatches?.some(batch => 
        batch.branchIds.includes(branch.branchId)
      )
    );

    if (branchContracts.length === 0) {
      alert('لا توجد عقود مرتبطة بهذا الفرع');
      return;
    }

    // Get services from the first service batch that includes this branch
    const firstContract = branchContracts[0];
    const relevantBatch = firstContract.serviceBatches?.find(batch => 
      batch.branchIds.includes(branch.branchId)
    );

    if (!relevantBatch) {
      alert('لا توجد خدمات محددة لهذا الفرع');
      return;
    }

    // Create a regular visit for the week
    const visitData = {
      branchId: branch.branchId,
      contractId: firstContract.contractId, // Use first contract
      companyId: branch.companyId,
      type: 'regular' as const,
      status: 'scheduled' as const,
      scheduledDate: weekData.startDate,
      services: {
        fireExtinguisher: relevantBatch.services.fireExtinguisherMaintenance,
        alarmSystem: relevantBatch.services.alarmSystemMaintenance,
        fireSuppression: relevantBatch.services.fireSuppressionMaintenance,
        gasSystem: relevantBatch.services.gasFireSuppression,
        foamSystem: relevantBatch.services.foamFireSuppression,
      },
      createdBy: 'system-auto-plan'
    };

    const result = await addVisit(visitData);
    if (result.success) {
      // Refresh visits data to update the display immediately
      refreshVisits();
      // Optional: Show success message for individual planning
      // alert(`تم جدولة زيارة للفرع ${branch.branchName} في الأسبوع ${weekData.weekNumber}`);
    } else {
      alert('فشل في جدولة الزيارة: ' + (result.error || 'خطأ غير معروف'));
    }
  };

  // Handle bulk planning for all filtered branches on specific week
  const handleBulkPlanWeek = async (weekData: WeekData) => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لجدولة الزيارات');
      return;
    }

    const branchesToPlan = weekData.branches.filter(b => b.status === 'none');

    if (branchesToPlan.length === 0) {
      alert('جميع الفروع مجدولة لهذا الأسبوع');
      return;
    }

    if (!confirm(`هل تريد جدولة ${branchesToPlan.length} فرع لأسبوع ${weekData.weekNumber}؟`)) {
      return;
    }

    console.log(`🚀 BULK PLANNING: Starting to plan ${branchesToPlan.length} branches for week ${weekData.weekNumber}`);

    let successCount = 0;
    const failedBranches: string[] = [];
    let visitCounter = 0;

    // Prepare all visits first, then save all at once to avoid race conditions
    const newVisits: Visit[] = [];

    for (const branchData of branchesToPlan) {
      const branch = branchData.branch;
      const branchContracts = contracts.filter(contract => 
        contract.serviceBatches?.some(batch => 
          batch.branchIds.includes(branch.branchId)
        ) && !contract.isArchived
      );

      console.log(`📋 Processing branch: ${branch.branchName} (${branch.branchId})`);
      console.log(`📋 Found ${branchContracts.length} contracts for this branch`);

      if (branchContracts.length > 0) {
        // Find the service batch that includes this branch
        const firstContract = branchContracts[0];
        const relevantBatch = firstContract.serviceBatches?.find(batch => 
          batch.branchIds.includes(branch.branchId)
        );

        if (relevantBatch) {
          // Generate unique IDs for each visit
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${visitCounter++}`;
          const visitId = `VISIT-${new Date().getFullYear()}-${String(visits.length + newVisits.length + 1).padStart(4, '0')}`;

          const newVisit = {
            branchId: branch.branchId,
            contractId: firstContract.contractId,
            companyId: branch.companyId,
            type: 'regular' as const,
            status: 'scheduled' as const,
            scheduledDate: weekData.startDate,
            services: {
              fireExtinguisher: relevantBatch.services.fireExtinguisherMaintenance,
              alarmSystem: relevantBatch.services.alarmSystemMaintenance,
              fireSuppression: relevantBatch.services.fireSuppressionMaintenance,
              gasSystem: relevantBatch.services.gasFireSuppression,
              foamSystem: relevantBatch.services.foamFireSuppression,
            },
            createdBy: `system-bulk-plan-${uniqueId}`,
            id: uniqueId,
            visitId: visitId,
            isArchived: false,
            createdAt: getCurrentDate(),
            updatedAt: getCurrentDate(),
          };

          newVisits.push(newVisit);
          successCount++;
          console.log(`✅ PREPARED: Visit for ${branch.branchName} - ID: ${newVisit.visitId}`);
        } else {
          failedBranches.push(branch.branchName);
          console.log(`❌ NO SERVICE BATCH: No service batch found for branch: ${branch.branchName}`);
        }
      } else {
        failedBranches.push(branch.branchName);
        console.log(`❌ NO CONTRACTS: No active contracts found for branch: ${branch.branchName}`);
      }
    }

    // Save all visits at once to prevent race conditions
    if (newVisits.length > 0) {
      try {
        const allVisits = [...visits, ...newVisits];
        const saveSuccess = SafeStorage.set('visits', allVisits);

        if (saveSuccess) {
          console.log(`🎯 BULK SAVE SUCCESS: Saved ${newVisits.length} visits to storage`);
        } else {
          console.log(`❌ BULK SAVE FAILED: Could not save to storage`);
          successCount = 0;
          failedBranches.length = 0;
          failedBranches.push(...branchesToPlan.map(b => b.branch.branchName));
        }
      } catch (error) {
        console.log(`❌ BULK SAVE ERROR: ${error}`);
        successCount = 0;
        failedBranches.length = 0;
        failedBranches.push(...branchesToPlan.map(b => b.branch.branchName));
      }
    }

    console.log(`🎯 BULK PLANNING COMPLETE: ${successCount} successful, ${failedBranches.length} failed`);

    // Show detailed results
    let resultMessage = `تم جدولة ${successCount} زيارة من أصل ${branchesToPlan.length} فرع`;
    if (failedBranches.length > 0) {
      resultMessage += `\n\nفشل في جدولة:\n${failedBranches.join(', ')}`;
    }
    alert(resultMessage);

    // Force multiple refreshes to ensure data is updated
    if (successCount > 0) {
      refreshVisits();
      setTimeout(() => {
        refreshVisits();
      }, 200);
      setTimeout(() => {
        refreshVisits();
      }, 500);
    }
  };

  // Handle visit selection
  const handleVisitSelect = (visitId: string, checked: boolean) => {
    setSelectedVisits(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(visitId);
      } else {
        newSet.delete(visitId);
      }
      return newSet;
    });
  };

  // Handle bulk delete
  const handleBulkDeleteVisits = async () => {
    if (!hasPermission('supervisor') || selectedVisits.size === 0) return;

    const visitsToDelete = visits.filter(v => selectedVisits.has(v.id));
    const completedVisits = visitsToDelete.filter(v => v.status === 'completed' || v.status === 'in_progress' || v.type === 'emergency');

    let confirmMessage = `هل أنت متأكد من حذف ${selectedVisits.size} زيارة؟`;
    if (completedVisits.length > 0) {
      confirmMessage = `⚠️ تحذير: من بين الزيارات المحددة، ${completedVisits.length} زيارة مكتملة أو قيد التنفيذ أو طارئة. هل أنت متأكد من حذفها؟ سيتم فقدان جميع البيانات المرتبطة بها.`;
    }

    if (confirm(confirmMessage)) {
      let successCount = 0;
      
      // Use for...of loop to properly handle async deleteVisit calls
      for (const visit of visitsToDelete) {
        const result = await deleteVisit(visit.id);
        if (result) {
          successCount++;
        }
      }

      alert(`تم حذف ${successCount} زيارة من أصل ${selectedVisits.size}`);
      setSelectedVisits(new Set());
      refreshVisits();
    }
  };

  // Handle single visit click with improved behavior
  const handleVisitClick = (branch: Branch, weekData: WeekData, branchVisits: Visit[]) => {
    if (!hasPermission('supervisor')) {
      return; // No action for non-supervisors
    }

    // If no visits (empty cell), plan a visit (first click = add blue visit)
    if (branchVisits.length === 0) {
      handlePlanBranch(branch, weekData);
      return;
    }

    // For scheduled visits (blue), delete immediately on first click
    const scheduledVisits = branchVisits.filter(v => v.status === 'scheduled');
    if (scheduledVisits.length > 0) {
      const visitId = scheduledVisits[0].id;

      // Delete immediately without confirmation for blue (scheduled) visits
      deleteVisit(visitId);
      refreshVisits();
      console.log(`🗑️ Deleted scheduled visit for branch ${branch.branchName}`);
      return;
    }

    // For other visit types (completed, emergency, etc.), show warning
    const otherVisits = branchVisits.filter(v => v.status !== 'scheduled');
    if (otherVisits.length > 0) {
      const visit = otherVisits[0];
      let visitTypeText = '';
      let warningMessage = '';

      if (visit.status === 'completed') {
        visitTypeText = 'مكتملة';
        warningMessage = `⚠️ تحذير: هذه زيارة مكتملة للفرع "${branch.branchName}". سيتم فقدان جميع بيانات التقرير والنتائج.\n\nهل أنت متأكد من حذفها؟`;
      } else if (visit.type === 'emergency') {
        visitTypeText = 'طارئة';
        warningMessage = `⚠️ تحذير: هذه زيارة طارئة للفرع "${branch.branchName}". قد تحتوي على بيانات مهمة.\n\nهل أنت متأكد من حذفها؟`;
      } else {
        visitTypeText = 'قيد التنفيذ';
        warningMessage = `⚠️ تحذير: هذه زيارة قيد التنفيذ للفرع "${branch.branchName}". قد تحتوي على بيانات جزئية.\n\nهل أنت متأكد من حذفها؟`;
      }

      if (confirm(warningMessage)) {
        deleteVisit(visit.id);
        refreshVisits();
      }
    }
  };

  // Handle select all visits
  const handleSelectAllVisits = (checked: boolean) => {
    if (checked) {
      const scheduledVisits = visits.filter(v => v.status === 'scheduled' && !v.isArchived);
      setSelectedVisits(new Set(scheduledVisits.map(v => v.id)));
    } else {
      setSelectedVisits(new Set());
    }
  };

  // Get status color for visual indication
  const getStatusColor = (status: string) => {
    const colors = {
      'planned': 'bg-blue-500',
      'partial': 'bg-yellow-500',
      'done': 'bg-green-500',
      'emergency': 'bg-orange-500',
      'none': 'bg-gray-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-200';
  };

  // Handle export planning
  const handleExportPlanning = () => {
    // TODO: Implement export functionality
    alert('سيتم إضافة ميزة التصدير قريباً');
  };

  const getStatusText = (status: string) => {
    const texts = {
      'planned': 'مجدولة',
      'partial': 'جزئي',
      'done': 'مكتملة',
      'emergency': 'طارئة',
      'none': 'غير مجدولة'
    };
    return texts[status as keyof typeof texts] || 'غير محدد';
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalWeeks = weeklyData.length;
    const totalBranches = filteredBranches.length;
    const totalSlots = totalWeeks * totalBranches;

    let plannedSlots = 0;
    let completedSlots = 0;
    let emergencySlots = 0;

    weeklyData.forEach(week => {
      week.branches.forEach(branchData => {
        if (branchData.status !== 'none') plannedSlots++;
        if (branchData.status === 'done') completedSlots++;
        if (branchData.status === 'emergency') emergencySlots++;
      });
    });

    return {
      totalSlots,
      plannedSlots,
      completedSlots,
      emergencySlots,
      planningPercentage: totalSlots > 0 ? Math.round((plannedSlots / totalSlots) * 100) : 0,
      completionPercentage: plannedSlots > 0 ? Math.round((completedSlots / plannedSlots) * 100) : 0
    };
  }, [weeklyData, filteredBranches]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with year navigation and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">{selectedYear}</h2>
            <p className="text-sm text-gray-600">جدولة الزيارات السنوية</p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Automated Planning Button */}
          <AutomatedVisitPlanner />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            تصفية
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPlanning}
          >
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          
          {selectedVisits.size > 0 && hasPermission('supervisor') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteVisits}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف المحدد ({selectedVisits.size})
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <SearchAndFilter
          filters={branchSearch.filters}
          onFiltersChange={branchSearch.setFilters}
          searchPlaceholder="البحث في الفروع..."
          availableCities={branchSearch.filterOptions.cities}
          availableLocations={branchSearch.filterOptions.locations}
          availableTeamMembers={branchSearch.filterOptions.teamMembers}
          availableSortOptions={[
            { value: 'branchName', label: 'اسم الفرع' },
            { value: 'city', label: 'المدينة' },
            { value: 'location', label: 'الموقع' },
            { value: 'createdAt', label: 'تاريخ الإنشاء' }
          ]}
          resultCount={branchSearch.resultCount}
          onSaveSearch={branchSearch.saveSearch}
          savedSearches={branchSearch.savedSearches}
          onLoadSearch={branchSearch.loadSavedSearch}
        />
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredBranches.length}</div>
            <div className="text-sm text-gray-600">فرع مفلتر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summaryStats.planningPercentage}%</div>
            <div className="text-sm text-gray-600">نسبة التخطيط</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.completionPercentage}%</div>
            <div className="text-sm text-gray-600">نسبة الإنجاز</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{summaryStats.emergencySlots}</div>
            <div className="text-sm text-gray-600">زيارات طارئة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{summaryStats.totalSlots}</div>
            <div className="text-sm text-gray-600">إجمالي الخانات</div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>مجدولة (أزرق)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>مكتملة (أخضر)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>طارئة (برتقالي)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>جزئي (أصفر)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded border"></div>
              <span>غير مجدولة</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 52-Week Planning Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">شبكة التخطيط السنوي - 52 أسبوع</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBranches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فروع تطابق المعايير</h3>
              <p className="text-gray-500">قم بتعديل المرشحات لعرض الفروع</p>
            </div>
          ) : (
            <div className="overflow-x-hidden">
              <table className="w-full table-fixed text-xs" key={`table-${filteredBranches.length}-${branchSearch.filters.searchTerm}`}>
                <thead className="bg-gray-50 sticky top-0">
                  {/* Bulk Planning Row */}
                  {hasPermission('supervisor') && (
                    <tr className="bg-blue-50">
                      <th className="w-56 px-2 py-1 text-right text-xs font-medium text-blue-700 border">
                        جدولة جماعية:
                      </th>
                      {weeklyData.map(week => {
                        const unplannedCount = week.branches.filter(b => b.status === 'none').length;
                        return (
                          <th key={week.weekNumber} className="w-4 px-0 py-1 border">
                            <button
                              onClick={() => handleBulkPlanWeek(week)}
                              disabled={unplannedCount === 0}
                              className={`w-full h-6 text-xs ${
                                unplannedCount > 0
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              } border-0 rounded-sm`}
                              title={`جدولة جماعية للأسبوع ${week.weekNumber} - ${unplannedCount} فرع غير مجدول`}
                            >
                            </button>
                          </th>
                        );
                      })}
                      <th className="w-16 px-1 py-1 text-center text-xs font-medium text-blue-700 border">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs">تحديد الكل</div>
                          {hasPermission('supervisor') && (
                            <Checkbox
                              checked={selectedVisits.size > 0 && visits.filter(v => v.status === 'scheduled').every(v => selectedVisits.has(v.id))}
                              onCheckedChange={handleSelectAllVisits}
                            />
                          )}
                        </div>
                      </th>
                    </tr>
                  )}

                  {/* Week Numbers Row */}
                  <tr>
                    <th className="w-56 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase border">
                      الفرع/العقود
                    </th>
                    {weeklyData.map(week => (
                      <th
                        key={week.weekNumber}
                        className="w-4 px-0 py-1 text-center text-xs font-medium text-gray-500 border"
                        title={`أسبوع ${week.weekNumber} - التاريخ: ${formatDateForDisplay(week.startDate)} إلى ${formatDateForDisplay(week.endDate)}`}
                      >
                        <div className="text-xs transform -rotate-90 origin-center">{week.weekNumber}</div>
                      </th>
                    ))}
                    <th className="w-16 px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase border">
                      إحصائيات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBranches.map(branch => {
                    const company = companies.find(c => c.companyId === branch.companyId);
                    return (
                      <tr key={branch.branchId} className="hover:bg-gray-50">
                        <td className="px-2 py-1 border">
                          <div className="text-xs font-medium text-gray-900">
                            {branch.branchName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {company?.companyName} - {branch.city}
                          </div>
                          <div className="text-xs text-gray-400">
                            {branch.branchId}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            عقود: {contracts.filter(contract => 
                              contract.serviceBatches?.some(batch => 
                                batch.branchIds.includes(branch.branchId)
                              ) && !contract.isArchived
                            ).length} | زيارات: {visits.filter(v => v.branchId === branch.branchId).length}
                          </div>
                        </td>
                        {weeklyData.map(week => {
                          const branchWeekData = week.branches.find(b => b.branch.branchId === branch.branchId);
                          const status = branchWeekData?.status || 'none';
                          const branchVisits = branchWeekData?.visits || [];
                          const hasCheckableVisits = branchVisits.some(v => v.status === 'scheduled');

                          return (
                            <td key={week.weekNumber} className="px-0 py-1 border text-center">
                              <div className="relative">
                                <button
                                  onClick={() => hasPermission('supervisor') && handleVisitClick(branch, week, branchVisits)}
                                  className={`w-full h-6 ${getStatusColor(status)} hover:opacity-80 transition-opacity border-0 ${
                                    status === 'planned' ? 'cursor-pointer' : ''
                                  }`}
                                  title={`أسبوع ${week.weekNumber} - التاريخ: ${week.startDate} - الحالة: ${getStatusText(status)} - عدد الزيارات: ${branchVisits.length}${
                                    status === 'planned' ? ' (انقر لحذف الزيارة المجدولة)' : ''
                                  }`}
                                  disabled={!hasPermission('supervisor')}
                                >
                                </button>

                                {/* Checkbox for schedulable visits */}
                                {hasPermission('supervisor') && hasCheckableVisits && (
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1">
                                    <input
                                      type="checkbox"
                                      className="w-3 h-3 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                      checked={branchVisits.some(v => selectedVisits.has(v.id))}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const scheduledVisits = branchVisits.filter(v => v.status === 'scheduled');
                                        scheduledVisits.forEach(visit => {
                                          handleVisitSelect(visit.id, e.target.checked);
                                        });
                                      }}
                                      title="تحديد الزيارات المجدولة للحذف"
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-1 py-1 border text-center">
                          <div className="text-xs">
                            {(() => {
                              const branchContracts = contracts.filter(contract => 
                                contract.serviceBatches?.some(batch => 
                                  batch.branchIds.includes(branch.branchId)
                                ) && !contract.isArchived
                              );
                              
                              // Calculate total visits from all service batches for this branch
                              const totalRegularVisits = branchContracts.reduce((sum, contract) => {
                                const branchBatches = contract.serviceBatches?.filter(batch => 
                                  batch.branchIds.includes(branch.branchId)
                                ) || [];
                                return sum + branchBatches.reduce((batchSum, batch) => 
                                  batchSum + (batch.regularVisitsPerYear || 0), 0
                                );
                              }, 0);
                              
                              const totalEmergencyVisits = branchContracts.reduce((sum, contract) => {
                                const branchBatches = contract.serviceBatches?.filter(batch => 
                                  batch.branchIds.includes(branch.branchId)
                                ) || [];
                                return sum + branchBatches.reduce((batchSum, batch) => 
                                  batchSum + (batch.emergencyVisitsPerYear || 0), 0
                                );
                              }, 0);

                              // Count only visits within contract periods
                              const allBranchVisits = visits.filter(v => v.branchId === branch.branchId && !v.isArchived);

                              const completedVisitsInContract = allBranchVisits.filter(visit => {
                                if (visit.status !== 'completed' || visit.type !== 'regular') return false;

                                // Check if visit is within any active contract period
                                return branchContracts.some(contract => {
                                  const visitDate = parseCustomDate(visit.scheduledDate);
                                  const contractStart = parseCustomDate(contract.contractStartDate);
                                  const contractEnd = parseCustomDate(contract.contractEndDate);
                                  return visitDate >= contractStart && visitDate <= contractEnd;
                                });
                              }).length;

                              const emergencyVisitsInContract = allBranchVisits.filter(visit => {
                                if (visit.status !== 'completed' || visit.type !== 'emergency') return false;

                                // Check if visit is within any active contract period
                                return branchContracts.some(contract => {
                                  const visitDate = parseCustomDate(visit.scheduledDate);
                                  const contractStart = parseCustomDate(contract.contractStartDate);
                                  const contractEnd = parseCustomDate(contract.contractEndDate);
                                  return visitDate >= contractStart && visitDate <= contractEnd;
                                });
                              }).length;

                              return (
                                <>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-green-600 font-bold">{completedVisitsInContract}</span>
                                    <span className="text-black text-xs">/{totalRegularVisits}</span>
                                  </div>
                                  <div className="text-blue-600">
                                    {(() => {
                                      // Count planned visits within contract period
                                      const plannedVisitsInContract = allBranchVisits.filter(visit => {
                                        if (visit.status !== 'scheduled') return false;

                                        // Check if visit is within any active contract period
                                        return branchContracts.some(contract => {
                                          const visitDate = parseCustomDate(visit.scheduledDate);
                                          const contractStart = parseCustomDate(contract.contractStartDate);
                                          const contractEnd = parseCustomDate(contract.contractEndDate);
                                          return visitDate >= contractStart && visitDate <= contractEnd;
                                        });
                                      }).length;
                                      return plannedVisitsInContract;
                                    })()}
                                  </div>
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-orange-600">{emergencyVisitsInContract}</span>
                                    <span className="text-black text-xs">/{totalEmergencyVisits}</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
