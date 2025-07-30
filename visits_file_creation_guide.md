# Visits File Creation Guide

## Overview
This document explains the complete process of creating the `visits_complete_336_perfect_final.csv` file from the original `زيارات CSV.csv` file, ensuring all dates are accurate and properly distributed across branches.

## Source Files

### Primary Source Files
1. **`زيارات CSV.csv`** - Original visits data with client names, locations, and visit dates
2. **`export_contracts_2025-07-29_enhanced (1).csv`** - Contract data containing company IDs, branch IDs, and contract mappings

### Key Data Structure
- **Original CSV**: Contains client names, locations, and 30 visit date columns (columns 4-33)
- **Contracts CSV**: Contains company IDs, branch IDs, and contract relationships

## Process Overview

### Phase 1: Data Analysis and Mapping
1. **Company Name Mapping**: Created manual mapping between Arabic company names and company IDs
2. **Branch-Contract Mapping**: Extracted branch-to-contract and company-to-branch relationships
3. **Date Format Standardization**: Handled various date formats (dd/mm/yyyy, dd-Mon-yyyy, etc.)

### Phase 2: Date Extraction and Validation
1. **Original Date Extraction**: Extracted all visit dates from the original CSV
2. **Date Format Conversion**: Standardized all dates to dd-Mon-yyyy format
3. **Date Validation**: Ensured all dates are valid and complete

### Phase 3: Visit Generation and Distribution
1. **Visit Creation**: Created individual visit records for each date
2. **Branch Assignment**: Distributed visits across available branches using round-robin algorithm
3. **Data Population**: Populated all required fields for each visit record

## Scripts Created and Their Functions

### 1. `fix_date_comparison.js`
**Purpose**: Compare dates between original and generated files
**Functions**:
- Extract dates from original CSV by company
- Extract dates from generated CSV by company
- Identify mismatches and missing dates
- Verify specific dates (e.g., Company 0033 screenshot dates)

### 2. `final_perfect_dates.js`
**Purpose**: Generate the final CSV with only original dates
**Functions**:
- Read original visits CSV and extract all dates
- Read contracts CSV and create branch mappings
- Generate visit records with exact original dates
- Distribute visits across branches evenly
- Create 26-column CSV with proper format

### 3. `final_verification.js`
**Purpose**: Comprehensive verification of the generated file
**Functions**:
- Verify total record count (336)
- Verify column count (26)
- Check for empty or invalid dates
- Verify Company 0033 has exactly 48 visits
- Verify all dates exist in original file
- Verify screenshot dates are present
- Check branch distribution

## Key Algorithms and Logic

### Date Format Conversion
```javascript
function convertDateFormat(dateStr) {
    // Handle m/d/yyyy format
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        const month = parseInt(parts[0]) - 1;
        const day = parts[1];
        const year = parts[2];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[month]}-${year}`;
    }
    
    // Handle incomplete dates like "24-Sep"
    if (dateStr.match(/^\d{1,2}-[A-Za-z]{3}$/)) {
        return `${dateStr}-2024`;
    }
    
    return dateStr;
}
```

### Branch Distribution Algorithm
```javascript
// Round-robin distribution across available branches
const currentUsage = companyBranchUsage.get(companyId);
const selectedBranchIndex = currentUsage % availableBranches.length;
const selectedBranchId = availableBranches[selectedBranchIndex];
```

### Company Name Mapping
```javascript
const companyNameMapping = {
    'شركة عناية العالمية': '0033',
    'شركة هلا للخدمات المساندة': '0045',
    // ... complete mapping for all companies
};
```

## Output File Structure

### CSV Format
- **26 columns** with specific headers
- **336 records** (one for each visit)
- **Proper encoding** for Arabic text

### Column Structure
1. `معرف الفرع*` - Branch ID
2. `معرف العقد*` - Contract ID
3. `معرف الشركة*` - Company ID
4. `نوع الزيارة*` - Visit Type (always "regular")
5. `حالة الزيارة*` - Visit Status (always "completed")
6. `تاريخ الجدولة*` - Scheduled Date (original date)
7. `وقت الجدولة` - Scheduled Time (09:00)
8. `تاريخ التنفيذ` - Execution Date (same as scheduled)
9. `وقت التنفيذ` - Execution Time (11:30)
10. `المدة المتوقعة` - Expected Duration (150 minutes)
11-22. Service fields (empty)
23. `حالة الزيارة` - Visit Status (completed)
24. `ملاحظات` - Notes (passed)
25. `مصدر البيانات` - Data Source (system-import)

## Quality Assurance

### Verification Steps
1. **Record Count**: Ensure exactly 336 records
2. **Column Count**: Ensure exactly 26 columns
3. **Date Validation**: No empty or invalid dates
4. **Original Date Verification**: All dates exist in source file
5. **Company 0033 Verification**: Exactly 48 visits with correct dates
6. **Branch Distribution**: Even distribution across branches

### Success Criteria
- ✅ All 336 visits from original file included
- ✅ All dates match original file exactly
- ✅ Company 0033 has 48 visits with correct distribution
- ✅ All screenshot dates present and correct
- ✅ Proper 26-column format
- ✅ No validation errors

## Troubleshooting

### Common Issues
1. **Date Format Mismatches**: Use date conversion function
2. **Missing Company Mappings**: Add to companyNameMapping
3. **Branch Assignment Issues**: Check branch availability in contracts file
4. **Encoding Issues**: Ensure proper UTF-8 encoding

### Debugging Tools
- Use `fix_date_comparison.js` to identify date mismatches
- Use `final_verification.js` for comprehensive validation
- Check console output for specific error messages

## Future Improvements

### Potential Enhancements
1. **Automated Company Mapping**: Generate mappings from database
2. **Dynamic Branch Assignment**: Use business rules for branch selection
3. **Date Validation Rules**: Add business-specific date validation
4. **Performance Optimization**: Handle larger datasets efficiently

### Maintenance
1. **Regular Verification**: Run verification scripts after any changes
2. **Documentation Updates**: Keep this guide updated with process changes
3. **Script Versioning**: Maintain version control for all scripts

## File Dependencies

### Required Files
- `.same/project documents/CSVs/زيارات CSV.csv`
- `.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv`

### Generated Files
- `visits_complete_336_perfect_final.csv` (final output)
- `fix_date_comparison.js` (verification script)
- `final_perfect_dates.js` (generation script)
- `final_verification.js` (comprehensive verification)

---

*This guide documents the process used to create the visits file as of the current implementation. For any modifications or improvements, please update this document accordingly.* 