// src/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // Import auth methods

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: __firebase_config__ and __app_id__ are global variables provided by the Canvas environment.
// Do NOT hardcode your Firebase config or API key here in production.
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string;


let firebaseConfig: any;
let appId: string;
let initialAuthToken: string | undefined;

// Check if the variables are defined by the environment (Canvas specific)
if (typeof __firebase_config !== 'undefined' && typeof __app_id !== 'undefined') {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
    appId = __app_id;
    initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;
    console.log('Firebase config loaded from Canvas environment.');
  } catch (error) {
    console.error('Failed to parse Firebase config from Canvas environment:', error);
    // Fallback or error handling if parsing fails
    // Using provided keys as a fallback if Canvas environment variables are not available or parsing fails
    firebaseConfig = {
      apiKey: "AIzaSyBBT4jPexRxFsk00Ly4Dwah3Q01NTtiOS8", // Your provided API Key
      authDomain: "maopay-app.vercel.app", // Your provided Auth Domain
      projectId: "maopay-app", // Your provided Project ID
      storageBucket: "maopay-app.appspot.com", // Your provided Storage Bucket
      messagingSenderId: "1017073316088", // Your provided Messaging Sender ID
      appId: "1:1017073316088:web:17f10fa54e3e2702a34b0d" // Your provided App ID
    };
    appId = 'maopay-app'; // Use your project ID as fallback app ID
  }
} else {
  console.warn('__firebase_config__ or __app_id__ not found in global scope. Using provided config for fallback.');
  // This is a fallback for local development or if not running in Canvas.
  // Using the Firebase keys provided by the user.
  firebaseConfig = {
    apiKey: "AIzaSyBBT4jPexRxFsk00Ly4Dwah3Q01NTtiOS8", // Your provided API Key
    authDomain: "maopay-app.vercel.app", // Your provided Auth Domain
    projectId: "maopay-app", // Your provided Project ID
    storageBucket: "maopay-app.appspot.com", // Your provided Storage Bucket
    messagingSenderId: "1017073316088", // Your provided Messaging Sender ID
    appId: "1:1017073316088:web:17f10fa54e3e2702a34b0d" // Your provided App ID
  };
  appId = 'maopay-app'; // Use your project ID as fallback app ID
  initialAuthToken = undefined; // No auth token for local dev fallback
}


// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Authenticate with Firebase using the provided token or anonymously
// This is crucial for Firestore security rules to work correctly
async function authenticateFirebase() {
  try {
    if (initialAuthToken) {
      await signInWithCustomToken(auth, initialAuthToken);
      console.log('Firebase authenticated with custom token.');
    } else {
      // If no custom token, sign in anonymously (less secure for production without proper rules)
      await signInAnonymously(auth);
      console.log('Firebase authenticated anonymously.');
    }
  } catch (error) {
    console.error('Firebase authentication failed:', error);
    // Handle authentication error
  }
}

// Call authentication function immediately
authenticateFirebase();


// Export Firestore instance and helper functions
export { db, auth, collection, addDoc, appId };

