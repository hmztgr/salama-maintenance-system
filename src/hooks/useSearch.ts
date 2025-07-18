import { useState, useEffect, useCallback, useMemo } from 'react';
import { SafeStorage } from '@/lib/storage';

export interface SearchFilters {
  searchTerm: string;
  status: 'all' | 'active' | 'archived' | 'expired' | 'expiring-soon';
  location: string | string[]; // Support both single and multi-select
  city: string | string[]; // Support both single and multi-select
  teamMember: string | string[]; // Support both single and multi-select
  contractType: 'all' | 'fireExtinguisher' | 'alarmSystem' | 'fireSuppression' | 'gasSystem' | 'foamSystem' | string[]; // Support multi-select
  regularVisits: {
    min: string;
    max: string;
  };
  emergencyVisits: {
    min: string;
    max: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface SavedSearch {
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export function useSearch<T>(data: T[], searchConfig: {
  searchFields: (keyof T)[];
  statusField?: keyof T;
  locationField?: keyof T;
  cityField?: keyof T;
  teamMemberField?: keyof T;
  dateField?: keyof T;
  contractFields?: {
    fireExtinguisher?: keyof T;
    alarmSystem?: keyof T;
    fireSuppression?: keyof T;
    gasSystem?: keyof T;
    foamSystem?: keyof T;
  };
}) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    location: 'all-locations',
    city: 'all-cities',
    teamMember: 'all-teams',
    contractType: 'all',
    regularVisits: { min: '', max: '' },
    emergencyVisits: { min: '', max: '' },
    dateRange: { start: '', end: '' },
    sortBy: 'name',
    sortDirection: 'asc'
  });

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved searches on mount
  useEffect(() => {
    try {
      const stored = SafeStorage.get<SavedSearch[]>('savedSearches', []);
      setSavedSearches(Array.isArray(stored) ? stored : []);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      setSavedSearches([]);
    }
  }, []);

  // Save searches to localStorage
  const saveSavedSearches = useCallback((searches: SavedSearch[]) => {
    try {
      SafeStorage.set('savedSearches', searches);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to save searches:', error);
    }
  }, []);

  // Filter and search logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Text search across specified fields
    if (filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase();
      result = result.filter(item => {
        return searchConfig.searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm);
          }
          return false;
        });
      });
    }

    // Status filter
    if (filters.status !== 'all' && searchConfig.statusField) {
      result = result.filter(item => {
        const status = item[searchConfig.statusField!];
        switch (filters.status) {
          case 'active':
            return !Boolean(item['isArchived' as keyof T]);
          case 'archived':
            return Boolean(item['isArchived' as keyof T]);
          case 'expired':
            // Implement expiry logic based on date field
            if (searchConfig.dateField) {
              const dateValue = item[searchConfig.dateField];
              if (typeof dateValue === 'string') {
                const endDate = new Date(dateValue);
                return endDate < new Date();
              }
            }
            return false;
          case 'expiring-soon':
            // Implement expiring soon logic (within 30 days)
            if (searchConfig.dateField) {
              const dateValue = item[searchConfig.dateField];
              if (typeof dateValue === 'string') {
                const endDate = new Date(dateValue);
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                return endDate <= thirtyDaysFromNow && endDate >= new Date();
              }
            }
            return false;
          default:
            return true;
        }
      });
    }

    // Location filter (single or multi-select)
    if (filters.location && filters.location !== 'all-locations' && searchConfig.locationField) {
      result = result.filter(item => {
        const location = item[searchConfig.locationField!];
        if (typeof location !== 'string') return false;

        if (Array.isArray(filters.location)) {
          return filters.location.some(filterLoc => location.includes(filterLoc));
        } else {
          return location.includes(filters.location);
        }
      });
    }

    // City filter (single or multi-select)
    if (filters.city && filters.city !== 'all-cities' && searchConfig.cityField) {
      result = result.filter(item => {
        const city = item[searchConfig.cityField!];
        if (typeof city !== 'string') return false;

        if (Array.isArray(filters.city)) {
          return filters.city.includes(city);
        } else {
          return city === filters.city;
        }
      });
    }

    // Team member filter (single or multi-select)
    if (filters.teamMember && filters.teamMember !== 'all-teams' && searchConfig.teamMemberField) {
      result = result.filter(item => {
        const teamMember = item[searchConfig.teamMemberField!];
        if (typeof teamMember !== 'string') return false;

        if (Array.isArray(filters.teamMember)) {
          return filters.teamMember.some(filterTeam => teamMember.includes(filterTeam));
        } else {
          return teamMember.includes(filters.teamMember);
        }
      });
    }

    // Contract type filter (single or multi-select)
    if (filters.contractType !== 'all' && searchConfig.contractFields) {
      result = result.filter(item => {
        const contractFields = searchConfig.contractFields!;

        if (Array.isArray(filters.contractType)) {
          // Multi-select: item matches if it has any of the selected contract types
          return filters.contractType.some(contractType => {
            switch (contractType) {
              case 'fireExtinguisher':
                return contractFields.fireExtinguisher ? Boolean(item[contractFields.fireExtinguisher]) : false;
              case 'alarmSystem':
                return contractFields.alarmSystem ? Boolean(item[contractFields.alarmSystem]) : false;
              case 'fireSuppression':
                return contractFields.fireSuppression ? Boolean(item[contractFields.fireSuppression]) : false;
              case 'gasSystem':
                return contractFields.gasSystem ? Boolean(item[contractFields.gasSystem]) : false;
              case 'foamSystem':
                return contractFields.foamSystem ? Boolean(item[contractFields.foamSystem]) : false;
              default:
                return false;
            }
          });
        } else {
          // Single select (backward compatibility)
          switch (filters.contractType) {
            case 'fireExtinguisher':
              return contractFields.fireExtinguisher ? Boolean(item[contractFields.fireExtinguisher]) : false;
            case 'alarmSystem':
              return contractFields.alarmSystem ? Boolean(item[contractFields.alarmSystem]) : false;
            case 'fireSuppression':
              return contractFields.fireSuppression ? Boolean(item[contractFields.fireSuppression]) : false;
            case 'gasSystem':
              return contractFields.gasSystem ? Boolean(item[contractFields.gasSystem]) : false;
            case 'foamSystem':
              return contractFields.foamSystem ? Boolean(item[contractFields.foamSystem]) : false;
            default:
              return true;
          }
        }
      });
    }

    // Regular visits filter
    if (filters.regularVisits.min || filters.regularVisits.max) {
      result = result.filter(item => {
        const regularVisits = item['regularVisitsPerYear' as keyof T] as number;
        if (typeof regularVisits === 'number') {
          const min = filters.regularVisits.min ? parseInt(filters.regularVisits.min) : 0;
          const max = filters.regularVisits.max ? parseInt(filters.regularVisits.max) : Number.MAX_SAFE_INTEGER;
          return regularVisits >= min && regularVisits <= max;
        }
        return true;
      });
    }

    // Emergency visits filter
    if (filters.emergencyVisits.min || filters.emergencyVisits.max) {
      result = result.filter(item => {
        const emergencyVisits = item['emergencyVisitsPerYear' as keyof T] as number;
        if (typeof emergencyVisits === 'number') {
          const min = filters.emergencyVisits.min ? parseInt(filters.emergencyVisits.min) : 0;
          const max = filters.emergencyVisits.max ? parseInt(filters.emergencyVisits.max) : Number.MAX_SAFE_INTEGER;
          return emergencyVisits >= min && emergencyVisits <= max;
        }
        return true;
      });
    }

    // Date range filter
    if ((filters.dateRange.start || filters.dateRange.end) && searchConfig.dateField) {
      result = result.filter(item => {
        const dateValue = item[searchConfig.dateField!];
        if (typeof dateValue === 'string') {
          const itemDate = new Date(dateValue);
          const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
          const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const sortField = filters.sortBy as keyof T;
      const aValue = a[sortField];
      const bValue = b[sortField];

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      }

      return filters.sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [data, filters, searchConfig]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const cities = new Set<string>();
    const locations = new Set<string>();
    const teamMembers = new Set<string>();

    data.forEach(item => {
      if (searchConfig.cityField) {
        const city = item[searchConfig.cityField];
        if (typeof city === 'string' && city.trim()) {
          cities.add(city);
        }
      }

      if (searchConfig.locationField) {
        const location = item[searchConfig.locationField];
        if (typeof location === 'string' && location.trim()) {
          locations.add(location);
        }
      }

      if (searchConfig.teamMemberField) {
        const teamMember = item[searchConfig.teamMemberField];
        if (typeof teamMember === 'string' && teamMember.trim()) {
          teamMembers.add(teamMember);
        }
      }
    });

    return {
      cities: Array.from(cities).sort(),
      locations: Array.from(locations).sort(),
      teamMembers: Array.from(teamMembers).sort()
    };
  }, [data, searchConfig]);

  // Save search
  const saveSearch = useCallback((name: string, searchFilters: SearchFilters) => {
    const newSearch: SavedSearch = {
      name,
      filters: searchFilters,
      createdAt: new Date().toISOString()
    };

    const updatedSearches = [...savedSearches, newSearch];
    saveSavedSearches(updatedSearches);
  }, [savedSearches, saveSavedSearches]);

  // Delete saved search
  const deleteSavedSearch = useCallback((index: number) => {
    const updatedSearches = savedSearches.filter((_, i) => i !== index);
    saveSavedSearches(updatedSearches);
  }, [savedSearches, saveSavedSearches]);

  // Load saved search
  const loadSavedSearch = useCallback((searchFilters: SearchFilters) => {
    setFilters(searchFilters);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
      location: 'all-locations',
      city: 'all-cities',
      teamMember: 'all-teams',
      contractType: 'all',
      regularVisits: { min: '', max: '' },
      emergencyVisits: { min: '', max: '' },
      dateRange: { start: '', end: '' },
      sortBy: 'name',
      sortDirection: 'asc'
    });
  }, []);

  // Highlight search terms in text
  const highlightSearchTerm = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  }, []);

  return {
    filters,
    setFilters,
    filteredData,
    filterOptions,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    loadSavedSearch,
    clearFilters,
    highlightSearchTerm,
    resultCount: filteredData.length,
    totalCount: data.length
  };
}
