'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Building, User, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Visit } from '@/types/customer';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';

interface VisitDetailsViewProps {
  visit: Visit;
  onClose: () => void;
}

export function VisitDetailsView({ visit, onClose }: VisitDetailsViewProps) {
  const { companies } = useCompaniesFirebase();
  const { branches } = useBranchesFirebase();

  const company = companies.find(c => c.id === visit.companyId);
  const branch = branches.find(b => b.id === visit.branchId);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'completed': 'مكتملة',
      'cancelled': 'ملغية',
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'rescheduled': 'إعادة جدولة'
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'cancelled': 'destructive',
      'scheduled': 'secondary',
      'in_progress': 'outline',
      'rescheduled': 'outline'
    };
    return variants[status] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'regular': 'عادية',
      'emergency': 'طارئة',
      'followup': 'متابعة'
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getOverallStatusIcon = (status?: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              تفاصيل الزيارة - {visit.visitId}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">حالة الزيارة:</span>
                <Badge variant={getStatusBadgeVariant(visit.status)}>
                  {getStatusLabel(visit.status)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">نوع الزيارة:</span>
                <span className="text-sm">{getTypeLabel(visit.type)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">تاريخ الجدولة:</span>
                <span className="text-sm">{formatDate(visit.scheduledDate)}</span>
              </div>

              {visit.completedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">تاريخ الإكمال:</span>
                  <span className="text-sm">{formatDate(visit.completedDate)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-600">الشركة:</span>
                  <span className="text-sm mr-2">{company?.companyName || 'غير محدد'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-600">الفرع:</span>
                  <span className="text-sm mr-2">{branch?.branchName || 'غير محدد'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-600">رقم العقد:</span>
                  <span className="text-sm mr-2">{visit.contractId}</span>
                </div>
              </div>

              {visit.assignedTechnician && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-600">الفني المسؤول:</span>
                    <span className="text-sm mr-2">{visit.assignedTechnician}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          {visit.services && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">الخدمات المطلوبة</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(visit.services).map(([service, enabled]) => (
                  <div key={service} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">
                      {service === 'fireExtinguisher' && 'صيانة الطفايات'}
                      {service === 'alarmSystem' && 'صيانة نظام الإنذار'}
                      {service === 'fireSuppression' && 'صيانة نظام الإطفاء'}
                      {service === 'gasSystem' && 'نظام الإطفاء بالغاز'}
                      {service === 'foamSystem' && 'نظام الإطفاء بالفوم'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results for completed visits */}
          {visit.status === 'completed' && visit.results && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">نتائج الزيارة</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">الحالة العامة:</span>
                  <div className="flex items-center gap-2">
                    {getOverallStatusIcon(visit.results.overallStatus)}
                    <span className="text-sm">
                      {visit.results.overallStatus === 'passed' && 'نجح'}
                      {visit.results.overallStatus === 'failed' && 'فشل'}
                      {visit.results.overallStatus === 'partial' && 'جزئي'}
                    </span>
                  </div>
                </div>

                {visit.results.issues && visit.results.issues.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-2">المشاكل المكتشفة:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {visit.results.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {visit.results.recommendations && visit.results.recommendations.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-2">التوصيات:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {visit.results.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {visit.results.nextVisitDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">موعد الزيارة القادمة:</span>
                    <span className="text-sm">{formatDate(visit.results.nextVisitDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {visit.notes && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">الملاحظات</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{visit.notes}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {visit.attachments && visit.attachments.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">المرفقات</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visit.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {attachment.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 