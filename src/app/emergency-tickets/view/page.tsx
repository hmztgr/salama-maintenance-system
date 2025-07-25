'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertTriangle, Calendar, Clock, User, Phone, MapPin, FileText } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';
import { FileViewer } from '@/components/ui/file-viewer';

interface EmergencyTicket {
  id: string;
  emergencyTicketNumber: string;
  type: 'emergency';
  status: 'open' | 'closed' | 'in_progress';
  scheduledDate: string;
  scheduledTime?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customerComplaints: string[];
  reportedBy: string;
  contactNumber: string;
  branchId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  attachments?: Array<{
    name: string;
    url: string;
    path: string;
    size: number;
    type: string;
  }>;
}

function EmergencyTicketViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ticketId = searchParams.get('ticketId');
  
  const [ticket, setTicket] = useState<EmergencyTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<any | null>(null);

  // Data hooks
  const { companies, loading: companiesLoading } = useCompaniesFirebase();
  const { branches, loading: branchesLoading } = useBranchesFirebase();

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) {
        setError('معرف التذكرة مطلوب');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const ticketDoc = await getDoc(doc(db, 'visits', ticketId));
        if (ticketDoc.exists()) {
          const ticketData = {
            id: ticketDoc.id,
            ...ticketDoc.data()
          } as EmergencyTicket;
          setTicket(ticketData);

          // Load branch and company names
          if (ticketData.branchId) {
            const branch = branches.find(b => b.branchId === ticketData.branchId);
            setBranchName(branch?.branchName || 'فرع غير محدد');
          }
          if (ticketData.companyId) {
            const company = companies.find(c => c.companyId === ticketData.companyId);
            setCompanyName(company?.companyName || 'شركة غير محددة');
          }
        } else {
          setError('التذكرة غير موجودة');
        }
      } catch (error) {
        console.error('Error loading ticket:', error);
        setError('فشل في تحميل بيانات التذكرة');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId, branches, companies]);

  const handleGoBack = () => {
    router.push('/?tab=emergency-tickets');
  };

  const handleCreateCompletion = () => {
    if (ticket) {
      router.push(`/planning/visit-completion?visitId=${ticket.id}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateValue: any) => {
    try {
      if (!dateValue) return 'غير متوفر';
      let date: Date;
      // Firestore Timestamp object
      if (typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
      } else {
        date = new Date(dateValue);
      }
      if (isNaN(date.getTime())) return 'غير متوفر';
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'غير متوفر';
    }
  };

  if (loading || companiesLoading || branchesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل بيانات التذكرة...</div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || 'التذكرة غير موجودة'}</AlertDescription>
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
          العودة إلى التذاكر الطارئة
        </Button>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">تفاصيل التذكرة الطارئة</h1>
              <p className="text-gray-600">عرض تفاصيل التذكرة الطارئة</p>
            </div>
          </div>
          {ticket.status === 'open' && (
            <Button 
              onClick={handleCreateCompletion}
              className="bg-green-600 hover:bg-green-700"
            >
              إكمال الزيارة
            </Button>
          )}
        </div>
      </div>

      {/* Ticket Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {ticket.emergencyTicketNumber}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority === 'critical' ? 'حرج' :
                     ticket.priority === 'high' ? 'عالي' :
                     ticket.priority === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status === 'open' ? 'مفتوح' :
                     ticket.status === 'in_progress' ? 'قيد التنفيذ' : 'مغلق'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">تاريخ البلاغ:</span>
                  <span className="font-medium">{formatDate(ticket.scheduledDate)}</span>
                </div>
                {ticket.scheduledTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">وقت البلاغ:</span>
                    <span className="font-medium">{ticket.scheduledTime}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Complaints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                شكاوى العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ticket.customerComplaints.map((complaint, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{complaint}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>المرفقات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingFile(attachment)}
                      >
                        عرض
                      </Button>
                    </div>
                  ))}
                </div>
                <FileViewer
                  file={viewingFile}
                  isOpen={!!viewingFile}
                  onClose={() => setViewingFile(null)}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                معلومات الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">الشركة:</span>
                <p className="font-medium">{companyName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">الفرع:</span>
                <p className="font-medium">{branchName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-600">أبلغ عن طريق:</span>
                  <p className="font-medium">{ticket.reportedBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm text-gray-600">رقم الاتصال:</span>
                  <p className="font-medium">{ticket.contactNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات النظام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                <p className="font-medium">{formatDate(ticket.createdAt)}</p>
              </div>
              {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                <div>
                  <span className="text-sm text-gray-600">آخر تحديث:</span>
                  <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">أنشئ بواسطة:</span>
                <p className="font-medium">{!ticket.createdBy || ticket.createdBy === 'مستخدم النظام' ? 'غير متوفر' : ticket.createdBy}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyTicketViewPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <EmergencyTicketViewContent />
    </Suspense>
  );
} 