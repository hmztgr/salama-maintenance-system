# 🚀 Production Deployment Setup Guide

## SSCO-planner-prod Branch - Stable Production Version for End Users

### 📋 Required Environment Variables

Copy these environment variables to your **SSCO-planner-prod Branch Netlify Site**:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Firebase Configuration (CURRENT FIREBASE FOR PRODUCTION)
NEXT_PUBLIC_FIREBASE_API_KEY=your_current_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_current_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_current_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_current_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_current_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_current_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_current_measurement_id
```

### 🔥 Firebase Project Strategy

**UPDATED APPROACH:**
- **Production**: Keep current Firebase project (has real data)
- **Development**: Create new Firebase project for testing/updates
- **Data Cleanup**: Use admin panel to clean test data from production

#### **Step 1: Clean Current Firebase (Production)**
1. **Access Admin Panel:**
   - Go to your current site
   - Login as admin
   - Navigate to "إدارة النظام" → "🗑️ تنظيف البيانات"

2. **Clean Test Data:**
   - Click "Start Cleanup" button
   - This will delete all test data while preserving admin users
   - Monitor the cleanup logs for progress

3. **Verify Cleanup:**
   - Check that only admin users remain
   - Verify all test companies, contracts, branches, visits are removed
   - Confirm emergency tickets and bug reports are cleaned

#### **Step 2: Create New Firebase for Development**
1. **Create New Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - **Project name**: `ssco-planner-dev` (or your preferred name)
   - **Project ID**: Will auto-generate (e.g., `ssco-planner-dev-12345`)
   - **Enable Google Analytics**: ✅ **YES** (recommended)
   - Click "Create project"

2. **Configure Authentication:**
   - Go to Authentication → Sign-in method
   - Enable Email/Password authentication
   - Add your development domain to authorized domains

3. **Configure Firestore Database:**
   - Go to Firestore Database
   - Create database in production mode
   - Choose location closest to your users (e.g., europe-west3 for Saudi Arabia)

4. **Configure Storage:**
   - Go to Storage
   - Get started with default rules
   - Update rules for development security

5. **Get Configuration:**
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web app
   - Register app and copy config

### 🎯 Deployment Strategy

**Branch Purpose:**
- **SSCO-planner-prod** = Stable production for end users (current Firebase project)
- **main** = Development branch for ongoing work (new Firebase project)

### 📝 Setup Steps

1. **Create New Branch:**
   ```bash
   git checkout -b SSCO-planner-prod
   git push -u origin SSCO-planner-prod
   ```

2. **Clean Production Firebase:**
   - Use the admin panel cleanup tool
   - Remove all test data while preserving admin users
   - Verify cleanup was successful

3. **Create New Netlify Site for SSCO-planner-prod Branch:**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect to same GitHub repo
   - Select **SSCO-planner-prod** branch
   - Set build command: `npm run build`
   - Set publish directory: `out`

4. **Configure Production Environment Variables:**
   - Use the CURRENT Firebase project configuration (production)
   - Copy EmailJS variables from development site
   - Add them to SSCO-planner-prod branch site
   - Deploy

5. **Verify Production Site:**
   - Test EmailJS functionality
   - Test Firebase connection (should connect to production project)
   - Test all contract features
   - Verify only admin users exist

### 🔗 URLs

- **Production (SSCO-planner-prod)**: [Your SSCO-planner-prod branch Netlify URL]
- **Development (Main)**: [Your main branch Netlify URL]

### ⚡ Quick Access to Environment Variables

**From Your Working Site:**
1. Go to working Netlify site dashboard
2. Site Settings → Environment Variables
3. Copy EmailJS variables
4. **IMPORTANT**: Use CURRENT Firebase project config for production

### 🛡️ Security Notes

- **Production Firebase**: Current project with cleaned real data
- **Development Firebase**: New project for testing/development
- **Data Isolation**: Production and development use different Firebase projects
- **Environment Variables**: Different Firebase configs for each environment
- **Domain Security**: Each Firebase project has its own authorized domains
- **Quick Login**: Removed from production for security (credentials preserved in documentation)

### 🔐 Development Credentials (For Development Branches Only)

**Quick Login Credentials:**
```typescript
Email: admin@salamasaudi.com
Password: admin123456
Role: مدير النظام (Admin)
```

**Note**: These credentials are available in development branches (feature/weekly-planner-drag-drop, main) but have been removed from the production branch (SSCO-planner-prod) for security.

### 🔄 Migration Strategy

1. **Phase 1**: Clean current Firebase using admin panel
2. **Phase 2**: Set up SSCO-planner-prod branch and deploy
3. **Phase 3**: Create new Firebase project for development
4. **Phase 4**: Switch end users to production site
5. **Phase 5**: Use development Firebase for all testing/updates

### 🗑️ Data Cleanup Process

The admin panel cleanup tool will:
- ✅ **Preserve**: Admin users
- ❌ **Delete**: All test companies, contracts, branches, visits
- ❌ **Delete**: Emergency tickets, bug reports, demo data
- ❌ **Delete**: Non-admin users
- 📊 **Track**: Real-time progress and statistics
- 📝 **Log**: Detailed cleanup operations

---

**Last Updated:** January 24, 2025  
**Status:** Updated for current Firebase production + new development Firebase 