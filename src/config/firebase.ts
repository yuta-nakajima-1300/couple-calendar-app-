import { initializeApp, getApps, getApp } from 'firebase/app';
  import { getAuth, GoogleAuthProvider } from 'firebase/auth';
  import { getFirestore } from 'firebase/firestore';
  import { getDatabase } from 'firebase/database';

  // 一時的にハードコード（本番環境でのみ）
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
