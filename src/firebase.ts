import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVK1mkgXC4Z2y9EAwZzBDkY2_VwabfEDI",
  authDomain: "zencycle-2d18d.firebaseapp.com",
  projectId: "zencycle-2d18d",
  storageBucket: "zencycle-2d18d.firebasestorage.app",
  messagingSenderId: "372954664973",
  appId: "1:372954664973:web:74111093de962133330544"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
