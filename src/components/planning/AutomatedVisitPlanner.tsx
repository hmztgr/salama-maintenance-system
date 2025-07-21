'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Settings, Play, CheckCircle, AlertCircle, Clock, Search, Filter, SortAsc, SortDesc, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { VisitPlanningAlgorithm, PlanningOptions, PlanningResult } from '@/lib/planning/VisitPlanningAlgorithm';
import { Branch } from '@/types/customer';

interface AutomatedVisitPlannerProps {
  className?: string;
}

interface BranchSelectionData extends Branch {
  isSelected: boolean;
  contractCount: number;
  visitCount: number;
  companyName: string;
}

export function AutomatedVisitPlanner({ className = '' }: AutomatedVisitPlannerProps) {
  const { hasPermission } = useAuth();
  const { companies } = useCompaniesFirebase();
  const { contracts } = useContractsFirebase();
  const { branches } = useBranchesFirebase();
  const { visits, addVisit, refreshVisits } = useVisitsFirebase();

  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planningProgress, setPlanningProgress] = useState(0);
  const [planningResult, setPlanningResult] = useState<PlanningResult | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [planningOptions, setPlanningOptions] = useState<PlanningOptions>({
    maxVisitsPerDay: 5,
    preferredWeekStart: 'saturday',
    minDaysBetweenVisits: 1,
    includeExistingVisits: true,
    conflictResolution: 'reschedule',
    batchSize: 50
  });

  // Multi-branch selection state
  const [branchSelections, setBranchSelections] = useState<Map<string, boolean>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'branchName' | 'companyName' | 'contractCount' | 'visitCount'>('branchName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'withContracts' | 'withoutContracts'>('all');

  // Check permissions
  if (!hasPermission('admin')) {
    return null; // Only admins can access automated planning
  }

  // Enhanced branch data with company names and contract counts
  const enhancedBranches = useMemo(() => {
    return branches
      .filter(branch => !branch.isArchived)
      .map(branch => {
        const company = companies.find(c => c.companyId === branch.companyId);
        const branchContracts = contracts.filter(contract => 
          contract.serviceBatches?.some(batch => 
            batch.branchIds.includes(branch.branchId)
          ) && !contract.isArchived
        );
        const branchVisits = visits.filter(v => v.branchId === branch.branchId);

        return {
          ...branch,
          companyName: company?.companyName || 'شركة غير معروفة',
          contractCount: branchContracts.length,
          visitCount: branchVisits.length,
          isSelected: branchSelections.get(branch.branchId) || false
        } as BranchSelectionData;
      });
  }, [branches, companies, contracts, visits, branchSelections]);

  // Filtered and sorted branches
  const filteredBranches = useMemo(() => {
    let filtered = enhancedBranches;

    // Filter by company
    if (selectedCompanyId) {
      filtered = filtered.filter(branch => branch.companyId === selectedCompanyId);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(branch => 
        branch.branchName.toLowerCase().includes(searchLower) ||
        branch.companyName.toLowerCase().includes(searchLower) ||
        branch.branchId.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower) ||
        branch.contactPerson?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    switch (filterStatus) {
      case 'withContracts':
        filtered = filtered.filter(branch => branch.contractCount > 0);
        break;
      case 'withoutContracts':
        filtered = filtered.filter(branch => branch.contractCount === 0);
        break;
      default:
        break;
    }

    // Sort branches
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'branchName':
          comparison = a.branchName.localeCompare(b.branchName);
          break;
        case 'companyName':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case 'contractCount':
          comparison = a.contractCount - b.contractCount;
          break;
        case 'visitCount':
          comparison = a.visitCount - b.visitCount;
          break;
        default:
          comparison = a.branchName.localeCompare(b.branchName);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [enhancedBranches, selectedCompanyId, searchTerm, filterStatus, sortBy, sortDirection]);

  // Selection helpers
  const selectedBranches = useMemo(() => {
    return filteredBranches.filter(branch => branch.isSelected);
  }, [filteredBranches]);

  const handleBranchSelection = (branchId: string, isSelected: boolean) => {
    setBranchSelections(prev => new Map(prev.set(branchId, isSelected)));
  };

  const handleSelectAll = (isSelected: boolean) => {
    const newSelections = new Map(branchSelections);
    filteredBranches.forEach(branch => {
      newSelections.set(branch.branchId, isSelected);
    });
    setBranchSelections(newSelections);
  };

  const handleSelectAllWithContracts = () => {
    const newSelections = new Map(branchSelections);
    filteredBranches.forEach(branch => {
      if (branch.contractCount > 0) {
        newSelections.set(branch.branchId, true);
      }
    });
    setBranchSelections(newSelections);
  };

  const handlePlanningStart = async () => {
    if (selectedBranches.length === 0) {
      alert('يرجى اختيار فروع واحدة على الأقل للبدء في التخطيط التلقائي');
      return;
    }

    setIsPlanning(true);
    setPlanningProgress(0);
    setPlanningResult(null);

    try {
      // Create planning algorithm instance
      const planner = new VisitPlanningAlgorithm(planningOptions);
      
      // Update progress
      setPlanningProgress(20);

      // Generate automated visits for selected branches
      const result = planner.generateAutomatedVisits(
        selectedCompanyId,
        contracts,
        selectedBranches,
        visits
      );

      setPlanningProgress(60);

      // Create visits in batches
      if (result.success && result.plannedVisits.length > 0) {
        const batchSize = planningOptions.batchSize;
        const totalBatches = Math.ceil(result.plannedVisits.length / batchSize);
        
        for (let i = 0; i < result.plannedVisits.length; i += batchSize) {
          const batch = result.plannedVisits.slice(i, i + batchSize);
          
          // Add visits to the system
          for (const visit of batch) {
            await addVisit(visit);
          }
          
          // Update progress
          const batchProgress = Math.min(60 + ((i + batchSize) / result.plannedVisits.length) * 30, 90);
          setPlanningProgress(batchProgress);
        }
      }

      setPlanningProgress(100);
      setPlanningResult(result);

      // Refresh visits data
      await refreshVisits();

    } catch (error) {
      console.error('Planning failed:', error);
      setPlanningResult({
        success: false,
        plannedVisits: [],
        conflicts: [],
        summary: {
          totalPlanned: 0,
          totalConflicts: 0,
          totalSkipped: 0,
          planningTime: 0
        },
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
    } finally {
      setIsPlanning(false);
    }
  };

  const handleOptionChange = (key: keyof PlanningOptions, value: any) => {
    setPlanningOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.companyId === companyId)?.companyName || 'Unknown Company';
  };

  const getCompanyBranchCount = (companyId: string) => {
    return branches.filter(b => b.companyId === companyId && !b.isArchived).length;
  };

  const getCompanyContractCount = (companyId: string) => {
    return contracts.filter(c => c.companyId === companyId && !c.isArchived).length;
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={isPlanning}
          >
            <Calendar className="h-4 w-4 mr-2" />
            التخطيط التلقائي للزيارات
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              التخطيط التلقائي للزيارات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اختيار الشركة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-select">الشركة (اختياري - للتصفية)</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشركة للتصفية (اختياري)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع الشركات</SelectItem>
                        {companies
                          .filter(company => !company.isArchived)
                          .map(company => (
                            <SelectItem key={company.companyId} value={company.companyId}>
                              <div className="flex flex-col">
                                <span>{company.companyName}</span>
                                <span className="text-xs text-gray-500">
                                  {getCompanyBranchCount(company.companyId)} فروع • {getCompanyContractCount(company.companyId)} عقود
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCompanyId && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">الفروع</Badge>
                        <span>{getCompanyBranchCount(selectedCompanyId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">العقود</Badge>
                        <span>{getCompanyContractCount(selectedCompanyId)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Branch Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اختيار الفروع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="البحث في الفروع..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفروع</SelectItem>
                        <SelectItem value="withContracts">فروع لها عقود</SelectItem>
                        <SelectItem value="withoutContracts">فروع بدون عقود</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SortAsc className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branchName">اسم الفرع</SelectItem>
                        <SelectItem value="companyName">اسم الشركة</SelectItem>
                        <SelectItem value="contractCount">عدد العقود</SelectItem>
                        <SelectItem value="visitCount">عدد الزيارات</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-2"
                    >
                      {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      {sortDirection === 'asc' ? 'تصاعدي' : 'تنازلي'}
                    </Button>
                  </div>

                  {/* Bulk Selection Controls */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filteredBranches.length > 0 && filteredBranches.every(b => b.isSelected)}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label>تحديد الكل</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllWithContracts}
                    >
                      تحديد الفروع ذات العقود
                    </Button>
                    <Badge variant="secondary">
                      {selectedBranches.length} من {filteredBranches.length} فرع محدد
                    </Badge>
                  </div>

                  {/* Branches List */}
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-right">تحديد</th>
                          <th className="px-4 py-2 text-right">اسم الفرع</th>
                          <th className="px-4 py-2 text-right">الشركة</th>
                          <th className="px-4 py-2 text-right">العقود</th>
                          <th className="px-4 py-2 text-right">الزيارات</th>
                          <th className="px-4 py-2 text-right">المدينة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredBranches.map(branch => (
                          <tr key={branch.branchId} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <Checkbox
                                checked={branch.isSelected}
                                onCheckedChange={(checked) => handleBranchSelection(branch.branchId, checked as boolean)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="font-medium">{branch.branchName}</div>
                              <div className="text-sm text-gray-500">{branch.branchId}</div>
                            </td>
                            <td className="px-4 py-2 text-sm">{branch.companyName}</td>
                            <td className="px-4 py-2">
                              <Badge variant={branch.contractCount > 0 ? "default" : "secondary"}>
                                {branch.contractCount}
                              </Badge>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="outline">{branch.visitCount}</Badge>
                            </td>
                            <td className="px-4 py-2 text-sm">{branch.city}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredBranches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد فروع تطابق معايير البحث
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Planning Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">خيارات التخطيط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-visits">الحد الأقصى للزيارات يومياً</Label>
                    <Input
                      id="max-visits"
                      type="number"
                      min="1"
                      max="10"
                      value={planningOptions.maxVisitsPerDay}
                      onChange={(e) => handleOptionChange('maxVisitsPerDay', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="week-start">بداية الأسبوع المفضلة</Label>
                    <Select 
                      value={planningOptions.preferredWeekStart} 
                      onValueChange={(value) => handleOptionChange('preferredWeekStart', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saturday">السبت</SelectItem>
                        <SelectItem value="sunday">الأحد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="min-days">الحد الأدنى للأيام بين الزيارات</Label>
                    <Input
                      id="min-days"
                      type="number"
                      min="1"
                      max="7"
                      value={planningOptions.minDaysBetweenVisits}
                      onChange={(e) => handleOptionChange('minDaysBetweenVisits', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="conflict-resolution">حل التعارضات</Label>
                    <Select 
                      value={planningOptions.conflictResolution} 
                      onValueChange={(value) => handleOptionChange('conflictResolution', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reschedule">إعادة جدولة</SelectItem>
                        <SelectItem value="skip">تخطي</SelectItem>
                        <SelectItem value="error">خطأ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-existing"
                      checked={planningOptions.includeExistingVisits}
                      onCheckedChange={(checked) => handleOptionChange('includeExistingVisits', checked)}
                    />
                    <Label htmlFor="include-existing">مراعاة الزيارات الموجودة</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planning Progress */}
            {isPlanning && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 animate-spin" />
                    جاري التخطيط...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={planningProgress} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">
                    {planningProgress < 30 && 'جاري تحليل البيانات...'}
                    {planningProgress >= 30 && planningProgress < 60 && 'جاري إنشاء الجدول...'}
                    {planningProgress >= 60 && planningProgress < 90 && 'جاري حفظ الزيارات...'}
                    {planningProgress >= 90 && 'إكمال العملية...'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Planning Results */}
            {planningResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {planningResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    نتائج التخطيط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {planningResult.success ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          تم إنشاء {planningResult.summary.totalPlanned} زيارة بنجاح
                          {planningResult.summary.totalConflicts > 0 && (
                            <span className="block mt-1">
                              تم حل {planningResult.summary.totalConflicts} تعارض
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {planningResult.summary.totalPlanned}
                          </div>
                          <div className="text-sm text-gray-600">زيارة مخططة</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {planningResult.summary.totalConflicts}
                          </div>
                          <div className="text-sm text-gray-600">تعارض محلول</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {planningResult.summary.planningTime}ms
                          </div>
                          <div className="text-sm text-gray-600">وقت التخطيط</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {selectedBranches.length}
                          </div>
                          <div className="text-sm text-gray-600">فرع مخطط</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        فشل في التخطيط التلقائي:
                        <ul className="mt-2 list-disc list-inside">
                          {planningResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPlanning}
              >
                إلغاء
              </Button>
              
              <Button
                onClick={handlePlanningStart}
                disabled={selectedBranches.length === 0 || isPlanning}
                className="min-w-[120px]"
              >
                {isPlanning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    جاري...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    بدء التخطيط ({selectedBranches.length} فرع)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 