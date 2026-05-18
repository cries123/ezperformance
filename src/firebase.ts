import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase is currently deactivated as the user declined setup.
// To reactivate, link a project and provide the VITE_FIREBASE_API_KEY.

let db: any = null;
let auth: any = null;

export { db, auth };
