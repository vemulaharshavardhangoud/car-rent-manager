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
import { getFirestore } from "firebase/firestore";

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

if (isConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase connected successfully.");
  } catch (err) {
    console.warn("⚠️ Firebase failed to initialize:", err.message);
    db = null;
  }
} else {
  console.warn("⚠️ Firebase not configured. Running in offline/local mode.");
}

export { db };
