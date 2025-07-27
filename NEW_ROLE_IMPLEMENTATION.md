# New Role Implementation: Operations Manager (مدير العمليات)

## Overview

A new role has been added to the Salama Maintenance System: **Operations Manager (مدير العمليات)** with the role code `operations_manager`.

## Role Hierarchy

The updated role hierarchy is now:
1. **Admin (مدير النظام)** - Level 4 - Full system access
2. **Operations Manager (مدير العمليات)** - Level 3 - Full access except admin functions
3. **Supervisor (مشرف)** - Level 2 - Operational management
4. **Viewer (مستخدم)** - Level 1 - Read-only access

## Operations Manager Permissions

### ✅ Full Access To:
- **Customer Management**: Create, read, update, delete, export, import
- **Planning & Scheduling**: Full visit planning and scheduling capabilities
- **Visit Management**: Complete visit lifecycle management
- **Reports**: Full reporting and analytics access
- **Issues Management**: Complete issue tracking and management
- **Emergency Tickets**: Full emergency ticket management
- **User Profiles**: Read and update user profiles (limited)
- **System Audit**: Read audit logs (limited)

### ❌ Restricted From:
- **Admin Tab (إدارة النظام)**: Cannot access the admin panel
- **User Management**: Cannot create, delete, or manage user accounts
- **Role Management**: Cannot modify roles and permissions
- **System Settings**: Cannot modify system configuration
- **Invitations**: Cannot send or manage user invitations
- **Firebase Testing**: Cannot access Firebase testing tools
- **Data Migration**: Cannot perform data migration operations

## Implementation Details

### Files Modified:
1. **Type Definitions**:
   - `src/types/role-management.ts`
   - `src/types/auth.ts`
   - `src/types/invitation.ts`

2. **Role Management**:
   - `src/hooks/useRoleManagement.ts`
   - `src/hooks/useRoleManagementFirebase.ts`

3. **UI Components**:
   - `src/components/admin/AdvancedRoleManagement.tsx`
   - `src/components/MainDashboard.tsx`
   - `src/components/profile/UserProfile.tsx`
   - `src/components/customers/ContractDetailView.tsx`
   - `src/components/customers/CompanyDetailView.tsx`
   - `src/components/customers/BranchDetailView.tsx`

4. **Authentication**:
   - `src/contexts/AuthContext.tsx`
   - `src/hooks/useForgotPassword.ts`

5. **Security**:
   - `firestore.rules`

### Demo User Added:
- **Username**: `operations_manager`
- **Email**: `operations@salamasaudi.com`
- **Name**: `مدير العمليات`
- **Password**: Any password with 3+ characters

## Testing

To test the new role:

1. Login with username: `operations_manager`
2. Verify access to all main features (customers, planning, reports, etc.)
3. Verify that the admin tab (إدارة النظام) is not visible
4. Verify that all operational functions work correctly

## Security Considerations

- The role follows the principle of least privilege
- Operations managers cannot access system administration functions
- All permissions are properly enforced at both UI and backend levels
- Firestore security rules have been updated to include the new role

## Future Enhancements

- Consider adding specific permissions for operations managers to manage team assignments
- May add audit logging for operations manager actions
- Could implement approval workflows for certain operations manager actions 