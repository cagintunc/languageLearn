import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCz8fNHYaW75DallM61baS_8zEftF7YA9Q",
  authDomain: "languagelearn-8784a.firebaseapp.com",
  projectId: "languagelearn-8784a",
  storageBucket: "languagelearn-8784a.firebasestorage.app",
  messagingSenderId: "55619615999",
  appId: "1:55619615999:web:c3b410c3323d3e616160ca",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
