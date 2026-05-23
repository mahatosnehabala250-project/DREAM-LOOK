import admin from 'firebase-admin';
import path from 'path';

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'firebase-service-account.json');
const STORAGE_BUCKET = 'dream-look-e409a.firebasestorage.app';
const APP_NAME = 'dream-look-admin';

export function getFirebaseAdmin(): admin.app.App {
  // Check for existing app (handles hot reload)
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(SERVICE_ACCOUNT_PATH),
        storageBucket: STORAGE_BUCKET,
      },
      APP_NAME
    );
    console.log('[Firebase] ✅ Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('[Firebase] ❌ Admin SDK initialization failed:', error);
    throw new Error('Firebase Admin SDK initialization failed. Make sure firebase-service-account.json exists.');
  }
}

// ─── AUTH ────────────────────────────────────────────────────────
export function getFirebaseAuth() {
  return getFirebaseAdmin().auth();
}

// Verify Firebase ID token
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.UserRecord> {
  const decoded = await getFirebaseAuth().verifyIdToken(idToken);
  const user = await getFirebaseAuth().getUser(decoded.uid);
  return user;
}

// ─── FIRESTORE ───────────────────────────────────────────────────
export function getFirebaseFirestore() {
  return getFirebaseAdmin().firestore();
}

// ─── STORAGE ─────────────────────────────────────────────────────
export function getFirebaseStorage(): admin.storage.Storage {
  return getFirebaseAdmin().storage();
}

// Upload file to Firebase Storage and return public URL
export async function uploadToStorage(
  fileBuffer: Buffer,
  filePath: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const bucket = getFirebaseStorage().bucket();
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Make file public
  await file.makePublic();

  return file.publicUrl();
}

// Delete file from Firebase Storage
export async function deleteFromStorage(filePath: string): Promise<void> {
  const bucket = getFirebaseStorage().bucket();
  await bucket.file(filePath).delete().catch(() => {
    // Ignore not-found errors
  });
}

// ─── MESSAGING (FCM) ─────────────────────────────────────────────
export function getFirebaseMessaging() {
  return getFirebaseAdmin().messaging();
}

// Send push notification to a specific device
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
  },
  data?: Record<string, string>
): Promise<string> {
  const message: admin.messaging.Message = {
    token,
    notification,
    android: {
      notification: {
        channelId: 'dream_look_notifications',
        priority: 'high' as const,
        sound: 'default',
      },
    },
    webpush: {
      notification: {
        icon: '/logo.svg',
        badge: '/logo.svg',
        vibrate: [100, 50, 100],
      },
    },
    data,
  };

  const result = await getFirebaseMessaging().send(message);
  console.log(`[Firebase] ✅ Push notification sent: ${result}`);
  return result;
}

// Send push notification to multiple devices (multicast)
export async function sendMulticastNotification(
  tokens: string[],
  notification: {
    title: string;
    body: string;
  },
  data?: Record<string, string>
): Promise<admin.messaging.BatchResponse> {
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification,
    android: {
      notification: {
        channelId: 'dream_look_notifications',
        priority: 'high' as const,
        sound: 'default',
      },
    },
    webpush: {
      notification: {
        icon: '/logo.svg',
        badge: '/logo.svg',
      },
    },
    data,
  };

  const result = await getFirebaseMessaging().sendEachForMulticast(message);
  console.log(`[Firebase] ✅ Multicast: ${result.successCount} success, ${result.failureCount} failed`);
  return result;
}

// ─── FIRESTORE HELPERS ──────────────────────────────────────────

// Save or update a document
export async function setFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getFirebaseFirestore();
  await db.collection(collection).doc(docId).set(
    {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// Get a document
export async function getFirestoreDoc(
  collection: string,
  docId: string
): Promise<Record<string, unknown> | null> {
  const db = getFirebaseFirestore();
  const doc = await db.collection(collection).doc(docId).get();
  return doc.exists ? (doc.data() as Record<string, unknown>) : null;
}

// Query documents
export async function queryFirestore(
  collection: string,
  fieldPath: string,
  opStr: admin.firestore.WhereFilterOp,
  value: unknown
): Promise<Record<string, unknown>[]> {
  const db = getFirebaseFirestore();
  const snapshot = await db.collection(collection).where(fieldPath, opStr, value).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
