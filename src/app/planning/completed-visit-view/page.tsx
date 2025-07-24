'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Visit } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileViewer } from '@/components/ui/file-viewer';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

function CompletedVisitViewContent() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId');
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

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
          const visitWithId = {
            id: visitDoc.id,
            ...visitData
          } as Visit;
          setVisit(visitWithId);
          
          // Load branch and company names
          if (visitData.branchId) {
            const branchName = await getBranchName(visitData.branchId);
            setBranchName(branchName);
          }
          if (visitData.companyId) {
            const companyName = await getCompanyName(visitData.companyId);
            setCompanyName(companyName);
          }
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

  // Helper functions to get branch and company names
  const getBranchName = async (branchId: string) => {
    try {
      const branchDoc = await getDoc(doc(db, 'branches', branchId));
      return branchDoc.exists() ? branchDoc.data().name : 'فرع غير معروف';
    } catch (error) {
      console.error('Error loading branch name:', error);
      return 'فرع غير معروف';
    }
  };

  const getCompanyName = async (companyId: string) => {
    try {
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      return companyDoc.exists() ? companyDoc.data().name : 'شركة غير معروفة';
    } catch (error) {
      console.error('Error loading company name:', error);
      return 'شركة غير معروفة';
    }
  };

  // Handle go back
  const handleGoBack = () => {
    window.location.href = '/?tab=planning';
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

  if (error || !visit) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'الزيارة غير موجودة'}</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button onClick={handleGoBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة إلى التخطيط
        </Button>
        
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تقرير زيارة مكتملة</h1>
            <p className="text-gray-600">تفاصيل الزيارة المكتملة والتقرير</p>
          </div>
        </div>
      </div>

      {/* Visit Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>معلومات الزيارة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">رقم الزيارة</Label>
              <p className="text-lg font-semibold">{visit.visitId}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">نوع الزيارة</Label>
              <Badge variant={visit.type === 'emergency' ? 'destructive' : 'default'}>
                {visit.type === 'emergency' ? '🚨 طارئة' : '📅 عادية'}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">الحالة</Label>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✅ مكتملة
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">الفرع</Label>
              <p className="text-lg">{branchName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">الشركة</Label>
              <p className="text-lg">{companyName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">التاريخ المجدول</Label>
              <p className="text-lg">{new Date(visit.scheduledDate).toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">تاريخ الإكمال</Label>
              <p className="text-lg">{visit.completedDate ? new Date(visit.completedDate).toLocaleDateString('en-GB') : 'غير محدد'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تفاصيل الإكمال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <Label className="text-sm font-medium text-gray-700">وقت الإكمال</Label>
                <p className="text-lg">{visit.completedTime || 'غير محدد'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <Label className="text-sm font-medium text-gray-700">مدة الزيارة</Label>
                <p className="text-lg">{visit.duration ? `${visit.duration} ساعة` : 'غير محدد'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <Label className="text-sm font-medium text-gray-700">تم الإكمال بواسطة</Label>
                <p className="text-lg">{visit.updatedBy || 'مستخدم النظام'}</p>
              </div>
            </div>
          </div>

          {visit.notes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">ملاحظات</Label>
              <p className="text-lg mt-1 p-3 bg-gray-50 rounded-lg">{visit.notes}</p>
            </div>
          )}

          {visit.results?.internalNotes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">ملاحظات داخلية</Label>
              <p className="text-lg mt-1 p-3 bg-blue-50 rounded-lg">{visit.results.internalNotes}</p>
            </div>
          )}

          {visit.results?.systemIssues && visit.results.systemIssues.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">مشاكل النظام</Label>
              <div className="mt-2 space-y-2">
                {visit.results.systemIssues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <span className="text-red-600">⚠️</span>
                    <span className="text-sm">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {visit.results?.recommendations && visit.results.recommendations.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">التوصيات</Label>
              <div className="mt-2 space-y-2">
                {visit.results.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <span className="text-blue-600">💡</span>
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {visit.attachments && visit.attachments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>المرفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {visit.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingFile(file)}
                  >
                    عرض
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          isOpen={!!viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper component for labels
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium text-gray-700 ${className}`}>{children}</div>;
}

export default function CompletedVisitViewPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <CompletedVisitViewContent />
    </Suspense>
  );
} 