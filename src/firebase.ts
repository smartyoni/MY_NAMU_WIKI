import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB8XHkT_DedTncHBUSu8d5AwjJLXqDFP2g",
  authDomain: "smartrealapp.firebaseapp.com",
  projectId: "smartrealapp",
  storageBucket: "smartrealapp.firebasestorage.app",
  messagingSenderId: "651193312612",
  appId: "1:651193312612:web:cfa6bea236c71c14a94671"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;