'use client';

import { useState } from 'react';
import { AnnualScheduler } from './AnnualScheduler';
import { PlanningGrid } from './PlanningGrid';
import { VisitImportTemplate } from './VisitImportTemplate';
import { VisitExportTemplate } from './VisitExportTemplate';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { useVisits } from '@/hooks/useVisits';

export function PlanningManagement() {
  const [activeTab, setActiveTab] = useState<'annual' | 'weekly' | 'visits'>('annual');
  const [showVisitImport, setShowVisitImport] = useState(false);
  const [showVisitExport, setShowVisitExport] = useState(false);

  const { hasPermission } = useAuth();
  const { visits } = useVisits();

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
      {activeTab === 'weekly' && <PlanningGrid />}
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
                variant="outline"
                className="gap-2"
              >
                📤 تصدير تقرير الزيارات
              </Button>
            </div>
          </div>

          {/* Visit Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📊</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{visits.length}</div>
                  <div className="text-sm text-blue-800">إجمالي الزيارات</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {visits.filter(v => v.status === 'completed').length}
                  </div>
                  <div className="text-sm text-green-800">زيارات مكتملة</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">⏰</div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {visits.filter(v => v.status === 'scheduled').length}
                  </div>
                  <div className="text-sm text-yellow-800">زيارات مجدولة</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🚨</div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {visits.filter(v => v.type === 'emergency').length}
                  </div>
                  <div className="text-sm text-red-800">زيارات طارئة</div>
                </div>
              </div>
            </div>
          </div>

          {/* Import/Export Information */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">إدارة بيانات الزيارات</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Section */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h4 className="font-medium text-green-800 mb-2">📥 استيراد الزيارات التاريخية</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• استيراد بيانات الزيارات من ملفات CSV أو Excel</li>
                    <li>• التحقق من صحة البيانات ضد العقود والفروع</li>
                    <li>• مراجعة وموافقة على كل زيارة قبل الاستيراد</li>
                    <li>• دعم جميع أنواع الزيارات (دورية، طارئة، متابعة)</li>
                  </ul>
                </div>

                {/* Export Section */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium text-blue-800 mb-2">📤 تصدير تقارير الزيارات</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• تصدير تقارير شاملة لجميع الزيارات</li>
                    <li>• تصفية حسب التاريخ ونوع الزيارة والحالة</li>
                    <li>• تضمين تفاصيل النتائج والتوصيات</li>
                    <li>• تنسيق CSV متوافق مع Excel</li>
                  </ul>
                </div>
              </div>

              {/* Requirements */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-medium text-yellow-800 mb-2">متطلبات الاستيراد:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• يجب أن تكون الشركات والعقود والفروع موجودة في النظام</li>
                  <li>• تواريخ الزيارات يجب أن تكون ضمن فترة العقد</li>
                  <li>• خدمات السلامة يجب أن تتطابق مع خدمات العقد</li>
                  <li>• استخدام التنسيقات الصحيحة للتواريخ والأوقات</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visit Import Modal */}
      {showVisitImport && (
        <VisitImportTemplate
          onClose={() => setShowVisitImport(false)}
        />
      )}

      {/* Visit Export Modal */}
      {showVisitExport && (
        <VisitExportTemplate
          visits={visits}
          onClose={() => setShowVisitExport(false)}
        />
      )}
    </div>
  );
}
