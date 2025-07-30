const fs = require('fs');

console.log('🔧 Starting status field fix...');

// Read the current visits CSV
const visitsData = fs.readFileSync('visits_complete_336_improved.csv', 'utf8');
const visitsLines = visitsData.split('\n');
const visitsHeaders = visitsLines[0].split(',');

console.log(`📊 Processing ${visitsLines.length - 1} visit records`);

// Find the index of the problematic status field (the second one)
const statusFieldIndex = visitsHeaders.findIndex(header => header.trim() === 'حالة الزيارة');
console.log(`📊 Found status field at index: ${statusFieldIndex}`);

if (statusFieldIndex === -1) {
  console.log('❌ Could not find status field');
  process.exit(1);
}

// Fix the status field in each row
let fixedCount = 0;
const fixedLines = [];

// Keep the header as is
fixedLines.push(visitsLines[0]);

// Process each data row
for (let i = 1; i < visitsLines.length; i++) {
  if (visitsLines[i].trim()) {
    const values = visitsLines[i].split(',');
    
    // Check if this row has enough columns and the status field is 'passed'
    if (values.length > statusFieldIndex && values[statusFieldIndex] === 'passed') {
      values[statusFieldIndex] = 'completed';
      fixedCount++;
      console.log(`✅ Fixed status for row ${i}: passed → completed`);
    }
    
    fixedLines.push(values.join(','));
  }
}

// Write with UTF-8 BOM for Arabic support
const outputContent = '\ufeff' + fixedLines.join('\n');
fs.writeFileSync('visits_status_fixed.csv', outputContent, 'utf8');

console.log(`\n📊 Summary:`);
console.log(`✅ Fixed ${fixedCount} records`);
console.log(`📁 File saved as: visits_status_fixed.csv`);

console.log(`\n🎉 Status field fix completed!`);
console.log(`   The CSV should now have valid status values ('completed') in the second status field.`); 