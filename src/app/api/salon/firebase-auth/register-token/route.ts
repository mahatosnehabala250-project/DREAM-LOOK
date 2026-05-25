import { NextRequest, NextResponse } from 'next/server';
import { setFirestoreDoc, queryFirestore } from '@/lib/firebase-admin';

// POST /api/salon/firebase-auth/register-token — Save FCM device token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userPhone, token, platform } = body;

    if (!userId || !token) {
      return NextResponse.json({ error: 'userId and token are required' }, { status: 400 });
    }

    // Save device token to Firestore for push notifications
    await setFirestoreDoc('device_tokens', `${userId}_${token.slice(-8)}`, {
      userId,
      userPhone: userPhone || '',
      token,
      platform: platform || 'web',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Device token registered' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register token';
    console.error('[FirebaseAuth] Token registration error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/salon/firebase-auth/register-token?userId=xxx — Get all device tokens for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const tokens = await queryFirestore('device_tokens', 'userId', '==', userId);

    return NextResponse.json({
      success: true,
      tokens: tokens.map((t) => t.token),
    });
  } catch (error) {
    console.log('[register-token] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  });
  }
}
