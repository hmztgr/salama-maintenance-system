# Automated Visit Planning - User Guide
## Salama Maintenance Scheduler

### 🎯 **Overview**

The Automated Visit Planning System allows administrators to automatically generate planned visits for all branches within a company based on their contract requirements. This feature significantly reduces manual planning time and ensures contract compliance.

---

## 🚀 **How to Use**

### **Step 1: Access the Feature**
1. Navigate to **Planning** → **Annual Scheduler**
2. Look for the **"التخطيط التلقائي للزيارات"** (Automated Visit Planning) button in the top-right corner
3. Click the button to open the planning dialog

### **Step 2: Select Company**
1. Choose the company you want to plan visits for from the dropdown
2. The system will show you:
   - Number of branches in the company
   - Number of active contracts
   - Available planning options

### **Step 3: Configure Planning Options**
Adjust the planning parameters as needed:

- **الحد الأقصى للزيارات يومياً** (Max Visits Per Day): Default 5, range 1-10
- **بداية الأسبوع المفضلة** (Preferred Week Start): Saturday or Sunday
- **الحد الأدنى للأيام بين الزيارات** (Min Days Between Visits): Default 1, range 1-7
- **حل التعارضات** (Conflict Resolution): 
  - إعادة جدولة (Reschedule): Automatically find alternative dates
  - تخطي (Skip): Skip conflicting dates
  - خطأ (Error): Stop planning on conflicts
- **مراعاة الزيارات الموجودة** (Include Existing Visits): Consider already planned visits

### **Step 4: Start Planning**
1. Click **"بدء التخطيط"** (Start Planning)
2. Watch the progress bar as the system:
   - Analyzes contract data
   - Calculates optimal visit distribution
   - Resolves scheduling conflicts
   - Creates planned visits

### **Step 5: Review Results**
The system will show you a comprehensive summary:
- **Total Planned Visits**: Number of visits created
- **Resolved Conflicts**: Number of conflicts automatically resolved
- **Planning Time**: How long the operation took
- **Branches Planned**: Number of branches that received visits

---

## 📊 **How It Works**

### **Algorithm Logic**
1. **Contract Analysis**: Reads all active contracts for the selected company
2. **Service Batch Processing**: Identifies which branches are included in each service batch
3. **Visit Calculation**: Determines required visits per branch based on `regularVisitsPerYear`
4. **Date Distribution**: Spreads visits evenly throughout contract periods
5. **Conflict Resolution**: Handles existing visits and daily limits
6. **Service Assignment**: Automatically assigns correct services from contracts

### **Smart Features**
- **Even Distribution**: Visits are spread optimally to prevent team overload
- **Saturday Priority**: Prioritizes Saturday starts for weekly distribution
- **Contract Compliance**: All visits are within contract start/end dates
- **Existing Visit Consideration**: Accounts for already completed visits
- **Conflict Resolution**: Automatically finds alternative dates for conflicts

---

## ⚙️ **Configuration Options**

### **Planning Parameters**

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Max Visits Per Day | 5 | 1-10 | Maximum visits allowed on any single day |
| Preferred Week Start | Saturday | Saturday/Sunday | Preferred day to start weekly planning |
| Min Days Between Visits | 1 | 1-7 | Minimum spacing between visits for the same branch |
| Conflict Resolution | Reschedule | Reschedule/Skip/Error | How to handle scheduling conflicts |
| Include Existing Visits | Yes | Yes/No | Whether to consider already planned visits |

### **Business Rules**
- **Contract Period Respect**: All visits must fall within contract start/end dates
- **Service Accuracy**: Services are automatically assigned from contract service batches
- **Visit Type**: Only creates `regular` visits (emergency visits are excluded)
- **Status**: All created visits have `scheduled` status
- **Created By**: Visits are marked as created by `system-automated-planning`

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **No Companies Available**
- **Cause**: No active companies in the system
- **Solution**: Create companies and contracts first

#### **No Visits Generated**
- **Cause**: No active contracts with `regularVisitsPerYear > 0`
- **Solution**: Check contract service batches and visit requirements

#### **Planning Takes Too Long**
- **Cause**: Large number of branches or complex conflicts
- **Solution**: Reduce batch size or simplify conflict resolution

#### **Conflicts Not Resolved**
- **Cause**: Too many existing visits or strict daily limits
- **Solution**: Increase daily limits or change conflict resolution strategy

### **Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| "لا توجد عقود مرتبطة بهذا الفرع" | Branch not included in any service batch | Add branch to contract service batch |
| "لا توجد خدمات محددة لهذا الفرع" | No services defined for branch | Configure services in contract service batch |
| "Invalid contract dates" | Contract has invalid start/end dates | Fix contract date format (dd-mmm-yyyy) |

---

## 📈 **Best Practices**

### **Before Planning**
1. **Verify Contracts**: Ensure all contracts have valid start/end dates
2. **Check Service Batches**: Confirm branches are properly assigned to service batches
3. **Review Existing Visits**: Check for any manually planned visits that might conflict
4. **Set Realistic Limits**: Configure daily visit limits based on team capacity

### **After Planning**
1. **Review Results**: Check the planning summary for any issues
2. **Manual Adjustments**: Make any necessary manual adjustments to the generated schedule
3. **Team Communication**: Inform team members about the new planned visits
4. **Monitor Progress**: Track visit completion and adjust future planning accordingly

### **Optimization Tips**
- **Use Saturday Start**: Better for weekly distribution in Saudi Arabia
- **Set Appropriate Daily Limits**: Balance between efficiency and team capacity
- **Regular Planning**: Run automated planning quarterly or when contracts change
- **Conflict Resolution**: Use "Reschedule" for most scenarios, "Skip" for strict schedules

---

## 🔐 **Permissions**

### **Access Control**
- **Admin Only**: Only users with admin permissions can access automated planning
- **Supervisor Access**: Supervisors can view and modify generated visits
- **Viewer Access**: Viewers can see planned visits but cannot modify them

### **Security Features**
- **Audit Trail**: All automated planning operations are logged
- **Created By Tracking**: Visits are marked with system identifier
- **Permission Validation**: System checks permissions before allowing planning

---

## 📞 **Support**

### **Getting Help**
- **Documentation**: Refer to this guide for common questions
- **System Logs**: Check browser console for detailed error messages
- **Admin Support**: Contact system administrator for technical issues

### **Feature Requests**
- **Enhancement Ideas**: Submit suggestions for future improvements
- **Bug Reports**: Report any issues with the planning system
- **Feedback**: Provide feedback on planning accuracy and efficiency

---

**Last Updated**: January 15, 2025  
**Version**: 1.0  
**Compatibility**: Salama Maintenance Scheduler v2.1+ 