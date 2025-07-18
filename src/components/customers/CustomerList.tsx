'use client';

import { useState, useMemo } from 'react';
import { Customer, CustomerSearchFilters } from '@/types/customer';
import { useAuth } from '@/contexts/AuthContextFirebase';
import { formatDateForDisplay } from '@/lib/date-handler';

export interface CustomerListProps {
  customers: Customer[];
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  readonly?: boolean;
}

export function CustomerList({
  customers,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
  readonly = false
}: CustomerListProps) {
  const { hasPermission, authState } = useAuth();
  const [searchFilters, setSearchFilters] = useState<CustomerSearchFilters>({});
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search term
    if (searchFilters.searchTerm) {
      const term = searchFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.customerId.toLowerCase().includes(term) ||
        customer.location.toLowerCase().includes(term) ||
        customer.branch.toLowerCase().includes(term) ||
        customer.area.toLowerCase().includes(term)
      );
    }

    // Apply area filter
    if (searchFilters.area) {
      filtered = filtered.filter(customer => customer.area === searchFilters.area);
    }

    // Apply team member filter
    if (searchFilters.teamMember) {
      filtered = filtered.filter(customer => customer.teamMember === searchFilters.teamMember);
    }

    // Apply archive filter
    if (searchFilters.isArchived !== undefined) {
      filtered = filtered.filter(customer => customer.isArchived === searchFilters.isArchived);
    }

    // Apply contract status filter
    if (searchFilters.contractStatus) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      filtered = filtered.filter(customer => {
        if (!customer.contractEndDate) return searchFilters.contractStatus === 'active';

        const endDate = new Date(customer.contractEndDate);

        switch (searchFilters.contractStatus) {
          case 'active':
            return endDate > now;
          case 'expired':
            return endDate <= now;
          case 'expiring-soon':
            return endDate > now && endDate <= thirtyDaysFromNow;
          default:
            return true;
        }
      });
    }

    // Sort customers
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });

    return filtered;
  }, [customers, searchFilters, sortField, sortDirection]);

  // Get unique areas and team members for filters
  const uniqueAreas = useMemo(() =>
    [...new Set(customers.map(c => c.area))].filter(Boolean),
    [customers]
  );

  const uniqueTeamMembers = useMemo(() =>
    [...new Set(customers.map(c => c.teamMember))].filter(Boolean),
    [customers]
  );

  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleArchive = (customer: Customer) => {
    if (!hasPermission('supervisor')) return;

    const action = customer.isArchived ? 'إلغاء أرشفة' : 'أرشفة';
    if (confirm(`هل أنت متأكد من ${action} العميل "${customer.name}"؟`)) {
      if (customer.isArchived) {
        onUnarchive(customer.id);
      } else {
        onArchive(customer.id);
      }
    }
  };

  const handleDelete = (customer: Customer) => {
    if (!hasPermission('admin')) return;

    if (confirm(`⚠️ تحذير: هل أنت متأكد من حذف العميل "${customer.name}" نهائياً؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيؤدي إلى حذف جميع البيانات المرتبطة بهذا العميل.`)) {
      onDelete(customer.id);
    }
  };

  if (!customers) {
    return <div className="text-center py-8">جاري تحميل العملاء...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البحث
            </label>
            <input
              type="text"
              value={searchFilters.searchTerm || ''}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="ابحث بالاسم، الرقم، الموقع..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المنطقة
            </label>
            <select
              value={searchFilters.area || ''}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, area: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المناطق</option>
              {uniqueAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Team Member Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عضو الفريق
            </label>
            <select
              value={searchFilters.teamMember || ''}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, teamMember: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع أعضاء الفريق</option>
              {uniqueTeamMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          {/* Archive Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              value={searchFilters.isArchived === undefined ? '' : searchFilters.isArchived.toString()}
              onChange={(e) => setSearchFilters(prev => ({
                ...prev,
                isArchived: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع العملاء</option>
              <option value="false">نشط</option>
              <option value="true">مؤرشف</option>
            </select>
          </div>
        </div>

        {/* Contract Status Filter */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            حالة العقد
          </label>
          <select
            value={searchFilters.contractStatus || ''}
            onChange={(e) => setSearchFilters(prev => ({
              ...prev,
              contractStatus: e.target.value as CustomerSearchFilters['contractStatus'] || undefined
            }))}
            className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع العقود</option>
            <option value="active">نشط</option>
            <option value="expiring-soon">ينتهي قريباً</option>
            <option value="expired">منتهي</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          عرض {filteredCustomers.length} من أصل {customers.length} عميل
        </div>
        <button
          onClick={() => setSearchFilters({})}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          مسح الفلاتر
        </button>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('customerId')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  رقم العميل
                  {sortField === 'customerId' && (
                    <span className="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  اسم العميل
                  {sortField === 'name' && (
                    <span className="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموقع / الفرع
                </th>
                <th
                  onClick={() => handleSort('area')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  المنطقة
                  {sortField === 'area' && (
                    <span className="mr-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العقد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  خدمات السلامة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={customer.isArchived ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {customer.customerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    {customer.teamMember && (
                      <div className="text-sm text-gray-500">فريق: {customer.teamMember}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{customer.location}</div>
                    <div className="text-gray-500">{customer.branch}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.area}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.contractStartDate && customer.contractStartDate.trim() !== '' &&
                     customer.contractEndDate && customer.contractEndDate.trim() !== '' ? (
                      <div>
                        <div>{formatDateForDisplay(customer.contractStartDate)}</div>
                        <div className="text-gray-500">إلى {formatDateForDisplay(customer.contractEndDate)}</div>
                        <div className="text-xs text-gray-400">
                          زيارات: {customer.regularVisitsPerYear} عادية، {customer.emergencyVisitsPerYear} طارئة
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">غير محدد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {customer.fireExtinguisherMaintenance && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          طفايات
                        </span>
                      )}
                      {customer.alarmSystemMaintenance && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          إنذار
                        </span>
                      )}
                      {customer.fireSuppressionMaintenance && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          إطفاء
                        </span>
                      )}
                      {customer.gasFireSuppression && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          غاز
                        </span>
                      )}
                      {customer.foamFireSuppression && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          فوم
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.isArchived ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        مؤرشف
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        نشط
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 space-x-reverse">
                    {!readonly && (
                      <>
                        <button
                          onClick={() => onUpdate(customer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          تعديل
                        </button>

                        {hasPermission('supervisor') && (
                          <button
                            onClick={() => handleArchive(customer)}
                            className={customer.isArchived ?
                              "text-green-600 hover:text-green-900" :
                              "text-yellow-600 hover:text-yellow-900"
                            }
                          >
                            {customer.isArchived ? 'إلغاء الأرشفة' : 'أرشفة'}
                          </button>
                        )}

                        {hasPermission('admin') && (
                          <button
                            onClick={() => handleDelete(customer)}
                            className="text-red-600 hover:text-red-900"
                          >
                            حذف
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد عملاء مطابقون لمعايير البحث
          </div>
        )}
      </div>
    </div>
  );
}

// Safe default props
CustomerList.defaultProps = {
  readonly: false,
};
