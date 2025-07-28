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
- **main** = Development branch (new Firebase project)
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

- **Production (SSCO-planner-prod)**: [Your SSCO-planner-prod branch Netlify URL]
- **Development (main)**: [Your main branch Netlify URL]
- **Feature Development (feature/weekly-planner-drag-drop)**: [Your feature branch Netlify URL]

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
**Note**: These credentials are available in development branches (feature/weekly-planner-drag-drop, main) but have been removed from the production branch (SSCO-planner-prod) for security.

### 🛡️ Security Notes

- **Production (SSCO-planner-prod)**: Uses current Firebase project with real data
- **Development (main)**: Will use new Firebase project for testing
- **Firebase Admin SDK**: Required for complete user deletion (Auth + Firestore)
- **Quick Login**: Removed from production for security

---

**Last Updated:** January 19, 2025  
**Status:** Ready for production deployment 