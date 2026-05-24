import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/products — List all active products
export async function GET() {
  try {
    const products = await db.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(products);
  } catch {
    console.log('[Products] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const snapshot = await getFirebaseAdmin().firestore().collection('products').where('isActive', '==', true).orderBy('name', 'asc').get();
      return NextResponse.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
  }
}

// POST /api/salon/products — Create new product
export async function POST(req: NextRequest) {
  try {
    const { name, cost, unit, category } = await req.json();
    if (!name || cost === undefined || !unit || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const product = await db.product.create({ data: { name, cost: Number(cost), unit, category, isActive: true } });
    return NextResponse.json(product, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { name, cost, unit, category } = await req.json();
      const id = `prd_${Date.now()}`;
      const doc = { id, name, cost: Number(cost), unit, category, isActive: true, createdAt: new Date().toISOString() };
      await getFirebaseAdmin().firestore().collection('products').doc(id).set(doc);
      return NextResponse.json(doc, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
  }
}

// PATCH /api/salon/products — Update product
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, cost, unit, category, isActive } = await req.json();
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    const product = await db.product.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(cost !== undefined && { cost: Number(cost) }), ...(unit !== undefined && { unit }), ...(category !== undefined && { category }), ...(isActive !== undefined && { isActive }) },
    });
    return NextResponse.json(product);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { id, name, cost, unit, category, isActive } = await req.json();
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (cost !== undefined) updates.cost = Number(cost);
      if (unit !== undefined) updates.unit = unit;
      if (category !== undefined) updates.category = category;
      if (isActive !== undefined) updates.isActive = isActive;
      await getFirebaseAdmin().firestore().collection('products').doc(id).set(updates, { merge: true });
      return NextResponse.json({ id, ...updates });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
  }
}

// DELETE /api/salon/products — Soft-delete
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    await db.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      await getFirebaseAdmin().firestore().collection('products').doc(id || '').set({ isActive: false }, { merge: true });
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
  }
}
