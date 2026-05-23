import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface EmployeeData {
  id: string;
  name: string;
  phone: string;
  role: string;
  storeId: string;
  storeName: string;
  storeCity: string;
}

/**
 * Try to authenticate via Firebase Firestore (works on Vercel / serverless)
 */
async function authenticateViaFirestore(
  normalizedPhone: string,
  allowedRoles: string[]
): Promise<EmployeeData | null> {
  try {
    const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
    const firestore = getFirebaseAdmin().firestore();

    // Lookup by phone number (doc ID = phone)
    const doc = await firestore.collection('employees').doc(normalizedPhone).get();

    if (!doc.exists) {
      console.log(`[Auth] Firestore: no employee with phone ${normalizedPhone}`);
      return null;
    }

    const data = doc.data()!;

    // Check role matches
    if (!allowedRoles.includes(data.role)) {
      console.log(`[Auth] Firestore: role mismatch. Got ${data.role}, expected one of ${allowedRoles.join(',')}`);
      return null;
    }

    // Check active
    if (data.isActive === false) {
      console.log(`[Auth] Firestore: employee ${data.name} is inactive`);
      return null;
    }

    console.log(`[Auth] ✅ Firestore auth success: ${data.name} (${data.role})`);
    return {
      id: data.id || doc.id,
      name: data.name,
      phone: data.phone,
      role: data.role,
      storeId: data.storeId,
      storeName: data.storeName || '',
      storeCity: data.storeCity || '',
    };
  } catch (firestoreError) {
    console.error('[Auth] Firestore lookup failed:', firestoreError);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, role, firebaseToken, fcmToken } = body as {
      phone: string;
      role: string;
      firebaseToken?: string;
      fcmToken?: string;
    };

    if (!phone || !role) {
      return NextResponse.json(
        { error: 'Phone number and role are required' },
        { status: 400 }
      );
    }

    // If Firebase ID token provided, verify it
    if (firebaseToken) {
      try {
        const { verifyFirebaseToken } = await import('@/lib/firebase-admin');
        const firebaseUser = await verifyFirebaseToken(firebaseToken);
        console.log(`[Auth] Firebase verified: uid=${firebaseUser.uid}, phone=${firebaseUser.phoneNumber}`);
      } catch (firebaseError) {
        console.error('[Auth] Firebase token verification failed:', firebaseError);
        // Don't block login if Firebase verification fails — fallback to phone auth
      }
    }

    // Normalize phone: strip spaces, +91 prefix, etc.
    const normalizedPhone = phone.replace(/[\s\-+()]/g, '').replace(/^91/, '');

    // Map frontend role names to database roles
    const dbRoleMap: Record<string, string[]> = {
      employee: ['STYLIST'],
      manager: ['MANAGER'],
      owner: ['OWNER'],
    };

    const allowedRoles = dbRoleMap[role];
    if (!allowedRoles) {
      return NextResponse.json(
        { error: 'Invalid role. Must be employee, manager, or owner' },
        { status: 400 }
      );
    }

    // ── Strategy 1: Try SQLite (local dev) ──
    let employee: {
      id: string;
      name: string;
      phone: string;
      role: string;
      storeId: string;
      Store?: { name: string; city: string } | null;
    } | null = null;

    try {
      employee = await db.employee.findFirst({
        where: {
          role: { in: allowedRoles },
          phone: { endsWith: normalizedPhone },
          isActive: true,
        },
        include: {
          Store: {
            select: { id: true, name: true, address: true, city: true },
          },
        },
      });
    } catch (dbError) {
      console.log('[Auth] SQLite not available, falling back to Firestore...');
    }

    // ── Strategy 2: Fallback to Firebase Firestore (Vercel / production) ──
    let employeeData: EmployeeData | null = null;

    if (employee) {
      employeeData = {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        storeId: employee.storeId,
        storeName: employee.Store?.name || '',
        storeCity: employee.Store?.city || '',
      };
    } else {
      employeeData = await authenticateViaFirestore(normalizedPhone, allowedRoles);
    }

    if (!employeeData) {
      return NextResponse.json(
        { error: 'No account found. Please check your phone number and try again.' },
        { status: 404 }
      );
    }

    // Register FCM token for push notifications
    if (fcmToken) {
      try {
        const { setFirestoreDoc } = await import('@/lib/firebase-admin');
        await setFirestoreDoc('device_tokens', `${employeeData.id}_${fcmToken.slice(-8)}`, {
          userId: employeeData.id,
          userPhone: employeeData.phone,
          token: fcmToken,
          platform: 'web',
          name: employeeData.name,
          role: employeeData.role,
          createdAt: new Date().toISOString(),
        });
        console.log(`[Auth] FCM token registered for ${employeeData.name}`);
      } catch (fcmError) {
        console.error('[Auth] FCM registration failed (non-blocking):', fcmError);
      }
    }

    return NextResponse.json({
      success: true,
      employee: employeeData,
    });
  } catch (error) {
    console.error('[Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
