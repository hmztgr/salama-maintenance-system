import { useState, useEffect, useCallback } from 'react';
import { Customer, CustomerFormData, CustomerSearchFilters, Location } from '@/types/customer';
import { generateCustomerId, generateLocationId } from '@/lib/id-generator';
import { SafeStorage } from '@/lib/storage';
import { getCurrentDate } from '@/lib/date-handler';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safe localStorage operations
  const loadCustomers = useCallback(() => {
    try {
      setLoading(true);
      const stored = SafeStorage.get<Customer[]>('customers', []);
      const storedLocations = SafeStorage.get<Location[]>('locations', []);

      setCustomers(Array.isArray(stored) ? stored : []);
      setLocations(Array.isArray(storedLocations) ? storedLocations : []);
      setError(null);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setCustomers([]);
      setLocations([]);
      setError('فشل في تحميل بيانات العملاء');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCustomers = useCallback((newCustomers: Customer[]) => {
    try {
      const success = SafeStorage.set('customers', newCustomers);
      if (success) {
        setCustomers(newCustomers);
        setError(null);
      } else {
        setError('فشل في حفظ بيانات العملاء');
      }
    } catch (err) {
      console.error('Failed to save customers:', err);
      setError('فشل في حفظ بيانات العملاء');
    }
  }, []);

  const saveLocations = useCallback((newLocations: Location[]) => {
    try {
      const success = SafeStorage.set('locations', newLocations);
      if (success) {
        setLocations(newLocations);
      }
    } catch (err) {
      console.error('Failed to save locations:', err);
    }
  }, []);

  const addCustomer = useCallback((customerData: CustomerFormData): { success: boolean; customer?: Customer; warnings?: string[] } => {
    try {
      // Generate customer ID with validation
      const idResult = generateCustomerId(
        customerData,
        customers,
        locations.map(l => ({ name: l.name, city: l.city }))
      );

      if (!idResult.customerId) {
        setError('فشل في إنشاء رقم العميل: ' + idResult.warnings.join(', '));
        return { success: false, warnings: idResult.warnings };
      }

      // Create location if it doesn't exist
      const existingLocation = locations.find(l =>
        l.name === customerData.location && l.city === customerData.area
      );

      let locationId = '';
      if (existingLocation) {
        locationId = existingLocation.locationId;
      } else {
        const locationResult = generateLocationId(
          { name: customerData.location, city: customerData.area },
          locations.map(l => ({ name: l.name, city: l.city }))
        );

        if (locationResult.locationId) {
          const newLocation: Location = {
            id: Date.now().toString(),
            locationId: locationResult.locationId,
            name: customerData.location,
            city: customerData.area,
            createdAt: getCurrentDate(),
            updatedAt: getCurrentDate(),
          };

          const updatedLocations = [...locations, newLocation];
          saveLocations(updatedLocations);
          locationId = locationResult.locationId;
        }
      }

      // Create new customer
      const newCustomer: Customer = {
        id: Date.now().toString(),
        customerId: idResult.customerId,
        name: customerData.name,
        location: customerData.location,
        branch: customerData.branch,
        area: customerData.area,
        contractStartDate: customerData.contractStartDate,
        contractEndDate: customerData.contractEndDate,
        regularVisitsPerYear: customerData.regularVisitsPerYear,
        emergencyVisitsPerYear: customerData.emergencyVisitsPerYear,
        teamMember: customerData.teamMember,
        isArchived: false,
        weeklyPlan: {},
        createdAt: getCurrentDate(),
        updatedAt: getCurrentDate(),
        // Fire safety services
        fireExtinguisherMaintenance: customerData.fireExtinguisherMaintenance,
        alarmSystemMaintenance: customerData.alarmSystemMaintenance,
        fireSuppressionMaintenance: customerData.fireSuppressionMaintenance,
        gasFireSuppression: customerData.gasFireSuppression,
        foamFireSuppression: customerData.foamFireSuppression,
      };

      const updatedCustomers = [...customers, newCustomer];
      saveCustomers(updatedCustomers);

      return {
        success: true,
        customer: newCustomer,
        warnings: idResult.warnings.length > 0 ? idResult.warnings : undefined
      };
    } catch (err) {
      console.error('Failed to add customer:', err);
      setError('فشل في إضافة العميل');
      return { success: false };
    }
  }, [customers, locations, saveCustomers, saveLocations]);

  const updateCustomer = useCallback((customerId: string, updates: Partial<CustomerFormData>): boolean => {
    try {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        setError('العميل غير موجود');
        return false;
      }

      const updatedCustomer = {
        ...customers[customerIndex],
        ...updates,
        updatedAt: getCurrentDate(),
      };

      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = updatedCustomer;
      saveCustomers(updatedCustomers);

      return true;
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError('فشل في تحديث بيانات العميل');
      return false;
    }
  }, [customers, saveCustomers]);

  const archiveCustomer = useCallback((customerId: string, archivedBy: string): boolean => {
    try {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        setError('العميل غير موجود');
        return false;
      }

      const updatedCustomer = {
        ...customers[customerIndex],
        isArchived: true,
        archivedBy,
        archivedAt: getCurrentDate(),
        updatedAt: getCurrentDate(),
      };

      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = updatedCustomer;
      saveCustomers(updatedCustomers);

      return true;
    } catch (err) {
      console.error('Failed to archive customer:', err);
      setError('فشل في أرشفة العميل');
      return false;
    }
  }, [customers, saveCustomers]);

  const unarchiveCustomer = useCallback((customerId: string): boolean => {
    try {
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        setError('العميل غير موجود');
        return false;
      }

      const updatedCustomer = {
        ...customers[customerIndex],
        isArchived: false,
        archivedBy: undefined,
        archivedAt: undefined,
        updatedAt: getCurrentDate(),
      };

      const updatedCustomers = [...customers];
      updatedCustomers[customerIndex] = updatedCustomer;
      saveCustomers(updatedCustomers);

      return true;
    } catch (err) {
      console.error('Failed to unarchive customer:', err);
      setError('فشل في إلغاء أرشفة العميل');
      return false;
    }
  }, [customers, saveCustomers]);

  const deleteCustomer = useCallback((customerId: string): boolean => {
    try {
      const updatedCustomers = customers.filter(c => c.id !== customerId);
      saveCustomers(updatedCustomers);
      return true;
    } catch (err) {
      console.error('Failed to delete customer:', err);
      setError('فشل في حذف العميل');
      return false;
    }
  }, [customers, saveCustomers]);

  const searchCustomers = useCallback((filters: CustomerSearchFilters): Customer[] => {
    let filtered = [...customers];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.customerId.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term) ||
        c.branch.toLowerCase().includes(term)
      );
    }

    if (filters.area) {
      filtered = filtered.filter(c => c.area === filters.area);
    }

    if (filters.teamMember) {
      filtered = filtered.filter(c => c.teamMember === filters.teamMember);
    }

    if (filters.isArchived !== undefined) {
      filtered = filtered.filter(c => c.isArchived === filters.isArchived);
    }

    if (filters.contractStatus) {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      filtered = filtered.filter(c => {
        if (!c.contractEndDate) return filters.contractStatus === 'active';

        const endDate = new Date(c.contractEndDate);

        switch (filters.contractStatus) {
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

    return filtered;
  }, [customers]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    locations,
    loading,
    error,
    addCustomer,
    updateCustomer,
    archiveCustomer,
    unarchiveCustomer,
    deleteCustomer,
    searchCustomers,
    refreshCustomers: loadCustomers,
    clearError,
  };
}
