'use client';

import { useState } from 'react';
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
import { Calendar, Settings, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useContractsFirebase } from '@/hooks/useContractsFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { VisitPlanningAlgorithm, PlanningOptions, PlanningResult } from '@/lib/planning/VisitPlanningAlgorithm';

interface AutomatedVisitPlannerProps {
  className?: string;
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

  // Check permissions
  if (!hasPermission('admin')) {
    return null; // Only admins can access automated planning
  }

  const handlePlanningStart = async () => {
    if (!selectedCompanyId) {
      alert('يرجى اختيار شركة للبدء في التخطيط التلقائي');
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

      // Generate automated visits
      const result = planner.generateAutomatedVisits(
        selectedCompanyId,
        contracts,
        branches,
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
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <Label htmlFor="company-select">الشركة</Label>
                    <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشركة" />
                      </SelectTrigger>
                      <SelectContent>
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
                            {getCompanyBranchCount(selectedCompanyId)}
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
                disabled={!selectedCompanyId || isPlanning}
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
                    بدء التخطيط
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