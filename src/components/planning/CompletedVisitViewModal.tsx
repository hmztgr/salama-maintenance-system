'use client';

import React, { useState, useEffect } from 'react';
import { Visit } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FileViewer } from '@/components/ui/file-viewer';
import { UploadedFile } from '@/hooks/useFirebaseStorage';

interface CompletedVisitViewModalProps {
  visit: Visit;
  isOpen: boolean;
  onClose: () => void;
}

export function CompletedVisitViewModal({ visit, isOpen, onClose }: CompletedVisitViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<UploadedFile | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  // Load branch and company names
  useEffect(() => {
    const loadNames = async () => {
      if (!visit) return;
      
      setLoading(true);
      try {
        // Load branch name
        if (visit.branchId) {
          const branchDoc = await getDoc(doc(db, 'branches', visit.branchId));
          if (branchDoc.exists()) {
            const branchData = branchDoc.data();
            setBranchName(branchData.branchName || branchData.name || 'فرع غير معروف');
          } else {
            setBranchName('فرع غير معروف');
          }
        }

        // Load company name
        if (visit.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', visit.companyId));
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            setCompanyName(companyData.companyName || companyData.name || 'شركة غير معروفة');
          } else {
            setCompanyName('شركة غير معروفة');
          }
        }
      } catch (error) {
        console.error('Error loading names:', error);
        setError('فشل في تحميل بيانات الشركة والفرع');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && visit) {
      loadNames();
    }
  }, [visit, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تقرير زيارة مكتملة</h1>
                <p className="text-gray-600">تفاصيل الزيارة المكتملة والتقرير</p>
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Visit Information */}
          <Card>
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
                  <p className="text-lg">{formatDate(visit.scheduledDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">تاريخ الإكمال</Label>
                  <p className="text-lg">{visit.completedDate ? formatDate(visit.completedDate) : 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Details */}
          <Card>
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

              {visit.results?.overallStatus && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">الحالة العامة</Label>
                  <Badge 
                    variant={
                      visit.results.overallStatus === 'passed' ? 'default' :
                      visit.results.overallStatus === 'failed' ? 'destructive' : 'secondary'
                    }
                    className={
                      visit.results.overallStatus === 'passed' ? 'bg-green-100 text-green-800' :
                      visit.results.overallStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {visit.results.overallStatus === 'passed' ? '✅ ناجحة' :
                     visit.results.overallStatus === 'failed' ? '❌ فاشلة' : '⚠️ جزئية'}
                  </Badge>
                </div>
              )}

              {visit.results?.issues && visit.results.issues.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">المشاكل المكتشفة</Label>
                  <div className="mt-2 space-y-2">
                    {visit.results.issues.map((issue: string, index: number) => (
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

              {visit.results?.nextVisitDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">تاريخ الزيارة القادمة</Label>
                  <p className="text-lg">{formatDate(visit.results.nextVisitDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {visit.attachments && visit.attachments.length > 0 && (
            <Card>
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
        </div>

        {/* File Viewer Modal */}
        {viewingFile && (
          <FileViewer
            file={viewingFile}
            isOpen={!!viewingFile}
            onClose={() => setViewingFile(null)}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to format date
function formatDate(dateStr?: string) {
  if (!dateStr) return 'غير محدد';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
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