# Firebase Storage CORS Configuration Guide

## 🚨 Current Issue
File uploads are failing with CORS errors because Firebase Storage bucket is not configured to allow requests from your Netlify domain.

**Error Example:**
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/salama-maintenance-prod.firebasestorage.app/o' 
from origin 'https://salama-restructured-contract-system.netlify.app' has been blocked by CORS policy
```

## 🔧 Solution Options

### Option 1: Firebase CLI (Recommended)

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Create CORS Configuration File
Create a file named `cors.json` in your project root:

```json
[
  {
    "origin": [
      "https://salama-restructured-contract-system.netlify.app",
      "https://salama-maintenance-system.netlify.app",
      "https://salama-maintenance-prod.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Credentials"
    ]
  }
]
```

#### Step 4: Apply CORS Configuration
```bash
gsutil cors set cors.json gs://salama-maintenance-prod.firebasestorage.app
```

#### Step 5: Verify Configuration
```bash
gsutil cors get gs://salama-maintenance-prod.firebasestorage.app
```

### Option 2: Google Cloud Console

#### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `salama-maintenance-prod`
3. Navigate to **Cloud Storage** → **Browser**

#### Step 2: Configure CORS
1. Click on your bucket: `salama-maintenance-prod`
2. Go to **Permissions** tab
3. Click **Edit CORS configuration**
4. Add the following configuration:

```json
[
  {
    "origin": [
      "https://salama-restructured-contract-system.netlify.app",
      "https://salama-maintenance-system.netlify.app",
      "https://salama-maintenance-prod.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Credentials"
    ]
  }
]
```

5. Click **Save**

### Option 3: Firebase Console (Alternative)

#### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `salama-maintenance-prod`
3. Go to **Storage**

#### Step 2: Update Storage Rules
1. Click on **Rules** tab
2. Update the rules to include CORS headers:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note:** This method may not fully resolve CORS issues as it's primarily for access control, not CORS headers.

## 🧪 Testing After Configuration

### 1. Clear Browser Cache
- Clear browser cache and cookies
- Or test in incognito/private mode

### 2. Test File Uploads
- Try uploading files in companies and contracts
- Check browser console for CORS errors
- Verify files appear in Firebase Storage

### 3. Verify Upload Success
- Files should upload without errors
- Progress should reach 100%
- Files should be accessible in Firebase Storage

## 🔍 Troubleshooting

### Common Issues

#### Issue 1: "gsutil command not found"
**Solution:** Install Google Cloud SDK
```bash
# Windows
# Download from: https://cloud.google.com/sdk/docs/install

# macOS
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

#### Issue 2: "Permission denied"
**Solution:** Ensure you have proper permissions
```bash
# Check current account
gcloud auth list

# Login if needed
gcloud auth login
```

#### Issue 3: "Bucket not found"
**Solution:** Verify bucket name
```bash
# List all buckets
gsutil ls

# Check bucket details
gsutil ls -L gs://salama-maintenance-prod.firebasestorage.app
```

#### Issue 4: CORS still not working after configuration
**Solutions:**
1. **Wait for propagation** (can take up to 10 minutes)
2. **Clear browser cache**
3. **Check domain spelling** in CORS configuration
4. **Verify HTTPS vs HTTP** (use HTTPS for production)

### Debugging Commands

```bash
# Check current CORS configuration
gsutil cors get gs://salama-maintenance-prod.firebasestorage.app

# Test bucket access
gsutil ls gs://salama-maintenance-prod.firebasestorage.app

# Check bucket permissions
gsutil iam get gs://salama-maintenance-prod.firebasestorage.app
```

## 📋 Checklist

- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] CORS configuration file created
- [ ] CORS rules applied to bucket
- [ ] Configuration verified
- [ ] Browser cache cleared
- [ ] File uploads tested
- [ ] Files accessible in Firebase Storage

## 🆘 Still Having Issues?

If CORS issues persist after following this guide:

1. **Check Firebase project settings** - Ensure you're using the correct project
2. **Verify environment variables** - Check `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Test with different browser** - Rule out browser-specific issues
4. **Check network tab** - Look for specific CORS error details
5. **Contact Firebase support** - If all else fails

## 📞 Support

For additional help:
- [Firebase Documentation](https://firebase.google.com/docs/storage)
- [Google Cloud Storage CORS](https://cloud.google.com/storage/docs/cross-origin)
- [Firebase Community](https://firebase.google.com/community) 