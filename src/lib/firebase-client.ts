import { initializeApp, getApps } from 'firebase/app';

// Firebase Web Client Configuration
// Project: dream-look-e409a
const firebaseConfig = {
  apiKey: 'AIzaSyDlcwI3zm1XoveaThObLtDTbTekKxkqbTE',
  authDomain: 'dream-look-e409a.firebaseapp.com',
  projectId: 'dream-look-e409a',
  storageBucket: 'dream-look-e409a.firebasestorage.app',
  messagingSenderId: '37086154732',
  appId: '1:37086154732:web:5bfa3fa8f809e7fb473ac9',
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };
export default app;
