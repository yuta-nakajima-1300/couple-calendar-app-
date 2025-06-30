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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with error handling
export const auth = getAuth(app);

let db: any;
let storage: any;

try {
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase initialization warning:', error);
  // Retry initialization after a short delay for web environments
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        db = getFirestore(app);
        storage = getStorage(app);
      } catch (retryError) {
        console.error('Firebase retry initialization failed:', retryError);
      }
    }, 1000);
  }
}

export { db, storage };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
