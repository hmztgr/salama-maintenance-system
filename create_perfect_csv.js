const fs = require('fs');

// Read the enhanced contracts data to get correct branch-to-contract mapping
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv', 'utf8');
const contractLines = contractsData.split('\n').slice(4); // Skip header lines

// Create mapping from branch ID to contract ID
const branchToContractMap = new Map();
contractLines.forEach(line => {
    if (line.trim() && !line.startsWith('معرف العقد')) {
        // Parse the line: "0033-007","0033","14-Nov-2024","13-Nov-2025","0033-JED-007-0007","الفيحاء - نساء"
        const parts = line.split('","');
        if (parts.length >= 5) {
            const contractId = parts[0].replace(/"/g, '');
            const companyId = parts[1].replace(/"/g, '');
            const branchIds = parts[4].replace(/"/g, '').split(',');
            
            branchIds.forEach(branchId => {
                branchToContractMap.set(branchId.trim(), contractId);
            });
        }
    }
});

// Read the visits data
const visitsData = fs.readFileSync('visits_actual_system_format.csv', 'utf8');
const visitLines = visitsData.split('\n');

// Create the perfect CSV
const perfectLines = [];

// Add header
perfectLines.push('معرف الفرع*,معرف العقد*,معرف الشركة*,نوع الزيارة*,حالة الزيارة*,تاريخ الجدولة*,وقت الجدولة,تاريخ التنفيذ,وقت التنفيذ,المدة المتوقعة,خدمة التكييف,خدمة الكهرباء,خدمة السباكة,خدمة النجارة,خدمة الدهان,خدمة التنظيف,خدمة الحدادة,خدمة السيراميك,خدمة الزجاج,خدمة الألمنيوم,خدمة الأرضيات,خدمة الأسقف,خدمة الجدران,حالة الزيارة,ملاحظات,مصدر البيانات');

// Process each visit line
visitLines.slice(1).forEach(line => {
    if (!line.trim()) return;
    
    const columns = line.split(',');
    
    // Extract the key fields
    const branchId = columns[0];
    const companyId = columns[2];
    const scheduledDate = columns[5];
    const completedDate = columns[7];
    
    // Get the correct contract ID
    const contractId = branchToContractMap.get(branchId) || '0001-001';
    
    // Create the perfect row with exactly 26 columns
    const perfectRow = [
        branchId,                    // 0: معرف الفرع*
        contractId,                  // 1: معرف العقد*
        companyId,                   // 2: معرف الشركة*
        'regular',                   // 3: نوع الزيارة*
        'completed',                 // 4: حالة الزيارة*
        scheduledDate,               // 5: تاريخ الجدولة*
        '09:00',                     // 6: وقت الجدولة
        completedDate,               // 7: تاريخ التنفيذ
        '11:30',                     // 8: وقت التنفيذ
        '150',                       // 9: المدة المتوقعة
        '',                          // 10: خدمة التكييف
        '',                          // 11: خدمة الكهرباء
        '',                          // 12: خدمة السباكة
        '',                          // 13: خدمة النجارة
        '',                          // 14: خدمة الدهان
        '',                          // 15: خدمة التنظيف
        '',                          // 16: خدمة الحدادة
        '',                          // 17: خدمة السيراميك
        '',                          // 18: خدمة الزجاج
        '',                          // 19: خدمة الألمنيوم
        '',                          // 20: خدمة الأرضيات
        '',                          // 21: خدمة الأسقف
        '',                          // 22: خدمة الجدران
        'completed',                 // 23: حالة الزيارة
        'passed',                    // 24: ملاحظات (overallStatus)
        'system-import'              // 25: مصدر البيانات
    ];
    
    perfectLines.push(perfectRow.join(','));
});

const outputContent = perfectLines.join('\n');
fs.writeFileSync('visits_complete_336_perfect.csv', outputContent);

console.log(`Perfect CSV file created: visits_complete_336_perfect.csv`);
console.log(`Total records: ${perfectLines.length - 1}`);

// Show sample of first few lines
console.log('\nSample output (first 3 data lines):');
const sampleLines = perfectLines.slice(1, 4);
sampleLines.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Line ${index + 1}: Branch=${cols[0]}, Contract=${cols[1]}, Company=${cols[2]}, Status=${cols[4]}, ScheduledDate=${cols[5]}, CompletedDate=${cols[7]}, OverallStatus=${cols[24]}, Source=${cols[25]}`);
});

// Count total records
console.log(`\nTotal records: ${perfectLines.length - 1}`);

// Check for specific companies
const companyCounts = {};
perfectLines.slice(1).forEach(line => {
    const cols = line.split(',');
    const companyId = cols[2];
    companyCounts[companyId] = (companyCounts[companyId] || 0) + 1;
});

console.log('\nCompany distribution:');
Object.keys(companyCounts).sort().forEach(companyId => {
    console.log(`Company ${companyId}: ${companyCounts[companyId]} visits`);
});

// Verify column count
console.log('\nColumn count verification:');
const firstDataLine = perfectLines[1];
const columnCount = firstDataLine.split(',').length;
console.log(`Columns in data line: ${columnCount}`);
console.log(`Expected: 26 columns`);
console.log(`Status: ${columnCount === 26 ? 'PASS' : 'FAIL'}`);

// Show some specific examples
console.log('\nSample records:');
const sampleRecords = perfectLines.slice(1, 6);
sampleRecords.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Record ${index + 1}: ${cols[0]} | ${cols[1]} | ${cols[2]} | ${cols[4]} | ${cols[5]} | ${cols[24]} | ${cols[25]}`);
}); 