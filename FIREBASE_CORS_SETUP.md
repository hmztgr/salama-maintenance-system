# Firebase Storage CORS Configuration

## Issue
File uploads are failing with CORS errors because Firebase Storage bucket is not configured to allow requests from your Netlify domain.

## Solution

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Create CORS Configuration File
Create a file named `cors.json` with the following content:

```json
[
  {
    "origin": [
      "https://salama-restructured-contract-system.netlify.app",
      "https://salama-maintenance-system.netlify.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ]
  }
]
```

### 4. Apply CORS Configuration
```bash
gsutil cors set cors.json gs://salama-maintenance-prod.firebasestorage.app
```

### 5. Verify Configuration
```bash
gsutil cors get gs://salama-maintenance-prod.firebasestorage.app
```

## Alternative: Firebase Console Method

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `salama-maintenance-prod`
3. Go to Storage
4. Click on "Rules" tab
5. Add CORS headers to your storage rules:

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

## Temporary Workaround

If you can't configure CORS immediately, you can:

1. Test file uploads locally (localhost:3000)
2. Use a different storage solution temporarily
3. Disable file uploads until CORS is configured

## Testing

After applying CORS configuration:

1. Deploy the changes
2. Test file uploads in companies and contracts
3. Verify files are stored and accessible

## Common Issues

- **Wrong bucket name**: Make sure you're using the correct storage bucket
- **Incorrect origins**: Add all your domains including localhost for development
- **Cache issues**: Clear browser cache after CORS changes
- **Firebase rules**: Ensure storage rules allow authenticated users to upload 