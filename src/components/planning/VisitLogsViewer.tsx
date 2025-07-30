'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, User, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { Visit } from '@/types/customer';

interface VisitLog {
  id: string;
  visitId: string;
  action: 'completed' | 'cancelled' | 'scheduled' | 'in_progress' | 'rescheduled';
  completedAt?: string;
  cancelledAt?: string;
  originalDate?: string;
  branchName?: string;
  companyName?: string;
  contractId?: string;
  status?: string;
  overallStatus?: string;
}

export default function VisitLogsViewer() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [branches, setBranches] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch visits
        const visitsRef = collection(db, 'visits');
        const visitsQuery = query(visitsRef, orderBy('createdAt', 'desc'));
        const visitsSnapshot = await getDocs(visitsQuery);
        
        const visitsData = visitsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Visit[];
        
        setVisits(visitsData);
        
        // Extract unique branch and company IDs
        const branchIds = [...new Set(visitsData.map(visit => visit.branchId))];
        const companyIds = [...new Set(visitsData.map(visit => visit.companyId))];
        
        // Fetch branches
        const branchesMap: Record<string, string> = {};
        for (const branchId of branchIds) {
          try {
            const branchDoc = await getDoc(doc(db, 'branches', branchId));
            if (branchDoc.exists()) {
              branchesMap[branchId] = branchDoc.data().branchName || 'غير محدد';
            } else {
              branchesMap[branchId] = 'غير محدد';
            }
          } catch (error) {
            console.error(`Error fetching branch ${branchId}:`, error);
            branchesMap[branchId] = 'غير محدد';
          }
        }
        setBranches(branchesMap);
        
        // Fetch companies
        const companiesMap: Record<string, string> = {};
        for (const companyId of companyIds) {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', companyId));
            if (companyDoc.exists()) {
              companiesMap[companyId] = companyDoc.data().companyName || 'غير محدد';
            } else {
              companiesMap[companyId] = 'غير محدد';
            }
          } catch (error) {
            console.error(`Error fetching company ${companyId}:`, error);
            companiesMap[companyId] = 'غير محدد';
          }
        }
        setCompanies(companiesMap);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Convert visits to logs format
  const visitLogs = useMemo(() => {
    return visits.map(visit => {
      const log: VisitLog = {
        id: visit.id,
        visitId: visit.visitId || visit.id,
        action: visit.status,
        completedAt: visit.completedDate,
        cancelledAt: visit.status === 'cancelled' ? visit.updatedAt : undefined,
        originalDate: visit.scheduledDate,
        branchName: branches[visit.branchId] || 'غير محدد',
        companyName: companies[visit.companyId] || 'غير محدد',
        contractId: visit.contractId,
        status: visit.status,
        overallStatus: visit.results?.overallStatus
      };
      return log;
    });
  }, [visits, branches, companies]);

  // Filter logs based on search and status
  const filteredLogs = useMemo(() => {
    let filtered = visitLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.visitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.contractId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.action === statusFilter);
    }

    return filtered;
  }, [visitLogs, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'completed': 'مكتملة',
      'cancelled': 'ملغية',
      'scheduled': 'مجدولة',
      'in_progress': 'قيد التنفيذ',
      'rescheduled': 'إعادة جدولة'
    };
    return labels[action] || action;
  };

  const getActionBadgeVariant = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'cancelled': 'destructive',
      'scheduled': 'secondary',
      'in_progress': 'outline',
      'rescheduled': 'outline'
    };
    return variants[action] || 'default';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const exportToCSV = () => {
    const headers = ['Visit ID', 'Action', 'Date', 'Branch', 'Company', 'Contract', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        log.visitId,
        getActionLabel(log.action),
        formatDate(log.completedAt || log.cancelledAt || log.originalDate),
        log.branchName || '',
        log.companyName || '',
        log.contractId || '',
        log.overallStatus || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `visit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            سجلات الزيارات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">جاري تحميل السجلات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          سجلات الزيارات ({filteredLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="البحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="completed">مكتملة</SelectItem>
              <SelectItem value="cancelled">ملغية</SelectItem>
              <SelectItem value="scheduled">مجدولة</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="rescheduled">إعادة جدولة</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير CSV
          </Button>
        </div>

        {/* Logs List */}
        <div className="space-y-1">
          {currentLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-xs whitespace-nowrap">
                      {getActionLabel(log.action)}
                    </Badge>
                    <span className="font-mono text-xs text-gray-600 truncate">{log.visitId}</span>
                    <span className="text-xs text-gray-500 truncate">|</span>
                    <span className="text-xs text-gray-700 truncate">{log.branchName}</span>
                    <span className="text-xs text-gray-500 truncate">|</span>
                    <span className="text-xs text-gray-700 truncate">{log.companyName}</span>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {formatDate(log.completedAt || log.cancelledAt || log.originalDate)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              عرض {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} من {filteredLogs.length} سجل
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                السابق
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                التالي
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد سجلات مطابقة للبحث
          </div>
        )}
      </CardContent>
    </Card>
  );
} 