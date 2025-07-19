import { useState, useEffect, useMemo } from 'react';
import { useVisitsFirebase } from './useVisitsFirebase';
import { useCompaniesFirebase } from './useCompaniesFirebase';
import { useBranchesFirebase } from './useBranchesFirebase';
import { useContractsFirebase } from './useContractsFirebase';
import { Visit, Company, Branch, Contract } from '@/types/customer';
import { formatDateForDisplay, getCurrentDate } from '@/lib/date-handler';

export interface VisitReport {
  period: string;
  totalVisits: number;
  completedVisits: number;
  scheduledVisits: number;
  emergencyVisits: number;
  completionRate: number;
  avgDuration: number;
  topPerformingTeams: { team: string; completedCount: number }[];
  issuesFound: number;
  avgIssuesPerVisit: number;
}

export interface CompanyReport {
  companyId: string;
  companyName: string;
  totalVisits: number;
  completedVisits: number;
  scheduledVisits: number;
  lastVisitDate: string;
  nextScheduledDate: string;
  completionRate: number;
  avgIssuesPerVisit: number;
  totalIssues: number;
  contractCompliance: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TeamPerformance {
  teamMember: string;
  totalAssignedVisits: number;
  completedVisits: number;
  completionRate: number;
  avgCompletionTime: number;
  issuesIdentified: number;
  avgIssuesPerVisit: number;
  rating: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  companyIds?: string[];
  teamMembers?: string[];
  contractTypes?: string[];
  visitTypes?: ('regular' | 'emergency' | 'followup')[];
  status?: ('scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled')[];
}

export function useVisitReports() {
  const { visits, loading: visitsLoading } = useVisitsFirebase();
  const { companies, loading: companiesLoading } = useCompaniesFirebase();
  const { branches, loading: branchesLoading } = useBranchesFirebase();
  const { contracts, loading: contractsLoading } = useContractsFirebase();

  const [filters, setFilters] = useState<ReportFilters>({});
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const loading = visitsLoading || companiesLoading || branchesLoading || contractsLoading;

  // Filter visits based on current filters
  const filteredVisits = useMemo(() => {
    let filtered = [...visits];

    if (filters.startDate) {
      filtered = filtered.filter(visit => visit.scheduledDate >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(visit => visit.scheduledDate <= filters.endDate!);
    }

    if (filters.companyIds?.length) {
      filtered = filtered.filter(visit => filters.companyIds!.includes(visit.companyId));
    }

    if (filters.teamMembers?.length) {
      filtered = filtered.filter(visit => 
        filters.teamMembers!.includes(visit.assignedTeam || '') ||
        filters.teamMembers!.includes(visit.assignedTechnician || '')
      );
    }

    if (filters.visitTypes?.length) {
      filtered = filtered.filter(visit => filters.visitTypes!.includes(visit.type));
    }

    if (filters.status?.length) {
      filtered = filtered.filter(visit => filters.status!.includes(visit.status));
    }

    return filtered;
  }, [visits, filters]);

  // Generate overall visit report
  const visitReport = useMemo((): VisitReport => {
    const totalVisits = filteredVisits.length;
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length;
    const scheduledVisits = filteredVisits.filter(v => v.status === 'scheduled').length;
    const emergencyVisits = filteredVisits.filter(v => v.type === 'emergency').length;

    // Calculate completion rate
    const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    // Calculate average duration
    const completedWithDuration = filteredVisits.filter(v => v.status === 'completed' && v.duration);
    const avgDuration = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((sum, v) => sum + (v.duration || 0), 0) / completedWithDuration.length)
      : 0;

    // Team performance analysis
    const teamPerformance = new Map<string, { completed: number; total: number }>();
    filteredVisits.forEach(visit => {
      const team = visit.assignedTeam || visit.assignedTechnician || 'غير محدد';
      if (!teamPerformance.has(team)) {
        teamPerformance.set(team, { completed: 0, total: 0 });
      }
      const teamData = teamPerformance.get(team)!;
      teamData.total++;
      if (visit.status === 'completed') {
        teamData.completed++;
      }
    });

    const topPerformingTeams = Array.from(teamPerformance.entries())
      .map(([team, data]) => ({ team, completedCount: data.completed }))
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    // Issues analysis
    const completedWithResults = filteredVisits.filter(v => v.status === 'completed' && v.results);
    const totalIssues = completedWithResults.reduce((sum, v) => {
      return sum + (v.results?.issues?.length || 0);
    }, 0);

    const avgIssuesPerVisit = completedWithResults.length > 0 
      ? Math.round((totalIssues / completedWithResults.length) * 10) / 10
      : 0;

    return {
      period: `${reportPeriod} - ${getCurrentDate()}`,
      totalVisits,
      completedVisits,
      scheduledVisits,
      emergencyVisits,
      completionRate,
      avgDuration,
      topPerformingTeams,
      issuesFound: totalIssues,
      avgIssuesPerVisit
    };
  }, [filteredVisits, reportPeriod]);

  // Generate company reports
  const companyReports = useMemo((): CompanyReport[] => {
    return companies.map(company => {
      const companyVisits = filteredVisits.filter(v => v.companyId === company.companyId);
      const totalVisits = companyVisits.length;
      const completedVisits = companyVisits.filter(v => v.status === 'completed').length;
      const scheduledVisits = companyVisits.filter(v => v.status === 'scheduled').length;

      // Find last and next visit dates
      const completedVisitsWithDates = companyVisits
        .filter(v => v.status === 'completed' && v.completedDate)
        .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));
      
      const scheduledVisitsWithDates = companyVisits
        .filter(v => v.status === 'scheduled')
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

      const lastVisitDate = completedVisitsWithDates[0]?.completedDate || '';
      const nextScheduledDate = scheduledVisitsWithDates[0]?.scheduledDate || '';

      // Calculate completion rate
      const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

      // Issues analysis
      const completedWithResults = companyVisits.filter(v => v.status === 'completed' && v.results);
      const totalIssues = completedWithResults.reduce((sum, v) => {
        return sum + (v.results?.issues?.length || 0);
      }, 0);

      const avgIssuesPerVisit = completedWithResults.length > 0 
        ? Math.round((totalIssues / completedWithResults.length) * 10) / 10
        : 0;

      // Contract compliance calculation
      const companyContracts = contracts.filter(c => c.companyId === company.companyId);
      const expectedVisitsPerYear = companyContracts.reduce((sum, c) => {
        const contractTotal = c.serviceBatches?.reduce((batchSum, batch) => 
          batchSum + (batch.regularVisitsPerYear || 0), 0) || 0;
        return sum + contractTotal;
      }, 0);
      
      // Get current year visits
      const currentYear = new Date().getFullYear();
      const yearlyVisits = companyVisits.filter(v => 
        v.scheduledDate.includes(currentYear.toString())
      );
      
      const contractCompliance = expectedVisitsPerYear > 0 
        ? Math.round((yearlyVisits.length / expectedVisitsPerYear) * 100)
        : 100;

      // Risk level assessment
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (avgIssuesPerVisit > 2 || completionRate < 70 || contractCompliance < 80) {
        riskLevel = 'high';
      } else if (avgIssuesPerVisit > 1 || completionRate < 85 || contractCompliance < 90) {
        riskLevel = 'medium';
      }

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        totalVisits,
        completedVisits,
        scheduledVisits,
        lastVisitDate,
        nextScheduledDate,
        completionRate,
        avgIssuesPerVisit,
        totalIssues,
        contractCompliance,
        riskLevel
      };
    });
  }, [companies, filteredVisits, contracts]);

  // Generate team performance reports
  const teamPerformance = useMemo((): TeamPerformance[] => {
    const teamStats = new Map<string, {
      totalAssigned: number;
      completed: number;
      totalDuration: number;
      completedWithDuration: number;
      issues: number;
    }>();

    filteredVisits.forEach(visit => {
      const team = visit.assignedTeam || visit.assignedTechnician || 'غير محدد';
      
      if (!teamStats.has(team)) {
        teamStats.set(team, {
          totalAssigned: 0,
          completed: 0,
          totalDuration: 0,
          completedWithDuration: 0,
          issues: 0
        });
      }

      const stats = teamStats.get(team)!;
      stats.totalAssigned++;

      if (visit.status === 'completed') {
        stats.completed++;
        
        if (visit.duration) {
          stats.totalDuration += visit.duration;
          stats.completedWithDuration++;
        }

        if (visit.results?.issues) {
          stats.issues += visit.results.issues.length;
        }
      }
    });

    return Array.from(teamStats.entries()).map(([teamMember, stats]) => {
      const completionRate = stats.totalAssigned > 0 
        ? Math.round((stats.completed / stats.totalAssigned) * 100)
        : 0;

      const avgCompletionTime = stats.completedWithDuration > 0
        ? Math.round(stats.totalDuration / stats.completedWithDuration)
        : 0;

      const avgIssuesPerVisit = stats.completed > 0
        ? Math.round((stats.issues / stats.completed) * 10) / 10
        : 0;

      // Calculate rating (0-5 scale)
      let rating = 3; // Base rating
      
      if (completionRate >= 95) rating += 1;
      else if (completionRate < 80) rating -= 1;

      if (avgIssuesPerVisit > 2) rating += 0.5; // Finding more issues is good
      else if (avgIssuesPerVisit < 0.5) rating -= 0.5;

      if (avgCompletionTime > 0 && avgCompletionTime <= 90) rating += 0.5; // Efficient time management
      else if (avgCompletionTime > 150) rating -= 0.5;

      rating = Math.max(1, Math.min(5, rating)); // Clamp between 1-5

      return {
        teamMember,
        totalAssignedVisits: stats.totalAssigned,
        completedVisits: stats.completed,
        completionRate,
        avgCompletionTime,
        issuesIdentified: stats.issues,
        avgIssuesPerVisit,
        rating: Math.round(rating * 10) / 10
      };
    }).sort((a, b) => b.rating - a.rating);
  }, [filteredVisits]);

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${getCurrentDate()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportVisitReport = () => {
    exportToCSV([visitReport], 'visit_report');
  };

  const exportCompanyReports = () => {
    exportToCSV(companyReports, 'company_reports');
  };

  const exportTeamPerformance = () => {
    exportToCSV(teamPerformance, 'team_performance');
  };

  return {
    // Data
    visitReport,
    companyReports,
    teamPerformance,
    filteredVisits,
    
    // State
    filters,
    reportPeriod,
    loading,
    
    // Actions
    setFilters,
    setReportPeriod,
    exportVisitReport,
    exportCompanyReports,
    exportTeamPerformance,
    
    // Computed values
    totalCompanies: companies.length,
    totalBranches: branches.length,
    totalContracts: contracts.length
  };
} 