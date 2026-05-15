import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In AI Studio, we use the local config file. 
// For Netlify/Production, use VITE_ environment variables.
const firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};

// Fallback for AI Studio development environment
if (!firebaseConfig.apiKey && import.meta.env.DEV) {
  try {
    const localConfig = await import('../firebase-applet-config.json');
    const config = localConfig.default || localConfig;
    Object.assign(firebaseConfig, config);
  } catch (e) {
    console.warn("Local firebase-applet-config.json not found.");
  }
}

let app;
let db: any;
let auth: any;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  auth = getAuth(app);
} else {
  console.error("Firebase API Key is missing. Check your .env file or Netlify environment variables.");
  // Export "null" or dummy versions to prevent import errors, 
  // but the app should handle the missing config gracefully.
  db = null;
  auth = null;
}

export { db, auth };
