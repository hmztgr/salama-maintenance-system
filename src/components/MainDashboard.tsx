'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { CustomerManagement } from './customers/CustomerManagement';
import { NewCustomerManagement } from './customers/NewCustomerManagement';
import { PlanningManagement } from './planning/PlanningManagement';
import { DemoDataGenerator } from './admin/DemoDataGenerator';
import { InvitationManagement } from './admin/InvitationManagement';
import { AdvancedRoleManagement } from './admin/AdvancedRoleManagement';
import { UserManagement } from './admin/UserManagement';
import { FirebaseTest } from './admin/FirebaseTest';
import { FirebaseAuthTest } from './admin/FirebaseAuthTest';
import { FirebaseMigration } from './admin/FirebaseMigration';
import { FirebaseDataTest } from './admin/FirebaseDataTest';
import { DataMigration } from './admin/DataMigration';
import { UserProfile } from './profile/UserProfile';
import { ReportsDashboard } from './reports/ReportsDashboard';

export interface MainDashboardProps {
  className?: string;
}

export function MainDashboard({ className = '' }: MainDashboardProps) {
  const { authState, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [adminSubTab, setAdminSubTab] = useState('demo-data');

  if (!authState.user) {
    return <div>غير مصرح بالدخول</div>;
  }

  const tabs = [
    {
      id: 'customers',
      label: 'إدارة العملاء',
      icon: '👥',
      requiredRole: 'viewer' as const,
    },
    {
      id: 'planning',
      label: 'جدولة الصيانة',
      icon: '📅',
      requiredRole: 'viewer' as const,
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: '📊',
      requiredRole: 'supervisor' as const,
    },
    {
      id: 'checklists',
      label: 'قوائم المراجعة',
      icon: '✅',
      requiredRole: 'supervisor' as const,
      isPlaceholder: true,
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: '👤',
      requiredRole: 'viewer' as const,
    },
    {
      id: 'admin',
      label: 'إدارة النظام',
      icon: '🔧',
      requiredRole: 'admin' as const,
    },
  ];

  const availableTabs = tabs.filter(tab => hasPermission(tab.requiredRole));

  const handleLogout = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      logout();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                شركة سلامة السعودية - نظام إدارة الصيانة
              </h1>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm text-gray-600">
                مرحباً، {authState.user.displayName || 'مستخدم'}
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {authState.user.role === 'admin' ? 'مدير' :
                 authState.user.role === 'supervisor' ? 'مشرف' : 'فني'}
              </div>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.isPlaceholder && setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                } ${tab.isPlaceholder ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={tab.isPlaceholder}
              >
                <span className="ml-2">{tab.icon}</span>
                {tab.label}
                {tab.isPlaceholder && (
                  <span className="mr-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    قريباً
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'customers' && <NewCustomerManagement />}

        {activeTab === 'planning' && <PlanningManagement />}

        {activeTab === 'profile' && <UserProfile />}

        {activeTab === 'reports' && <ReportsDashboard />}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">إدارة النظام</h2>

            {/* Admin Sub-Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 space-x-reverse px-6">
                  <button
                    onClick={() => setAdminSubTab('demo-data')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'demo-data'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🎯 بيانات تجريبية
                  </button>
                  <button
                    onClick={() => setAdminSubTab('invitations')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'invitations'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📧 دعوات المستخدمين
                  </button>
                  <button
                    onClick={() => setAdminSubTab('users')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🛡️ إدارة الأدوار والصلاحيات
                  </button>
                  <button
                    onClick={() => setAdminSubTab('user-management')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'user-management'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    👥 إدارة المستخدمين
                  </button>
                  <button
                    onClick={() => setAdminSubTab('firebase')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'firebase'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔥 اختبار Firebase
                  </button>
                  <button
                    onClick={() => setAdminSubTab('firebase-auth')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'firebase-auth'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔐 اختبار المصادقة
                  </button>
                  <button
                    onClick={() => setAdminSubTab('firebase-migration')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'firebase-migration'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📊 ترحيل البيانات
                  </button>
                  <button
                    onClick={() => setAdminSubTab('firebase-data')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'firebase-data'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    💾 اختبار البيانات
                  </button>
                  <button
                    onClick={() => setAdminSubTab('data-migration')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'data-migration'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    🔧 ترحيل البيانات
                  </button>
                  <button
                    onClick={() => setAdminSubTab('settings')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      adminSubTab === 'settings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    ⚙️ إعدادات النظام
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Demo Data Generator */}
                {adminSubTab === 'demo-data' && <DemoDataGenerator />}

                {/* Invitation Management */}
                {adminSubTab === 'invitations' && <InvitationManagement />}

                {/* Advanced Role Management */}
                {adminSubTab === 'users' && <AdvancedRoleManagement />}

                {/* User Management */}
                {adminSubTab === 'user-management' && <UserManagement />}

                {/* Firebase Test */}
                {adminSubTab === 'firebase' && <FirebaseTest />}

                {/* Firebase Authentication Test */}
                {adminSubTab === 'firebase-auth' && <FirebaseAuthTest />}

                {/* Firebase Data Migration */}
                {adminSubTab === 'firebase-migration' && <FirebaseMigration />}

                {/* Firebase Data Test */}
                {adminSubTab === 'firebase-data' && <FirebaseDataTest />}

                {/* Data Migration */}
                {adminSubTab === 'data-migration' && <DataMigration />}

                {/* System Settings (Placeholder) */}
                {adminSubTab === 'settings' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">إعدادات النظام</h3>
                    <p className="text-gray-500 mb-4">
                      إعدادات عامة للنظام، النسخ الاحتياطي، وتخصيص الواجهة
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-blue-800 text-sm">
                        📋 قيد التطوير - سيتم إضافة هذه الميزة قريباً
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            نظام إدارة جدولة الصيانة - شركة سلامة السعودية © 2024
          </div>
        </div>
      </footer>
    </div>
  );
}

// Safe default props
MainDashboard.defaultProps = {
  className: '',
};
