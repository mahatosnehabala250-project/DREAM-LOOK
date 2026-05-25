import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/stores — List all stores
export async function GET() {
  try {
    const stores = await db.store.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(stores);
  } catch {
    console.log('[Stores] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const snapshot = await getFirebaseAdmin().firestore().collection('stores').orderBy('name', 'asc').get();
      return NextResponse.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }
  }
}

// POST /api/salon/stores — Create new store
export async function POST(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, address, phone, city } = body;
  if (!name || !city) return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });

  try {
    const store = await db.store.create({ data: { name: name as string, address: (address as string) || '', phone: (phone as string) || '', city: city as string, isActive: true } });
    return NextResponse.json(store, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const id = `store_${Date.now()}`;
      await getFirebaseAdmin().firestore().collection('stores').doc(id).set({ id, name, address: address || '', phone: phone || '', city, isActive: true, createdAt: new Date().toISOString() });
      return NextResponse.json({ id, name, address: address || '', phone: phone || '', city, isActive: true }, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
  }
}

// PATCH /api/salon/stores — Update store
export async function PATCH(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, name, address, phone, city, isActive } = body;
  if (!id) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

  try {
    const store = await db.store.update({ where: { id: id as string }, data: { ...(name !== undefined && { name }), ...(address !== undefined && { address }), ...(phone !== undefined && { phone }), ...(city !== undefined && { city }), ...(isActive !== undefined && { isActive }) } });
    return NextResponse.json(store);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (phone !== undefined) updates.phone = phone;
      if (city !== undefined) updates.city = city;
      if (isActive !== undefined) updates.isActive = isActive;
      await getFirebaseAdmin().firestore().collection('stores').doc(id as string).set(updates, { merge: true });
      return NextResponse.json({ id, ...updates });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }
  }
}

// DELETE /api/salon/stores — Soft-delete store
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || (await req.json()).id;
    if (!id) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    await db.store.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      await getFirebaseAdmin().firestore().collection('stores').doc(id || '').set({ isActive: false, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
    }
  }
}
