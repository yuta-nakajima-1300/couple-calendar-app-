import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Validate required environment variables
const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase with error handling
let app: any;
try {
  console.log('Initializing Firebase with config:', {
    apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'production'
  });
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Firebase app initialization failed:', error);
  throw error;
}

// Initialize Firebase services with proper error handling
export const auth = getAuth(app);

// Lazy initialization for web environments
let _db: any = null;
let _storage: any = null;

export const getDb = () => {
  if (!_db) {
    try {
      console.log('Initializing Firestore...');
      _db = getFirestore(app);
      console.log('Firestore initialized successfully');
    } catch (error) {
      console.error('Firebase Firestore initialization failed:', error);
      throw new Error('Firebase Firestore not available');
    }
  }
  return _db;
};

export const getStorageInstance = () => {
  if (!_storage) {
    try {
      _storage = getStorage(app);
    } catch (error) {
      console.warn('Firebase Storage initialization failed:', error);
      throw new Error('Firebase Storage not available');
    }
  }
  return _storage;
};

// Legacy exports - completely lazy initialization
export const db = null; // Force lazy initialization
export const storage = null; // Force lazy initialization

// Safe getter functions that always work
export const getSafeDb = () => {
  try {
    return getDb();
  } catch (error) {
    console.warn('Database not available:', error);
    return null;
  }
};

export const getSafeStorage = () => {
  try {
    return getStorageInstance();
  } catch (error) {
    console.warn('Storage not available:', error);
    return null;
  }
};

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
