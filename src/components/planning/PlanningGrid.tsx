'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Plus, Calendar, Filter, Trash2, Edit, X } from 'lucide-react';
import { Visit, WeeklyPlanningGrid } from '@/types/customer';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useSearch } from '@/hooks/useSearch';
import { SearchAndFilter } from '@/components/common/SearchAndFilter';
import { addWeeksToDate, getCurrentWeekStart, formatDateForDisplay } from '@/lib/date-handler';
import { VisitCard } from './VisitCard';
import { VisitForm } from './VisitForm';
import { VisitCompletionForm } from './VisitCompletionForm';

export interface PlanningGridProps {
  className?: string;
}

export function PlanningGrid({ className = '' }: PlanningGridProps) {
  const { hasPermission } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(getCurrentWeekStart());
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [visitToComplete, setVisitToComplete] = useState<Visit | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states (enhanced with multi-select support)
  const [filters, setFilters] = useState({
    searchTerm: '',
    companyId: 'all-companies', // Can be string or string[]
    contractId: 'all-contracts', // Can be string or string[]
    branchId: 'all-branches', // Can be string or string[]
    visitType: 'all-types', // Can be string or string[]
    visitStatus: 'all-statuses' // Can be string or string[]
  });

  // Bulk delete states
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Data hooks
  const { getWeeklyPlan, loading: visitsLoading, refreshVisits, deleteVisit, cancelVisit } = useVisitsFirebase();
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();

  // Get current week data
  const originalWeeklyPlan: WeeklyPlanningGrid = getWeeklyPlan(currentWeekStart);

  // Helper function to check multi-select filters
  const matchesFilter = (filterValue: string | string[], actualValue: string, allValue: string): boolean => {
    if (Array.isArray(filterValue)) {
      return filterValue.length === 0 || filterValue.includes(actualValue);
    } else {
      return filterValue === allValue || filterValue === actualValue;
    }
  };

  // Apply filters to weekly plan
  const weeklyPlan: WeeklyPlanningGrid = {
    ...originalWeeklyPlan,
    visits: originalWeeklyPlan.visits.filter(visit => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const company = companies.find(c => c.companyId === visit.companyId);
        const branch = branches.find(b => b.branchId === visit.branchId);
        const searchText = `${visit.visitId} ${company?.companyName || ''} ${branch?.branchName || ''} ${visit.notes || ''}`.toLowerCase();
        if (!searchText.includes(searchLower)) return false;
      }

      // Company filter (multi-select support)
      if (!matchesFilter(filters.companyId, visit.companyId, 'all-companies')) return false;

      // Contract filter (multi-select support)
      if (!matchesFilter(filters.contractId, visit.contractId, 'all-contracts')) return false;

      // Branch filter (multi-select support)
      if (!matchesFilter(filters.branchId, visit.branchId, 'all-branches')) return false;

      // Visit type filter (multi-select support)
      if (!matchesFilter(filters.visitType, visit.type, 'all-types')) return false;

      // Visit status filter (multi-select support)
      if (!matchesFilter(filters.visitStatus, visit.status, 'all-statuses')) return false;

      return true;
    }),
    dailyPlans: Object.fromEntries(
      Object.entries(originalWeeklyPlan.dailyPlans).map(([date, dailyPlan]) => [
        date,
        {
          ...dailyPlan,
          visits: dailyPlan.visits.filter(visit => {
            // Apply same filters to daily plans
            if (filters.searchTerm) {
              const searchLower = filters.searchTerm.toLowerCase();
              const company = companies.find(c => c.companyId === visit.companyId);
              const branch = branches.find(b => b.branchId === visit.branchId);
              const searchText = `${visit.visitId} ${company?.companyName || ''} ${branch?.branchName || ''} ${visit.notes || ''}`.toLowerCase();
              if (!searchText.includes(searchLower)) return false;
            }

            if (!matchesFilter(filters.companyId, visit.companyId, 'all-companies')) return false;
            if (!matchesFilter(filters.contractId, visit.contractId, 'all-contracts')) return false;
            if (!matchesFilter(filters.branchId, visit.branchId, 'all-branches')) return false;
            if (!matchesFilter(filters.visitType, visit.type, 'all-types')) return false;
            if (!matchesFilter(filters.visitStatus, visit.status, 'all-statuses')) return false;

            return true;
          }),
          totalVisits: dailyPlan.visits.filter(visit => {
            // Same filter logic for count
            if (filters.searchTerm) {
              const searchLower = filters.searchTerm.toLowerCase();
              const company = companies.find(c => c.companyId === visit.companyId);
              const branch = branches.find(b => b.branchId === visit.branchId);
              const searchText = `${visit.visitId} ${company?.companyName || ''} ${branch?.branchName || ''} ${visit.notes || ''}`.toLowerCase();
              if (!searchText.includes(searchLower)) return false;
            }

            if (!matchesFilter(filters.companyId, visit.companyId, 'all-companies')) return false;
            if (!matchesFilter(filters.contractId, visit.contractId, 'all-contracts')) return false;
            if (!matchesFilter(filters.branchId, visit.branchId, 'all-branches')) return false;
            if (!matchesFilter(filters.visitType, visit.type, 'all-types')) return false;
            if (!matchesFilter(filters.visitStatus, visit.status, 'all-statuses')) return false;

            return true;
          }).length
        }
      ])
    )
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const weeksToAdd = direction === 'next' ? 1 : -1;
    setCurrentWeekStart(addWeeksToDate(currentWeekStart, weeksToAdd));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getCurrentWeekStart());
  };

  const handleAddVisit = () => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لإضافة زيارة جديدة');
      return;
    }
    setSelectedVisit(null);
    setShowVisitForm(true);
  };

  const handleEditVisit = (visit: Visit) => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لتعديل الزيارة');
      return;
    }
    setSelectedVisit(visit);
    setShowVisitForm(true);
  };

  const handleVisitFormClose = () => {
    setShowVisitForm(false);
    setSelectedVisit(null);
  };

  const handleCompleteVisit = (visit: Visit) => {
    // Allow editing completion reports for both new and already completed visits
    setVisitToComplete(visit);
    setShowCompletionForm(true);
  };

  const handleCompletionFormClose = () => {
    setShowCompletionForm(false);
    setVisitToComplete(null);
    // Refresh the visits data to show updates immediately
    refreshVisits();
  };

  // Delete visit handler
  const handleDeleteVisit = async (visit: Visit) => {
    if (!hasPermission('supervisor')) {
      alert('ليس لديك صلاحية لحذف الزيارات');
      return;
    }

    // Check if visit requires warning
    const needsWarning = visit.status === 'completed' || visit.status === 'in_progress' || visit.type === 'emergency';

    let confirmMessage = `هل أنت متأكد من حذف الزيارة ${visit.visitId}؟`;
    if (needsWarning) {
      confirmMessage = `⚠️ تحذير: هذه الزيارة ${
        visit.status === 'completed' ? 'مكتملة' :
        visit.status === 'in_progress' ? 'قيد التنفيذ' : 'طارئة'
      }. هل أنت متأكد من حذفها؟ سيتم فقدان جميع البيانات المرتبطة بها.`;
    }

    if (confirm(confirmMessage)) {
      const success = await deleteVisit(visit.id);
      if (success) {
        refreshVisits();
        // Remove from selected visits if it was selected
        setSelectedVisits(prev => {
          const newSet = new Set(prev);
          newSet.delete(visit.id);
          return newSet;
        });
      } else {
        alert('فشل في حذف الزيارة');
      }
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!hasPermission('supervisor') || selectedVisits.size === 0) return;

    const visitsToDelete = originalWeeklyPlan.visits.filter(v => selectedVisits.has(v.id));
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
      setShowBulkActions(false);
      refreshVisits();
    }
  };

  // Select/deselect visit
  const handleSelectVisit = (visitId: string, checked: boolean) => {
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

  // Select/deselect all visits
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVisits(new Set(weeklyPlan.visits.map(v => v.id)));
    } else {
      setSelectedVisits(new Set());
    }
  };

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      companyId: 'all-companies',
      contractId: 'all-contracts',
      branchId: 'all-branches',
      visitType: 'all-types',
      visitStatus: 'all-statuses'
    });
  };

  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.companyId === companyId);
    return company?.companyName || 'شركة غير معروفة';
  };

  const getBranchName = (branchId: string): string => {
    const branch = branches.find(b => b.branchId === branchId);
    return branch?.branchName || 'فرع غير معروف';
  };

  const getContractInfo = (contractId: string): string => {
    const contract = contracts.find(c => c.contractId === contractId);
    return contract ? `عقد ${contract.contractId}` : 'عقد غير معروف';
  };

  const getDayName = (date: string): string => {
    const dayNames = {
      'Sunday': 'الأحد',
      'Monday': 'الاثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت'
    };

    const dailyPlan = weeklyPlan.dailyPlans[date];
    return dailyPlan ? dayNames[dailyPlan.dayOfWeek] || dailyPlan.dayOfWeek : '';
  };

  const getVisitStatusColor = (status: Visit['status']): string => {
    const statusColors = {
      'scheduled': 'bg-blue-100 border-blue-300 text-blue-800',
      'in_progress': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'completed': 'bg-green-100 border-green-300 text-green-800',
      'cancelled': 'bg-red-100 border-red-300 text-red-800',
      'rescheduled': 'bg-purple-100 border-purple-300 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getVisitTypeIcon = (type: Visit['type']): string => {
    const typeIcons = {
      'regular': '🔧',
      'emergency': '🚨',
      'followup': '📋'
    };
    return typeIcons[type] || '🔧';
  };

  // Generate array of dates for the week
  const weekDates = Object.keys(weeklyPlan.dailyPlans).sort((a, b) => {
    const dateA = new Date(a.split('-').reverse().join('-'));
    const dateB = new Date(b.split('-').reverse().join('-'));
    return dateA.getTime() - dateB.getTime();
  });

  if (visitsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل خطة الأسبوع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">شبكة التخطيط الأسبوعية</h1>
          <p className="text-gray-600 mt-2">
            خطة الأسبوع {weeklyPlan.weekNumber} - السنة {weeklyPlan.year}
          </p>
          <p className="text-sm text-gray-500">
            من <span dir="ltr">{weeklyPlan.weekStartDate}</span> إلى <span dir="ltr">{weeklyPlan.weekEndDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('supervisor') && (
            <Button onClick={handleAddVisit} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة زيارة
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" />
            تصفية
          </Button>
          {selectedVisits.size > 0 && hasPermission('supervisor') && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              حذف المحدد ({selectedVisits.size})
            </Button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-right">تصفية الزيارات</CardTitle>
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                <X className="w-4 h-4" />
                مسح المرشحات
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">البحث</label>
                <Input
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="البحث في الزيارات..."
                  className="text-right"
                  dir="rtl"
                />
              </div>

              {/* Company Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">الشركة</label>
                <Select value={filters.companyId} onValueChange={(value) => handleFilterChange('companyId', value)} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الشركات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-companies">جميع الشركات</SelectItem>
                    {companies.filter(c => !c.isArchived).map(company => (
                      <SelectItem key={company.companyId} value={company.companyId}>
                        {company.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visit Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">نوع الزيارة</label>
                <Select value={filters.visitType} onValueChange={(value) => handleFilterChange('visitType', value)} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">جميع الأنواع</SelectItem>
                    <SelectItem value="regular">🔧 عادية</SelectItem>
                    <SelectItem value="emergency">🚨 طارئة</SelectItem>
                    <SelectItem value="followup">📋 متابعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visit Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">حالة الزيارة</label>
                <Select value={filters.visitStatus} onValueChange={(value) => handleFilterChange('visitStatus', value)} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">جميع الحالات</SelectItem>
                    <SelectItem value="scheduled">مجدولة</SelectItem>
                    <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                    <SelectItem value="completed">مكتملة</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                    <SelectItem value="rescheduled">معاد جدولتها</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">الفرع</label>
                <Select value={filters.branchId} onValueChange={(value) => handleFilterChange('branchId', value)} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-branches">جميع الفروع</SelectItem>
                    {branches.filter(b => !b.isArchived &&
                      (filters.companyId === 'all-companies' || b.companyId === filters.companyId)
                    ).map(branch => (
                      <SelectItem key={branch.branchId} value={branch.branchId}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contract Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-right block">العقد</label>
                <Select value={filters.contractId} onValueChange={(value) => handleFilterChange('contractId', value)} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="جميع العقود" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-contracts">جميع العقود</SelectItem>
                    {contracts.filter(c => !c.isArchived &&
                      (filters.companyId === 'all-companies' || c.companyId === filters.companyId)
                    ).map(contract => (
                      <SelectItem key={contract.contractId} value={contract.contractId}>
                        عقد {contract.contractId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-gray-600 text-right">
              عرض {weeklyPlan.visits.length} زيارة من أصل {originalWeeklyPlan.visits.length}
            </div>

            {/* Bulk Actions */}
            {hasPermission('supervisor') && (
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedVisits.size === weeklyPlan.visits.length && weeklyPlan.visits.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label className="text-sm">تحديد الكل</label>
                </div>
                {selectedVisits.size > 0 && (
                  <div className="text-sm text-blue-600">
                    تم تحديد {selectedVisits.size} زيارة
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Week Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => navigateWeek('prev')} className="gap-2">
              <ChevronRight className="w-4 h-4" />
              الأسبوع السابق
            </Button>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={goToCurrentWeek} className="gap-2">
                <Calendar className="w-4 h-4" />
                الأسبوع الحالي
              </Button>

              {/* Week Selection Dropdown */}
              <div className="flex items-center gap-2">
                <Select
                  value={weeklyPlan.weekNumber.toString()}
                  onValueChange={(value) => {
                    const targetWeek = parseInt(value);
                    const currentYear = new Date().getFullYear();
                    const yearStart = new Date(currentYear, 0, 1);
                    const targetWeekStart = new Date(yearStart);
                    targetWeekStart.setDate(yearStart.getDate() + (targetWeek - 1) * 7);
                    setCurrentWeekStart(formatDateForDisplay(targetWeekStart));
                  }}
                  dir="rtl"
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => i + 1).map(weekNum => (
                      <SelectItem key={weekNum} value={weekNum.toString()}>
                        الأسبوع {weekNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-center">
                <h3 className="font-bold text-lg">الأسبوع {weeklyPlan.weekNumber}</h3>
                <p className="text-sm text-gray-600">
                  {weeklyPlan.weekStartDate} - {weeklyPlan.weekEndDate}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => navigateWeek('next')} className="gap-2">
              الأسبوع التالي
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyPlan.visits.length}</div>
              <div className="text-sm text-gray-600">إجمالي الزيارات</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weeklyPlan.visits.filter(v => v.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">زيارات مكتملة</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {weeklyPlan.visits.filter(v => v.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">زيارات مجدولة</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {weeklyPlan.visits.filter(v => v.type === 'emergency').length}
              </div>
              <div className="text-sm text-gray-600">زيارات طارئة</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Planning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDates.map((date) => {
          const dailyPlan = weeklyPlan.dailyPlans[date];
          return (
            <Card key={date} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className="text-lg font-bold">{getDayName(date)}</div>
                  <div className="text-sm text-gray-600" dir="ltr">{formatDateForDisplay(date)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dailyPlan.totalVisits} زيارة
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-3 space-y-2">
                {dailyPlan.visits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm">لا توجد زيارات مجدولة</p>
                  </div>
                ) : (
                  dailyPlan.visits.map((visit) => (
                    <div
                      key={visit.id}
                      className={`p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${getVisitStatusColor(visit.status)} ${
                        selectedVisits.has(visit.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={(e) => {
                        // Don't trigger if clicking on action buttons or checkboxes
                        const target = e.target as HTMLElement;
                        if (!target.closest('.complete-button-area') && !target.closest('input[type="checkbox"]')) {
                          // Show visit details form for viewing/editing visit info
                          handleEditVisit(visit);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Selection checkbox */}
                          {hasPermission('supervisor') && (
                            <div className="flex items-center gap-2 mb-1">
                              <Checkbox
                                checked={selectedVisits.has(visit.id)}
                                onCheckedChange={(checked) => handleSelectVisit(visit.id, !!checked)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-lg">{getVisitTypeIcon(visit.type)}</span>
                                <span className="font-medium text-sm">{visit.visitId}</span>
                              </div>
                            </div>
                          )}

                          {!hasPermission('supervisor') && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-lg">{getVisitTypeIcon(visit.type)}</span>
                              <span className="font-medium text-sm">{visit.visitId}</span>
                            </div>
                          )}

                          <div className="text-xs space-y-1">
                            <div className="font-medium">{getCompanyName(visit.companyId)}</div>
                            <div>{getBranchName(visit.branchId)}</div>
                            <div className="text-gray-600">{getContractInfo(visit.contractId)}</div>

                            {visit.scheduledTime && (
                              <div className="flex items-center gap-1">
                                <span>⏰</span>
                                <span>{visit.scheduledTime}</span>
                              </div>
                            )}

                            {visit.assignedTeam && (
                              <div className="flex items-center gap-1">
                                <span>👥</span>
                                <span>{visit.assignedTeam}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="complete-button-area flex flex-col gap-1 mt-2">
                          {visit.status !== 'completed' ? (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteVisit(visit);
                                }}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                title="إكمال الزيارة"
                              >
                                ✅ إكمال
                              </button>
                              {hasPermission('supervisor') && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditVisit(visit);
                                    }}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex-1"
                                    title="تعديل الزيارة"
                                  >
                                    <Edit className="w-3 h-3 inline" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVisit(visit);
                                    }}
                                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex-1"
                                    title="حذف الزيارة"
                                  >
                                    <Trash2 className="w-3 h-3 inline" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {visit.results && (
                                <div
                                  className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 ${
                                    visit.results.overallStatus === 'passed' ? 'bg-green-100 text-green-700' :
                                    visit.results.overallStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteVisit(visit);
                                  }}
                                  title="عرض/تعديل تقرير الإكمال"
                                >
                                  {visit.results.overallStatus === 'passed' ? '✅ نجح' :
                                   visit.results.overallStatus === 'failed' ? '❌ فشل' : '⚠️ جزئي'}
                                </div>
                              )}
                              {hasPermission('supervisor') && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCompleteVisit(visit);
                                    }}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 flex-1"
                                    title="تعديل تقرير الإكمال"
                                  >
                                    📋 تقرير
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditVisit(visit);
                                    }}
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex-1"
                                    title="تعديل بيانات الزيارة"
                                  >
                                    <Edit className="w-3 h-3 inline" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVisit(visit);
                                    }}
                                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 flex-1"
                                    title="حذف الزيارة"
                                  >
                                    <Trash2 className="w-3 h-3 inline" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Visit Form Modal */}
      {showVisitForm && (
        <VisitForm
          visit={selectedVisit || undefined}
          onSuccess={handleVisitFormClose}
          onCancel={handleVisitFormClose}
        />
      )}

      {/* Visit Completion Form Modal */}
      {showCompletionForm && visitToComplete && (
        <VisitCompletionForm
          visit={visitToComplete}
          onSuccess={handleCompletionFormClose}
          onCancel={handleCompletionFormClose}
        />
      )}
    </div>
  );
}
