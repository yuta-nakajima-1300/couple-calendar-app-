import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app;
