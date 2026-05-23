import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const employee = await db.employee.findFirst({
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

    if (!employee) {
      return NextResponse.json(
        { error: 'No account found. Please check your phone number and try again.' },
        { status: 404 }
      );
    }

    // Register FCM token for push notifications
    if (fcmToken) {
      try {
        const { setFirestoreDoc } = await import('@/lib/firebase-admin');
        await setFirestoreDoc('device_tokens', `${employee.id}_${fcmToken.slice(-8)}`, {
          userId: employee.id,
          userPhone: employee.phone,
          token: fcmToken,
          platform: 'web',
          name: employee.name,
          role: employee.role,
          createdAt: new Date().toISOString(),
        });
        console.log(`[Auth] FCM token registered for ${employee.name}`);
      } catch (fcmError) {
        console.error('[Auth] FCM registration failed (non-blocking):', fcmError);
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        storeId: employee.storeId,
        storeName: employee.Store?.name || '',
        storeCity: employee.Store?.city || '',
      },
    });
  } catch (error) {
    console.error('[Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
