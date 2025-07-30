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

console.log('Company to Contract mapping:');
companyToContractMap.forEach((contractId, companyId) => {
    console.log(`Company ${companyId} -> Contract ${contractId}`);
});

// Function to convert date from dd-mm-yyyy to dd-Mon-yyyy
function convertDateFormat(dateStr) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parts[0];
        const month = parseInt(parts[1]) - 1; // 0-based index
        const year = parts[2];
        
        if (month >= 0 && month < 12) {
            return `${day}-${months[month]}-${year}`;
        }
    }
    return dateStr; // Return original if parsing fails
}

// Read the current CSV file
const csvContent = fs.readFileSync('visits_complete_336_improved.csv', 'utf8');
const lines = csvContent.split('\n');

// Process each line
const fixedLines = [];
let fixesApplied = 0;

lines.forEach((line, index) => {
    if (index === 0) {
        // Keep header as is
        fixedLines.push(line);
        return;
    }
    
    if (!line.trim()) {
        // Skip empty lines
        return;
    }
    
    const columns = line.split(',');
    let hasChanges = false;
    
    // Fix 1: Status field (column 5) - ensure it's "completed"
    if (columns[4] !== 'completed') {
        columns[4] = 'completed';
        hasChanges = true;
    }
    
    // Fix 2: Contract ID (column 2) - use correct contract for company
    const companyId = columns[2];
    const correctContractId = companyToContractMap.get(companyId);
    if (correctContractId && columns[1] !== correctContractId) {
        columns[1] = correctContractId;
        hasChanges = true;
        console.log(`Fixed contract for company ${companyId}: ${columns[1]} -> ${correctContractId}`);
    }
    
    // Fix 3: Date formats (columns 6 and 8) - convert to dd-Mon-yyyy
    if (columns[5]) {
        const newScheduledDate = convertDateFormat(columns[5]);
        if (newScheduledDate !== columns[5]) {
            columns[5] = newScheduledDate;
            hasChanges = true;
        }
    }
    
    if (columns[7]) {
        const newCompletedDate = convertDateFormat(columns[7]);
        if (newCompletedDate !== columns[7]) {
            columns[7] = newCompletedDate;
            hasChanges = true;
        }
    }
    
    // Fix 4: Status field in column 24 - change "passed" to "completed"
    if (columns[23] === 'passed') {
        columns[23] = 'completed';
        hasChanges = true;
    }
    
    // Fix 5: Add overallStatus for completed visits (column 25)
    if (columns[4] === 'completed' && !columns[24]) {
        columns[24] = 'passed'; // Default to passed for completed visits
        hasChanges = true;
    }
    
    if (hasChanges) {
        fixesApplied++;
    }
    
    fixedLines.push(columns.join(','));
});

// Write the fixed CSV
const outputContent = fixedLines.join('\n');
fs.writeFileSync('visits_complete_336_final.csv', outputContent);

console.log(`\nFixes applied: ${fixesApplied}`);
console.log('Fixed CSV saved as: visits_complete_336_final.csv');

// Show sample of fixed data
console.log('\nSample of fixed data:');
const sampleLines = fixedLines.slice(1, 6); // First 5 data rows
sampleLines.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Row ${index + 1}: Branch=${cols[0]}, Contract=${cols[1]}, Company=${cols[2]}, Status=${cols[4]}, ScheduledDate=${cols[5]}, CompletedDate=${cols[7]}, OverallStatus=${cols[24]}`);
}); 