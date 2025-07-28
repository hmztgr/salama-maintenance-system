import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
};

// Initialize the app only if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

/**
 * Delete a user from Firebase Auth
 */
export async function deleteAuthUser(uid: string): Promise<void> {
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