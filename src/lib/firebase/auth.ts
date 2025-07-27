import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { UserRole } from '@/types/auth';

export interface FirebaseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  profilePhoto?: string;
  phone?: string;
  invitedBy?: string;
}

/**
 * Sign in user with email and password
 */
export async function signInUser(email: string, password: string): Promise<FirebaseUserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userProfile = await getUserProfile(userCredential.user.uid);

  // Update last login time
  await updateUserProfile(userCredential.user.uid, {
    lastLoginAt: new Date().toISOString(),
  });

  return userProfile;
}

/**
 * Create new user account
 */
export async function createUser(
  email: string,
  password: string,
  userData: {
    displayName: string;
    role: UserRole;
    phone?: string;
    invitedBy?: string;
  }
): Promise<FirebaseUserProfile> {
  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, {
    displayName: userData.displayName,
  });

  // Send email verification
  await sendEmailVerification(user);

  // Create user profile in Firestore
  const userProfile: FirebaseUserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: userData.displayName,
    role: userData.role,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    phone: userData.phone,
    invitedBy: userData.invitedBy,
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);

  return userProfile;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<FirebaseUserProfile> {
  const userDoc = await getDoc(doc(db, 'users', uid));

  if (!userDoc.exists()) {
    throw new Error('User profile not found');
  }

  return userDoc.data() as FirebaseUserProfile;
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<FirebaseUserProfile>
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...updates,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = { viewer: 1, supervisor: 2, operations_manager: 3, admin: 4 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Initialize admin user (for initial setup)
 */
export async function initializeAdminUser(): Promise<void> {
  try {
    // Check if admin user already exists
    const adminEmail = 'admin@salamasaudi.com';

    // Create admin user
    await createUser(adminEmail, 'admin123', {
      displayName: 'مدير النظام',
      role: 'admin',
    });

    console.log('✅ Admin user created successfully');
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists');
    } else {
      console.error('❌ Failed to create admin user:', error);
      throw error;
    }
  }
}
