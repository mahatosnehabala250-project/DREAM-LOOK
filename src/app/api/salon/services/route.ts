import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/services — List all active services
export async function GET() {
  try {
    const services = await db.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(services);
  } catch {
    console.log('[Services] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const snapshot = await getFirebaseAdmin().firestore().collection('services').where('isActive', '==', true).orderBy('name', 'asc').get();
      return NextResponse.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
  }
}

// POST /api/salon/services — Create new service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, duration, category, description, ownerPercent, employeePercent, performedBy } = body;
    if (!name || price === undefined || !duration || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const oPct = ownerPercent || 50;
    const ePct = employeePercent || 50;
    if (oPct + ePct !== 100) return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });
    const service = await db.service.create({ data: { name, price, duration, category, description: description || '', ownerPercent: oPct, employeePercent: ePct } });
    return NextResponse.json(service, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const body = await req.json();
      const { name, price, duration, category, description, ownerPercent, employeePercent } = body;
      const oPct = ownerPercent || 50;
      const ePct = employeePercent || 50;
      const id = `svc_${Date.now()}`;
      const doc = { id, name, price: Number(price), duration: Number(duration), category, description: description || '', ownerPercent: oPct, employeePercent: ePct, isActive: true, createdAt: new Date().toISOString() };
      await getFirebaseAdmin().firestore().collection('services').doc(id).set(doc);
      return NextResponse.json(doc, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }
  }
}

// PATCH /api/salon/services — Update service
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, duration, category, description, ownerPercent, employeePercent, isActive } = body;
    if (!id) return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
    if (ownerPercent !== undefined && employeePercent !== undefined && ownerPercent + employeePercent !== 100) {
      return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });
    }
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (ownerPercent !== undefined) updateData.ownerPercent = ownerPercent;
    if (employeePercent !== undefined) updateData.employeePercent = employeePercent;
    if (isActive !== undefined) updateData.isActive = isActive;
    const service = await db.service.update({ where: { id }, data: updateData });
    return NextResponse.json(service);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const body = await req.json();
      const { id, name, price, duration, category, description, ownerPercent, employeePercent, isActive } = body;
      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = Number(price);
      if (duration !== undefined) updates.duration = Number(duration);
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (ownerPercent !== undefined) updates.ownerPercent = ownerPercent;
      if (employeePercent !== undefined) updates.employeePercent = employeePercent;
      if (isActive !== undefined) updates.isActive = isActive;
      await getFirebaseAdmin().firestore().collection('services').doc(id).set(updates, { merge: true });
      return NextResponse.json({ id, ...updates });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
  }
}
