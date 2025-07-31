import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Determine environment
const isTestEnvironment = process.env.NEXT_PUBLIC_FIREBASE_ENV === 'test' || 
                         process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_TEST_FIREBASE === 'true';

const isDevEnvironment = process.env.NEXT_PUBLIC_FIREBASE_ENV === 'dev' || 
                        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'ssco-planner-dev';

// Firebase configuration - loaded from environment variables or use actual project config
const firebaseConfig = isTestEnvironment ? {
  // Test environment config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_TEST_API_KEY || "AIzaSyBIyQYGTyB0v8ERXDUAB5-9IPlZda9P7Bw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_TEST_AUTH_DOMAIN || "salama-maintenance-test.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_TEST_PROJECT_ID || "salama-maintenance-test",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_TEST_STORAGE_BUCKET || "salama-maintenance-test.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MESSAGING_SENDER_ID || "147270460266",
  appId: process.env.NEXT_PUBLIC_FIREBASE_TEST_APP_ID || "1:147270460266:web:0f8decd600a927e52d7b13",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MEASUREMENT_ID || "G-HB1VBJN9HD",
} : isDevEnvironment ? {
  // Development environment config (ssco-planner-dev)
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your_dev_firebase_api_key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ssco-planner-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ssco-planner-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ssco-planner-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_dev_messaging_sender_id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your_dev_firebase_app_id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "your_dev_measurement_id",
} : {
  // Production environment config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBIyQYGTyB0v8ERXDUAB5-9IPlZda9P7Bw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "salama-maintenance-prod.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "salama-maintenance-prod",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "salama-maintenance-prod.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "147270460266",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:147270460266:web:0f8decd600a927e52d7b13",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HB1VBJN9HD",
};

// Validate configuration
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !isTestEnvironment && !isDevEnvironment) {
  console.warn('⚠️ Firebase configuration missing from environment variables. Using project default configuration.');
}

if (isTestEnvironment) {
  console.log('🧪 Using Firebase TEST environment');
} else if (isDevEnvironment) {
  console.log('🔧 Using Firebase DEVELOPMENT environment (ssco-planner-dev)');
} else {
  console.log('🚀 Using Firebase PRODUCTION environment');
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
