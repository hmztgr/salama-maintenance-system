const fs = require('fs');

// Read the enhanced contracts data to get actual branch IDs
const contractsData = fs.readFileSync('.same/project documents/CSVs/export_contracts_2025-07-29_enhanced (1).csv', 'utf8');
const contractLines = contractsData.split('\n').slice(4);

// Create mappings
const branchToContractMap = new Map();
const branchToCompanyMap = new Map();
const companyToBranchesMap = new Map();

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
                    
                    // Store all branches for each company
                    if (!companyToBranchesMap.has(companyId)) {
                        companyToBranchesMap.set(companyId, []);
                    }
                    companyToBranchesMap.get(companyId).push(cleanBranchId);
                }
            });
        }
    }
});

// Manual mapping for company names (based on the original CSV)
const companyNameMapping = {
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
    'شركة وايت للشحن': '0063',
    'الشركة العربية للهدايا الراقية المحدودة (ذات مسؤولية محدودة)': '0021',
    'شركة لوكسيتان العربية للتجارة - شركة شخص واحد': '0037',
    'شركة بي سي دي  العربية السعودية شركة شخص واحد': '0029',
    'شركة بوتش العربية المحدودة': '0024'
};

// Read the original visits CSV
const originalVisitsData = fs.readFileSync('.same/project documents/CSVs/زيارات CSV.csv', 'utf8');
const visitLines = originalVisitsData.split('\n');

// Create the perfect CSV with distributed visits
const perfectLines = [];

// Add header
perfectLines.push('معرف الفرع*,معرف العقد*,معرف الشركة*,نوع الزيارة*,حالة الزيارة*,تاريخ الجدولة*,وقت الجدولة,تاريخ التنفيذ,وقت التنفيذ,المدة المتوقعة,خدمة التكييف,خدمة الكهرباء,خدمة السباكة,خدمة النجارة,خدمة الدهان,خدمة التنظيف,خدمة الحدادة,خدمة السيراميك,خدمة الزجاج,خدمة الألمنيوم,خدمة الأرضيات,خدمة الأسقف,خدمة الجدران,حالة الزيارة,ملاحظات,مصدر البيانات');

let totalVisitsProcessed = 0;
let skippedVisits = 0;

// Track branch usage for each company
const companyBranchUsage = new Map();

// Process each visit line (skip header)
visitLines.slice(1).forEach(line => {
    if (!line.trim()) return;
    
    const columns = line.split(',');
    
    // Extract data from original CSV
    const clientName = columns[0].trim();
    const location = columns[2].trim();
    
    // Get company ID from mapping
    const companyId = companyNameMapping[clientName];
    if (!companyId) {
        console.log(`Warning: No company ID found for "${clientName}"`);
        skippedVisits++;
        return;
    }
    
    // Get all available branches for this company
    const availableBranches = companyToBranchesMap.get(companyId) || [];
    if (availableBranches.length === 0) {
        console.log(`Warning: No branches found for company ${companyId}`);
        skippedVisits++;
        return;
    }
    
    // Initialize branch usage counter for this company
    if (!companyBranchUsage.has(companyId)) {
        companyBranchUsage.set(companyId, 0);
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
            } else if (formattedDate.match(/^\d{1,2}-[A-Za-z]{3}$/)) {
                // Handle incomplete dates like "24-Sep" - assume current year or 2024
                formattedDate = `${formattedDate}-2024`;
                console.log(`Fixed incomplete date: ${visitDate.trim()} → ${formattedDate}`);
            }
            
            // Select branch using round-robin distribution
            const currentUsage = companyBranchUsage.get(companyId);
            const selectedBranchIndex = currentUsage % availableBranches.length;
            const selectedBranchId = availableBranches[selectedBranchIndex];
            const selectedContractId = branchToContractMap.get(selectedBranchId);
            
            // Increment usage counter
            companyBranchUsage.set(companyId, currentUsage + 1);
            
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
            totalVisitsProcessed++;
        }
    }
});

const outputContent = perfectLines.join('\n');
fs.writeFileSync('visits_complete_336_distributed.csv', outputContent);

console.log(`Distributed visits CSV file created: visits_complete_336_distributed.csv`);
console.log(`Total records: ${perfectLines.length - 1}`);
console.log(`Total visits processed: ${totalVisitsProcessed}`);
console.log(`Skipped visits: ${skippedVisits}`);

// Show branch distribution for Company 0033
console.log('\n=== Company 0033 Branch Distribution ===');
const company33Branches = companyToBranchesMap.get('0033') || [];
console.log(`Available branches for Company 0033: ${company33Branches.length}`);
company33Branches.forEach((branchId, index) => {
    console.log(`${index + 1}. ${branchId}`);
});

// Count visits per branch for Company 0033
const company33Visits = perfectLines.slice(1).filter(line => {
    const cols = line.split(',');
    return cols[2] === '0033';
});

const branchCounts = {};
company33Visits.forEach(line => {
    const cols = line.split(',');
    const branchId = cols[0];
    branchCounts[branchId] = (branchCounts[branchId] || 0) + 1;
});

console.log('\n=== Company 0033 Visit Distribution ===');
Object.keys(branchCounts).sort().forEach(branchId => {
    console.log(`${branchId}: ${branchCounts[branchId]} visits`);
});

// Show total visits for Company 0033
console.log(`Total visits for Company 0033: ${company33Visits.length}`);

// Show some sample records for Company 0033
console.log('\n=== Sample Company 0033 Records ===');
const sample33Records = company33Visits.slice(0, 10);
sample33Records.forEach((line, index) => {
    const cols = line.split(',');
    console.log(`Record ${index + 1}: ${cols[0]} | ${cols[1]} | ${cols[2]} | ${cols[5]}`);
});

// Show distribution for other major companies
console.log('\n=== Other Companies Branch Distribution ===');
const majorCompanies = ['0039', '0031', '0021', '0005', '0014'];
majorCompanies.forEach(companyId => {
    const companyVisits = perfectLines.slice(1).filter(line => {
        const cols = line.split(',');
        return cols[2] === companyId;
    });
    
    if (companyVisits.length > 0) {
        const branchCounts = {};
        companyVisits.forEach(line => {
            const cols = line.split(',');
            const branchId = cols[0];
            branchCounts[branchId] = (branchCounts[branchId] || 0) + 1;
        });
        
        console.log(`\nCompany ${companyId} (${companyVisits.length} visits):`);
        Object.keys(branchCounts).sort().forEach(branchId => {
            console.log(`  ${branchId}: ${branchCounts[branchId]} visits`);
        });
    }
});

// Verify column count
console.log('\n=== Column Count Verification ===');
const firstDataLine = perfectLines[1];
const columnCount = firstDataLine.split(',').length;
console.log(`Columns in data line: ${columnCount}`);
console.log(`Expected: 26 columns`);
console.log(`Status: ${columnCount === 26 ? 'PASS' : 'FAIL'}`); 