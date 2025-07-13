import { initializeApp, getApps, getApp } from 'firebase/app';
  import { getAuth, GoogleAuthProvider } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';
  import { getDatabase } from 'firebase/database';

  // Firebase configuration from environment variables
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  // Initialize services
  export const auth = getAuth(app);
  export const googleProvider = new GoogleAuthProvider();

  let db: any = null;
  let database: any = null;

  export const getSafeDb = () => {
    if (!db) {
      try {
        db = getFirestore(app);
      } catch (error) {
        console.error('Failed to initialize Firestore:', error);
      }
    }
    return db;
  };

  export const getSafeDatabase = () => {
    if (!database) {
      try {
        database = getDatabase(app);
      } catch (error) {
        console.error('Failed to initialize Realtime Database:', error);
      }
    }
    return database;
  };

  export { app };
