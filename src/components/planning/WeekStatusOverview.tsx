import React, { useMemo } from 'react';
import { WeeklyPlanningData, VisitAction, WeekQuickAction } from '@/types/weekly-planning';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Printer, Calendar } from 'lucide-react';

export interface WeekStatusOverviewProps {
  weekData: WeeklyPlanningData;
  onQuickAction: (action: VisitAction) => void;
  onApprove: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onWeekChange?: (weekNumber: number) => void;
  readonly?: boolean;
  userName?: string;
}

export function WeekStatusOverview({
  weekData,
  onQuickAction,
  onApprove,
  onExport,
  onPrint,
  onWeekChange,
  readonly = false,
  userName = 'مستخدم النظام'
}: WeekStatusOverviewProps) {
  // Calculate week statistics
  const weekStats = useMemo(() => {
    const totalVisits = weekData.visits.length;
    const completedVisits = weekData.visits.filter(v => v.status === 'completed').length;
    const pendingVisits = weekData.visits.filter(v => v.status === 'scheduled').length;
    const emergencyVisits = weekData.visits.filter(v => v.type === 'emergency').length;
    const completionRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    // Debug logging removed to prevent console loops

    return {
      totalVisits,
      completedVisits,
      pendingVisits,
      emergencyVisits,
      completionRate
    };
  }, [weekData.visits]);

  // Quick actions
  const quickActions: WeekQuickAction[] = [
    {
      type: 'approve',
      label: 'موافقة على الأسبوع',
      icon: 'CheckCircle',
      disabled: readonly || weekData.status === 'approved'
    },
    {
      type: 'export',
      label: 'تصدير الأسبوع',
      icon: 'Download',
      disabled: false
    },
    {
      type: 'print',
      label: 'طباعة الأسبوع',
      icon: 'Printer',
      disabled: false
    }
  ];

  const handleQuickAction = (action: WeekQuickAction) => {
    switch (action.type) {
      case 'approve':
        onApprove();
        break;
      case 'export':
        onExport?.();
        break;
      case 'print':
        onPrint?.();
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'approved':
        return 'معتمد';
      case 'in-progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      default:
        return status;
    }
  };

  return (
    <div className="week-status-overview">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>نظرة عامة على الأسبوع {weekData.weekNumber}</span>
            <Badge className={getStatusColor(weekData.status)}>
              {getStatusText(weekData.status)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Week Selection Buttons */}
          {onWeekChange && (
            <div className="week-selection-compact mb-4">
              <div className="flex flex-wrap gap-1 justify-center">
                {Array.from({ length: 52 }, (_, i) => i + 1).map(weekNum => (
                  <button
                    key={weekNum}
                    onClick={() => onWeekChange(weekNum)}
                    className={`px-2 py-1 text-xs rounded ${
                      weekData.weekNumber === weekNum 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {weekNum}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Statistics Cards */}
          <div className="status-cards grid grid-cols-4 gap-4 mb-6">
            <div className="status-card">
              <div className="text-2xl font-bold text-blue-600">{weekStats.totalVisits}</div>
              <div className="text-sm text-gray-600">إجمالي الزيارات</div>
            </div>
            <div className="status-card">
              <div className="text-2xl font-bold text-green-600">{weekStats.completedVisits}</div>
              <div className="text-sm text-gray-600">الزيارات المكتملة</div>
            </div>
            <div className="status-card">
              <div className="text-2xl font-bold text-yellow-600">{weekStats.pendingVisits}</div>
              <div className="text-sm text-gray-600">الزيارات المعلقة</div>
            </div>
            <div className="status-card">
              <div className="text-2xl font-bold text-red-600">{weekStats.emergencyVisits}</div>
              <div className="text-sm text-gray-600">الزيارات الطارئة</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">نسبة الإنجاز</span>
              <span className="text-sm text-gray-600">{weekStats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${weekStats.completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions flex gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.type}
                variant={action.type === 'approve' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleQuickAction(action)}
                disabled={action.disabled}
                className="flex items-center gap-2"
              >
                {action.type === 'approve' && <CheckCircle className="h-4 w-4" />}
                {action.type === 'export' && <Download className="h-4 w-4" />}
                {action.type === 'print' && <Printer className="h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>

          {/* Last Modified Info */}
          <div className="mt-4 text-xs text-gray-500">
            آخر تعديل: {new Date(weekData.lastModified).toLocaleString('en-GB')}
            {` بواسطة ${userName}`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 