'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, AlertTriangle, Calendar, Clock, Plus, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';
import { useWeekNavigation } from '@/contexts/WeekNavigationContext';

function CompletedVisitNewContent() {
  const router = useRouter();
  const { currentWeekNumber, currentYear } = useWeekNavigation();
  
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [completionTime, setCompletionTime] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'passed' | 'failed' | 'partial'>('passed');
  const [issues, setIssues] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newIssue, setNewIssue] = useState<string>('');
  const [newRecommendation, setNewRecommendation] = useState<string>('');
  const [nextVisitDate, setNextVisitDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // URL parameters
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [dayIndex, setDayIndex] = useState<string>('');
  const [dayName, setDayName] = useState<string>('');

  // Data hooks
  const { companies, loading: companiesLoading } = useCompaniesFirebase();
  const { branches, loading: branchesLoading } = useBranchesFirebase();

  // Load URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const dayParam = urlParams.get('day');
    const dayNameParam = urlParams.get('dayName');

    if (dateParam) {
      setScheduledDate(dateParam);
      setCompletionDate(new Date(dateParam).toISOString().split('T')[0]);
    }
    if (dayParam) setDayIndex(dayParam);
    if (dayNameParam) setDayName(dayNameParam);

    // Set default completion time to current time
    const now = new Date();
    setCompletionTime(now.toTimeString().slice(0, 5));
  }, []);

  // Filter branches based on selected company
  const availableBranches = branches.filter(branch => 
    selectedCompany ? branch.companyId === selectedCompany : true
  );

  // Handle file uploads
  const handleFilesUploaded = (files: UploadedFile[]) => {
    setAttachments(prev => [...prev, ...files]);
  };

  const handleFileDeleted = (filePath: string) => {
    setAttachments(prev => prev.filter(file => file.path !== filePath));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only require company, branch, and completion date
    if (!selectedCompany || !selectedBranch || !completionDate) {
      setError('يرجى ملء الحقول المطلوبة: الشركة، الفرع، وتاريخ الإكمال');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Generate visit ID
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const visitId = `VIS-${timestamp}-${random}`;

      // Create completed visit document
      const completedVisitData = {
        visitId,
        type: 'regular',
        status: 'completed',
        companyId: selectedCompany,
        branchId: selectedBranch,
        scheduledDate: scheduledDate || new Date().toISOString(),
        completedDate: completionDate,
        completedTime: completionTime,
        overallStatus,
        issues: issues.length > 0 ? issues : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        nextVisitDate: nextVisitDate || undefined,
        notes: notes || undefined,
        attachments: attachments.map(file => ({
          name: file.name,
          url: file.url,
          path: file.path,
          size: file.size,
          type: file.type
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'مستخدم النظام'
      };

      console.log('📝 Creating completed visit:', completedVisitData);
      
      // Add to visits collection
      const visitRef = await addDoc(collection(db, 'visits'), completedVisitData);
      console.log('✅ Completed visit created with ID:', visitRef.id);

      setSuccess(true);
      
      // Redirect back to planning tab with current week
      setTimeout(() => {
        router.push(`/?tab=planning&week=${currentWeekNumber}&year=${currentYear}`);
      }, 2000);

    } catch (error) {
      console.error('Error creating completed visit:', error);
      setError('فشل في إنشاء الزيارة المكتملة');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    router.push(`/?tab=planning&week=${currentWeekNumber}&year=${currentYear}`);
  };

  // Add issue
  const addIssue = () => {
    if (newIssue.trim()) {
      setIssues(prev => [...prev, newIssue.trim()]);
      setNewIssue('');
    }
  };

  // Remove issue
  const removeIssue = (index: number) => {
    setIssues(prev => prev.filter((_, i) => i !== index));
  };

  // Add recommendation
  const addRecommendation = () => {
    if (newRecommendation.trim()) {
      setRecommendations(prev => [...prev, newRecommendation.trim()]);
      setNewRecommendation('');
    }
  };

  // Remove recommendation
  const removeRecommendation = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  if (companiesLoading || branchesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل البيانات...</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تم إنشاء الزيارة المكتملة بنجاح. سيتم توجيهك إلى صفحة التخطيط...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إكمال زيارة جديدة</h1>
            <p className="text-gray-600 mt-2">
              تسجيل زيارة مكتملة مع تفاصيل الإكمال والنتائج
            </p>
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company and Branch */}
            <Card>
              <CardHeader>
                <CardTitle>الشركة والفرع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company">الشركة *</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(company => (
                        <SelectItem key={company.companyId} value={company.companyId}>
                          {company.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">الفرع *</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map(branch => (
                        <SelectItem key={branch.branchId} value={branch.branchId}>
                          {branch.branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Completion Date and Time */}
            <Card>
              <CardHeader>
                <CardTitle>تاريخ ووقت الإكمال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="completionDate">تاريخ الإكمال *</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="completionTime">وقت الإكمال</Label>
                  <Input
                    id="completionTime"
                    type="time"
                    value={completionTime}
                    onChange={(e) => setCompletionTime(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Status and Next Visit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>حالة الزيارة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="overallStatus">الحالة العامة</Label>
                  <Select value={overallStatus} onValueChange={(value: any) => setOverallStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">ناجحة</SelectItem>
                      <SelectItem value="failed">فاشلة</SelectItem>
                      <SelectItem value="partial">جزئية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nextVisitDate">تاريخ الزيارة القادمة</Label>
                  <Input
                    id="nextVisitDate"
                    type="date"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Issues */}
            <Card>
              <CardHeader>
                <CardTitle>المشاكل المكتشفة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newIssue}
                    onChange={(e) => setNewIssue(e.target.value)}
                    placeholder="أضف مشكلة مكتشفة"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIssue())}
                  />
                  <Button type="button" onClick={addIssue} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {issues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="flex-1 text-sm">{issue}</span>
                      <Button
                        type="button"
                        onClick={() => removeIssue(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>التوصيات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="أضف توصية"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecommendation())}
                />
                <Button type="button" onClick={addRecommendation} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{recommendation}</span>
                    <Button
                      type="button"
                      onClick={() => removeRecommendation(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الإكمال</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أدخل تفاصيل إكمال الزيارة..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>المرفقات</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                onFileDeleted={handleFileDeleted}
                maxFiles={5}
                allowedTypes={['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']}
                folder="completed-visits/attachments"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" onClick={handleGoBack} variant="outline">
              إلغاء
            </Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'جاري الحفظ...' : 'حفظ الزيارة المكتملة'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompletedVisitNewPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <CompletedVisitNewContent />
    </Suspense>
  );
} 