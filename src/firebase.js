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
  12. Paste it in src/firebase.js replacing the placeholder config
  13. Go to "Firestore Database" in left sidebar
  14. Click "Create Database"
  15. Select "Start in test mode" (allows read/write for 30 days)
  16. Choose your nearest region
  17. Click "Enable"
  18. Done — Firestore is ready
  
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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
