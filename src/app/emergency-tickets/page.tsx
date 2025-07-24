'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Eye, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCompaniesFirebase } from '@/hooks/useCompaniesFirebase';
import { useBranchesFirebase } from '@/hooks/useBranchesFirebase';

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
}

function EmergencyTicketsContent() {
  const [tickets, setTickets] = useState<EmergencyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'in_progress'>('open');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data
  const { companies, loading: companiesLoading } = useCompaniesFirebase();
  const { branches, loading: branchesLoading } = useBranchesFirebase();

  // Load emergency tickets
  useEffect(() => {
    const loadEmergencyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let ticketsQuery = query(
          collection(db, 'visits'),
          where('type', '==', 'emergency'),
          orderBy('createdAt', 'desc')
        );

        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsData = ticketsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmergencyTicket[];

        setTickets(ticketsData);
      } catch (error) {
        console.error('Error loading emergency tickets:', error);
        setError(`فشل في تحميل التذاكر الطارئة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyTickets();
  }, []);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    // Status filter
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    
    // Priority filter
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    
    // Company filter
    if (companyFilter !== 'all' && ticket.companyId !== companyFilter) return false;
    
    // Branch filter
    if (branchFilter !== 'all' && ticket.branchId !== branchFilter) return false;
    
    // Date range filter
    if (startDate && new Date(ticket.scheduledDate) < new Date(startDate)) return false;
    if (endDate && new Date(ticket.scheduledDate) > new Date(endDate)) return false;
    
    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const company = companies.find(c => c.companyId === ticket.companyId);
      const branch = branches.find(b => b.branchId === ticket.branchId);
      const searchText = `${ticket.emergencyTicketNumber} ${company?.companyName || ''} ${branch?.branchName || ''} ${ticket.reportedBy} ${ticket.customerComplaints.join(' ')}`.toLowerCase();
      if (!searchText.includes(searchLower)) return false;
    }
    
    return true;
  });

  // Get company name
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.companyId === companyId);
    return company?.companyName || 'شركة غير معروفة';
  };

  // Get branch name
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.branchId === branchId);
    return branch?.branchName || 'فرع غير معروف';
  };

  // Handle go back
  const handleGoBack = () => {
    window.location.href = '/?tab=planning';
  };

  // Handle view ticket
  const handleViewTicket = (ticket: EmergencyTicket) => {
    window.location.href = `/emergency-tickets/view?ticketId=${ticket.id}`;
  };

  // Handle create completion visit
  const handleCreateCompletion = (ticket: EmergencyTicket) => {
    window.location.href = `/planning/visit-completion?visitId=${ticket.id}`;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 border-red-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading || companiesLoading || branchesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري تحميل التذاكر الطارئة...</div>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button onClick={handleGoBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          العودة إلى التخطيط
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة التذاكر الطارئة</h1>
            <p className="text-gray-600">عرض وإدارة جميع التذاكر الطارئة</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tickets.filter(t => t.status === 'open').length}
                </div>
                <div className="text-sm text-gray-600">تذاكر مفتوحة</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">قيد التنفيذ</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'closed').length}
                </div>
                <div className="text-sm text-gray-600">مغلقة</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tickets.length}
                </div>
                <div className="text-sm text-gray-600">إجمالي التذاكر</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية وبحث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label className="text-sm font-medium text-gray-700">البحث</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="البحث في التذاكر..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">الحالة</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">الأولوية</Label>
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأولويات</SelectItem>
                  <SelectItem value="critical">حرجة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="low">منخفضة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Filter */}
            <div>
              <Label className="text-sm font-medium text-gray-700">الشركة</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">من تاريخ</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">إلى تاريخ</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            التذاكر الطارئة ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد تذاكر طارئة تطابق المعايير المحددة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{ticket.emergencyTicketNumber}</h3>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority === 'critical' ? 'حرجة' :
                           ticket.priority === 'high' ? 'عالية' :
                           ticket.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status === 'open' ? 'مفتوحة' :
                           ticket.status === 'in_progress' ? 'قيد التنفيذ' : 'مغلقة'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">الشركة:</span> {getCompanyName(ticket.companyId)}
                        </div>
                        <div>
                          <span className="font-medium">الفرع:</span> {getBranchName(ticket.branchId)}
                        </div>
                        <div>
                          <span className="font-medium">أبلغ عن طريق:</span> {ticket.reportedBy}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">الشكاوى:</span> {ticket.customerComplaints.join(', ')}
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(ticket.scheduledDate).toLocaleDateString('en-GB')}
                        {ticket.scheduledTime && ` - ${ticket.scheduledTime}`}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTicket(ticket)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        عرض
                      </Button>
                      
                      {ticket.status !== 'closed' && (
                        <Button
                          size="sm"
                          onClick={() => handleCreateCompletion(ticket)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          إكمال
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for labels
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium text-gray-700 ${className}`}>{children}</div>;
}

export default function EmergencyTicketsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </div>
    }>
      <EmergencyTicketsContent />
    </Suspense>
  );
} 