const fs = require('fs');

// Read the current CSV file
const csvContent = fs.readFileSync('visits_complete_336_final_clean.csv', 'utf8');
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
    
    // Remove all duplicate columns and keep only the first 26 columns
    const cleanedColumns = columns.slice(0, 26);
    
    // Ensure we have exactly 26 columns
    while (cleanedColumns.length < 26) {
        cleanedColumns.push('');
    }
    
    // Fix the overallStatus column (column 25) - should be "passed" not "passed,system-import"
    if (cleanedColumns[24] && cleanedColumns[24].includes('passed,system-import')) {
        cleanedColumns[24] = 'passed';
    }
    
    // Fix the source data column (column 26) - should be "system-import"
    if (cleanedColumns[25] && cleanedColumns[25].includes('system-import')) {
        cleanedColumns[25] = 'system-import';
    }
    
    cleanedLines.push(cleanedColumns.join(','));
});

const outputContent = cleanedLines.join('\n');
fs.writeFileSync('visits_complete_336_final_ready.csv', outputContent);

console.log(`Final cleaned CSV file created: visits_complete_336_final_ready.csv`);
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