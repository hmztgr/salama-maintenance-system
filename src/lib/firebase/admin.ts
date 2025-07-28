import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if environment variables are available
let adminAuth: any = null;
let adminDb: any = null;

// Only initialize if we're in a server environment and have the required variables
if (typeof window === 'undefined' && process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
  try {
    const serviceAccount = {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID!,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID!,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL!,
    };

    // Initialize the app only if it hasn't been initialized
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount as any),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    
    adminAuth = getAuth();
    adminDb = getFirestore();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

// Export the admin objects
export { adminAuth, adminDb };

/**
 * Delete a user from Firebase Auth
 */
export async function deleteAuthUser(uid: string): Promise<void> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    await adminAuth.deleteUser(uid);
    console.log(`✅ Deleted auth user: ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to delete auth user ${uid}:`, error);
    throw error;
  }
}

/**
 * List all users from Firebase Auth
 */
export async function listAuthUsers(): Promise<any[]> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  
  try {
    const listUsersResult = await adminAuth.listUsers();
    return listUsersResult.users;
  } catch (error) {
    console.error('❌ Failed to list auth users:', error);
    throw error;
  }
}

/**
 * Delete multiple users from Firebase Auth
 */
export async function deleteMultipleAuthUsers(uids: string[]): Promise<number> {
  if (!adminAuth) {
    console.warn('Firebase Admin SDK not initialized - skipping auth user deletion');
    return 0;
  }
  
  let deletedCount = 0;
  
  for (const uid of uids) {
    try {
      await deleteAuthUser(uid);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete user ${uid}:`, error);
    }
  }
  
  return deletedCount;
} 