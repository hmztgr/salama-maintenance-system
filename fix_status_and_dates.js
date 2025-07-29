const fs = require('fs');

console.log('🔧 Starting status and date fixes...');

// Read the current visits CSV
const visitsData = fs.readFileSync('visits_complete_336_improved.csv', 'utf8');
const visitsLines = visitsData.split('\n');
const visitsHeaders = visitsLines[0].split(',');

console.log(`📊 Processing ${visitsLines.length - 1} visit records`);

// Parse visits data
const visits = [];
for (let i = 1; i < visitsLines.length; i++) {
  if (visitsLines[i].trim()) {
    const values = visitsLines[i].split(',');
    if (values.length >= visitsHeaders.length) {
      const visit = {};
      visitsHeaders.forEach((header, index) => {
        visit[header.trim()] = values[index] ? values[index].trim() : '';
      });
      visits.push(visit);
    }
  }
}

// Fix all issues
let fixedCount = 0;
let statusFixedCount = 0;
let dateFixedCount = 0;

const fixedVisits = visits.map((visit, index) => {
  const originalVisit = { ...visit };
  let hasChanges = false;
  
  // 1. Fix status field - change from 'passed' to 'completed'
  if (visit['حالة الزيارة*'] === 'passed') {
    visit['حالة الزيارة*'] = 'completed';
    hasChanges = true;
    statusFixedCount++;
    console.log(`✅ Fixed status for visit ${index + 1}: passed → completed`);
  }
  
  // 2. Fix date formatting - ensure consistent dd-mm-yyyy format
  const scheduledDate = visit['تاريخ الجدولة*'];
  const completedDate = visit['تاريخ التنفيذ'];
  
  if (scheduledDate) {
    // Parse and reformat date
    const dateParts = scheduledDate.split('-');
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      
      if (year.length === 2) {
        // Convert 2-digit year to 4-digit
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        const newDate = `${day}-${month}-${fullYear}`;
        if (newDate !== scheduledDate) {
          visit['تاريخ الجدولة*'] = newDate;
          hasChanges = true;
          dateFixedCount++;
          console.log(`✅ Fixed scheduled date for visit ${index + 1}: ${scheduledDate} → ${newDate}`);
        }
      }
    }
  }
  
  if (completedDate) {
    // Parse and reformat date
    const dateParts = completedDate.split('-');
    if (dateParts.length === 3) {
      const day = dateParts[0].padStart(2, '0');
      const month = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      
      if (year.length === 2) {
        // Convert 2-digit year to 4-digit
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        const newDate = `${day}-${month}-${fullYear}`;
        if (newDate !== completedDate) {
          visit['تاريخ التنفيذ'] = newDate;
          hasChanges = true;
          dateFixedCount++;
          console.log(`✅ Fixed completed date for visit ${index + 1}: ${completedDate} → ${newDate}`);
        }
      }
    }
  }
  
  if (hasChanges) {
    fixedCount++;
  }
  
  return visit;
});

console.log(`\n📊 Summary:`);
console.log(`✅ Fixed ${fixedCount} records`);
console.log(`   - Status fixes: ${statusFixedCount}`);
console.log(`   - Date fixes: ${dateFixedCount}`);

// Generate the fixed CSV
const outputHeaders = visitsHeaders;
const outputLines = [outputHeaders.join(',')];

fixedVisits.forEach(visit => {
  const line = outputHeaders.map(header => {
    const value = visit[header.trim()] || '';
    // Escape commas and quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  });
  outputLines.push(line.join(','));
});

// Write with UTF-8 BOM for Arabic support
const outputContent = '\ufeff' + outputLines.join('\n');
fs.writeFileSync('visits_status_dates_fixed.csv', outputContent, 'utf8');

console.log(`\n✅ Generated visits_status_dates_fixed.csv with ${fixedVisits.length} records`);
console.log(`📁 File saved as: visits_status_dates_fixed.csv`);

// Generate summary report
console.log(`\n📋 Summary Report:`);
console.log(`Total visits processed: ${visits.length}`);
console.log(`Records with fixes: ${fixedCount}`);
console.log(`Status field fixes: ${statusFixedCount}`);
console.log(`Date format fixes: ${dateFixedCount}`);

console.log(`\n🎉 Status and date fixes completed!`);
console.log(`   The CSV should now have valid status values ('completed') and proper date formats.`);
console.log(`   Note: Contract/branch relationship issues may still need to be addressed separately.`); 