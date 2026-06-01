import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBSDUpRrKn4OSm1D9fMBbkTwhyTZnLRGHQ",
  authDomain: "rational-poet-376317.firebaseapp.com",
  projectId: "rational-poet-376317",
  storageBucket: "rational-poet-376317.firebasestorage.app",
  messagingSenderId: "749112454946",
  appId: "1:749112454946:web:85a169fc62608f500fbf7b",
  databaseId: "ai-studio-9746c3a4-4f86-4a0f-9679-9363a2cf96b0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-9746c3a4-4f86-4a0f-9679-9363a2cf96b0");
