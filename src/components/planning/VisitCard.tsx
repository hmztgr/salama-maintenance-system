'use client';

import { Visit } from '@/types/customer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users, FileText } from 'lucide-react';

export interface VisitCardProps {
  visit: Visit;
  companyName: string;
  branchName: string;
  contractInfo: string;
  onClick: () => void;
  className?: string;
}

export function VisitCard({
  visit,
  companyName,
  branchName,
  contractInfo,
  onClick,
  className = ''
}: VisitCardProps) {
  const getStatusColor = (status: Visit['status']): string => {
    const statusColors = {
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-300',
      'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'completed': 'bg-green-100 text-green-800 border-green-300',
      'cancelled': 'bg-red-100 text-red-800 border-red-300',
      'rescheduled': 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status: Visit['status']): string => {
    const statusTexts = {
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتملة',
      'cancelled': 'ملغية',
      'rescheduled': 'معاد جدولتها'
    };
    return statusTexts[status] || status;
  };

  const getTypeIcon = (type: Visit['type']): string => {
    const typeIcons = {
      'regular': '🔧',
      'emergency': '🚨',
      'followup': '📋'
    };
    return typeIcons[type] || '🔧';
  };

  const getTypeText = (type: Visit['type']): string => {
    const typeTexts = {
      'regular': 'عادية',
      'emergency': 'طارئة',
      'followup': 'متابعة'
    };
    return typeTexts[type] || type;
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all duration-200 border ${getStatusColor(visit.status)} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon(visit.type)}</span>
              <div>
                <div className="font-bold text-sm">{visit.visitId}</div>
                <Badge variant="secondary" className="text-xs">
                  {getTypeText(visit.type)}
                </Badge>
              </div>
            </div>
            <Badge className={`text-xs ${getStatusColor(visit.status)}`}>
              {getStatusText(visit.status)}
            </Badge>
          </div>

          {/* Company and Branch Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="font-medium text-sm">{companyName}</span>
            </div>
            <div className="text-xs text-gray-600 mr-4">{branchName}</div>
            <div className="text-xs text-gray-500 mr-4">{contractInfo}</div>
          </div>

          {/* Time and Team */}
          <div className="space-y-1">
            {visit.scheduledTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs">{visit.scheduledTime}</span>
                {visit.duration && (
                  <span className="text-xs text-gray-500">({visit.duration} دقيقة)</span>
                )}
              </div>
            )}

            {visit.assignedTeam && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-xs">{visit.assignedTeam}</span>
              </div>
            )}

            {visit.assignedTechnician && (
              <div className="text-xs text-gray-600 mr-4">
                التقني: {visit.assignedTechnician}
              </div>
            )}
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-1">
            {visit.services.fireExtinguisher && (
              <Badge variant="outline" className="text-xs">🧯 طفايات</Badge>
            )}
            {visit.services.alarmSystem && (
              <Badge variant="outline" className="text-xs">⚠️ إنذار</Badge>
            )}
            {visit.services.fireSuppression && (
              <Badge variant="outline" className="text-xs">💧 إطفاء</Badge>
            )}
            {visit.services.gasSystem && (
              <Badge variant="outline" className="text-xs">🟦 غاز</Badge>
            )}
            {visit.services.foamSystem && (
              <Badge variant="outline" className="text-xs">🟢 فوم</Badge>
            )}
          </div>

          {/* Notes */}
          {visit.notes && (
            <div className="flex items-start gap-1">
              <FileText className="w-3 h-3 text-gray-500 mt-0.5" />
              <span className="text-xs text-gray-600 line-clamp-2">{visit.notes}</span>
            </div>
          )}

          {/* Results Summary for Completed Visits */}
          {visit.status === 'completed' && visit.results && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">النتيجة:</span>
                <Badge
                  variant={visit.results.overallStatus === 'passed' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {visit.results.overallStatus === 'passed' ? '✅ نجح' :
                   visit.results.overallStatus === 'failed' ? '❌ فشل' : '⚠️ جزئي'}
                </Badge>
              </div>
              {visit.results.issues && visit.results.issues.length > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  {visit.results.issues.length} مشكلة مكتشفة
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
