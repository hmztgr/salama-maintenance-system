import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration - loaded from environment variables or use actual project config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBIyQYGTyB0v8ERXDUAB5-9IPlZda9P7Bw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "salama-maintenance-prod.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "salama-maintenance-prod",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "salama-maintenance-prod.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "147270460266",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:147270460266:web:0f8decd600a927e52d7b13",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HB1VBJN9HD",
};

// Validate configuration
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.warn('⚠️ Firebase configuration missing from environment variables. Using project default configuration.');
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
