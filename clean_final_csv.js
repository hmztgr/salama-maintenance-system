const fs = require('fs');

// Read the current CSV file
const csvContent = fs.readFileSync('visits_complete_336_final_fixed_v4.csv', 'utf8');
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
    
    // Remove duplicate columns at the end (keep only first 26 columns)
    const cleanedColumns = columns.slice(0, 26);
    
    // Ensure we have exactly 26 columns
    while (cleanedColumns.length < 26) {
        cleanedColumns.push('');
    }
    
    cleanedLines.push(cleanedColumns.join(','));
});

const outputContent = cleanedLines.join('\n');
fs.writeFileSync('visits_complete_336_final_clean.csv', outputContent);

console.log(`Cleaned CSV file created: visits_complete_336_final_clean.csv`);
console.log(`Total records: ${cleanedLines.length - 1}`);

// Show sample of first few lines
console.log('\nSample output (first 3 data lines):');
const sampleLines = cleanedLines.slice(1, 4);
sampleLines.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Line ${index + 1}: Branch=${cols[0]}, Contract=${cols[1]}, Company=${cols[2]}, Status=${cols[4]}, ScheduledDate=${cols[5]}, CompletedDate=${cols[7]}, OverallStatus=${cols[24]}`);
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