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
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (products.length === 0) {
        // Seed default products into Firestore for first-time Vercel access
        const defaultProducts = [
          { id: 'prod_1', name: 'Shampoo', price: 50, cost: 30, unit: 'ml', description: 'Professional shampoo', isActive: true },
          { id: 'prod_2', name: 'Hair Color', price: 200, cost: 120, unit: 'tube', description: 'Hair color cream', isActive: true },
          { id: 'prod_3', name: 'Hair Oil', price: 80, cost: 45, unit: 'ml', description: 'Nourishing hair oil', isActive: true },
          { id: 'prod_4', name: 'Conditioner', price: 60, cost: 35, unit: 'ml', description: 'Deep conditioner', isActive: true },
          { id: 'prod_5', name: 'Hair Mask', price: 150, cost: 80, unit: 'g', description: 'Intensive hair mask', isActive: true },
          { id: 'prod_6', name: 'Hair Spray', price: 120, cost: 65, unit: 'can', description: 'Hold and shine spray', isActive: true },
          { id: 'prod_7', name: 'Gel', price: 90, cost: 50, unit: 'tube', description: 'Styling gel', isActive: true },
          { id: 'prod_8', name: 'Serum', price: 180, cost: 100, unit: 'ml', description: 'Hair serum', isActive: true },
        ];

        const batch = getFirebaseAdmin().firestore().batch();
        for (const prod of defaultProducts) {
          batch.set(getFirebaseAdmin().firestore().collection('products').doc(prod.id), {
            ...prod,
            createdAt: new Date().toISOString(),
          });
        }
        await batch.commit();

        return NextResponse.json(defaultProducts);
      }

      return NextResponse.json(products);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
  }
}

// POST /api/salon/products — Create new product
export async function POST(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, cost, unit, category } = body;
  if (!name || cost === undefined || !unit || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  try {
    const product = await db.product.create({ data: { name: name as string, cost: Number(cost), unit: unit as string, category: category as string, isActive: true } });
    return NextResponse.json(product, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
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
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, name, cost, unit, category, isActive } = body;
  if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

  try {
    const product = await db.product.update({
      where: { id: id as string },
      data: { ...(name !== undefined && { name }), ...(cost !== undefined && { cost: Number(cost) }), ...(unit !== undefined && { unit }), ...(category !== undefined && { category }), ...(isActive !== undefined && { isActive }) },
    });
    return NextResponse.json(product);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (cost !== undefined) updates.cost = Number(cost);
      if (unit !== undefined) updates.unit = unit;
      if (category !== undefined) updates.category = category;
      if (isActive !== undefined) updates.isActive = isActive;
      await getFirebaseAdmin().firestore().collection('products').doc(id as string).set(updates, { merge: true });
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
