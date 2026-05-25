import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/employees — List employees (optional storeId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const employees = await db.employee.findMany({
      where: { ...(storeId ? { storeId } : {}), isActive: true },
      include: { Store: { select: { id: true, name: true, address: true, phone: true, city: true, isActive: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(employees);
  } catch {
    console.log('[Employees] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(request.url);
      const storeId = searchParams.get('storeId');
      let query: any = getFirebaseAdmin().firestore().collection('employees').where('isActive', '==', true);
      if (storeId) query = query.where('storeId', '==', storeId);
      const snapshot = await query.get();
      let employees = snapshot.docs.map((doc: any) => {
        const d = doc.data();
        return { id: d.id || doc.id, name: d.name, phone: d.phone, role: d.role, storeId: d.storeId, isActive: d.isActive, store: { id: d.storeId, name: d.storeName || '', address: '', phone: '', city: d.storeCity || '', isActive: true } };
      });
      employees.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return NextResponse.json(employees);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
  }
}

// POST /api/salon/employees — Create new employee
export async function POST(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, role, storeId, storeName, storeCity } = body
  if (!name || !phone || !role) return NextResponse.json({ error: 'Name, phone, and role required' }, { status: 400 });
  const allowedRoles = ['STYLIST', 'MANAGER', 'OWNER'];
  if (!allowedRoles.includes(role as string)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  try {
    const existing = await db.employee.findFirst({ where: { phone: phone as string } });
    if (existing) return NextResponse.json({ error: 'Employee with this phone already exists', existingId: existing.id }, { status: 409 });
    const employee = await db.employee.create({ data: { name: name as string, phone: phone as string, role: role as string, storeId: (storeId as string) || '', isActive: true } });
    return NextResponse.json(employee, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const id = `emp_${Date.now()}`;
      const doc = { id, name, phone, role, storeId: (storeId as string) || '', storeName: (storeName as string) || '', storeCity: (storeCity as string) || '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      // Check duplicate
      const existing = await getFirebaseAdmin().firestore().collection('employees').doc(phone as string).get();
      if (existing.exists) return NextResponse.json({ error: 'Employee with this phone already exists' }, { status: 409 });
      await getFirebaseAdmin().firestore().collection('employees').doc(phone as string).set(doc);
      return NextResponse.json(doc, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
  }
}

// PATCH /api/salon/employees — Update employee
export async function PATCH(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, name, phone, role, storeId, storeName, storeCity, isActive } = body
  if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

  try {
    const employee = await db.employee.update({
      where: { id: id as string },
      data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), ...(role !== undefined && { role }), ...(storeId !== undefined && { storeId }), ...(isActive !== undefined && { isActive }) },
    });
    return NextResponse.json(employee);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (role !== undefined) updates.role = role;
      if (storeId !== undefined) updates.storeId = storeId;
      if (storeName !== undefined) updates.storeName = storeName;
      if (storeCity !== undefined) updates.storeCity = storeCity;
      if (isActive !== undefined) updates.isActive = isActive;
      // Find doc by id field
      const snapshot = await getFirebaseAdmin().firestore().collection('employees').where('id', '==', id).get();
      if (!snapshot.empty) {
        await getFirebaseAdmin().firestore().collection('employees').doc(snapshot.docs[0].id).set(updates, { merge: true });
      }
      return NextResponse.json({ id, ...updates });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
    }
  }
}

// DELETE /api/salon/employees — Soft-delete
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    await db.employee.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');
      const snapshot = await getFirebaseAdmin().firestore().collection('employees').where('id', '==', id).get();
      if (!snapshot.empty) await getFirebaseAdmin().firestore().collection('employees').doc(snapshot.docs[0].id).set({ isActive: false, updatedAt: new Date().toISOString() }, { merge: true });
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
    }
  }
}
