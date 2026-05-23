import { initializeApp, getApps } from 'firebase/app';

// Firebase Web Client Configuration
// Project: dream-look-e409a
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: 'dream-look-e409a.firebaseapp.com',
  projectId: 'dream-look-e409a',
  storageBucket: 'dream-look-e409a.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };
export default app;
