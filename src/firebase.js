/*
  FIREBASE SETUP STEPS:
  1. Go to https://firebase.google.com
  2. Click "Get Started" and sign in with Google account
  3. Click "Add Project"
  4. Enter project name: "carrent-manager"
  5. Disable Google Analytics (not needed)
  6. Click "Create Project"
  7. Once created click the Web icon (</>)
  8. Enter app name: "CarRent Manager Web"
  9. Do NOT enable Firebase Hosting
  10. Click "Register App"
  11. Copy the firebaseConfig object shown on screen
  12. Paste it below replacing the placeholder values
  13. Go to "Firestore Database" in left sidebar
  14. Click "Create Database"
  15. Select "Start in test mode" (allows read/write for 30 days)
  16. Choose your nearest region
  17. Click "Enable"
  18. Done — Firestore is ready and will sync across all devices!

  IMPORTANT: After 30 days update Firestore rules to:
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
*/

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJoT3LlFx80qOrqbgxfxa8jswNM5Gw1UI",
  authDomain: "carrent-manager.firebaseapp.com",
  projectId: "carrent-manager",
  storageBucket: "carrent-manager.firebasestorage.app",
  messagingSenderId: "534659277770",
  appId: "1:534659277770:web:630b1b4d1965cb5856e533"
};

// Check if config has been filled in
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;
let auth = null;
let storage = null;

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    // Enable offline persistence
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
        console.warn("The current browser does not support all of the features required to enable persistence.");
      }
    });
    
    console.log("✅ Firebase connected successfully with Auth, Storage and offline persistence.");
  } catch (err) {
    console.warn("⚠️ Firebase failed to initialize:", err.message);
    db = null;
    auth = null;
    storage = null;
  }
} else {
  console.warn("⚠️ Firebase not configured. Running in offline/local mode.");
}

export { db, auth, storage };

