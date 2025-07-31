# 🚀 Production Deployment Setup Guide

## SSCO-planner-prod Branch - Production Version for End Users

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

# Firebase Admin SDK Configuration (For Server-Side Operations)
FIREBASE_ADMIN_TYPE=service_account
FIREBASE_ADMIN_PROJECT_ID=your_current_firebase_project_id
FIREBASE_ADMIN_PRIVATE_KEY_ID=your_admin_private_key_id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=your_admin_client_id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your_project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

### 🎯 Deployment Strategy

**Branch Purpose:**
- **SSCO-planner-prod** = Production for end users (current Firebase)
- **ssco-planner-dev** = Development branch (new Firebase project) ⭐ **NEW**
- **feature/weekly-planner-drag-drop** = Feature development branch

### 📝 Setup Steps

1. **Create New Netlify Site for SSCO-planner-prod Branch:**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect to same GitHub repo
   - Select **SSCO-planner-prod** branch
   - Set build command: `npm run build`
   - Set publish directory: `out`

2. **Configure Environment Variables:**
   - Copy all Firebase variables from current working site
   - Add Firebase Admin SDK variables (see Firebase Console → Project Settings → Service Accounts)
   - Deploy

3. **Set Up Firebase Admin SDK:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Extract the values and add them to Netlify environment variables
   - This enables server-side operations like deleting Auth users

4. **Verify Production Site:**
   - Test EmailJS functionality
   - Test Firebase connection
   - Test invitation acceptance flow
   - Test data cleanup tool (Admin → تنظيف البيانات)

### 🔗 URLs

- **Production (SSCO-planner-prod)**: https://ssco-planner.netlify.app/
- **Development (ssco-planner-dev)**: [Your dev branch Netlify URL - To be created] ⭐ **NEW**
- **Feature Development (feature/weekly-planner-drag-drop)**: [Your feature branch Netlify URL - To be created]

### ⚡ Quick Access to Environment Variables

**From Your Working Site:**
1. Go to working Netlify site dashboard
2. Site Settings → Environment Variables
3. Copy all Firebase variables
4. Add Firebase Admin SDK variables from Firebase Console

### 🔐 Development Credentials (For Development Branches Only)

**Quick Login Credentials:**
```typescript
Email: admin@salamasaudi.com
Password: admin123456
Role: مدير النظام (Admin)
```
**Note**: These credentials are available in development branches (feature/weekly-planner-drag-drop, ssco-planner-dev) but have been removed from the production branch (SSCO-planner-prod) for security.

### 🛡️ Security Notes

- **Production (SSCO-planner-prod)**: Uses current Firebase project with real data
- **Development (ssco-planner-dev)**: Will use new Firebase project for testing ⭐ **NEW**
- **Firebase Admin SDK**: Required for complete user deletion (Auth + Firestore)
- **Quick Login**: Removed from production for security

## 🚀 Development Environment Setup

### ✅ COMPLETED STEPS

1. **✅ Firebase Project Created**: `ssco-planner-dev` project created at https://console.firebase.google.com/u/0/project/ssco-planner-dev/firestore
2. **✅ Firebase Configuration Updated**: `src/lib/firebase/config.ts` updated to support development environment
3. **✅ Environment Detection**: Added `isDevEnvironment` logic to detect `ssco-planner-dev` project

### 📋 NEXT STEPS TO COMPLETE

#### Step 1: Configure Firebase Services (Manual - Firebase Console)

1. **Authentication**:
   - Go to https://console.firebase.google.com/u/0/project/ssco-planner-dev/authentication
   - Click "Get started"
   - Enable Email/Password authentication
   - Add test user: `admin@salamasaudi.com` / `admin123456`

2. **Firestore Database**:
   - Go to https://console.firebase.google.com/u/0/project/ssco-planner-dev/firestore
   - Click "Create database"
   - Start in test mode (for development)
   - Choose location: `us-central1` (same as production)

3. **Storage** (if needed):
   - Go to https://console.firebase.google.com/u/0/project/ssco-planner-dev/storage
   - Click "Get started"
   - Start in test mode

#### Step 2: Get Firebase Configuration (Manual - Firebase Console)

1. **Project Settings**:
   - Go to https://console.firebase.google.com/u/0/project/ssco-planner-dev/settings/general
   - Scroll to "Your apps" section
   - Click "Add app" → Web app
   - App nickname: `ssco-planner-dev-web`
   - Register app

2. **Copy Configuration**:
   ```javascript
   // Development Firebase Config (copy from Firebase Console)
   const firebaseConfig = {
     apiKey: "your_dev_api_key",
     authDomain: "ssco-planner-dev.firebaseapp.com",
     projectId: "ssco-planner-dev",
     storageBucket: "ssco-planner-dev.appspot.com",
     messagingSenderId: "your_dev_messaging_sender_id",
     appId: "your_dev_app_id",
     measurementId: "your_dev_measurement_id"
   };
   ```

#### Step 3: Create GitHub Branch (Manual - Git Commands)

```bash
# Create and switch to development branch
git checkout -b ssco-planner-dev

# Commit the Firebase configuration changes
git add src/lib/firebase/config.ts
git commit -m "Add development environment support for ssco-planner-dev"

# Push the new branch to GitHub
git push -u origin ssco-planner-dev
```

#### Step 4: Create Netlify Site for Development Branch (Manual - Netlify Dashboard)

1. **Go to Netlify Dashboard**: https://app.netlify.com/
2. **New site from Git**:
   - Connect to same GitHub repo
   - Select `ssco-planner-dev` branch
   - Set build command: `npm run build`
   - Set publish directory: `out`
   - Site name: `ssco-planner-dev` (or auto-generated)

#### Step 5: Configure Environment Variables (Manual - Netlify Dashboard)

Add these environment variables to your **ssco-planner-dev Netlify Site**:

```bash
# Development Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ssco-planner-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ssco-planner-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ssco-planner-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_dev_measurement_id

# EmailJS Configuration (same as production)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

#### Step 6: Test Development Environment

1. **Deploy Development Branch**:
   - Push changes to ssco-planner-dev branch
   - Verify Netlify deployment

2. **Test Features**:
   - Quick login should work (credentials available)
   - Demo data generation
   - All CRUD operations
   - Invitation system

3. **Verify Data Isolation**:
   - Development site should have separate data
   - Production site should remain unaffected

### 📋 Step 7: Update Documentation

1. **Update URLs**:
   - Add ssco-planner-dev branch Netlify URL to this document
   - Update feature branch URLs when created

2. **Environment Summary**:
   - **Production**: https://ssco-planner.netlify.app/ (SSCO-planner-prod branch)
   - **Development**: [ssco-planner-dev branch URL] (ssco-planner-dev branch) ⭐ **NEW**
   - **Feature**: [Feature branch URL] (feature/weekly-planner-drag-drop branch)

---

**Last Updated:** January 24, 2025  
**Status:** Production deployed, Development setup in progress - Firebase config updated, manual steps remaining 