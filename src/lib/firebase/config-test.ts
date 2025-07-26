import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for TESTING environment
const firebaseTestConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_TEST_API_KEY || "AIzaSyBIyQYGTyB0v8ERXDUAB5-9IPlZda9P7Bw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_TEST_AUTH_DOMAIN || "salama-maintenance-test.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_TEST_PROJECT_ID || "salama-maintenance-test",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_TEST_STORAGE_BUCKET || "salama-maintenance-test.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MESSAGING_SENDER_ID || "147270460266",
  appId: process.env.NEXT_PUBLIC_FIREBASE_TEST_APP_ID || "1:147270460266:web:0f8decd600a927e52d7b13",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MEASUREMENT_ID || "G-HB1VBJN9HD",
};

// Initialize Firebase for testing
let testApp: any = null;
let testAuth: any = null;
let testDb: any = null;
let testStorage: any = null;

if (typeof window !== 'undefined') {
  try {
    testApp = initializeApp(firebaseTestConfig, 'test');
    testAuth = getAuth(testApp);
    testDb = getFirestore(testApp);
    testStorage = getStorage(testApp);
  } catch (error) {
    console.error('Failed to initialize Firebase Test:', error);
  }
}

export { testAuth, testDb, testStorage };
export default testApp; 