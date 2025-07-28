// Enhanced ID generation system with Saudi Arabia city validation
import { Customer, Location } from '@/types/customer';

// Saudi Arabia cities database for validation
const SAUDI_CITIES: Record<string, string> = {
  'الرياض': 'RYD',
  'جدة': 'JED',
  'الدمام': 'DAM',
  'مكة': 'MKA',
  'مكة المكرمة': 'MKA', // Same code as مكة
  'المدينة': 'MDN',
  'المدينة المنورة': 'MDN', // Same code as المدينة
  'تبوك': 'TBK',
  'أبها': 'ABH',
  'الطائف': 'TAF',
  'الجبيل': 'JUB',
  'ينبع': 'YAN',
  'الخبر': 'KHO',
  'القطيف': 'QAT',
  'الأحساء': 'AHS',
  'خميس مشيط': 'KHM',
  'بريدة': 'BUR',
  'حائل': 'HAI',
  'الظهران': 'DHA',
  'عرعر': 'ARA',
  'سكاكا': 'SAK',
  'جازان': 'JAZ',
  'جيزان': 'JAZ', // Alternative spelling
  'نجران': 'NAJ',
  'الباحة': 'BAH',
  'القريات': 'QUR'
};

interface CustomerData {
  name: string;
  location: string;
  branch: string;
  area: string;
}

interface LocationData {
  name: string;
  city: string;
}

// Validate city name against Saudi Arabia cities
export function validateSaudiCity(cityName: string): {
  isValid: boolean;
  cityCode?: string;
  suggestions?: string[]
} {
  const cityCode = SAUDI_CITIES[cityName];
  if (cityCode) {
    return { isValid: true, cityCode };
  }

  // Provide suggestions for similar city names
  const suggestions = Object.keys(SAUDI_CITIES).filter(city =>
    city.includes(cityName) || cityName.includes(city)
  );

  return {
    isValid: false,
    suggestions: suggestions.length > 0 ? suggestions : ['الرياض', 'جدة', 'الدمام']
  };
}

// Generate Location ID (City-Location format: JED-001)
export function generateLocationId(
  locationData: LocationData,
  existingLocations: LocationData[] = []
): { locationId: string; warnings: string[] } {
  const warnings: string[] = [];
  const cityValidation = validateSaudiCity(locationData.city);

  if (!cityValidation.isValid) {
    warnings.push(`مدينة غير معترف بها: ${locationData.city}. اقتراحات: ${cityValidation.suggestions?.join(', ')}`);
    return { locationId: '', warnings };
  }

  // Generate location number (sequential per city)
  const cityLocations = existingLocations.filter(l => l.city === locationData.city);
  const locationNumber = (cityLocations.length + 1).toString().padStart(3, '0');

  return {
    locationId: `${cityValidation.cityCode}-${locationNumber}`,
    warnings
  };
}

// Generate Customer ID (Customer-City-Location format: 0001-JED-001) - LEGACY
export function generateCustomerId(
  customerData: CustomerData,
  existingCustomers: Customer[] = [],
  existingLocations: LocationData[] = []
): { customerId: string; warnings: string[] } {
  const warnings: string[] = [];

  // Validate city
  const cityValidation = validateSaudiCity(customerData.area);
  if (!cityValidation.isValid) {
    warnings.push(`مدينة غير معترف بها: ${customerData.area}. اقتراحات: ${cityValidation.suggestions?.join(', ')}`);
    return { customerId: '', warnings };
  }

  // Generate customer number (sequential by unique name)
  const uniqueNames = new Set(existingCustomers.map(c => c.name));
  const customerNumber = (uniqueNames.size + 1).toString().padStart(4, '0');

  // Find or generate location number (sequential per city, regardless of customer)
  const locationInCity = existingLocations.find(l =>
    l.name === customerData.location && l.city === customerData.area
  );

  let locationNumber: string;
  if (locationInCity) {
    // Extract location number from existing location ID
    locationNumber = locationInCity.name.split('-')[1] || '001';
  } else {
    // Generate new location number for this city
    const cityLocations = existingLocations.filter(l => l.city === customerData.area);
    locationNumber = (cityLocations.length + 1).toString().padStart(3, '0');
  }

  // Generate branch number (sequential per customer)
  const customerBranches = existingCustomers.filter(c => c.name === customerData.name);
  const branchNumber = (customerBranches.length + 1).toString().padStart(4, '0');

  return {
    customerId: `${customerNumber}-${cityValidation.cityCode}-${locationNumber}-${branchNumber}`,
    warnings
  };
}

// NEW ID GENERATION FUNCTIONS FOR RESTRUCTURED SYSTEM

// Generate Company ID (Format: 0001, 0002, 0003...)
export function generateCompanyId(existingCompanies: Array<{ companyId?: string; id?: string }> = []): string {
  // Extract existing company IDs and find the highest number
  const existingIds = existingCompanies
    .map(c => c.companyId || '')
    .filter(id => /^\d{4}$/.test(id))
    .map(id => parseInt(id, 10))
    .filter(num => !isNaN(num));

  // Find the next available number
  let nextNumber = 1;
  if (existingIds.length > 0) {
    nextNumber = Math.max(...existingIds) + 1;
  }

  return nextNumber.toString().padStart(4, '0');
}

// Generate Contract ID (Format: 0001-001, 0001-002, 0002-001...)
export function generateContractId(companyId: string, existingContracts: Array<{ companyId: string }> = []): string {
  // Find existing contracts for this company
  const companyContracts = existingContracts.filter(c => c.companyId === companyId);
  const contractNumber = (companyContracts.length + 1).toString().padStart(3, '0');
  return `${companyId}-${contractNumber}`;
}

// Generate Branch ID (Format: 0001-JED-001-0001, 0001-JED-001-0002...)
export function generateBranchId(
  companyId: string,
  city: string,
  location: string,
  existingBranches: Array<{ branchId: string; city: string; location: string }> = []
): { branchId: string; warnings: string[] } {
  const warnings: string[] = [];

  // Validate city
  const cityValidation = validateSaudiCity(city);
  if (!cityValidation.isValid) {
    warnings.push(`مدينة غير معترف بها: ${city}. اقتراحات: ${cityValidation.suggestions?.join(', ')}`);
    return { branchId: '', warnings };
  }

  // Find existing locations for this city across all companies
  const cityBranches = existingBranches.filter(b =>
    b.city === city && b.location === location
  );

  let locationNumber: string;
  if (cityBranches.length > 0) {
    // Extract location number from existing branch
    const existingBranch = cityBranches[0];
    const parts = existingBranch.branchId.split('-');
    locationNumber = parts[2] || '001';
  } else {
    // Generate new location number for this city
    const allCityLocations = existingBranches.filter(b => b.city === city);
    const uniqueLocations = new Set(allCityLocations.map(b => b.location));
    locationNumber = (uniqueLocations.size + 1).toString().padStart(3, '0');
  }

  // Generate branch number for this specific company, city, and location combination
  // This ensures unique IDs even for same company in same city/location
  const companyLocationBranches = existingBranches.filter(b =>
    b.branchId.startsWith(`${companyId}-${cityValidation.cityCode}-${locationNumber}`)
  );
  const branchNumber = (companyLocationBranches.length + 1).toString().padStart(4, '0');

  return {
    branchId: `${companyId}-${cityValidation.cityCode}-${locationNumber}-${branchNumber}`,
    warnings
  };
}

// Get all Saudi cities for dropdowns
export function getSaudiCities(): Array<{ name: string; code: string }> {
  return Object.entries(SAUDI_CITIES).map(([name, code]) => ({ name, code }));
}
