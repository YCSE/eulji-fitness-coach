import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAdQ9UBLOsTE3BPGiRAW4KNYfn8ZcrLGn0",
  authDomain: "eulji-45720.firebaseapp.com",
  projectId: "eulji-45720",
  storageBucket: "eulji-45720.firebasestorage.app",
  messagingSenderId: "227416722925",
  appId: "1:227416722925:web:f8bd51d77d83114aa7abe4",
  measurementId: "G-DHRJW80BL4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-northeast3');

export default app;