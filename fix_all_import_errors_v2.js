const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive fix for all import errors (Version 2)...');

// Read the contracts data for validation
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv', 'utf8');
const contractsLines = contractsData.split('\n');

// Skip the first 3 lines (header info)
const dataLines = contractsLines.slice(3);
const contractsHeaders = dataLines[0].split(',');

console.log('📊 Contracts headers:', contractsHeaders);

// Parse contracts data
const contracts = [];
for (let i = 1; i < dataLines.length; i++) {
  if (dataLines[i].trim()) {
    const values = dataLines[i].split(',');
    if (values.length >= contractsHeaders.length) {
      const contract = {};
      contractsHeaders.forEach((header, index) => {
        contract[header.trim()] = values[index] ? values[index].trim().replace(/"/g, '') : '';
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
  const contractId = contract['معرف العقد'];
  const companyId = contract['معرف الشركة'];
  const branchIds = contract['معرفات الفروع'];
  const branchNames = contract['أسماء الفروع'];
  
  if (contractId && companyId && branchIds) {
    // Split branch IDs (they can be comma-separated)
    const branchIdList = branchIds.split(',').map(id => id.trim());
    const branchNameList = branchNames ? branchNames.split(',').map(name => name.trim()) : [];
    
    contractLookup.set(contractId, { companyId, branchIds: branchIdList });
    
    branchIdList.forEach((branchId, index) => {
      const branchName = branchNameList[index] || '';
      branchLookup.set(branchId, { companyId, contractId, branchName });
      
      if (!companyBranchLookup.has(companyId)) {
        companyBranchLookup.set(companyId, []);
      }
      companyBranchLookup.get(companyId).push({ branchId, contractId, branchName });
    });
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
  } else if (!contractInfo.branchIds.includes(branchId)) {
    console.log(`❌ Contract ${contractId} is not associated with branch ${branchId}`);
    console.log(`   Available branches: ${contractInfo.branchIds.join(', ')}`);
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
fs.writeFileSync('visits_final_fixed_v2.csv', outputContent, 'utf8');

console.log(`\n✅ Generated visits_final_fixed_v2.csv with ${fixedVisits.length} records`);
console.log(`📁 File saved as: visits_final_fixed_v2.csv`);

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

// Show some examples of valid contracts for debugging
console.log(`\n🔍 Sample valid contracts:`);
const sampleContracts = Array.from(contractLookup.entries()).slice(0, 5);
sampleContracts.forEach(([contractId, info]) => {
  console.log(`   ${contractId} → Company: ${info.companyId}, Branches: ${info.branchIds.join(', ')}`);
}); 