'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';

function PlannedVisitContent() {
  const searchParams = useSearchParams();
  const scheduledDate = searchParams.get('date');
  const dayIndex = searchParams.get('day');
  const dayName = searchParams.get('dayName');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [notes, setNotes] = useState('');
  
  // Data
  const { companies, loading: companiesLoading } = useCompaniesFirebase();
  const { branches, loading: branchesLoading } = useBranchesFirebase();
  const [availableBranches, setAvailableBranches] = useState<Array<{branchId: string, branchName: string}>>([]);

  // Filter branches based on selected company
  useEffect(() => {
    if (selectedCompany && branches.length > 0) {
      const companyBranches = branches.filter(branch => branch.companyId === selectedCompany);
      setAvailableBranches(companyBranches);
      // Reset branch selection if current branch is not available for selected company
      if (selectedBranch && !companyBranches.find(b => b.branchId === selectedBranch)) {
        setSelectedBranch('');
      }
    } else {
      setAvailableBranches([]);
      setSelectedBranch('');
    }
  }, [selectedCompany, branches, selectedBranch]);

  // Generate visit ID
  const generateVisitId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `VIS-${timestamp}-${random}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany || !selectedBranch) {
      setError('يرجى اختيار الشركة والفرع');
      return;
    }

    if (!scheduledDate) {
      setError('تاريخ الزيارة مطلوب');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const visitData = {
        visitId: generateVisitId(),
        companyId: selectedCompany,
        branchId: selectedBranch,
        type: 'scheduled',
        status: 'scheduled',
        scheduledDate: new Date(scheduledDate).toISOString(),
        dayOfWeek: dayIndex ? parseInt(dayIndex) : 0,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user' // Get from auth context
      };

      // Add visit to Firestore
      const visitRef = await addDoc(collection(db, 'visits'), visitData);
      
      console.log('✅ Planned visit created successfully:', visitRef.id);
      
      setSuccess(true);
      
      // Redirect back to weekly planner after 2 seconds
      setTimeout(() => {
        window.location.href = '/?tab=planning';
      }, 2000);

    } catch (error) {
      console.error('Error creating planned visit:', error);
      setError('فشل في إنشاء الزيارة المخططة');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    window.location.href = '/?tab=planning';
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
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            تم إنشاء الزيارة المخططة بنجاح. سيتم توجيهك إلى صفحة التخطيط...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Button onClick={handleGoBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة إلى التخطيط
        </Button>
        
        <h1 className="text-2xl font-bold text-gray-900">إضافة زيارة مخططة</h1>
        <p className="text-gray-600 mt-2">إنشاء زيارة مخططة جديدة</p>
        
        {scheduledDate && dayName && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>التاريخ:</strong> {new Date(scheduledDate).toLocaleDateString('en-GB')} ({dayName})
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الزيارة المخططة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                الشركة *
              </Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="mt-1">
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
              <Label htmlFor="branch" className="text-sm font-medium text-gray-700">
                الفرع *
              </Label>
              <Select 
                value={selectedBranch} 
                onValueChange={setSelectedBranch}
                disabled={!selectedCompany}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={selectedCompany ? "اختر الفرع" : "اختر الشركة أولاً"} />
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

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                ملاحظات
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات إضافية حول الزيارة"
                className="mt-1"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !selectedCompany || !selectedBranch}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'جاري الإنشاء...' : 'إنشاء الزيارة المخططة'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={saving}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PlannedVisitPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <PlannedVisitContent />
    </Suspense>
  );
} 