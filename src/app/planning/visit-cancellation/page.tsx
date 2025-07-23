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
import { ArrowLeft, Save, X } from 'lucide-react';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

function VisitCancellationContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [justification, setJustification] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [cancelledBy, setCancelledBy] = useState('');
  
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
    
    if (!visit || !justification.trim()) {
      setError('يرجى إدخال مبرر الإلغاء');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Check if visit document exists before updating
      const visitDocRef = doc(db, 'visits', visit.id);
      const visitDoc = await getDoc(visitDocRef);
      
      if (!visitDoc.exists()) {
        console.error('Visit document not found:', visit.id);
        throw new Error(`Visit document does not exist: ${visit.id}`);
      }

      // Update visit status to cancelled
      await updateDoc(visitDocRef, {
        status: 'cancelled',
        notes: `إلغاء الزيارة: ${justification}${suggestedDate ? ` - تاريخ مقترح: ${suggestedDate}` : ''}`,
        updatedAt: new Date()
      });

      // Log the cancellation to Firestore
      const cancellationLog = {
        visitId: visit.id,
        cancelledAt: new Date().toISOString(),
        cancelledBy: cancelledBy || 'مستخدم النظام',
        justification,
        suggestedDate: suggestedDate || null,
        originalDate: visit.scheduledDate,
        branchId: visit.branchId,
        companyId: visit.companyId,
        action: 'cancelled'
      };

      // Save cancellation log to Firestore
      try {
        await addDoc(collection(db, 'visitLogs'), cancellationLog);
        console.log('Visit cancellation logged to Firestore:', cancellationLog);
      } catch (error) {
        console.error('Error logging cancellation:', error);
      }

      setSuccess(true);
      
      // Redirect back to weekly planner after 2 seconds
      setTimeout(() => {
        window.location.href = '/planning?tab=weekly';
      }, 2000);

    } catch (error) {
      console.error('Error cancelling visit:', error);
      setError('فشل في إلغاء الزيارة');
    } finally {
      setSaving(false);
    }
  };

  // Handle go back
  const handleGoBack = () => {
    window.location.href = '/planning?tab=weekly';
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
          <X className="h-4 w-4" />
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
          <AlertDescription>
            تم إلغاء الزيارة بنجاح. سيتم توجيهك إلى صفحة التخطيط...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
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
        
        <h1 className="text-2xl font-bold text-gray-900">إلغاء زيارة</h1>
        <p className="text-gray-600 mt-2">إلغاء زيارة مجدولة مع إدخال المبرر</p>
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
            <p className="text-lg">{new Date(visit.scheduledDate).toLocaleDateString('ar-SA')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Form */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الإلغاء</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="justification" className="text-sm font-medium text-gray-700">
                مبرر الإلغاء *
              </Label>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="يرجى إدخال مبرر إلغاء الزيارة..."
                className="mt-1"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="suggestedDate" className="text-sm font-medium text-gray-700">
                تاريخ مقترح للزيارة (اختياري)
              </Label>
              <Input
                id="suggestedDate"
                type="date"
                value={suggestedDate}
                onChange={(e) => setSuggestedDate(e.target.value)}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-sm text-gray-500 mt-1">
                إذا كنت ترغب في اقتراح تاريخ جديد للزيارة
              </p>
            </div>

            <div>
              <Label htmlFor="cancelledBy" className="text-sm font-medium text-gray-700">
                تم الإلغاء بواسطة
              </Label>
              <Input
                id="cancelledBy"
                type="text"
                value={cancelledBy}
                onChange={(e) => setCancelledBy(e.target.value)}
                placeholder="اسم الشخص الذي قام بالإلغاء"
                className="mt-1"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !justification.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'جاري الإلغاء...' : 'إلغاء الزيارة'}
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

export default function VisitCancellationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل...</div>
        </div>
      </div>
    }>
      <VisitCancellationContent />
    </Suspense>
  );
} 