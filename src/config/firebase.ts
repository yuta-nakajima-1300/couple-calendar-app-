import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
 const firebaseConfig = {
  apiKey: "AIzaSyA6rjou9WjkG-Ivqfpqcis5jZXbGLfyXDY",
  authDomain: "couple-calendar-app-ac225.firebaseapp.com",
  projectId: "couple-calendar-app-ac225",
  storageBucket: "couple-calendar-app-ac225.firebasestorage.app",
  messagingSenderId: "1093220447522",
  appId: "1:1093220447522:web:9d96a3e6087f9ad4f6217b",
  measurementId: "G-00RBKPTXQ7"
};

// Initialize Firebase with error handling
let app: any;
try {
  app = initializeApp(firebaseConfig);
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
      _db = getFirestore(app);
    } catch (error) {
      console.warn('Firebase Firestore initialization failed:', error);
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

// Legacy exports for backward compatibility - with error handling
let db: any;
let storage: any;

try {
  db = getDb();
} catch (error) {
  console.warn('Firebase db export failed, will retry on first use');
  db = null;
}

try {
  storage = getStorageInstance();
} catch (error) {
  console.warn('Firebase storage export failed, will retry on first use');
  storage = null;
}

export { db, storage };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
