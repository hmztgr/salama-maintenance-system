# Pending Issues Tracker
## Issues Awaiting User Confirmation

### 📋 **Document Overview**
- **Purpose**: Track all issues that have been reported but not yet confirmed as fixed by the user
- **Status**: Active tracking
- **Last Updated**: 2025-01-24
- **Update Policy**: Only remove issues when user explicitly confirms they are fixed

---

## 🚨 **CRITICAL ISSUES - AWAITING CONFIRMATION**

### **1. Branch Selection Bug - NOT CONFIRMED FIXED**
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

### **2. Emergency Visit Cancel Button - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: The "العودة" & "إلغاء" buttons in "إنشاء بلاغ طارئ" (emergency visit creation) don't do anything when clicked.

**Files Modified**:
- `src/app/planning/emergency-visit/page.tsx` - Added debugging and fallback navigation

**User Feedback**: "the "العودة" & "إلغاء" buttons in "إنشاء بلاغ طارئ" it doesnt do anything"

**Action Required**: User needs to test the cancel button functionality and confirm it now works correctly.

---

### **3. Friday Drag-and-Drop - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Not being able to drop planned visits cards on Friday in the weekly planner.

**Files Modified**:
- `src/components/planning/WeeklyPlannerGrid.tsx` - Removed capacity limits
- `src/hooks/useWeeklyPlanning.ts` - Enhanced data refresh

**User Feedback**: "not being able to drop planned visits cards on friday in the weekly planner"

**Action Required**: User needs to test Friday drag-and-drop functionality and confirm it now works.

---

### **4. Emergency Visit Planner Integration - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Completing an emergency visit form should make the visit appear in the weekly and annual planner tabs, but it's not showing on those tabs.

**Files Modified**:
- `src/app/planning/emergency-visit/page.tsx` - Fixed date format and dayOfWeek calculation

**User Feedback**: "completing an emergency visit form should make the visit appear in the weekly and annual planner tabs but its not shwoing on those tabs"

**Action Required**: User needs to test emergency visit completion and confirm visits now appear in planners.

---

### **5. Visit Logs Branch/Company Names - NOT CONFIRMED FIXED**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Visit logs showing "Unknown" for company and branch names instead of actual names.

**Files Modified**:
- `src/components/planning/VisitLogsViewer.tsx` - Fixed Firestore document loading syntax

**User Feedback**: "i just noticed that we have the company and branch name issue also in planner tab > سجلات الزيارات if you dont remember how we fixed it chek the weekly planner visit cards company and branch names it used to have the same issue"

**Action Required**: User needs to check visit logs and confirm branch/company names now display correctly.

---

## ⚠️ **MEDIUM PRIORITY ISSUES**

### **6. Visit Logs Date Format - NOT CONFIRMED FIXED**
**Status**: 🟡 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: Visit logs showing dates in Hijri format instead of Georgian format.

**Files Modified**:
- `src/components/planning/VisitLogsViewer.tsx` - Changed locale from 'ar-SA' to 'en-GB'

**User Feedback**: "i noticed that in planner tab > visits log tab dates are in hijry it should be georgian"

**Action Required**: User needs to check visit logs and confirm dates now display in Georgian format.

---

## 🔍 **INVESTIGATION REQUIRED**

### **7. File Upload Display Issue - NEEDS INVESTIGATION**
**Status**: 🟡 **INVESTIGATION REQUIRED**
**Reported**: 2025-01-24
**Description**: Files uploaded in visit completion form may not be displaying correctly after upload.

**Files Modified**:
- `src/app/planning/visit-completion/page.tsx` - Added proper file upload handlers

**User Feedback**: User mentioned file upload issues but specific details unclear.

**Action Required**: User needs to test file upload functionality and provide specific feedback.

---

### **8. Issue Form Dialog Size - REVERT SIZE CHANGES**
**Status**: 🔴 **PENDING USER CONFIRMATION**
**Reported**: 2025-01-24
**Description**: The issue submission dialog needs to be resized to fit all content within the page width without requiring horizontal scrolling.

**Files Modified**:
- `src/components/issues/GlobalIssueButton.tsx` - Dialog sizing and console logs width adjustments

**User Feedback**: "revert size changes, what i want is to make everything within the new issue form page without using horizontal scroll"

**Action Required**: Developer needs to revert dialog size changes and ensure all content fits within page width without horizontal scrolling.

---

### **9. Weekly Planner Date Issue - DATES ARE WRONG**
**Status**: 🟡 **IN PROGRESS - AWAITING TESTING**
**Reported**: 2025-01-24
**Description**: Weekly planner showing incorrect dates. Today is Sunday, July 27th, but the planner shows July 27th as Friday.

**Files Modified**:
- `src/components/planning/AnnualScheduler.tsx` - Enhanced parseCustomDate to handle multiple date formats
- `src/contexts/WeekNavigationContext.tsx` - Fixed date parsing for dd-mmm-yyyy format

**Root Cause**: The system was receiving dates in multiple formats (mm/dd/yyyy, mm-dd-yyyy) but the date parsing functions only handled dd-mmm-yyyy format, causing parsing failures and incorrect date calculations.

**Solution**: 
1. Enhanced `parseCustomDate` function to handle multiple date formats: mm/dd/yyyy, mm-dd-yyyy, dd-mmm-yyyy, yyyy-mm-dd
2. Fixed `WeekNavigationContext` to properly parse dd-mmm-yyyy format when calculating week numbers
3. Added proper error handling and fallback mechanisms

**User Feedback**: "i noticed that the dates on the weekly planner are wrong today is Sunday the 27th of july but in the weekly planner it shows 27th of july is friday"

**Action Required**: User needs to test the weekly planner and confirm dates now display correctly.

---

### **10. Contract Export Empty Columns - COMPANY/BRANCH DATA MISSING** ✅ **RESOLVED**
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
- 🔴 **Critical Issues**: 6
- 🟡 **Medium Priority**: 3
- 🔍 **Needs Investigation**: 1
- 🟢 **Resolved**: 1
- **Total Pending**: 10

### **By Category**:
- **Branch Selection**: 1 issue
- **Navigation**: 1 issue
- **Drag-and-Drop**: 1 issue
- **Data Integration**: 1 issue
- **Data Display**: 3 issues
- **File Upload**: 1 issue
- **Date Format**: 2 issues
- **UI/UX**: 1 issue
- **Data Export**: 1 issue

---

## 🎯 **CONFIRMATION CHECKLIST**

### **For User to Test and Confirm**:

#### **Critical Issues**:
- [ ] **Branch Selection**: Test branch selection in emergency visit form, visit completion form, and planned visit form
- [ ] **Cancel Button**: Test "العودة" and "إلغاء" buttons in emergency visit creation
- [ ] **Friday Drag-and-Drop**: Test dropping visits on Friday in weekly planner
- [ ] **Emergency Visit Integration**: Complete an emergency visit and check if it appears in planners
- [ ] **Visit Logs Names**: Check if visit logs show actual branch/company names
- [ ] **Issue Form Dialog Size**: Test issue submission dialog to ensure no horizontal scrolling required
- [ ] **Weekly Planner Dates**: Check if weekly planner shows correct dates (Sunday should be Sunday, not Friday) - **FIXED, AWAITING TESTING**

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

---

## 📞 **CONTACT INFORMATION**

### **For Issue Updates**:
- **User**: Please provide feedback on each issue after testing
- **Developer**: Will update this file based on user confirmation
- **Status Updates**: Issues will only be removed when user confirms they are fixed

---

**Note**: This file will be updated regularly as issues are confirmed as fixed or new issues are reported. Issues will only be removed when the user explicitly confirms they are resolved. 