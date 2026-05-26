import admin from 'firebase-admin';

let _db: admin.firestore.Firestore | null = null;
let _auth: admin.auth.Auth | null = null;
let _initialized = false;

function initializeIfNeeded() {
  if (_initialized) return;
  _initialized = true;

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export function getDb(): admin.firestore.Firestore {
  initializeIfNeeded();
  if (!_db) _db = admin.firestore();
  return _db;
}

export function getAdminAuth(): admin.auth.Auth {
  initializeIfNeeded();
  if (!_auth) _auth = admin.auth();
  return _auth;
}

// Lazy getters for backward compatibility
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    return (getAdminAuth() as any)[prop];
  },
});

export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
