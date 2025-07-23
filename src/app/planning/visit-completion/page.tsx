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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, CheckCircle, Plus, X } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileUpload } from '@/components/common/FileUpload';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

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
  const [servicesCompleted, setServicesCompleted] = useState('');
  const [systemIssues, setSystemIssues] = useState<string[]>([]);
  const [newSystemIssue, setNewSystemIssue] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [completedBy, setCompletedBy] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [users, setUsers] = useState<Array<{id: string, fullName: string, email: string}>>([]);

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

  // Load users for dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            fullName: data.fullName || data.displayName || 'مستخدم غير محدد',
            email: data.email || 'unknown@example.com'
          };
        }).filter(user => user.fullName !== 'مستخدم غير محدد');
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, []);

  // Set current time when form loads
  useEffect(() => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM format
    setCompletionTime(timeString);
  }, []);

  // Add system issue
  const addSystemIssue = () => {
    if (newSystemIssue.trim()) {
      setSystemIssues(prev => [...prev, newSystemIssue.trim()]);
      setNewSystemIssue('');
    }
  };

  // Remove system issue
  const removeSystemIssue = (index: number) => {
    setSystemIssues(prev => prev.filter((_, i) => i !== index));
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visit || !completionDate) {
      setError('يرجى إدخال تاريخ الإكمال');
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
        notes: servicesCompleted,
        results: {
          systemIssues: systemIssues.length > 0 ? systemIssues : undefined,
          recommendations: recommendations.length > 0 ? recommendations : undefined,
          internalNotes: internalNotes || undefined
        },
        attachments: attachments,
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
        notes: servicesCompleted,
        systemIssues,
        recommendations,
        internalNotes
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
              <Label className="text-sm font-medium text-gray-700">
                مشاكل النظام
              </Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  onClick={addSystemIssue}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  value={newSystemIssue}
                  onChange={(e) => setNewSystemIssue(e.target.value)}
                  placeholder="اكتب مشكلة النظام"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSystemIssue())}
                />
              </div>
              {systemIssues.length > 0 && (
                <div className="space-y-2 mt-2">
                  {systemIssues.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                      <Button
                        type="button"
                        onClick={() => removeSystemIssue(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <span className="text-sm flex-1 mr-2">{issue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="servicesCompleted" className="text-sm font-medium text-gray-700">
                ملاحظات
              </Label>
              <Textarea
                id="servicesCompleted"
                value={servicesCompleted}
                onChange={(e) => setServicesCompleted(e.target.value)}
                placeholder="تفاصيل العمل المنجز والملاحظات..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                النتائج والتوصيات
              </Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  onClick={addRecommendation}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Input
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  placeholder="اكتب التوصية"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRecommendation())}
                />
              </div>
              {recommendations.length > 0 && (
                <div className="space-y-2 mt-2">
                  {recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                      <Button
                        type="button"
                        onClick={() => removeRecommendation(index)}
                        size="sm"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <span className="text-sm flex-1 mr-2">{recommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="internalNotes" className="text-sm font-medium text-gray-700">
                ملاحظات داخلية
              </Label>
              <Textarea
                id="internalNotes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="ملاحظات داخلية للفريق..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="completedBy" className="text-sm font-medium text-gray-700">
                تم الإكمال بواسطة
              </Label>
              <Select value={completedBy} onValueChange={setCompletedBy}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المستخدم" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.fullName}>
                      {user.fullName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                المرفقات
              </Label>
              <FileUpload
                onFilesUploaded={setAttachments}
                onFileDeleted={(filePath) => {
                  setAttachments(prev => prev.filter(file => file.path !== filePath));
                }}
                existingFiles={[]}
                folder={`visits/${visit?.id}`}
                maxFiles={10}
                maxSize={25}
                allowedTypes={['image', 'pdf', 'doc', 'docx']}
                accept="image/*,.pdf,.doc,.docx"
                multiple={true}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving || !completionDate}
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