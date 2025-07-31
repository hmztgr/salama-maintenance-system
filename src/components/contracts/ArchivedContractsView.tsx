'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Archive, Search, Filter, Eye, Calendar, FileText, Building } from 'lucide-react';
import { Contract, Company } from '@/types/customer';
import { formatDateForDisplay } from '@/lib/date-handler';

interface ArchivedContractsViewProps {
  contracts: Contract[];
  companies: Company[];
  isOpen: boolean;
  onClose: () => void;
  onViewContract: (contract: Contract) => void;
}

export function ArchivedContractsView({
  contracts,
  companies,
  isOpen,
  onClose,
  onViewContract
}: ArchivedContractsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Filter archived contracts
  const archivedContracts = useMemo(() => {
    return contracts.filter(contract => 
      contract.isArchived || contract.status === 'archived'
    );
  }, [contracts]);

  // Filter and search contracts
  const filteredContracts = useMemo(() => {
    let filtered = archivedContracts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contract => 
        contract.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.archiveReason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      filtered = filtered.filter(contract => contract.companyId === companyFilter);
    }

    return filtered;
  }, [archivedContracts, searchTerm, statusFilter, companyFilter]);

  // Get company name by ID
  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.companyId === companyId);
    return company?.companyName || companyId;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'archived':
        return 'secondary';
      case 'expired':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'archived':
        return 'مؤرشف';
      case 'expired':
        return 'منتهي الصلاحية';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-gray-600" />
            العقود المؤرشفة
          </DialogTitle>
          <DialogDescription>
            عرض وإدارة العقود المؤرشفة والمنتهية الصلاحية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي العقود المؤرشفة</p>
                    <p className="text-2xl font-bold">{archivedContracts.length}</p>
                  </div>
                  <Archive className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عقود منتهية الصلاحية</p>
                    <p className="text-2xl font-bold text-red-600">
                      {archivedContracts.filter(c => c.status === 'expired').length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عقود ملغية</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {archivedContracts.filter(c => c.status === 'cancelled').length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">عقود مجددة</p>
                    <p className="text-2xl font-bold text-green-600">
                      {archivedContracts.filter(c => c.isRenewed).length}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                البحث والتصفية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">البحث</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في معرف العقد أو الملاحظات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                      <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">الشركة</label>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
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
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                النتائج ({filteredContracts.length} عقد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContracts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    لا توجد عقود مؤرشفة تطابق معايير البحث
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>معرف العقد</TableHead>
                        <TableHead>الشركة</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>تاريخ الانتهاء</TableHead>
                        <TableHead>قيمة العقد</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الأرشفة</TableHead>
                        <TableHead>سبب الأرشفة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.map((contract) => (
                        <TableRow key={contract.contractId}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {contract.contractId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {getCompanyName(contract.companyId)}
                            </div>
                          </TableCell>
                          <TableCell>{contract.contractStartDate}</TableCell>
                          <TableCell>{contract.contractEndDate}</TableCell>
                          <TableCell>
                            {contract.contractValue?.toLocaleString()} ريال
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(contract.status)}>
                              {getStatusText(contract.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {contract.archivedAt ? formatDateForDisplay(new Date(contract.archivedAt)) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={contract.archiveReason}>
                              {contract.archiveReason || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewContract(contract)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              عرض
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 