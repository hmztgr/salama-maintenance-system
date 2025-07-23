'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, User, Building } from 'lucide-react';

interface VisitLog {
  id: string;
  visitId: string;
  action: 'completed' | 'cancelled';
  completedAt?: string;
  cancelledAt?: string;
  completedBy?: string;
  cancelledBy?: string;
  completionDate?: string;
  completionTime?: string;
  duration?: string;
  notes?: string;
  systemIssues?: string[];
  recommendations?: string[];
  internalNotes?: string;
  justification?: string;
  suggestedDate?: string;
  originalDate?: string;
  branchId?: string;
  companyId?: string;
  branchName?: string;
  companyName?: string;
}

export function VisitLogsViewer() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Load visit logs
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const logsQuery = query(
          collection(db, 'visitLogs'),
          orderBy('completedAt', 'desc')
        );

        const querySnapshot = await getDocs(logsQuery);
        const logsData: VisitLog[] = [];

        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const log: VisitLog = {
            id: doc.id,
            ...data
          };

          // Load branch and company names if not already present
          if (data.branchId && !data.branchName) {
            try {
              const branchDoc = await getDocs(query(collection(db, 'branches'), where('__name__', '==', data.branchId)));
              if (!branchDoc.empty) {
                log.branchName = branchDoc.docs[0].data().branchName;
              }
            } catch (error) {
              console.error('Error loading branch name:', error);
            }
          }

          if (data.companyId && !data.companyName) {
            try {
              const companyDoc = await getDocs(query(collection(db, 'companies'), where('__name__', '==', data.companyId)));
              if (!companyDoc.empty) {
                log.companyName = companyDoc.docs[0].data().companyName;
              }
            } catch (error) {
              console.error('Error loading company name:', error);
            }
          }

          logsData.push(log);
        }

        setLogs(logsData);
      } catch (err) {
        console.error('Error loading visit logs:', err);
        setError('فشل في تحميل سجلات الزيارات');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  // Filter logs based on search criteria
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          log.visitId?.toLowerCase().includes(searchLower) ||
          log.branchName?.toLowerCase().includes(searchLower) ||
          log.companyName?.toLowerCase().includes(searchLower) ||
          log.completedBy?.toLowerCase().includes(searchLower) ||
          log.cancelledBy?.toLowerCase().includes(searchLower) ||
          log.notes?.toLowerCase().includes(searchLower) ||
          log.justification?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Date filter
      if (dateFilter) {
        const logDate = log.completedAt || log.cancelledAt;
        if (logDate) {
          const logDateStr = new Date(logDate).toISOString().split('T')[0];
          if (logDateStr !== dateFilter) return false;
        }
      }

      // User filter
      if (userFilter) {
        const user = log.completedBy || log.cancelledBy;
        if (!user?.toLowerCase().includes(userFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, actionFilter, dateFilter, userFilter]);

  // Export logs to CSV
  const exportToCSV = () => {
    const headers = [
      'Visit ID',
      'Action',
      'Date',
      'Time',
      'User',
      'Branch',
      'Company',
      'Duration',
      'Notes',
      'System Issues',
      'Recommendations',
      'Internal Notes',
      'Justification',
      'Suggested Date'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.visitId,
        log.action,
        log.completionDate || log.cancelledAt?.split('T')[0] || '',
        log.completionTime || '',
        log.completedBy || log.cancelledBy || '',
        log.branchName || '',
        log.companyName || '',
        log.duration || '',
        log.notes || '',
        log.systemIssues?.join('; ') || '',
        log.recommendations?.join('; ') || '',
        log.internalNotes || '',
        log.justification || '',
        log.suggestedDate || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري تحميل سجلات الزيارات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">سجلات الزيارات</h2>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          تصدير CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلاتر البحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium">بحث</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في المعرف، الفرع، الشركة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Filter */}
            <div>
              <label className="text-sm font-medium">نوع الإجراء</label>
              <Select value={actionFilter} onValueChange={(value: any) => setActionFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الإجراءات</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="text-sm font-medium">التاريخ</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label className="text-sm font-medium">المستخدم</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="اسم المستخدم..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          تم العثور على {filteredLogs.length} سجل من أصل {logs.length}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchTerm('');
            setActionFilter('all');
            setDateFilter('');
            setUserFilter('');
          }}
        >
          مسح الفلاتر
        </Button>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant={log.action === 'completed' ? 'default' : 'destructive'}>
                    {log.action === 'completed' ? '✅ مكتملة' : '❌ ملغية'}
                  </Badge>
                  <span className="font-mono text-sm text-gray-600">{log.visitId}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(log.completedAt || log.cancelledAt || '')}
                  {log.completionTime && ` - ${formatTime(log.completionTime)}`}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Building className="h-4 w-4" />
                    <span>الفرع:</span>
                  </div>
                  <p className="font-medium">{log.branchName || 'غير محدد'}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Building className="h-4 w-4" />
                    <span>الشركة:</span>
                  </div>
                  <p className="font-medium">{log.companyName || 'غير محددة'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <User className="h-4 w-4" />
                <span>بواسطة:</span>
                <span className="font-medium">{log.completedBy || log.cancelledBy || 'غير محدد'}</span>
              </div>

              {log.duration && (
                <div className="text-sm text-gray-600 mb-2">
                  المدة: {log.duration} ساعة
                </div>
              )}

              {log.notes && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">الملاحظات:</div>
                  <p className="text-sm text-gray-600">{log.notes}</p>
                </div>
              )}

              {log.justification && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">سبب الإلغاء:</div>
                  <p className="text-sm text-gray-600">{log.justification}</p>
                </div>
              )}

              {log.systemIssues && log.systemIssues.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">مشاكل النظام:</div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {log.systemIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {log.recommendations && log.recommendations.length > 0 && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">التوصيات:</div>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {log.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {log.internalNotes && (
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-700 mb-1">ملاحظات داخلية:</div>
                  <p className="text-sm text-gray-600">{log.internalNotes}</p>
                </div>
              )}

              {log.suggestedDate && (
                <div className="text-sm text-gray-600">
                  التاريخ المقترح: {formatDate(log.suggestedDate)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          لا توجد سجلات تطابق معايير البحث
        </div>
      )}
    </div>
  );
} 