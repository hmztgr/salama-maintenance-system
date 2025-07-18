import { initializeApp } from 'firebase/app';

/**
 * Simple Firebase initialization test that doesn't require database access
 */
export async function testFirebaseInit(): Promise<boolean> {
  try {
    console.log('🔥 Testing Firebase initialization...');

    // Check if environment variables are loaded
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    if (!config.apiKey || !config.projectId) {
      console.error('❌ Missing Firebase configuration');
      return false;
    }

    // Try to initialize Firebase (this should work even without network)
    const testApp = initializeApp(config, 'test-app');

    if (testApp) {
      console.log('✅ Firebase initialized successfully');
      console.log('📋 Project ID:', config.projectId);
      return true;
    }

    return false;

  } catch (error: any) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
}
