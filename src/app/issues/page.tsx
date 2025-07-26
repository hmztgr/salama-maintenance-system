'use client';

import React, { useState } from 'react';
import { IssueList } from '@/components/issues/IssueList';
import { IssueForm } from '@/components/issues/IssueForm';
import { Issue } from '@/types/issues';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export default function IssuesPage() {
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const handleCreateNew = () => {
    setView('form');
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setView('detail');
  };

  const handleFormSuccess = (issueId: string) => {
    // Show success message and return to list
    setView('list');
    // You could add a toast notification here
  };

  const handleFormCancel = () => {
    setView('list');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedIssue(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Navigation Header */}
      {view !== 'list' && (
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى قائمة المشاكل
          </Button>
        </div>
      )}

      {/* Page Content */}
      {view === 'list' && (
        <IssueList 
          onIssueClick={handleIssueClick}
          onCreateNew={handleCreateNew}
        />
      )}

      {view === 'form' && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">إبلاغ عن مشكلة جديدة</h1>
            <p className="text-gray-600 mt-2">
              استخدم هذا النموذج للإبلاغ عن مشاكل أو طلب ميزات جديدة
            </p>
          </div>
          <IssueForm 
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      {view === 'detail' && selectedIssue && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">تفاصيل المشكلة</h1>
            <p className="text-gray-600 mt-2">
              عرض تفاصيل المشكلة والتعليقات
            </p>
          </div>
          {/* TODO: Add IssueDetail component */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              مكون تفاصيل المشكلة سيتم إضافته في المرحلة التالية
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 