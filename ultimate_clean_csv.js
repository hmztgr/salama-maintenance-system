const fs = require('fs');

// Read the current CSV file
const csvContent = fs.readFileSync('visits_complete_336_final_ready.csv', 'utf8');
const lines = csvContent.split('\n');

// Process each line to clean up duplicate columns
const cleanedLines = [];

lines.forEach((line, index) => {
    if (index === 0) {
        // Keep the header as is
        cleanedLines.push(line);
        return;
    }
    if (!line.trim()) {
        return;
    }

    const columns = line.split(',');
    
    // Take only the first 26 columns and ensure proper values
    const cleanedColumns = [];
    
    // Copy first 26 columns
    for (let i = 0; i < 26; i++) {
        if (i < columns.length) {
            cleanedColumns.push(columns[i]);
        } else {
            cleanedColumns.push('');
        }
    }
    
    // Fix specific columns
    // Column 24 (overallStatus) - should be "passed"
    if (cleanedColumns[24] && cleanedColumns[24].includes('passed')) {
        cleanedColumns[24] = 'passed';
    }
    
    // Column 25 (source data) - should be "system-import"
    if (cleanedColumns[25] && cleanedColumns[25].includes('system-import')) {
        cleanedColumns[25] = 'system-import';
    }
    
    cleanedLines.push(cleanedColumns.join(','));
});

const outputContent = cleanedLines.join('\n');
fs.writeFileSync('visits_complete_336_final_ultimate.csv', outputContent);

console.log(`Ultimate cleaned CSV file created: visits_complete_336_final_ultimate.csv`);
console.log(`Total records: ${cleanedLines.length - 1}`);

// Show sample of first few lines
console.log('\nSample output (first 3 data lines):');
const sampleLines = cleanedLines.slice(1, 4);
sampleLines.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Line ${index + 1}: Branch=${cols[0]}, Contract=${cols[1]}, Company=${cols[2]}, Status=${cols[4]}, ScheduledDate=${cols[5]}, CompletedDate=${cols[7]}, OverallStatus=${cols[24]}, Source=${cols[25]}`);
});

// Count total records
console.log(`\nTotal records: ${cleanedLines.length - 1}`);

// Check for specific companies
const companyCounts = {};
cleanedLines.slice(1).forEach(line => {
    const cols = line.split(',');
    const companyId = cols[2];
    companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
});

console.log('\nCompany distribution:');
Object.keys(companyCounts).sort().forEach(companyId => {
    console.log(`Company ${companyId}: ${companyCounts[companyId]} visits`);
});

// Show some specific examples
console.log('\nSample records:');
const sampleRecords = cleanedLines.slice(1, 6);
sampleRecords.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Record ${index + 1}: ${cols[0]} | ${cols[1]} | ${cols[2]} | ${cols[4]} | ${cols[5]} | ${cols[24]} | ${cols[25]}`);
});

// Verify column count
console.log('\nColumn count verification:');
const firstDataLine = cleanedLines[1];
const columnCount = firstDataLine.split(',').length;
console.log(`Columns in data line: ${columnCount}`);
console.log(`Expected: 26 columns`);
console.log(`Status: ${columnCount === 26 ? 'PASS' : 'FAIL'}`); 