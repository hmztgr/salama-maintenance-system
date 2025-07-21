import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMO',
};

// Validate configuration
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn('⚠️ Firebase configuration missing. Check .env.local file. Using demo configuration.');
}

// Initialize Firebase only if we have the required configuration
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// For development, always initialize with demo config if real config is missing
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

// Export services (will be null if Firebase is not initialized)
export { auth, db, storage };

export default app;
