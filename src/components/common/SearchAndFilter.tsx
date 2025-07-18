'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Save, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { SearchFilters, SavedSearch } from '@/hooks/useSearch';

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  searchPlaceholder?: string;
  availableCities?: string[];
  availableLocations?: string[];
  availableTeamMembers?: string[];
  availableSortOptions?: Array<{ value: string; label: string }>;
  resultCount?: number;
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
  savedSearches?: SavedSearch[];
  onLoadSearch?: (filters: SearchFilters) => void;
  className?: string;
}

export function SearchAndFilter({
  filters,
  onFiltersChange,
  searchPlaceholder = "البحث...",
  availableCities = [],
  availableLocations = [],
  availableTeamMembers = [],
  availableSortOptions = [],
  resultCount = 0,
  onSaveSearch,
  savedSearches = [],
  onLoadSearch,
  className = ''
}: SearchAndFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');

  // Multi-select state
  const [selectedCities, setSelectedCities] = useState<string[]>(
    Array.isArray(filters.city) ? filters.city : filters.city && filters.city !== 'all-cities' ? [filters.city] : []
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    Array.isArray(filters.location) ? filters.location : filters.location && filters.location !== 'all-locations' ? [filters.location] : []
  );
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(
    Array.isArray(filters.teamMember) ? filters.teamMember : filters.teamMember && filters.teamMember !== 'all-teams' ? [filters.teamMember] : []
  );
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>(
    Array.isArray(filters.contractType) ? filters.contractType : filters.contractType && filters.contractType !== 'all' ? [filters.contractType] : []
  );

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[] | { start: string; end: string } | { min: string; max: string }) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleClearFilters = () => {
    setSelectedCities([]);
    setSelectedLocations([]);
    setSelectedTeamMembers([]);
    setSelectedContractTypes([]);

    onFiltersChange({
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
  };

  // Multi-select handlers
  const handleCitySelect = (city: string, checked: boolean) => {
    const newSelectedCities = checked
      ? [...selectedCities, city]
      : selectedCities.filter(c => c !== city);

    setSelectedCities(newSelectedCities);
    handleFilterChange('city', newSelectedCities.length > 0 ? newSelectedCities : 'all-cities');
  };

  const handleLocationSelect = (location: string, checked: boolean) => {
    const newSelectedLocations = checked
      ? [...selectedLocations, location]
      : selectedLocations.filter(l => l !== location);

    setSelectedLocations(newSelectedLocations);
    handleFilterChange('location', newSelectedLocations.length > 0 ? newSelectedLocations : 'all-locations');
  };

  const handleTeamMemberSelect = (member: string, checked: boolean) => {
    const newSelectedMembers = checked
      ? [...selectedTeamMembers, member]
      : selectedTeamMembers.filter(m => m !== member);

    setSelectedTeamMembers(newSelectedMembers);
    handleFilterChange('teamMember', newSelectedMembers.length > 0 ? newSelectedMembers : 'all-teams');
  };

  const handleContractTypeSelect = (contractType: string, checked: boolean) => {
    const newSelectedTypes = checked
      ? [...selectedContractTypes, contractType]
      : selectedContractTypes.filter(t => t !== contractType);

    setSelectedContractTypes(newSelectedTypes);
    handleFilterChange('contractType', newSelectedTypes.length > 0 ? newSelectedTypes : 'all');
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim() || !onSaveSearch) return;

    onSaveSearch(saveSearchName, filters);
    setSaveSearchName('');
    setShowSaveSearch(false);
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm ||
      filters.status !== 'all' ||
      (Array.isArray(filters.location) ? filters.location.length > 0 : filters.location !== 'all-locations') ||
      (Array.isArray(filters.city) ? filters.city.length > 0 : filters.city !== 'all-cities') ||
      (Array.isArray(filters.teamMember) ? filters.teamMember.length > 0 : filters.teamMember !== 'all-teams') ||
      (Array.isArray(filters.contractType) ? filters.contractType.length > 0 : filters.contractType !== 'all') ||
      filters.regularVisits?.min ||
      filters.regularVisits?.max ||
      filters.emergencyVisits?.min ||
      filters.emergencyVisits?.max ||
      filters.dateRange.start ||
      filters.dateRange.end
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-right">البحث والتصفية</CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  مسح المرشحات
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                تصفية متقدمة
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder={searchPlaceholder}
                className="text-right pr-10"
                dir="rtl"
              />
            </div>

            {/* Quick Status Filter */}
            <div className="w-48">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
                dir="rtl"
              >
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                  <SelectItem value="expired">منتهي</SelectItem>
                  <SelectItem value="expiring-soon">ينتهي قريباً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* City Filter - Multi-Select */}
                {availableCities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-right block">المدينة (متعدد الخيارات)</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {availableCities.map(city => (
                          <div key={city} className="flex items-center gap-2 justify-end">
                            <span className="text-sm">{city}</span>
                            <Checkbox
                              checked={selectedCities.includes(city)}
                              onCheckedChange={(checked) => handleCitySelect(city, !!checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedCities.length > 0 && (
                      <div className="text-xs text-blue-600 text-right">
                        محدد: {selectedCities.length} مدينة
                      </div>
                    )}
                  </div>
                )}

                {/* Location Filter - Multi-Select */}
                {availableLocations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-right block">الموقع (متعدد الخيارات)</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {availableLocations.map(location => (
                          <div key={location} className="flex items-center gap-2 justify-end">
                            <span className="text-sm">{location}</span>
                            <Checkbox
                              checked={selectedLocations.includes(location)}
                              onCheckedChange={(checked) => handleLocationSelect(location, !!checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedLocations.length > 0 && (
                      <div className="text-xs text-blue-600 text-right">
                        محدد: {selectedLocations.length} موقع
                      </div>
                    )}
                  </div>
                )}

                {/* Team Member Filter - Multi-Select */}
                {availableTeamMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-right block">فريق العمل (متعدد الخيارات)</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        {availableTeamMembers.map(member => (
                          <div key={member} className="flex items-center gap-2 justify-end">
                            <span className="text-sm">{member}</span>
                            <Checkbox
                              checked={selectedTeamMembers.includes(member)}
                              onCheckedChange={(checked) => handleTeamMemberSelect(member, !!checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedTeamMembers.length > 0 && (
                      <div className="text-xs text-blue-600 text-right">
                        محدد: {selectedTeamMembers.length} فريق
                      </div>
                    )}
                  </div>
                )}

                {/* Contract Type Filter - Multi-Select */}
                <div className="space-y-2">
                  <Label className="text-right block">نوع العقد (متعدد الخيارات)</Label>
                  <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                      {[
                        { value: 'fireExtinguisher', label: '🧯 طفايات الحريق' },
                        { value: 'alarmSystem', label: '⚠️ نظام الإنذار' },
                        { value: 'fireSuppression', label: '💧 نظام الإطفاء' },
                        { value: 'gasSystem', label: '🟦 نظام الغاز' },
                        { value: 'foamSystem', label: '🟢 نظام الفوم' }
                      ].map(contractType => (
                        <div key={contractType.value} className="flex items-center gap-2 justify-end">
                          <span className="text-sm">{contractType.label}</span>
                          <Checkbox
                            checked={selectedContractTypes.includes(contractType.value)}
                            onCheckedChange={(checked) => handleContractTypeSelect(contractType.value, !!checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedContractTypes.length > 0 && (
                    <div className="text-xs text-blue-600 text-right">
                      محدد: {selectedContractTypes.length} نوع عقد
                    </div>
                  )}
                </div>
              </div>

              {/* Visit Count Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regular Visits Filter */}
                <div className="space-y-2">
                  <Label className="text-right block">عدد الزيارات العادية سنوياً</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="من"
                      value={filters.regularVisits?.min || ''}
                      onChange={(e) => handleFilterChange('regularVisits', {
                        ...(filters.regularVisits || { min: '', max: '' }),
                        min: e.target.value
                      })}
                      className="text-right"
                      dir="rtl"
                      min="0"
                      max="365"
                    />
                    <Input
                      type="number"
                      placeholder="إلى"
                      value={filters.regularVisits?.max || ''}
                      onChange={(e) => handleFilterChange('regularVisits', {
                        ...(filters.regularVisits || { min: '', max: '' }),
                        max: e.target.value
                      })}
                      className="text-right"
                      dir="rtl"
                      min="0"
                      max="365"
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    مثال: من 6 إلى 12 زيارة سنوياً
                  </div>
                </div>

                {/* Emergency Visits Filter */}
                <div className="space-y-2">
                  <Label className="text-right block">عدد الزيارات الطارئة سنوياً</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="من"
                      value={filters.emergencyVisits?.min || ''}
                      onChange={(e) => handleFilterChange('emergencyVisits', {
                        ...(filters.emergencyVisits || { min: '', max: '' }),
                        min: e.target.value
                      })}
                      className="text-right"
                      dir="rtl"
                      min="0"
                      max="100"
                    />
                    <Input
                      type="number"
                      placeholder="إلى"
                      value={filters.emergencyVisits?.max || ''}
                      onChange={(e) => handleFilterChange('emergencyVisits', {
                        ...(filters.emergencyVisits || { min: '', max: '' }),
                        max: e.target.value
                      })}
                      className="text-right"
                      dir="rtl"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    مثال: من 1 إلى 5 زيارات طارئة سنوياً
                  </div>
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-right block">من تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value
                    })}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value
                    })}
                    className="text-right"
                  />
                </div>
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-right block">ترتيب حسب</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                    dir="rtl"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-right block">اتجاه الترتيب</Label>
                  <Select
                    value={filters.sortDirection}
                    onValueChange={(value) => handleFilterChange('sortDirection', value)}
                    dir="rtl"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">تصاعدي (أ - ي)</SelectItem>
                      <SelectItem value="desc">تنازلي (ي - أ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Search Results Summary */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              {resultCount > 0 ? (
                `عرض ${resultCount} نتيجة`
              ) : (
                'لا توجد نتائج'
              )}
            </div>

            {/* Save Search */}
            {onSaveSearch && (
              <div className="flex items-center gap-2">
                {showSaveSearch ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={saveSearchName}
                      onChange={(e) => setSaveSearchName(e.target.value)}
                      placeholder="اسم البحث المحفوظ"
                      className="w-48 text-right"
                      dir="rtl"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveSearch}
                      disabled={!saveSearchName.trim()}
                    >
                      حفظ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSaveSearch(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSaveSearch(true)}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    حفظ البحث
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="space-y-2">
              <Label className="text-right block text-sm font-medium">البحثات المحفوظة</Label>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((savedSearch, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => onLoadSearch?.(savedSearch.filters)}
                  >
                    {savedSearch.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="space-y-2">
              <Label className="text-right block text-sm font-medium">المرشحات النشطة</Label>
              <div className="flex flex-wrap gap-2">
                {filters.searchTerm && (
                  <Badge variant="secondary">
                    البحث: {filters.searchTerm}
                  </Badge>
                )}
                {filters.status !== 'all' && (
                  <Badge variant="secondary">
                    الحالة: {filters.status}
                  </Badge>
                )}
                {filters.city !== 'all-cities' && (
                  <Badge variant="secondary">
                    المدينة: {filters.city}
                  </Badge>
                )}
                {filters.location !== 'all-locations' && (
                  <Badge variant="secondary">
                    الموقع: {filters.location}
                  </Badge>
                )}
                {filters.teamMember !== 'all-teams' && (
                  <Badge variant="secondary">
                    الفريق: {filters.teamMember}
                  </Badge>
                )}
                {filters.contractType !== 'all' && (
                  <Badge variant="secondary">
                    نوع العقد: {filters.contractType}
                  </Badge>
                )}
                {(filters.regularVisits?.min || filters.regularVisits?.max) && (
                  <Badge variant="secondary">
                    زيارات عادية: {filters.regularVisits?.min || '...'} - {filters.regularVisits?.max || '...'}
                  </Badge>
                )}
                {(filters.emergencyVisits?.min || filters.emergencyVisits?.max) && (
                  <Badge variant="secondary">
                    زيارات طارئة: {filters.emergencyVisits?.min || '...'} - {filters.emergencyVisits?.max || '...'}
                  </Badge>
                )}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <Badge variant="secondary">
                    التاريخ: {filters.dateRange.start || '...'} - {filters.dateRange.end || '...'}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
