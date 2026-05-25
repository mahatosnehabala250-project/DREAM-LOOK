import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification, sendMulticastNotification } from '@/lib/firebase-admin';

// POST /api/salon/notifications — Send push notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, tokens, title, body: bodyText, data } = body;

    if (!title || !bodyText) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Send to single device
    if (token) {
      const messageId = await sendPushNotification(token, { title, body: bodyText }, data);
      return NextResponse.json({ success: true, messageId });
    }

    // Send to multiple devices
    if (tokens && Array.isArray(tokens) && tokens.length > 0) {
      if (tokens.length === 1) {
        const messageId = await sendPushNotification(tokens[0], { title, body: bodyText }, data);
        return NextResponse.json({ success: true, messageId });
      }
      const result = await sendMulticastNotification(tokens, { title, body: bodyText }, data);
      return NextResponse.json({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    }

    return NextResponse.json({ error: 'Either token or tokens array is required' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notification';
    console.error('[Notifications] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
