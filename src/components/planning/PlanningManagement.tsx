'use client';

import { useState } from 'react';
import { AnnualScheduler } from './AnnualScheduler';
import { PlanningGrid } from './PlanningGrid';
import { WeeklyPlanner } from './WeeklyPlanner';
import { VisitImportTemplate } from './VisitImportTemplate';
import { VisitExportTemplate } from './VisitExportTemplate';
import VisitLogsViewer from './VisitLogsViewer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useVisitsFirebase } from '@/hooks/useVisitsFirebase';
import { useWeekNavigation } from '@/contexts/WeekNavigationContext';

export function PlanningManagement() {
  const [activeTab, setActiveTab] = useState<'annual' | 'weekly' | 'visits' | 'logs'>('weekly');
  const [showVisitImport, setShowVisitImport] = useState(false);
  const [showVisitExport, setShowVisitExport] = useState(false);

  const { hasPermission } = useAuth();
  const { visits } = useVisitsFirebase();
  const { currentWeekNumber, currentYear } = useWeekNavigation();

  const tabs = [
    {
      id: 'annual' as const,
      label: 'المجدول السنوي',
      icon: '📅',
      description: 'عرض 52 أسبوع لجميع الفروع'
    },
    {
      id: 'weekly' as const,
      label: 'التخطيط الأسبوعي المفصل',
      icon: '🗓️',
      description: 'تخطيط مفصل على مستوى الأيام'
    },
    {
      id: 'visits' as const,
      label: 'إدارة الزيارات',
      icon: '📋',
      description: 'استيراد وتصدير بيانات الزيارات'
    },
    {
      id: 'logs' as const,
      label: 'سجلات الزيارات',
      icon: '📋',
      description: 'عرض سجلات الإكمال والإلغاء'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 space-x-reverse">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="ml-2 text-lg">{tab.icon}</span>
              <div className="text-right">
                <div>{tab.label}</div>
                <div className="text-xs text-gray-400 font-normal">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'annual' && <AnnualScheduler />}
      {activeTab === 'weekly' && <WeeklyPlanner weekNumber={currentWeekNumber} year={currentYear} />}
      {activeTab === 'logs' && <VisitLogsViewer />}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          {/* Visit Management Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">إدارة الزيارات</h2>
              <p className="text-gray-600 mt-1">
                استيراد وتصدير بيانات الزيارات التاريخية والتقارير
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Import Button */}
              {hasPermission('supervisor') && (
                <Button
                  onClick={() => setShowVisitImport(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  📥 استيراد الزيارات
                </Button>
              )}

              {/* Export Button */}
              <Button
                onClick={() => setShowVisitExport(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                📤 تصدير الزيارات
              </Button>
            </div>
          </div>

          {/* Visit Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">{visits.length}</div>
              <div className="text-sm text-gray-600">إجمالي الزيارات</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">
                {visits.filter(v => v.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">الزيارات المكتملة</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-yellow-600">
                {visits.filter(v => v.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">الزيارات المجدولة</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-red-600">
                {visits.filter(v => v.type === 'emergency').length}
              </div>
              <div className="text-sm text-gray-600">الزيارات الطارئة</div>
            </div>
          </div>

          {/* Import/Export Modals */}
          {showVisitImport && (
            <VisitImportTemplate
              onClose={() => setShowVisitImport(false)}
            />
          )}

          {showVisitExport && (
            <VisitExportTemplate
              onClose={() => setShowVisitExport(false)}
              visits={visits}
            />
          )}
        </div>
      )}
    </div>
  );
}
