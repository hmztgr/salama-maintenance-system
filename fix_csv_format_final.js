const fs = require('fs');

// Load contracts data to get correct contract IDs for each company
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced.csv', 'utf8');
const contractLines = contractsData.split('\n').slice(1); // Skip header

// Create mapping from company ID to contract ID
const companyToContractMap = new Map();
contractLines.forEach(line => {
    if (line.trim()) {
        const [contractId, companyId] = line.split(',');
        companyToContractMap.set(companyId, contractId);
    }
});

// Function to convert date from dd-mm-yyyy to dd-Mon-yyyy
function convertDateFormat(dateStr) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Handle different input formats
    let parts;
    if (dateStr.includes('-')) {
        parts = dateStr.split('-');
    } else if (dateStr.includes('/')) {
        parts = dateStr.split('/');
    } else {
        return dateStr; // Return original if can't parse
    }

    if (parts.length === 3) {
        let day, month, year;
        
        // Handle dd-mm-yyyy or dd/mm/yyyy
        if (parts[0].length <= 2 && parts[1].length <= 2) {
            day = parts[0];
            month = parseInt(parts[1]) - 1; // 0-based index
            year = parts[2];
        } 
        // Handle yyyy-mm-dd
        else if (parts[0].length === 4) {
            year = parts[0];
            month = parseInt(parts[1]) - 1; // 0-based index
            day = parts[2];
        }
        // Handle dd-Mon-yy or dd-Mon-yyyy (already in correct format)
        else if (parts[1].length === 3 && isNaN(parts[1])) {
            return dateStr; // Already in correct format
        }
        else {
            return dateStr; // Can't parse
        }

        if (month >= 0 && month < 12) {
            // Ensure 4-digit year
            if (year.length === 2) {
                year = '20' + year;
            }
            return `${day}-${months[month]}-${year}`;
        }
    }
    return dateStr; // Return original if parsing fails
}

// Read the correct base CSV file
const csvContent = fs.readFileSync('visits_actual_system_format.csv', 'utf8');
const lines = csvContent.split('\n');

// Process each line
const fixedLines = [];
let fixesApplied = 0;
let contractFixes = 0;
let dateFixes = 0;
let statusFixes = 0;

lines.forEach((line, index) => {
    if (index === 0) {
        // Update header to match expected format
        const header = 'معرف الفرع*,معرف العقد*,معرف الشركة*,نوع الزيارة*,حالة الزيارة*,تاريخ الجدولة*,وقت الجدولة,تاريخ التنفيذ,وقت التنفيذ,المدة المتوقعة,خدمة التكييف,خدمة الكهرباء,خدمة السباكة,خدمة النجارة,خدمة الدهان,خدمة التنظيف,خدمة الحدادة,خدمة السيراميك,خدمة الزجاج,خدمة الألمنيوم,خدمة الأرضيات,خدمة الأسقف,خدمة الجدران,حالة الزيارة,ملاحظات,مصدر البيانات';
        fixedLines.push(header);
        return;
    }
    if (!line.trim()) {
        return;
    }

    const columns = line.split(',');
    let hasChanges = false;

    // Ensure we have the right number of columns (26 total)
    while (columns.length < 26) {
        columns.push('');
    }

    // Fix 1: Status field (column 5) - ensure it's "completed"
    if (columns[4] !== 'completed') {
        columns[4] = 'completed';
        hasChanges = true;
        statusFixes++;
    }

    // Fix 2: Contract ID (column 2) - use correct contract for company
    const companyId = columns[2];
    const correctContractId = companyToContractMap.get(companyId);
    if (correctContractId && columns[1] !== correctContractId) {
        columns[1] = correctContractId;
        hasChanges = true;
        contractFixes++;
    }

    // Fix 3: Date formats (columns 6 and 8) - convert to dd-Mon-yyyy
    if (columns[5]) {
        const newScheduledDate = convertDateFormat(columns[5]);
        if (newScheduledDate !== columns[5]) {
            columns[5] = newScheduledDate;
            hasChanges = true;
            dateFixes++;
        }
    }

    if (columns[7]) {
        const newCompletedDate = convertDateFormat(columns[7]);
        if (newCompletedDate !== columns[7]) {
            columns[7] = newCompletedDate;
            hasChanges = true;
            dateFixes++;
        }
    }

    // Fix 4: Status field in column 24 - change "passed" to "completed"
    if (columns[23] === 'passed') {
        columns[23] = 'completed';
        hasChanges = true;
        statusFixes++;
    }

    // Fix 5: Add overallStatus for completed visits (column 25)
    if (columns[4] === 'completed' && !columns[24]) {
        columns[24] = 'passed'; // Default to passed for completed visits
        hasChanges = true;
        statusFixes++;
    }

    // Fix 6: Add source data column (column 26)
    if (!columns[25]) {
        columns[25] = 'system-import';
        hasChanges = true;
    }

    if (hasChanges) {
        fixesApplied++;
    }

    fixedLines.push(columns.join(','));
});

const outputContent = fixedLines.join('\n');
fs.writeFileSync('visits_complete_336_final_fixed_v3.csv', outputContent);

console.log(`Fixes applied: ${fixesApplied}`);
console.log(`Contract fixes: ${contractFixes}`);
console.log(`Date fixes: ${dateFixes}`);
console.log(`Status fixes: ${statusFixes}`);
console.log(`Output file: visits_complete_336_final_fixed_v3.csv`);

// Show sample of first few lines
console.log('\nSample output (first 3 data lines):');
const sampleLines = fixedLines.slice(1, 4);
sampleLines.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Line ${index + 1}: Branch=${cols[0]}, Contract=${cols[1]}, Company=${cols[2]}, Status=${cols[4]}, ScheduledDate=${cols[5]}, CompletedDate=${cols[7]}, OverallStatus=${cols[24]}`);
});

// Count total records
console.log(`\nTotal records: ${fixedLines.length - 1}`);

// Check for specific companies
const companyCounts = {};
fixedLines.slice(1).forEach(line => {
    const cols = line.split(',');
    const companyId = cols[2];
    companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
});

console.log('\nCompany distribution:');
Object.keys(companyCounts).sort().forEach(companyId => {
    console.log(`Company ${companyId}: ${companyCounts[companyId]} visits`);
}); 