# Firebase Environment Setup Guide
## Production vs Testing Environments

## 🎯 **Overview**

This guide covers different approaches to set up separate Firebase environments for production and testing, along with their pros, cons, costs, and implementation details.

---

## 🔥 **Option 1: Separate Firebase Projects (RECOMMENDED)**

### **Setup:**
- **Production Project**: `salama-maintenance-prod` (existing)
- **Testing Project**: `salama-maintenance-test` (new)

### **Implementation:**

#### **1. Create Test Project:**
```bash
# Create new Firebase project
firebase projects:create salama-maintenance-test
firebase use salama-maintenance-test
```

#### **2. Environment Variables:**
```env
# Production
NEXT_PUBLIC_FIREBASE_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salama-maintenance-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=salama-maintenance-prod.firebasestorage.app

# Testing
NEXT_PUBLIC_FIREBASE_ENV=test
NEXT_PUBLIC_FIREBASE_TEST_API_KEY=your_test_api_key
NEXT_PUBLIC_FIREBASE_TEST_PROJECT_ID=salama-maintenance-test
NEXT_PUBLIC_FIREBASE_TEST_STORAGE_BUCKET=salama-maintenance-test.firebasestorage.app
```

#### **3. Environment Switching:**
```typescript
// src/lib/firebase/config.ts
const isTestEnvironment = process.env.NEXT_PUBLIC_FIREBASE_ENV === 'test';

const firebaseConfig = isTestEnvironment ? {
  // Test config
} : {
  // Production config
};
```

### **✅ Pros:**
- **Complete Isolation**: No risk of test data affecting production
- **Independent Scaling**: Each environment can be optimized separately
- **Security**: Different security rules and access controls
- **Cost Control**: Separate billing and usage tracking
- **Easy Rollback**: Can easily switch between environments
- **Team Safety**: Developers can't accidentally affect production

### **❌ Cons:**
- **Setup Complexity**: Requires initial configuration
- **Data Sync**: Need to manually sync schema changes
- **Cost**: Two separate Firebase projects

### **💰 Cost Impact:**
- **Firebase Free Tier**: Each project gets free tier limits
- **Storage**: ~$0.026/GB/month per project
- **Firestore**: ~$0.18/100K reads, $0.06/100K writes per project
- **Total**: Minimal cost increase, mostly covered by free tiers

---

## 🔥 **Option 2: Single Project with Environment Prefixes**

### **Setup:**
- **Single Project**: `salama-maintenance-prod`
- **Data Separation**: Using collection prefixes

### **Implementation:**

#### **1. Collection Structure:**
```
/prod/companies/{companyId}
/prod/visits/{visitId}
/prod/contracts/{contractId}

/test/companies/{companyId}
/test/visits/{visitId}
/test/contracts/{contractId}
```

#### **2. Environment Detection:**
```typescript
const environment = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'prod';
const collectionPrefix = environment === 'test' ? 'test' : 'prod';

// Usage
const companiesRef = collection(db, `${collectionPrefix}/companies`);
```

### **✅ Pros:**
- **Single Project**: Easier management
- **Lower Cost**: Only one Firebase project
- **Schema Sync**: Automatic schema consistency
- **Simple Setup**: Minimal configuration needed

### **❌ Cons:**
- **Data Mixing Risk**: Potential for test data in production
- **Security Complexity**: Need environment-aware security rules
- **Query Complexity**: All queries need environment prefix
- **Storage Rules**: More complex storage path management

### **💰 Cost Impact:**
- **Minimal**: Single project, shared free tier
- **Storage**: Slightly higher due to prefix overhead

---

## 🔥 **Option 3: Firebase Emulator Suite (Development Only)**

### **Setup:**
- **Local Development**: Firebase emulators
- **Production**: Real Firebase project

### **Implementation:**

#### **1. Install Emulators:**
```bash
npm install -g firebase-tools
firebase init emulators
```

#### **2. Configuration:**
```json
// firebase.json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    }
  }
}
```

#### **3. Environment Detection:**
```typescript
const useEmulator = process.env.NODE_ENV === 'development' && 
                   process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

if (useEmulator) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

### **✅ Pros:**
- **Free**: No Firebase costs for development
- **Fast**: Local development, no network latency
- **Safe**: Can't affect production data
- **Offline**: Works without internet connection

### **❌ Cons:**
- **Development Only**: Not suitable for testing environment
- **Setup Complexity**: Requires local setup
- **Team Coordination**: Each developer needs local setup
- **No Real Testing**: Can't test real Firebase features

### **💰 Cost Impact:**
- **Zero**: Completely free for development

---

## 🔥 **Option 4: Hybrid Approach (RECOMMENDED FOR TEAMS)**

### **Setup:**
- **Development**: Firebase Emulators
- **Testing**: Separate Firebase Test Project
- **Production**: Production Firebase Project

### **Implementation:**

#### **1. Environment Configuration:**
```typescript
const environment = process.env.NEXT_PUBLIC_FIREBASE_ENV || 'production';

switch (environment) {
  case 'development':
    // Use emulators
    break;
  case 'test':
    // Use test Firebase project
    break;
  case 'production':
    // Use production Firebase project
    break;
}
```

#### **2. Package.json Scripts:**
```json
{
  "scripts": {
    "dev": "NEXT_PUBLIC_FIREBASE_ENV=development npm run dev",
    "dev:test": "NEXT_PUBLIC_FIREBASE_ENV=test npm run dev",
    "build:test": "NEXT_PUBLIC_FIREBASE_ENV=test npm run build",
    "build:prod": "NEXT_PUBLIC_FIREBASE_ENV=production npm run build"
  }
}
```

### **✅ Pros:**
- **Cost Effective**: Free development, minimal testing costs
- **Flexible**: Can choose environment per use case
- **Team Friendly**: Developers use emulators, QA uses test project
- **Production Safe**: Clear separation of concerns

### **❌ Cons:**
- **Complex Setup**: Multiple environments to configure
- **Learning Curve**: Team needs to understand environment switching

### **💰 Cost Impact:**
- **Minimal**: Only testing environment costs (covered by free tier)

---

## 🚀 **Recommended Implementation**

### **For Your Use Case: Option 1 (Separate Projects)**

Given your requirements for:
- Identical environments initially
- Future configuration changes
- File management
- Cost considerations

**I recommend Option 1** with the following setup:

#### **Step 1: Create Test Project**
```bash
# Create new Firebase project
firebase projects:create salama-maintenance-test

# Initialize test project
firebase use salama-maintenance-test
firebase init firestore
firebase init storage
firebase init hosting
```

#### **Step 2: Copy Configuration**
```bash
# Copy production rules to test
cp firestore.rules firestore-test.rules
cp storage.rules storage-test.rules
cp firebase.json firebase-test.json
```

#### **Step 3: Set Environment Variables**
```env
# .env.local (development)
NEXT_PUBLIC_FIREBASE_ENV=test
NEXT_PUBLIC_FIREBASE_TEST_API_KEY=your_test_api_key
NEXT_PUBLIC_FIREBASE_TEST_PROJECT_ID=salama-maintenance-test
NEXT_PUBLIC_FIREBASE_TEST_STORAGE_BUCKET=salama-maintenance-test.firebasestorage.app

# .env.production (production)
NEXT_PUBLIC_FIREBASE_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=salama-maintenance-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=salama-maintenance-prod.firebasestorage.app
```

#### **Step 4: Deploy Test Environment**
```bash
# Deploy to test environment
firebase use salama-maintenance-test
firebase deploy

# Deploy to production environment
firebase use salama-maintenance-prod
firebase deploy
```

---

## 🔧 **Migration Scripts**

### **Data Migration Between Environments:**
```typescript
// scripts/migrate-data.ts
import { db } from '../src/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export async function migrateData(sourceEnv: string, targetEnv: string) {
  // Implementation for migrating data between environments
  console.log(`Migrating data from ${sourceEnv} to ${targetEnv}`);
}
```

### **Configuration Sync:**
```typescript
// scripts/sync-config.ts
export async function syncFirebaseConfig() {
  // Sync security rules, indexes, and storage rules between environments
  console.log('Syncing Firebase configuration between environments');
}
```

---

## 💰 **Cost Analysis**

### **Current Setup (Single Project):**
- **Firebase Project**: 1
- **Storage**: ~$0.026/GB/month
- **Firestore**: ~$0.18/100K reads, $0.06/100K writes
- **Total**: Minimal (covered by free tier)

### **Recommended Setup (Two Projects):**
- **Firebase Projects**: 2
- **Storage**: ~$0.052/GB/month (2x)
- **Firestore**: ~$0.36/100K reads, $0.12/100K writes (2x)
- **Total**: Still minimal, mostly covered by free tiers

### **Free Tier Limits (Per Project):**
- **Storage**: 5GB
- **Firestore**: 1GB
- **Reads**: 50K/day
- **Writes**: 20K/day
- **Deletes**: 20K/day

---

## 🛡️ **Security Considerations**

### **Environment Isolation:**
- **Separate API Keys**: Each environment has unique keys
- **Different Domains**: Test environment uses different domains
- **Access Control**: Different user roles per environment

### **Data Protection:**
- **No Cross-Environment Access**: Test can't access production data
- **Backup Strategy**: Regular backups of both environments
- **Disaster Recovery**: Can restore from backups if needed

---

## 📋 **Implementation Checklist**

### **Phase 1: Setup (Week 1)**
- [ ] Create test Firebase project
- [ ] Configure environment variables
- [ ] Update Firebase configuration
- [ ] Deploy test environment
- [ ] Test environment switching

### **Phase 2: Migration (Week 2)**
- [ ] Migrate existing data to test environment
- [ ] Verify data integrity
- [ ] Test all functionality in test environment
- [ ] Update deployment scripts

### **Phase 3: Optimization (Week 3)**
- [ ] Set up monitoring for both environments
- [ ] Configure alerts and notifications
- [ ] Document environment management procedures
- [ ] Train team on environment usage

---

## 🎯 **Next Steps**

1. **Choose Implementation**: Decide on Option 1 (recommended)
2. **Create Test Project**: Set up the test Firebase project
3. **Update Configuration**: Modify the Firebase config files
4. **Test Environment**: Verify everything works in test environment
5. **Deploy**: Deploy to both environments

This setup will give you the flexibility to test changes safely while maintaining production stability. 