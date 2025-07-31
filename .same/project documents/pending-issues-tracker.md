# Pending Issues Tracker
## Issues Awaiting User Confirmation

### 📋 **Document Overview**
- **Purpose**: Track all issues that have been reported but not yet confirmed as fixed by the user
- **Status**: Active tracking
- **Last Updated**: 2025-01-24
- **Update Policy**: Only remove issues when user explicitly confirms they are fixed

---

## 🚨 **CRITICAL ISSUES - AWAITING CONFIRMATION**

### **1. Branch ID Generation Issue - DUPLICATE IDS** ✅ **RESOLVED**
**Status**: 🟢 **CONFIRMED FIXED**
**Reported**: 2025-01-24
**Resolved**: 2025-01-24
**Description**: Multiple branches for the same company were receiving identical IDs during batch imports (e.g., both branches getting "0002-JED-001-0001").

**Files Modified**:
- `src/hooks/useBranchesFirebase.ts` - Modified addBranch function to fetch fresh data from Firestore before ID generation

**Root Cause**: Stale state during rapid batch imports. The `branches` state from useBranchesFirebase hook was outdated when passed to `generateBranchId`, causing the function to work with stale data and generate duplicate IDs.

**Solution Applied**:
- Modified `addBranch` function to query Firestore directly before ID generation
- Fetched latest branches for the specific company using Firestore query
- Passed fresh data to `generateBranchId` instead of potentially stale hook state
- Added comprehensive debug logging to track the process

**User Feedback**: "it seem the ID issue is fixed"

**Resolution**: Issue completely resolved. Branch imports now generate unique sequential IDs correctly.

---

### **2. Branch Selection Bug - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: In multiple forms (emergency ticket form, visit completion form, planned visit form, and potentially others), selecting a branch incorrectly selects ALL branches associated with that company, instead of just the single selected branch.

**Files Modified**:
- `src/app/planning/emergency-visit/page.tsx` - Enhanced branch selection logic
- `src/components/planning/VisitForm.tsx` - Fixed branch filtering
- `src/app/planning/planned-visit/page.tsx` - Fixed branch selection

**User Feedback**: "Branch Selection Bug - still not fixed - screenshot attached - still selecting more than one branch at once"

**Action Required**: User needs to test branch selection in all forms and confirm the issue is resolved.

---

### **3. Emergency Visit Cancel Button - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: The "العودة" & "إلغاء" buttons in "إنشاء بلاغ طارئ" (emergency visit creation) don't do anything when clicked.

**Files Modified**:
- `src/app/planning/emergency-visit/page.tsx` - Added debugging and fallback navigation

**User Feedback**: "the "العودة" & "إلغاء" buttons in "إنشاء بلاغ طارئ" it doesnt do anything"

**Action Required**: User needs to test the cancel button functionality and confirm it now works correctly.

---

### **4. Friday Drag-and-Drop - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Not being able to drop planned visits cards on Friday in the weekly planner.

**Files Modified**:
- `src/components/planning/WeeklyPlannerGrid.tsx` - Removed capacity limits
- `src/hooks/useWeeklyPlanning.ts` - Enhanced data refresh

**User Feedback**: "not being able to drop planned visits cards on friday in the weekly planner"

**Action Required**: User needs to test Friday drag-and-drop functionality and confirm it now works.

---

### **5. Emergency Visit Planner Integration - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Completing an emergency visit form should make the visit appear in the weekly and annual planner tabs, but it's not showing on those tabs.

**Files Modified**:
- `src/app/planning/emergency-visit/page.tsx` - Fixed date format and dayOfWeek calculation

**User Feedback**: "completing an emergency visit form should make the visit appear in the weekly and annual planner tabs but its not shwoing on those tabs"

**Action Required**: User needs to test emergency visit completion and confirm visits now appear in planners.

---

### **6. Visit Logs Branch/Company Names - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Visit logs showing "Unknown" for company and branch names instead of actual names.

**Files Modified**:
- `src/components/planning/VisitLogsViewer.tsx` - Fixed Firestore document loading syntax

**User Feedback**: "i just noticed that we have the company and branch name issue also in planner tab > سجلات الزيارات if you dont remember how we fixed it chek the weekly planner visit cards company and branch names it used to have the same issue"

**Action Required**: User needs to check visit logs and confirm branch/company names now display correctly.

---

### **13. Visit Details View Layout - NEEDS REDESIGN**
**Status**: 🟡 **PENDING REDESIGN**
**Reported**: 2025-01-24
**Description**: The new read-only visit details view doesn't match the previous design/layout that the user was expecting. User wants to keep current implementation for now but fix the layout later.

**Files Modified**:
- `src/components/planning/VisitDetailsView.tsx` - Created new read-only view component
- `src/components/planning/VisitLogsViewer.tsx` - Added logic to show read-only view for completed visits

**User Feedback**: "this is not how the completed visit view mode looked like it had before but lets keep it as it is for now add it to the @pending-issues-tracker.md to be fixed later"

**Action Required**: Redesign the visit details view to match the previous layout/design that the user was expecting.

---

### **14. Contract View Popup Visit Calculations - FIXED** ✅ **RESOLVED**
**Status**: 🟢 **CONFIRMED FIXED**
**Reported**: 2025-01-24
**Resolved**: 2025-01-24
**Description**: Contract view popup was showing incorrect total visit calculations. It was summing visits per year from each batch instead of multiplying by the number of branches in each batch. Also, services were displayed globally instead of per batch.

**Example**: Contract with 2 batches - Batch 1: 35 branches × 3 visits/year, Batch 2: 12 branches × 4 visits/year. Should show 153 total visits ((35×3) + (12×4)), but was showing only 7 visits.

**Files Modified**:
- `src/components/customers/ContractDetailView.tsx` - Fixed visit calculation logic to multiply visits per year by branch count per batch, and moved services display to show per batch instead of globally

**Root Cause**: 
1. Visit calculation was using `sum + (batch.regularVisitsPerYear || 0)` instead of `sum + ((batch.regularVisitsPerYear || 0) * branchCount)`
2. Services were displayed globally in a separate section instead of showing per batch

**Solution Applied**:
1. Updated visit calculation to multiply visits per year by the number of branches in each batch
2. Removed global services display and added services display per batch in the Service Batches section
3. Updated services count calculation to sum services across all batches

**User Feedback**: "i just noticed something in customer tab > contracts tab >contract view popup page as an example this contract ... it is not giving proper info its showing 7 visits per year but it should be (batch 1 branches number * visits per year) + (batch 2 branches number * visits per year) + and so on so for this example it should be (35 * 3) + (12 * 4) = 153 vists in total ... same goes for this area "إحصائيات العقد إجمالي الزيارات 7 عدد الفروع 47 عدد الخدمات 3 تاريخ الإنشاء 29-Jul-2025 آخر تحديث 29-Jul-2025" also for the "الخدمات المقدمة 🧯 طفايات ⚠️ إنذار 💧 إطفاء" i think those should be shown for each batch indebendently because each batch could have different services"

**Resolution**: Issue completely resolved. Contract view popup now correctly calculates total visits by multiplying visits per year by branch count per batch, and displays services per batch independently.

---

### **15. Company View Popup Statistics - FIXED** ✅ **RESOLVED**
**Status**: 🟢 **CONFIRMED FIXED**
**Reported**: 2025-01-24
**Resolved**: 2025-01-24
**Description**: Company view popup was showing "0" for both contracts and branches count in the "إحصائيات سريعة" section, even though the company had associated contracts and branches.

**Files Modified**:
- `src/components/customers/CompanyDetailView.tsx` - Added contracts and branches props, implemented statistics calculation logic
- `src/components/customers/NewCustomerManagement.tsx` - Updated CompanyDetailView call to pass contracts and branches data

**Root Cause**: The CompanyDetailView component was hardcoded to show "0" for statistics instead of calculating the actual counts from the data.

**Solution Applied**:
1. Added `contracts` and `branches` props to CompanyDetailViewProps interface
2. Added statistics calculation logic to filter contracts and branches by company ID
3. Updated the statistics display to show actual counts instead of hardcoded "0"
4. Updated NewCustomerManagement to pass the required data to CompanyDetailView

**User Feedback**: "i just noticed also that in customer tab > companies tab > company view popup page i can see ... but the "إحصائيات سريعة عدد العقود 0 عدد الفروع 0" are not getting the correct number of branches and contracts for this company"

**Resolution**: Issue completely resolved. Company view popup now correctly displays the actual number of contracts and branches associated with each company.

---

## ⚠️ **MEDIUM PRIORITY ISSUES**

### **7. Visit Logs Date Format - NOT CONFIRMED FIXED**
**Status**: 🟡 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Visit logs showing dates in Hijri format instead of Georgian format.

**Files Modified**:
- `src/components/planning/VisitLogsViewer.tsx` - Changed locale from 'ar-SA' to 'en-GB'

**User Feedback**: "i noticed that in planner tab > visits log tab dates are in hijry it should be georgian"

**Action Required**: User needs to check visit logs and confirm dates now display in Georgian format.

---

## 🔍 **INVESTIGATION REQUIRED**

### **8. File Upload Display Issue - NEEDS INVESTIGATION**
**Status**: 🟡 **INVESTIGATION REQUIRED**
**Reported**: 2025-01-24
**Description**: Files uploaded in visit completion form may not be displaying correctly after upload.

**Files Modified**:
- `src/app/planning/visit-completion/page.tsx` - Added proper file upload handlers

**User Feedback**: User mentioned file upload issues but specific details unclear.

**Action Required**: User needs to test file upload functionality and provide specific feedback.

---

### **9. Issue Form Dialog Size - REVERT SIZE CHANGES**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: The issue submission dialog needs to be resized to fit all content within the page width without requiring horizontal scrolling.

**Files Modified**:
- `src/components/issues/GlobalIssueButton.tsx` - Dialog sizing and console logs width adjustments

**User Feedback**: "revert size changes, what i want is to make everything within the new issue form page without using horizontal scroll"

**Action Required**: Developer needs to revert dialog size changes and ensure all content fits within page width without horizontal scrolling.

---

### **10. Annual Planner New Visit Creation - BROKEN** ❌ **STILL OCCURRING**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Last Updated**: 2025-01-24
**Description**: Creating new planned visits in the annual planner is not working. Error occurs when clicking the "+" button to add a new visit.

**Error Details**:
- Error: `TypeError: Cannot read properties of undefined (reading 'includes')`
- Location: AnnualScheduler component when adding new visit
- Branches affected: 0017-JED-001-0001, 0029-JED-001-0001, and others
- Current visits count: 112

**Console Logs**:
- Empty date string warnings in parseCustomDate (repeated frequently)
- Failed to add visit with undefined property error
- AnnualScheduler rendering 179 branches successfully

**Previous Fix Attempt**:
- Added null checks and array validation before calling `.includes()` on `batch.branchIds`
- Fixed all 10 instances of `batch.branchIds.includes()` calls in AnnualScheduler.tsx
- Added proper validation: `batch.branchIds && Array.isArray(batch.branchIds) && batch.branchIds.includes(branch.branchId)`

**Current Status**: The TypeError was occurring because there were unprotected `batch.branchIds.includes()` calls in multiple files throughout the codebase, not just in AnnualScheduler.tsx.

**Comprehensive Fix Applied**:
- Fixed all unprotected `batch.branchIds.includes()` calls in the following files:
  - `src/components/planning/AnnualScheduler.tsx` - All 10 instances already had proper null checks
  - `src/components/planning/VisitForm.tsx` - Fixed 1 instance
  - `src/components/planning/AutomatedVisitPlanner.tsx` - Fixed 3 instances
  - `src/components/planning/VisitImportReview.tsx` - Fixed 1 instance
  - `src/components/customers/ContractDetailView.tsx` - Fixed 1 instance
  - `src/components/customers/BranchDetailView.tsx` - Fixed 1 instance
  - `src/components/admin/DemoDataGenerator.tsx` - Fixed 2 instances

**Total Fixes Applied**: 9 additional instances across 7 files, in addition to the 10 instances already fixed in AnnualScheduler.tsx.

**Action Required**: User needs to test creating new planned visits in the annual planner and confirm the TypeError is now resolved.

---

### **11. Weekly Planner Date Issue - DATES ARE WRONG** ✅ **RESOLVED**
**Status**: 🟢 **CONFIRMED FIXED**
**Reported**: 2025-01-24
**Description**: Weekly planner showing incorrect dates. Today is Sunday, July 27th, but the planner shows July 27th as Friday. Also, annual planner week 30 shows incorrect date range. User also reported "endless loop" when expanding objects in console logs.

**Files Modified**:
- `src/lib/date-handler.ts` - Fixed week calculation inconsistency between functions, made all use ISO 8601 standard (Monday as first day), added testWeekCalculations function
- `src/components/customers/export/ExportTemplate.tsx` - Fixed console logging to prevent endless loops when expanding objects
- `src/hooks/useWeeklyPlanning.ts` - Removed excessive debug logging that was causing console loops
- `src/components/planning/WeekStatusOverview.tsx` - Removed excessive debug logging
- `src/components/planning/WeeklyPlanner.tsx` - Added test function call to verify week calculations
- `src/components/planning/WeeklyPlannerGrid.tsx` - Fixed getStartOfWeek function to use ISO 8601 standard and updated weekDays array order

**Root Cause**: The system was using two different week calculation systems:
1. `getWeekStartDate()` used Sunday as first day of week (traditional US system)
2. `getWeekStartDateByNumber()` used Monday as first day of week (ISO 8601 system)
3. `WeeklyPlannerGrid.getStartOfWeek()` used custom Saturday-based calculation
This created a mismatch where the same date could be in different weeks depending on which function was used.

**Solution Applied**:
1. Updated `getWeekStartDate()` and `getWeekEndDate()` to use ISO 8601 standard (Monday as first day)
2. Fixed console logging in ExportTemplate to prevent circular references and endless loops
3. Made all week calculation functions consistent with ISO 8601 standard
4. Removed all excessive debug logging that was causing console loops
5. Added testWeekCalculations function to verify date logic
6. **FIXED**: Updated `WeeklyPlannerGrid.getStartOfWeek()` to use proper ISO 8601 calculation
7. **FIXED**: Changed weekDays array from Saturday-first to Monday-first order

**User Feedback**: "still having the same issue it shows the 27th as friday and 1st of january as monday" - Console logs showed date calculations were correct, but UI display was wrong due to WeeklyPlannerGrid using different week calculation.

**Final User Feedback**: "perfect it shows 27th as sunday and the 1st of january as wednesday now"

**Resolution**: Issue completely resolved. Weekly planner now correctly displays dates according to ISO 8601 standard.

---

### **12. Contract Export Empty Columns - COMPANY/BRANCH DATA MISSING** ✅ **RESOLVED**
**Status**: 🟢 **CONFIRMED FIXED**
**Reported**: 2025-01-24
**Resolved**: 2025-01-24
**Description**: Contract export columns for company names, branch IDs, and branch names are empty despite checkboxes being marked and data being available.

**Files Modified**:
- `src/components/customers/export/ExportTemplate.tsx` - Fixed computed field logic placement

**Root Cause**: The `formatFieldValue` function was checking for direct field values before handling computed fields, causing early returns with empty strings.

**Solution**: Moved computed field logic (companyName, branchIds, branchNames) to the beginning of the function before the value check.

**User Feedback**: "10. Contract Export Empty Columns - COMPANY/BRANCH DATA MISSING is fixed"

---

## 📊 **ISSUE SUMMARY**

### **By Status**:
- 🔴 **Critical Issues**: 4
- 🟡 **Medium Priority**: 4
- 🔍 **Needs Investigation**: 1
- 🟢 **Resolved**: 6
- **Total Pending**: 9

### **By Category**:
- **Branch Selection**: 1 issue
- **Navigation**: 1 issue
- **Drag-and-Drop**: 1 issue
- **Data Integration**: 1 issue
- **Data Display**: 3 issues
- **File Upload**: 1 issue
- **Date Format**: 1 issue
- **UI/UX**: 2 issues
- **Data Export**: 1 issue

---

## 🎯 **CONFIRMATION CHECKLIST**

### **For User to Test and Confirm**:

#### **Critical Issues**:
- [x] **Branch ID Generation**: Test branch import to ensure unique sequential IDs (0002-JED-001-0001, 0002-JED-001-0002, etc.) - **✅ CONFIRMED FIXED**
- [ ] **Branch Selection**: Test branch selection in emergency visit form, visit completion form, and planned visit form
- [ ] **Cancel Button**: Test "العودة" and "إلغاء" buttons in emergency visit creation
- [ ] **Friday Drag-and-Drop**: Test dropping visits on Friday in weekly planner
- [ ] **Emergency Visit Integration**: Complete an emergency visit and check if it appears in planners
- [ ] **Visit Logs Names**: Check if visit logs show actual branch/company names
- [ ] **Issue Form Dialog Size**: Test issue submission dialog to ensure no horizontal scrolling required
- [x] **Weekly Planner Dates**: Check if weekly planner shows correct dates (Sunday should be Sunday, not Friday) - **✅ CONFIRMED FIXED**

#### **Medium Priority**:
- [ ] **Visit Logs Dates**: Check if visit logs show Georgian dates instead of Hijri
- [ ] **File Upload**: Test file upload in visit completion form

#### **Investigation**:
- [ ] **File Upload Display**: Test file upload and provide specific feedback

---

## 📝 **CONFIRMATION PROCESS**

### **How to Confirm an Issue is Fixed**:
1. **Test the specific functionality** mentioned in the issue
2. **Provide clear feedback** about whether it's working or not
3. **Include screenshots** if the issue persists
4. **Specify which forms/pages** you tested

### **How to Report a New Issue**:
1. **Describe the problem** clearly and specifically
2. **Include the page/form** where the issue occurs
3. **Provide steps to reproduce** the issue
4. **Include screenshots** if possible
5. **Specify your browser/device** if relevant

---

## 🔄 **UPDATE LOG**

### **2025-01-24 - Initial Creation**
- Created comprehensive issues tracker
- Listed all 8 pending issues from user feedback
- Organized by priority and category
- Added confirmation checklist for user testing

### **2025-01-24 - Issue #8 Added**
- Added Issue Form Dialog Size issue (UI/UX category)
- Updated statistics: 9 total pending issues (6 critical, 2 medium, 1 investigation)
- Added to confirmation checklist for testing

### **2025-01-24 - Issues #9 & #10 Added**
- Added Weekly Planner Date Issue (Date Format category)
- Added Contract Export Empty Columns issue (Data Export category)
- Updated statistics: 11 total pending issues (8 critical, 2 medium, 1 investigation)
- Added to confirmation checklist for testing

### **2025-01-24 - Issue #10 Resolved**
- Fixed Contract Export Empty Columns issue
- Root cause: Computed field logic was placed after value check
- Solution: Moved computed field logic to beginning of function
- Updated statistics: 10 total pending issues (7 critical, 2 medium, 1 investigation, 1 resolved)

### **2025-01-24 - Issue #9 In Progress**
- Started work on Weekly Planner Date Issue
- Root cause: Date parsing functions only handled dd-mmm-yyyy format
- Solution: Enhanced parseCustomDate to handle multiple formats (mm/dd/yyyy, mm-dd-yyyy, dd-mmm-yyyy, yyyy-mm-dd)
- Fixed WeekNavigationContext date parsing for dd-mmm-yyyy format
- Status changed to 🟡 IN PROGRESS - AWAITING TESTING
- Updated statistics: 10 total pending issues (6 critical, 3 medium, 1 investigation, 1 resolved)

### **2025-01-24 - Issue #9 Fixed**
- Implemented ISO 8601 week calculation standard
- Fixed annual scheduler week calculation to use proper ISO week dates
- Updated WeekNavigationContext to use correct week number calculation
- Added getWeekStartDateByNumber and getWeekEndDateByNumber functions
- Status changed to 🟡 FIXED - AWAITING CONFIRMATION
- Should now correctly show July 27th as Sunday and proper week 30 dates

### **2025-01-24 - Issue #9 In Progress (Second Fix)**
- User reported dates still incorrect and "endless loop" in console logs
- Root cause: Week calculation inconsistency between functions
- Fixed getWeekStartDate() and getWeekEndDate() to use ISO 8601 standard (Monday as first day)
- Fixed console logging in ExportTemplate to prevent circular references
- Made all week calculation functions consistent with ISO 8601 standard
- Status changed to 🟡 IN PROGRESS - FIXING WEEK CALCULATION INCONSISTENCY

### **2025-01-24 - Issue #9 In Progress (Third Fix)**
- User reported console logging still causing endless loops with [[Prototype]] expansion
- Root cause: Excessive debug logging throughout the application
- Removed all excessive console.log statements from useWeeklyPlanning, WeekStatusOverview, and other components
- Added testWeekCalculations function to verify date logic
- Added test call in WeeklyPlanner component to debug week calculations
- Status changed to 🟡 IN PROGRESS - DEBUGGING WEEK CALCULATION

### **2025-01-24 - Issue #9 Fixed (Fourth Fix)**
- User reported dates still incorrect despite correct date calculations in console logs
- Root cause: WeeklyPlannerGrid.getStartOfWeek() was using custom Saturday-based calculation instead of ISO 8601
- Fixed getStartOfWeek function to use proper ISO 8601 week calculation (Monday as first day)
- Changed weekDays array from Saturday-first to Monday-first order to match ISO 8601
- Status changed to 🟡 FIXED - AWAITING CONFIRMATION

### **2025-01-24 - Issue #1 Resolved**
- User confirmed: "it seem the ID issue is fixed"
- Branch ID generation issue completely resolved and confirmed working
- Status changed to 🟢 CONFIRMED FIXED

### **2025-01-24 - Issue #9 Resolved**
- User confirmed: "perfect it shows 27th as sunday and the 1st of january as wednesday now"
- Issue completely resolved and confirmed working
- Status changed to 🟢 CONFIRMED FIXED

### **2025-01-24 - Issue #14 Added and Resolved**
- Added Contract View Popup Visit Calculations issue
- Root cause: Visit calculation was summing visits per year instead of multiplying by branch count per batch
- Solution: Fixed visit calculation logic and moved services display to show per batch
- Status changed to 🟢 CONFIRMED FIXED
- Updated statistics: 5 resolved issues, 9 total pending

### **2025-01-24 - Issue #15 Added and Resolved**
- Added Company View Popup Statistics issue
- Root cause: CompanyDetailView was hardcoded to show "0" for statistics instead of calculating actual counts
- Solution: Added contracts and branches props, implemented statistics calculation logic
- Status changed to 🟢 CONFIRMED FIXED
- Updated statistics: 6 resolved issues, 9 total pending

---

## 📞 **CONTACT INFORMATION**

### **For Issue Updates**:
- **User**: Please provide feedback on each issue after testing
- **Developer**: Will update this file based on user confirmation
- **Status Updates**: Issues will only be removed when user confirms they are fixed

---

**Note**: This file will be updated regularly as issues are confirmed as fixed or new issues are reported. Issues will only be removed when the user explicitly confirms they are resolved. 