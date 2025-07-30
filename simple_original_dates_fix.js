const fs = require('fs');

// Read the enhanced contracts data to get actual branch IDs
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv', 'utf8');
const contractLines = contractsData.split('\n').slice(4);

// Create simple mappings
const branchToContractMap = new Map();
const branchToCompanyMap = new Map();

contractLines.forEach(line => {
    if (line.trim() && !line.startsWith('معرف العقد')) {
        const parts = line.split('","');
        if (parts.length >= 6) {
            const contractId = parts[0].replace(/"/g, '');
            const companyId = parts[1].replace(/"/g, '');
            const branchIds = parts[4].replace(/"/g, '').split(',');
            
            branchIds.forEach(branchId => {
                const cleanBranchId = branchId.trim();
                if (cleanBranchId) {
                    branchToContractMap.set(cleanBranchId, contractId);
                    branchToCompanyMap.set(cleanBranchId, companyId);
                }
            });
        }
    }
});

// Read the original visits CSV
const originalVisitsData = fs.readFileSync('.same/project documents/CSVs/زيارات CSV.csv', 'utf8');
const visitLines = originalVisitsData.split('\n');

// Create the perfect CSV with original dates
const perfectLines = [];

// Add header
perfectLines.push('معرف الفرع*,معرف العقد*,معرف الشركة*,نوع الزيارة*,حالة الزيارة*,تاريخ الجدولة*,وقت الجدولة,تاريخ التنفيذ,وقت التنفيذ,المدة المتوقعة,خدمة التكييف,خدمة الكهرباء,خدمة السباكة,خدمة النجارة,خدمة الدهان,خدمة التنظيف,خدمة الحدادة,خدمة السيراميك,خدمة الزجاج,خدمة الألمنيوم,خدمة الأرضيات,خدمة الأسقف,خدمة الجدران,حالة الزيارة,ملاحظات,مصدر البيانات');

// Simple company mapping based on the original CSV structure
const companyMapping = {
    'شركة عناية العالمية': '0033',
    'شركة هلا للخدمات المساندة': '0045',
    'عالم التدوير للبلاستيك': '0049',
    'مرزوق البقمي': '0056',
    'شركة خدمات الضيافة العربية لتشغيل الفنادق': '0027',
    'شركة النافع للأغذية': '0019',
    'شركة النافع للتجارة للتخزين': '0020',
    'أبحر بلازا': '0001',
    'شركة محترفو البحر العربية السعودية المحدودة - نادي جدة لليخوت': '0009',
    'شركة أبناء عبدالله الخريف': '0010',
    'شركة اسنى للتقنيات المتطورة المحدودة': '0012',
    'مصنع وصل الخير للمنتجات المعدنية': '0051',
    'شركة الاحسن للتجارة': '0054',
    'قرطاسية ومكتبة صخر': '0025',
    'محطة بترولكس': '0023',
    'شركة بوليمرز': '0048',
    'شركة مصنع الانهار -نستلة': '0055',
    'شركة بترا السعودية للصناعات الهندسية': '0042',
    'ورثة احمد محمد شمسان ( مستودعات الخمرة)': '0061',
    'إدارة اوقاف احمد محمد شمسان (حارة الشام)': '0002',
    'إدارة اوقاف احمد محمد شمسان ( 9 عمائر ومحلات)': '0002',
    'شمسان بلازا': '0048',
    'مؤسسة بشرة منتعشة للتجارة - جيلا': '0069',
    'مدرسة براعم الوطن': '0014',
    'شركة نسما العالمية لتقنيات المياه والطاقة': '0044',
    'شركة سما الدرعية': '0017',
    'شركة كنز المستقبل': '0036',
    'شركة الحوطي ستانجر المحدودة': '0005',
    'الشركة العربية للهدايا الراقية': '0021',
    'شركة الجمال لمستحضرات التجميل': '0013',
    'شركة مجموعة الشلهوب العربية': '0039',
    'شركة النجيمة التجارية المحدودة': '0026',
    'شركة بوتش العربية': '0024',
    'شركة بي سي دي العربية': '0029',
    'شركة كرستيان ديور': '0035',
    'شركة رضوى التجارية': '0030',
    'شركة سيفورا العربية': '0031',
    'شركة فندي السعودية': '0034',
    'شركة لوكستيان العربية': '0037',
    'شركة لويس فيتون': '0038',
    'جامعة دار الحكمة': '0005',
    'شركة الخيال اللامحدودة- كيو': '0018',
    'مؤسسة الشهباء المتطورة لتشغيل الفنادق': '0006',
    'شركة منتجات صناعة الاسمنت': '0042',
    'ذا فيلج مول': '0006',
    'شركة الخريف التجارية - المستودع': '0015',
    'شركة الخريف التجارية - الورشة المركزية': '0015',
    'شركة الخريف التجارية - اوتو مول': '0015',
    'شركة الخريف التجارية - ورشة جازان': '0015',
    'شركة الهلال الذهبي - محطة ناقلين': '0022',
    'مصنع الكيماويات الصناعية': '0061',
    'شركة ناسكو العربية لوساطة اعادة التامين': '0043',
    'مركز تناغم الحياة': '0060',
    'شركة هلا للخدمات المساندة مستودع B': '0045',
    'عيادة الدكتور عمر العامودي': '0068',
    'مجمع بن رشد الطبية': '0053',
    'مصنع المرام للمستلزمات الطبية': '0046',
    'ترنكيلا كافي': '0004',
    'شركة اعمار المعارف - كلية الأمير محمد': '0011',
    'مون بلاك': '0066',
    'روضة الأطفال - براعة الصغار': '0007',
    'نقطة المراقبة للخدمات البيئية': '0060',
    'شركة صفوة المفروشات المحدودة': '0032',
    'شركة MHP العربية السعودية': '0008',
    'مشهور الفايز': '0002',
    'شركة الخليجية المتطورة للسيارات': '0016',
    'مركز الرعاية المتطورة': '0057',
    'شركة دار الهوات': '0028',
    'شركة الفرات لصناعة وإنتاج الواح الرخام': '0059',
    'مبنى دينار التجاري': '0052',
    'مؤسسة سامية الكثيري': '0067',
    'شركة مجموعة شلهوب العربية المحدودة': '0039',
    'شركة سيفورا العربية المحدودة (ذات مسؤولية محدودة)': '0031',
    'شركة النجيمة التجارية المحدودة (ذات مسؤولية محدودة)': '0026',
    'شركة كريستيان ديور كوتور العربية للتجارة': '0035',
    'شركة فندي السعودية للتجارة': '0034',
    'شركة لويس فيتون العربية المحدودة': '0038',
    'شركة رضوى التجارية (ذات مسؤولية محدودة) - جدة': '0030',
    'شركة الجمال لمستحضرات التجميل العالمية المحدودة (ذات مسؤولية محدودة)': '0013',
    'شركة الخريف التجارية': '0015',
    'مركز روائع تالا للتزيين النسائي': '0059',
    'شركة وايت للشحن': '0063'
};

// Process each visit line (skip header)
visitLines.slice(1).forEach(line => {
    if (!line.trim()) return;
    
    const columns = line.split(',');
    
    // Extract data from original CSV
    const clientName = columns[0].trim();
    const location = columns[2].trim();
    
    // Get company ID from mapping
    const companyId = companyMapping[clientName];
    if (!companyId) {
        console.log(`Warning: No company ID found for "${clientName}"`);
        return;
    }
    
    // Find a branch for this company
    let selectedBranchId = null;
    let selectedContractId = null;
    
    for (const [branchId, branchCompanyId] of branchToCompanyMap) {
        if (branchCompanyId === companyId) {
            selectedBranchId = branchId;
            selectedContractId = branchToContractMap.get(branchId);
            break;
        }
    }
    
    if (!selectedBranchId) {
        console.log(`Warning: No branch found for company ${companyId}`);
        return;
    }
    
    // Process visit dates (columns 4-33)
    for (let i = 4; i <= 33; i++) {
        const visitDate = columns[i];
        if (visitDate && visitDate.trim() && visitDate.trim() !== '') {
            // Convert date format if needed
            let formattedDate = visitDate.trim();
            
            // Handle different date formats
            if (formattedDate.includes('/')) {
                // Convert m/d/yyyy to dd-Mon-yyyy
                const parts = formattedDate.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[0]) - 1;
                    const day = parts[1];
                    const year = parts[2];
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    formattedDate = `${day}-${months[month]}-${year}`;
                }
            } else if (formattedDate.includes('-') && formattedDate.length > 10) {
                // Convert yyyy-mm-dd to dd-Mon-yyyy
                const parts = formattedDate.split('-');
                if (parts.length === 3 && parts[0].length === 4) {
                    const year = parts[0];
                    const month = parseInt(parts[1]) - 1;
                    const day = parts[2];
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    formattedDate = `${day}-${months[month]}-${year}`;
                }
            }
            
            // Create the perfect row with exactly 26 columns
            const perfectRow = [
                selectedBranchId,             // 0: معرف الفرع*
                selectedContractId,           // 1: معرف العقد*
                companyId,                    // 2: معرف الشركة*
                'regular',                    // 3: نوع الزيارة*
                'completed',                  // 4: حالة الزيارة*
                formattedDate,                // 5: تاريخ الجدولة* (original date)
                '09:00',                      // 6: وقت الجدولة
                formattedDate,                // 7: تاريخ التنفيذ (same as scheduled)
                '11:30',                      // 8: وقت التنفيذ
                '150',                        // 9: المدة المتوقعة
                '',                           // 10: خدمة التكييف
                '',                           // 11: خدمة الكهرباء
                '',                           // 12: خدمة السباكة
                '',                           // 13: خدمة النجارة
                '',                           // 14: خدمة الدهان
                '',                           // 15: خدمة التنظيف
                '',                           // 16: خدمة الحدادة
                '',                           // 17: خدمة السيراميك
                '',                           // 18: خدمة الزجاج
                '',                           // 19: خدمة الألمنيوم
                '',                           // 20: خدمة الأرضيات
                '',                           // 21: خدمة الأسقف
                '',                           // 22: خدمة الجدران
                'completed',                  // 23: حالة الزيارة
                'passed',                     // 24: ملاحظات (overallStatus)
                'system-import'               // 25: مصدر البيانات
            ];
            
            perfectLines.push(perfectRow.join(','));
        }
    }
});

const outputContent = perfectLines.join('\n');
fs.writeFileSync('visits_complete_336_simple_fix.csv', outputContent);

console.log(`Simple fix CSV file created: visits_complete_336_simple_fix.csv`);
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

// Show some 0033 examples
console.log('\nCompany 0033 examples:');
const company33Records = perfectLines.slice(1).filter(line => {
    const cols = line.split(',');
    return cols[2] === '0033';
}).slice(0, 5);

company33Records.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`0033 Record ${index + 1}: ${cols[0]} | ${cols[1]} | ${cols[2]} | ${cols[5]}`);
}); 