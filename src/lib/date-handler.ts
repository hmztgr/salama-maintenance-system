// Standardized date management system (dd-mmm-yyyy format)
interface DateValidationResult {
  isValid: boolean;
  standardizedDate?: string; // dd-mmm-yyyy format
  originalFormat?: string;
  warnings?: string[];
}

// Supported import formats
const SUPPORTED_FORMATS = ['mm-dd-yyyy', 'dd-mmm-yyyy', 'mm/dd/yyyy', 'dd/mm/yyyy', 'yyyy-mm-dd'];

// Month mapping for dd-mmm-yyyy format
const MONTH_NAMES = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
};

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
  'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
};

// Convert various date formats to standardized dd-mmm-yyyy
export function standardizeDate(dateInput: string): DateValidationResult {
  if (!dateInput || dateInput.trim() === '') {
    return { isValid: false, warnings: ['Empty date field'] };
  }

  const cleanInput = dateInput.trim();

  // Try to parse different formats
  let parsedDate: Date | null = null;
  let detectedFormat = '';

  // Format 1: mm-dd-yyyy or mm/dd/yyyy
  const mmddyyyyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/;
  const mmddMatch = cleanInput.match(mmddyyyyRegex);
  if (mmddMatch) {
    const [, month, day, year] = mmddMatch;
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    detectedFormat = 'mm-dd-yyyy';
  }

  // Format 2: dd-mmm-yyyy (target format)
  const ddmmmyyyyRegex = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/;
  const ddmmmMatch = cleanInput.match(ddmmmyyyyRegex);
  if (ddmmmMatch) {
    const [, day, monthName, year] = ddmmmMatch;
    const monthIndex = MONTH_NAME_TO_NUMBER[monthName.toLowerCase()];

    if (monthIndex) {
      parsedDate = new Date(parseInt(year), monthIndex - 1, parseInt(day));
      detectedFormat = 'dd-mmm-yyyy';
    }
  }

  // Format 3: dd/mm/yyyy
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ddmmMatch = cleanInput.match(ddmmyyyyRegex);
  if (ddmmMatch) {
    const [, day, month, year] = ddmmMatch;
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    detectedFormat = 'dd/mm/yyyy';
  }

  // Format 4: yyyy-mm-dd (HTML date input format)
  const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const yyyymmddMatch = cleanInput.match(yyyymmddRegex);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    detectedFormat = 'yyyy-mm-dd';
  }

  // Format 5: Excel serial date (if needed)
  const serialDateRegex = /^\d{5}$/;
  if (serialDateRegex.test(cleanInput)) {
    // Excel serial date conversion (days since 1900-01-01)
    const serialNumber = parseInt(cleanInput);
    parsedDate = new Date(1900, 0, serialNumber);
    detectedFormat = 'excel-serial';
  }

  // Validate parsed date
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      isValid: false,
      originalFormat: detectedFormat,
      warnings: [`Unsupported date format: "${cleanInput}". Supported formats: ${SUPPORTED_FORMATS.join(', ')}`]
    };
  }

  // Convert to standardized format: dd-mmm-yyyy
  const day = parsedDate.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[parsedDate.getMonth() + 1 as keyof typeof MONTH_NAMES];
  const year = parsedDate.getFullYear();
  const standardizedDate = `${day}-${month}-${year}`;

  return {
    isValid: true,
    standardizedDate,
    originalFormat: detectedFormat,
    warnings: detectedFormat !== 'dd-mmm-yyyy' ?
      [`Date converted from ${detectedFormat} to dd-mmm-yyyy format`] : []
  };
}

// Validate date format for import review
export function validateImportDates(data: Record<string, unknown>[]): {
  validationResults: Array<{
    rowIndex: number;
    dateField: string;
    originalValue: string;
    validationResult: DateValidationResult;
  }>;
  hasErrors: boolean;
} {
  const results: Array<{
    rowIndex: number;
    dateField: string;
    originalValue: string;
    validationResult: DateValidationResult;
  }> = [];
  const dateFields = ['contractStartDate', 'contractEndDate', 'scheduledDate', 'completedDate'];

  data.forEach((row, index) => {
    dateFields.forEach(field => {
      if (row[field] && typeof row[field] === 'string') {
        const validation = standardizeDate(row[field] as string);
        results.push({
          rowIndex: index + 1,
          dateField: field,
          originalValue: row[field] as string,
          validationResult: validation
        });
      }
    });
  });

  const hasErrors = results.some(r => !r.validationResult.isValid);

  return { validationResults: results, hasErrors };
}

// Format date for display in app (always dd-mmm-yyyy)
export function formatDateForDisplay(date: Date | string): string {
  if (typeof date === 'string') {
    const validation = standardizeDate(date);
    if (!validation.isValid || !validation.standardizedDate) {
      console.warn('Invalid date string provided to formatDateForDisplay:', date);
      return getCurrentDate(); // Return current date instead of 'Invalid Date'
    }
    return validation.standardizedDate;
  }

  const dateObj = date;
  
  // Validate the Date object
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid Date object provided to formatDateForDisplay:', dateObj);
    return getCurrentDate(); // Return current date instead of 'Invalid Date'
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[dateObj.getMonth() + 1 as keyof typeof MONTH_NAMES];
  const year = dateObj.getFullYear();

  return `${day}-${month}-${year}`;
}

// Get current date in dd-mmm-yyyy format
export function getCurrentDate(): string {
  return formatDateForDisplay(new Date());
}

// Parse dd-mmm-yyyy string to Date object
export function parseStandardDate(dateString: string): Date | null {
  const validation = standardizeDate(dateString);
  if (!validation.isValid || !validation.standardizedDate) {
    return null;
  }

  const [day, monthName, year] = validation.standardizedDate.split('-');
  const monthIndex = MONTH_NAME_TO_NUMBER[monthName.toLowerCase()];

  if (!monthIndex) {
    return null;
  }

  return new Date(parseInt(year), monthIndex - 1, parseInt(day));
}

// Convert dd-mmm-yyyy to yyyy-mm-dd for HTML date inputs
export function formatDateForInput(dateString: string): string {
  if (!dateString) return '';

  const validation = standardizeDate(dateString);
  if (!validation.isValid || !validation.standardizedDate) {
    return '';
  }

  const [day, monthName, year] = validation.standardizedDate.split('-');
  const monthIndex = MONTH_NAME_TO_NUMBER[monthName.toLowerCase()];

  if (!monthIndex) {
    return '';
  }

  const month = monthIndex.toString().padStart(2, '0');
  const dayPadded = day.padStart(2, '0');

  return `${year}-${month}-${dayPadded}`;
}

// Convert yyyy-mm-dd (from HTML date input) to dd-mmm-yyyy
export function convertInputDateToStandard(inputDate: string): string {
  if (!inputDate) return '';

  try {
    // Parse the yyyy-mm-dd format directly to avoid timezone issues
    const [year, month, day] = inputDate.split('-').map(Number);
    if (!year || !month || !day) return '';

    // Create date in local timezone (not UTC)
    const date = new Date(year, month - 1, day);
    
    // Format as dd-mmm-yyyy
    const dayStr = date.getDate().toString().padStart(2, '0');
    const monthName = MONTH_NAMES[date.getMonth() + 1 as keyof typeof MONTH_NAMES];
    const yearStr = date.getFullYear().toString();

    return `${dayStr}-${monthName}-${yearStr}`;
  } catch (error) {
    console.error('Error converting input date:', error);
    return '';
  }
}

/**
 * Add weeks to a date
 * @param dateString - Date in dd-mmm-yyyy format
 * @param weeks - Number of weeks to add (can be negative)
 * @returns New date string in dd-mmm-yyyy format
 */
export function addWeeksToDate(dateString: string, weeks: number): string {
  try {
    const date = parseStandardDate(dateString);
    if (!date) {
      throw new Error('Invalid date');
    }

    date.setDate(date.getDate() + (weeks * 7));
    return formatDateForDisplay(date);
  } catch (error) {
    console.error('Error adding weeks to date:', error);
    return dateString;
  }
}

/**
 * Get the start date of the week (Sunday)
 * @param dateString - Date in dd-mmm-yyyy format
 * @returns Week start date in dd-mmm-yyyy format
 */
export function getWeekStartDate(dateString: string): string {
  try {
    const date = parseStandardDate(dateString);
    if (!date) {
      throw new Error('Invalid date');
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);

    const result = formatDateForDisplay(startDate);
    
    // Debug logging for week start calculation
    console.log('🔍 getWeekStartDate debug:', {
      inputDate: dateString,
      parsedDate: date,
      dayOfWeek,
      dayOfWeekName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      startDate,
      result
    });

    return result;
  } catch (error) {
    console.error('Error getting week start date:', error);
    return dateString;
  }
}

/**
 * Get the end date of the week (Saturday)
 * @param dateString - Date in dd-mmm-yyyy format
 * @returns Week end date in dd-mmm-yyyy format
 */
export function getWeekEndDate(dateString: string): string {
  try {
    const date = parseStandardDate(dateString);
    if (!date) {
      throw new Error('Invalid date');
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + (6 - dayOfWeek));

    return formatDateForDisplay(endDate);
  } catch (error) {
    console.error('Error getting week end date:', error);
    return dateString;
  }
}

/**
 * Get the week number of the year (ISO 8601 standard)
 * @param date - Date object
 * @returns Week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  try {
    // ISO 8601 week calculation
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  } catch (error) {
    console.error('Error getting week number:', error);
    return 1;
  }
}

/**
 * Get the start date of a specific week number in a year
 * @param weekNumber - Week number (1-53)
 * @param year - Year
 * @returns Week start date in dd-mmm-yyyy format
 */
export function getWeekStartDateByNumber(weekNumber: number, year: number): string {
  try {
    // Find the first Thursday of the year
    const firstThursday = new Date(year, 0, 1);
    while (firstThursday.getDay() !== 4) { // 4 = Thursday
      firstThursday.setDate(firstThursday.getDate() + 1);
    }
    
    // Calculate the start of the target week
    const weekStart = new Date(firstThursday);
    weekStart.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);
    
    return formatDateForDisplay(weekStart);
  } catch (error) {
    console.error('Error getting week start date by number:', error);
    return getCurrentDate();
  }
}

/**
 * Get the end date of a specific week number in a year
 * @param weekNumber - Week number (1-53)
 * @param year - Year
 * @returns Week end date in dd-mmm-yyyy format
 */
export function getWeekEndDateByNumber(weekNumber: number, year: number): string {
  try {
    const weekStart = getWeekStartDateByNumber(weekNumber, year);
    const startDate = parseStandardDate(weekStart);
    if (!startDate) {
      throw new Error('Invalid week start date');
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Add 6 days to get to Saturday
    
    return formatDateForDisplay(endDate);
  } catch (error) {
    console.error('Error getting week end date by number:', error);
    return getCurrentDate();
  }
}

/**
 * Get current week start date
 * @returns Current week start date in dd-mmm-yyyy format
 */
export function getCurrentWeekStart(): string {
  const currentDate = getCurrentDate();
  const weekStart = getWeekStartDate(currentDate);
  
  // Debug logging for week calculation
  console.log('🔍 Week calculation debug:', {
    currentDate,
    weekStart,
    currentDateObj: new Date(),
    currentDayOfWeek: new Date().getDay(),
    weekStartObj: parseStandardDate(weekStart)
  });
  
  return weekStart;
}

/**
 * Get current week end date
 * @returns Current week end date in dd-mmm-yyyy format
 */
export function getCurrentWeekEnd(): string {
  return getWeekEndDate(getCurrentDate());
}

/**
 * Fix invalid dates in visit data
 * This function can be used to migrate existing data with invalid dates
 */
export function fixInvalidDate(dateString: string): string {
  if (!dateString || dateString === 'Invalid Date' || dateString === 'NaN') {
    // Return current date as fallback
    return getCurrentDate();
  }
  
  // Try to standardize the date
  const validation = standardizeDate(dateString);
  if (validation.isValid && validation.standardizedDate) {
    return validation.standardizedDate;
  }
  
  // If still invalid, return current date
  return getCurrentDate();
}

/**
 * Validate and fix a date string, returning a valid dd-mmm-yyyy format
 */
export function validateAndFixDate(dateString: string): { isValid: boolean; fixedDate: string; originalDate: string } {
  const originalDate = dateString;
  
  if (!dateString || dateString === 'Invalid Date' || dateString === 'NaN') {
    return {
      isValid: false,
      fixedDate: getCurrentDate(),
      originalDate
    };
  }
  
  const validation = standardizeDate(dateString);
  if (validation.isValid && validation.standardizedDate) {
    return {
      isValid: true,
      fixedDate: validation.standardizedDate,
      originalDate
    };
  }
  
  return {
    isValid: false,
    fixedDate: getCurrentDate(),
    originalDate
  };
}
