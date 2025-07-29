// Enhanced ID generation system with Saudi Arabia city validation
import { Customer, Location } from '@/types/customer';

// Saudi Arabia cities database for validation
let SAUDI_CITIES: Record<string, string> = {
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
  'القريات': 'QUR',
  'رابغ': 'RAB' // Added Rabigh
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
  if (!cityName || cityName.trim() === '') {
    return { isValid: false, suggestions: [] };
  }

  const normalizedCityName = cityName.trim();
  
  // Debug logging
  console.log(`🔍 validateSaudiCity called with: "${normalizedCityName}"`);
  console.log(`🔍 Available cities:`, Object.keys(SAUDI_CITIES));
  
  // Check for exact match first
  const cityCode = SAUDI_CITIES[normalizedCityName];
  if (cityCode) {
    console.log(`🔍 Exact match found for "${normalizedCityName}" with code: ${cityCode}`);
    return { isValid: true, cityCode };
  }

  // Provide suggestions for similar city names
  const suggestions = Object.keys(SAUDI_CITIES).filter(city => {
    const normalizedCity = city.toLowerCase();
    const normalizedInput = normalizedCityName.toLowerCase();
    
    // Exact match (case insensitive)
    if (normalizedCity === normalizedInput) {
      console.log(`🔍 Case-insensitive match found: "${city}"`);
      return true;
    }
    
    // Contains match
    if (normalizedCity.includes(normalizedInput) || normalizedInput.includes(normalizedCity)) {
      console.log(`🔍 Contains match found: "${city}"`);
      return true;
    }
    
    // Similar characters (for Arabic text)
    const cityWithoutDiacritics = normalizedCity.replace(/[أإآ]/g, 'ا').replace(/[يى]/g, 'ي');
    const inputWithoutDiacritics = normalizedInput.replace(/[أإآ]/g, 'ا').replace(/[يى]/g, 'ي');
    
    if (cityWithoutDiacritics.includes(inputWithoutDiacritics) || inputWithoutDiacritics.includes(cityWithoutDiacritics)) {
      console.log(`🔍 Diacritics match found: "${city}"`);
      return true;
    }
    
    // Additional fuzzy matching for Arabic cities
    // Check if cities share common patterns (e.g., جازان vs جيزان)
    if (cityWithoutDiacritics.length >= 3 && inputWithoutDiacritics.length >= 3) {
      // Check if at least 70% of characters match
      let matchCount = 0;
      const minLength = Math.min(cityWithoutDiacritics.length, inputWithoutDiacritics.length);
      
      for (let i = 0; i < minLength; i++) {
        if (cityWithoutDiacritics[i] === inputWithoutDiacritics[i]) {
          matchCount++;
        }
      }
      
      const similarity = matchCount / minLength;
      if (similarity >= 0.7) {
        console.log(`🔍 Fuzzy match found: "${city}" (similarity: ${similarity.toFixed(2)})`);
        return true;
      }
    }
    
    return false;
  });

  console.log(`🔍 Suggestions found for "${normalizedCityName}":`, suggestions);
  
  return {
    isValid: false,
    suggestions: suggestions
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

  // Find existing branches for this specific company
  const companyBranches = existingBranches.filter(b => 
    b.branchId.startsWith(`${companyId}-`)
  );

  // Find existing branches for this company in this specific city and location
  const companyLocationBranches = companyBranches.filter(b => 
    b.city === city && b.location === location
  );

  // Find existing branches for this company in this city (for location number generation)
  const companyCityBranches = companyBranches.filter(b => b.city === city);
  
  // Generate location number based on unique locations for this company in this city
  const uniqueLocations = new Set(companyCityBranches.map(b => b.location));
  let locationNumber: string;
  
  if (companyLocationBranches.length > 0) {
    // This location already exists for this company, use existing location number
    const existingBranch = companyLocationBranches[0];
    const parts = existingBranch.branchId.split('-');
    locationNumber = parts[2] || '001';
  } else {
    // This is a new location for this company in this city
    locationNumber = (uniqueLocations.size + 1).toString().padStart(3, '0');
  }

  // Generate branch number for this specific company, city, and location combination
  // Use the total count of branches for this company to ensure uniqueness
  const totalCompanyBranches = companyBranches.length;
  const branchNumber = (totalCompanyBranches + 1).toString().padStart(4, '0');

  // Additional check: if this exact combination already exists, increment the branch number
  const existingBranchWithSameId = companyBranches.find(b => {
    const parts = b.branchId.split('-');
    return parts[0] === companyId && 
           parts[1] === cityValidation.cityCode && 
           parts[2] === locationNumber && 
           parts[3] === branchNumber;
  });

  let finalBranchNumber = branchNumber;
  if (existingBranchWithSameId) {
    // Find the highest branch number for this company and increment
    const branchNumbers = companyBranches.map(b => {
      const parts = b.branchId.split('-');
      return parseInt(parts[3] || '0', 10);
    });
    const maxBranchNumber = Math.max(...branchNumbers, 0);
    finalBranchNumber = (maxBranchNumber + 1).toString().padStart(4, '0');
  }

  // Debug logging
  console.log(`🔧 generateBranchId debug:`, {
    companyId,
    city,
    location,
    totalCompanyBranches,
    companyLocationBranches: companyLocationBranches.length,
    locationNumber,
    branchNumber,
    finalBranchNumber,
    existingBranchWithSameId: !!existingBranchWithSameId,
    generatedId: `${companyId}-${cityValidation.cityCode}-${locationNumber}-${finalBranchNumber}`
  });

  return {
    branchId: `${companyId}-${cityValidation.cityCode}-${locationNumber}-${finalBranchNumber}`,
    warnings
  };
}

// Get all Saudi cities for dropdowns
export function getSaudiCities(): Array<{ name: string; code: string }> {
  return Object.entries(SAUDI_CITIES).map(([name, code]) => ({ name, code }));
}

// Add a new city to the database
export function addSaudiCity(cityName: string, cityCode: string): boolean {
  // Check if city code already exists
  const existingCity = Object.entries(SAUDI_CITIES).find(([_, code]) => code === cityCode.toUpperCase());
  if (existingCity) {
    console.error(`City code ${cityCode.toUpperCase()} already exists for city: ${existingCity[0]}`);
    return false;
  }

  // Add the new city
  SAUDI_CITIES[cityName] = cityCode.toUpperCase();
  console.log(`Added new city: ${cityName} (${cityCode.toUpperCase()})`);
  return true;
}
