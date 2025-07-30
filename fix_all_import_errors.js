const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive fix for all import errors...');

// Read the contracts data for validation
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv', 'utf8');
const contractsLines = contractsData.split('\n');
const contractsHeaders = contractsLines[0].split(',');

// Parse contracts data
const contracts = [];
for (let i = 1; i < contractsLines.length; i++) {
  if (contractsLines[i].trim()) {
    const values = contractsLines[i].split(',');
    if (values.length >= contractsHeaders.length) {
      const contract = {};
      contractsHeaders.forEach((header, index) => {
        contract[header.trim()] = values[index] ? values[index].trim() : '';
      });
      contracts.push(contract);
    }
  }
}

// Create lookup maps for validation
const contractLookup = new Map();
const branchLookup = new Map();
const companyBranchLookup = new Map();

contracts.forEach(contract => {
  const contractId = contract['Contract ID'] || contract['معرف العقد'];
  const companyId = contract['Company ID'] || contract['معرف الشركة'];
  const branchId = contract['Branch ID'] || contract['معرف الفرع'];
  const branchName = contract['Branch Name'] || contract['اسم الفرع'];
  
  if (contractId && companyId && branchId) {
    contractLookup.set(contractId, { companyId, branchId });
    branchLookup.set(branchId, { companyId, contractId });
    
    if (!companyBranchLookup.has(companyId)) {
      companyBranchLookup.set(companyId, []);
    }
    companyBranchLookup.get(companyId).push({ branchId, contractId, branchName });
  }
});

console.log(`📊 Loaded ${contracts.length} contracts`);
console.log(`📊 Found ${contractLookup.size} valid contract mappings`);
console.log(`📊 Found ${branchLookup.size} valid branch mappings`);

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
let errorCount = 0;

const fixedVisits = visits.map((visit, index) => {
  const originalVisit = { ...visit };
  let hasChanges = false;
  
  // 1. Fix status field - change from 'passed' to 'completed'
  if (visit['حالة الزيارة*'] === 'passed') {
    visit['حالة الزيارة*'] = 'completed';
    hasChanges = true;
    console.log(`✅ Fixed status for visit ${index + 1}: passed → completed`);
  }
  
  // 2. Validate and fix companyId, contractId, branchId relationships
  const companyId = visit['معرف الشركة*'];
  const contractId = visit['معرف العقد*'];
  const branchId = visit['معرف الفرع*'];
  
  // Check if this combination exists in contracts
  const contractInfo = contractLookup.get(contractId);
  const branchInfo = branchLookup.get(branchId);
  
  if (!contractInfo) {
    console.log(`❌ Contract ${contractId} not found in contracts data`);
    errorCount++;
  } else if (contractInfo.companyId !== companyId) {
    console.log(`❌ Contract ${contractId} belongs to company ${contractInfo.companyId}, not ${companyId}`);
    errorCount++;
  } else if (contractInfo.branchId !== branchId) {
    console.log(`❌ Contract ${contractId} is associated with branch ${contractInfo.branchId}, not ${branchId}`);
    errorCount++;
  }
  
  if (!branchInfo) {
    console.log(`❌ Branch ${branchId} not found in contracts data`);
    errorCount++;
  } else if (branchInfo.companyId !== companyId) {
    console.log(`❌ Branch ${branchId} belongs to company ${branchInfo.companyId}, not ${companyId}`);
    errorCount++;
  } else if (branchInfo.contractId !== contractId) {
    console.log(`❌ Branch ${branchId} is associated with contract ${branchInfo.contractId}, not ${contractId}`);
    errorCount++;
  }
  
  // 3. Fix date formatting - ensure consistent dd-mm-yyyy format
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
console.log(`❌ Found ${errorCount} validation errors`);

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
fs.writeFileSync('visits_final_fixed.csv', outputContent, 'utf8');

console.log(`\n✅ Generated visits_final_fixed.csv with ${fixedVisits.length} records`);
console.log(`📁 File saved as: visits_final_fixed.csv`);

// Generate validation report
console.log(`\n📋 Validation Report:`);
console.log(`Total visits processed: ${visits.length}`);
console.log(`Records with fixes: ${fixedCount}`);
console.log(`Validation errors found: ${errorCount}`);

if (errorCount > 0) {
  console.log(`\n⚠️  WARNING: ${errorCount} validation errors found.`);
  console.log(`   These records may still fail import due to invalid relationships.`);
  console.log(`   Please review the contract and branch mappings.`);
} else {
  console.log(`\n🎉 All records passed validation!`);
} 