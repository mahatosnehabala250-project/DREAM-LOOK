import { initializeApp, getApps } from 'firebase/app';

// Firebase Web Client Configuration
// Project: dream-look-e409a
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDlcwI3zm1XoveaThObLtDTbTekKxkqbTE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dream-look-e409a.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dream-look-e409a',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dream-look-e409a.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '37086154732',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:37086154732:web:5bfa3fa8f809e7fb473ac9',
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };
export default app;
