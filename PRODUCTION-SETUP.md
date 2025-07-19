# 🚀 Production Deployment Setup Guide

## Main Branch - Stable Production Version for End Users

### 📋 Required Environment Variables

Copy these environment variables to your **Main Branch Netlify Site**:

```bash
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 🎯 Deployment Strategy

**Branch Purpose:**
- **main** = Stable production for end user testing
- **restructured-contract-system** = Development branch for ongoing work

### 📝 Setup Steps

1. **Create New Netlify Site for Main Branch:**
   - Go to Netlify Dashboard
   - Click "New site from Git"
   - Connect to same GitHub repo
   - Select **main** branch
   - Set build command: `npm run build`
   - Set publish directory: `out`

2. **Configure Environment Variables:**
   - Copy all variables from working site
   - Add them to new main branch site
   - Deploy

3. **Verify Production Site:**
   - Test EmailJS functionality
   - Test Firebase connection
   - Test all contract features

### 🔗 URLs

- **Production (Main)**: [Your main branch Netlify URL]
- **Development (Restructured)**: [Your restructured branch Netlify URL]

### ⚡ Quick Access to Environment Variables

**From Your Working Site:**
1. Go to working Netlify site dashboard
2. Site Settings → Environment Variables
3. Copy all variables
4. Apply to main branch site

### 🛡️ Security Notes

- Both sites use same Firebase project (production data)
- Consider separate Firebase projects for true prod/dev separation
- Environment variables are the same for both sites

---

**Last Updated:** January 19, 2025  
**Status:** Ready for production deployment 