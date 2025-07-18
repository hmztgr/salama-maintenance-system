import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { createUser, initializeAdminUser } from './auth';
import { SafeStorage } from '@/lib/storage';
import { UserRole } from '@/types/auth';

export interface MigrationResult {
  success: boolean;
  error?: string;
  details?: {
    companies: number;
    contracts: number;
    branches: number;
    visits: number;
    invitations: number;
  };
}

/**
 * Main migration function to move all data from localStorage to Firebase
 */
export async function migrateFromLocalStorage(): Promise<MigrationResult> {
  console.log('🔄 Starting migration from localStorage to Firebase...');

  try {
    // Initialize admin user first
    await initializeAdminUser();

    const results = {
      companies: 0,
      contracts: 0,
      branches: 0,
      visits: 0,
      invitations: 0,
    };

    // Migrate each collection
    results.companies = await migrateCollection('companies', 'companies');
    results.contracts = await migrateCollection('contracts', 'contracts');
    results.branches = await migrateCollection('branches', 'branches');
    results.visits = await migrateCollection('visits', 'visits');
    results.invitations = await migrateCollection('invitations', 'invitations');

    console.log('✅ Migration completed successfully!', results);

    return {
      success: true,
      details: results,
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    };
  }
}

/**
 * Migrate a specific collection from localStorage to Firestore
 */
async function migrateCollection(
  localStorageKey: string,
  firestoreCollection: string
): Promise<number> {
  console.log(`📦 Migrating ${localStorageKey}...`);

  const localData = SafeStorage.get(localStorageKey, []);
  if (!Array.isArray(localData) || localData.length === 0) {
    console.log(`⚠️ No data found in localStorage for ${localStorageKey}`);
    return 0;
  }

  const batch = writeBatch(db);
  const collectionRef = collection(db, firestoreCollection);
  let migrated = 0;

  for (const item of localData) {
    const docId = getDocumentId(item, firestoreCollection);
    if (!docId) {
      console.warn(`⚠️ Skipping item without ID in ${localStorageKey}:`, item);
      continue;
    }

    // Convert dates and prepare data for Firestore
    const firestoreData = prepareForFirestore(item);

    // Add to batch
    batch.set(doc(collectionRef, docId), firestoreData);
    migrated++;
  }

  // Commit batch
  if (migrated > 0) {
    await batch.commit();
    console.log(`✅ Migrated ${migrated} items to ${firestoreCollection}`);
  }

  return migrated;
}

/**
 * Get the document ID for a Firestore document
 */
function getDocumentId(item: any, collection: string): string | null {
  switch (collection) {
    case 'companies':
      return item.id || item.companyId;
    case 'contracts':
      return item.id || item.contractId;
    case 'branches':
      return item.id || item.branchId;
    case 'visits':
      return item.id || item.visitId;
    case 'invitations':
      return item.id;
    default:
      return item.id;
  }
}

/**
 * Prepare data for Firestore by converting dates and adding metadata
 */
function prepareForFirestore(item: any): any {
  const prepared = { ...item };

  // Convert date strings to Firestore Timestamps
  const dateFields = [
    'createdAt', 'updatedAt', 'lastLoginAt',
    'scheduledDate', 'completedDate',
    'contractStartDate', 'contractEndDate',
    'expiresAt', 'sentAt', 'openedAt', 'acceptedAt'
  ];

  dateFields.forEach(field => {
    if (prepared[field] && typeof prepared[field] === 'string') {
      try {
        // Try to convert to Date object
        const date = new Date(prepared[field]);
        if (!isNaN(date.getTime())) {
          prepared[field] = date;
        }
      } catch (error) {
        console.warn(`⚠️ Could not convert date field ${field}:`, prepared[field]);
      }
    }
  });

  // Add migration metadata
  prepared.migratedAt = new Date();
  prepared.migratedFrom = 'localStorage';

  return prepared;
}

/**
 * Verify migration by checking document counts
 */
export async function verifyMigration(): Promise<Record<string, number>> {
  console.log('🔍 Verifying migration...');

  const collections = ['companies', 'contracts', 'branches', 'visits', 'invitations'];
  const results: Record<string, number> = {};

  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      results[collectionName] = snapshot.size;
      console.log(`📊 ${collectionName}: ${snapshot.size} documents`);
    } catch (error) {
      console.error(`❌ Error checking ${collectionName}:`, error);
      results[collectionName] = -1;
    }
  }

  return results;
}

/**
 * Clear localStorage data after successful migration
 */
export async function clearLocalStorageAfterMigration(): Promise<void> {
  console.log('🧹 Clearing localStorage data after migration...');

  const keysToRemove = [
    'companies',
    'contracts',
    'branches',
    'visits',
    'invitations',
    'currentUser'
  ];

  keysToRemove.forEach(key => {
    try {
      SafeStorage.remove(key);
      console.log(`✅ Cleared localStorage key: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Could not clear localStorage key ${key}:`, error);
    }
  });

  console.log('✅ localStorage cleanup completed');
}

/**
 * Test Firebase connection and permissions
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('🔗 Testing Firebase connection...');
    console.log('📊 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

    // Try to read from the test collection (allows unauthenticated access)
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);

    console.log('✅ Firebase connection successful');
    console.log('📋 Test collection size:', snapshot.size);
    return true;

  } catch (error: any) {
    console.error('❌ Firebase connection failed:', error);
    console.error('🔍 Error code:', error?.code);
    console.error('🔍 Error message:', error?.message);
    return false;
  }
}

/**
 * Backup localStorage data before migration
 */
export function backupLocalStorageData(): string {
  console.log('💾 Creating localStorage backup...');

  const backup = {
    timestamp: new Date().toISOString(),
    data: {
      companies: SafeStorage.get('companies', []),
      contracts: SafeStorage.get('contracts', []),
      branches: SafeStorage.get('branches', []),
      visits: SafeStorage.get('visits', []),
      invitations: SafeStorage.get('invitations', []),
      currentUser: SafeStorage.get('currentUser', null),
    }
  };

  const backupString = JSON.stringify(backup, null, 2);
  console.log('✅ Backup created successfully');

  return backupString;
}
