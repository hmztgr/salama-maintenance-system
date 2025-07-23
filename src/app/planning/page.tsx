'use client';

import { useState } from 'react';
import { AnnualScheduler } from '@/components/planning/AnnualScheduler';
import { PlanningGrid } from '@/components/planning/PlanningGrid';
import { VisitLogsViewer } from '@/components/planning/VisitLogsViewer';

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<'annual' | 'weekly' | 'logs'>('annual');

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
      id: 'logs' as const,
      label: 'سجلات الزيارات',
      icon: '📋',
      description: 'عرض سجلات الإكمال والإلغاء'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
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
      {activeTab === 'weekly' && <PlanningGrid />}
      {activeTab === 'logs' && <VisitLogsViewer />}
    </div>
  );
}
