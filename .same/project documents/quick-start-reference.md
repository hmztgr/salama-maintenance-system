# Quick Start Reference - Salama Maintenance System

## 🚀 **Immediate Setup (5 minutes)**

### **1. Environment Setup**
```bash
cd salama-maintenance-system-main
npm install
npm run dev
```

### **2. Test Access**
- **URL**: http://localhost:3000
- **Login**: admin@salamasaudi.com / admin123456
- **Production**: sparkling-beignet-8f54c9.netlify.app

### **3. Key Environment Variables**
```bash
# Required in .env.local
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salama-maintenance-prod
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
# [See full list in project-continuation-guide.md]
```

---

## 📁 **Critical Files to Know**

### **Firebase Hooks (Real-time Data)**
- `src/hooks/useCompaniesFirebase.ts` - Companies CRUD
- `src/hooks/useContractsFirebase.ts` - Contracts CRUD  
- `src/hooks/useBranchesFirebase.ts` - Branches CRUD
- `src/hooks/useVisitsFirebase.ts` - Visits CRUD
- `src/hooks/useFirebaseStorage.ts` - File uploads

### **Main Components**
- `src/components/customers/NewCustomerManagement.tsx` - Company/Contract/Branch management
- `src/components/planning/PlanningGrid.tsx` - Weekly visit planning
- `src/components/planning/VisitForm.tsx` - Visit creation with file uploads
- `src/components/admin/InvitationManagement.tsx` - User invitations

### **Configuration**
- `firestore.rules` - Database security rules
- `next.config.js` - Static export configuration
- `netlify.toml` - Deployment configuration

---

## 🔥 **Firebase Collections**

```
Firestore Structure:
├── companies/     # Client companies
├── contracts/     # Service agreements  
├── branches/      # Company locations
├── visits/        # Maintenance visits
├── users/         # User profiles & roles
└── invitations/   # Email invitations
```

---

## 🛠️ **Common Development Tasks**

### **Add New Feature**
1. Create component in appropriate folder
2. Add Firebase hook if needed
3. Update security rules if new collection
4. Test real-time sync
5. Update documentation

### **Debug Issues**
1. Check browser console for errors
2. Check Firebase console for data
3. Verify environment variables
4. Check Netlify deployment logs

### **Deploy Changes**
```bash
npm run build    # Test build locally
git push         # Auto-deploys to Netlify
```

---

## ⚡ **Quick Feature Status**

### ✅ **Working Features**
- User authentication & roles
- Company/Contract/Branch management
- Visit planning & scheduling
- File uploads (photos, documents)
- Real-time multi-user sync
- Email invitations
- Arabic interface

### 🔄 **Next Priorities**
1. Mobile responsiveness
2. Performance optimization
3. Reporting system
4. Advanced planning features

---

## 📞 **Need Help?**

1. **Read**: `project-continuation-guide.md` (full details)
2. **Check**: Firebase console for live data
3. **Test**: Production app for feature reference
4. **Debug**: Browser dev tools + Firebase logs

**Production URL**: sparkling-beignet-8f54c9.netlify.app  
**Firebase Project**: salama-maintenance-prod  
**Status**: Production-ready with 100% core features complete 