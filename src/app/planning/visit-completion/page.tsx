'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Visit } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function VisitCompletionContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [completionDate, setCompletionDate] = useState('');
  const [completionTime, setCompletionTime] = useState('');
  const [duration, setDuration] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [servicesCompleted, setServicesCompleted] = useState('');
  const [results, setResults] = useState('');
  const [completedBy, setCompletedBy] = useState('');

  // Load visit data
  useEffect(() => {
    const loadVisit = async () => {
      if (!visitId) {
        setError('معرف الزيارة مطلوب');
        setLoading(false);
        return;
      }

      try {
        const visitDoc = await getDoc(doc(db, 'visits', visitId));
        if (visitDoc.exists()) {
          const visitData = visitDoc.data();
          setVisit({
            id: visitDoc.id,
            ...visitData
          } as Visit);
          
          // Set default completion date to today
          const today = new Date().toISOString().split('T')[0];
          setCompletionDate(today);
        } else {
          setError('الزيارة غير موجودة');
        }
      } catch (error) {
        console.error('Error loading visit:', error);
        setError('فشل في تحميل بيانات الزيارة');
      } finally {
        setLoading(false);
      }
    };

    loadVisit();
  }, [visitId]);

  // Get branch and company names (simplified for now)
  const getBranchName = (branchId: string) => {
    return 'فرع غير محدد';
  };

  const getCompanyName = (companyId: string) => {
    return 'شركة غير محددة';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visit || !completionDate || !technicianNotes.trim()) {
      setError('يرجى إدخال التاريخ وملاحظات الفني');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if visit document exists before updating
      const visitDocRef = doc(db, 'visits', visit.id);
      const visitDoc = await getDoc(visitDocRef);
      
      if (!visitDoc.exists()) {
        throw new Error('Visit document does not exist');
      }

      // Update visit status to completed
      await updateDoc(visitDocRef, {
        status: 'completed',
        completedDate: completionDate,
        completedTime: completionTime || null,
        duration: duration || null,
        notes: technicianNotes,
        results: results || null,
        services: servicesCompleted || null,
        updatedAt: new Date(),
        updatedBy: completedBy || 'مستخدم النظام'
      });

      // Log the completion
      const completionLog = {
        visitId: visit.id,
        completedAt: new Date().toISOString(),
        completedBy: completedBy || 'مستخدم النظام',
        completionDate,
        completionTime,
        duration,
        notes: technicianNotes,
        results,
        services: servicesCompleted
      };

      console.log('Visit completion logged:', completionLog);

      setSuccess(true);
      
      // Redirect back to weekly planner after 2 seconds
      setTimeout(() => {
        window.location.href = '/planning?tab=weekly';
      }, 2000);

    } catch (error) {
      console.error('Error completing visit:', error);
      setError('فشل في إكمال الزيارة');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل بيانات الزيارة...</div>
        </div>
      </div>
    );
  }

  if (error && !visit) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            تم إكمال الزيارة بنجاح. سيتم توجيهك إلى صفحة التخطيط...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>الزيارة غير موجودة</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
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
        
        <h1 className="text-2xl font-bold text-gray-900">إكمال زيارة</h1>
        <p className="text-gray-600 mt-2">تسجيل إكمال زيارة مع التقرير</p>
      </div>

      {/* Visit Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>معلومات الزيارة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">رقم الزيارة</Label>
              <p className="text-lg font-semibold">{visit.visitId}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">نوع الزيارة</Label>
              <p className="text-lg">
                {visit.type === 'emergency' ? '🚨 طارئة' : '📅 عادية'}
              </p>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">الفرع</Label>
            <p className="text-lg">{getBranchName(visit.branchId)}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">الشركة</Label>
            <p className="text-lg">{getCompanyName(visit.companyId)}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">التاريخ المجدول</Label>
            <p className="text-lg">{new Date(visit.scheduledDate).toLocaleDateString('en-GB')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Form */}
      <Card>
        <CardHeader>
          <CardTitle>تقرير الإكمال</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="completionDate" className="text-sm font-medium text-gray-700">
                  تاريخ الإكمال *
                </Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="completionTime" className="text-sm font-medium text-gray-700">
                  وقت الإكمال
                </Label>
                <Input
                  id="completionTime"
                  type="time"
                  value={completionTime}
                  onChange={(e) => setCompletionTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                مدة الزيارة (بالساعات)
              </Label>
              <Input
                id="duration"
                type="number"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1"
                placeholder="مثال: 2.5"
              />
            </div>

            <div>
              <Label htmlFor="technicianNotes" className="text-sm font-medium text-gray-700">
                ملاحظات الفني *
              </Label>
              <Textarea
                id="technicianNotes"
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                placeholder="تفاصيل العمل المنجز والملاحظات..."
                className="mt-1"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="servicesCompleted" className="text-sm font-medium text-gray-700">
                الخدمات المنجزة
              </Label>
              <Textarea
                id="servicesCompleted"
                value={servicesCompleted}
                onChange={(e) => setServicesCompleted(e.target.value)}
                placeholder="قائمة الخدمات التي تم إنجازها..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="results" className="text-sm font-medium text-gray-700">
                النتائج والتوصيات
              </Label>
              <Textarea
                id="results"
                value={results}
                onChange={(e) => setResults(e.target.value)}
                placeholder="النتائج والتوصيات للمتابعة..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="completedBy" className="text-sm font-medium text-gray-700">
                تم الإكمال بواسطة
              </Label>
              <Input
                id="completedBy"
                type="text"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
                placeholder="اسم الفني أو المسؤول"
                className="mt-1"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !completionDate || !technicianNotes.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'جاري الإكمال...' : 'إكمال الزيارة'}
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

export default function VisitCompletionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل...</div>
        </div>
      </div>
    }>
      <VisitCompletionContent />
    </Suspense>
  );
} 