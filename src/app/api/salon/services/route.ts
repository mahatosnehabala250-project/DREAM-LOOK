import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Hardcoded fallback: 12 Dream Look salon services ──────────────────────
// Used when BOTH SQLite and Firestore are unavailable, so the frontend
// never shows "Loading..." forever.
function getHardcodedServices() {
  return [
    { id: 'svc_1', name: 'Haircut (Men)', price: 100, duration: 30, category: 'HAIRCUT', description: "Classic men's haircut", ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_2', name: 'Haircut (Women)', price: 250, duration: 45, category: 'HAIRCUT', description: "Women's haircut and styling", ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_3', name: 'Beard Trim & Shape', price: 50, duration: 15, category: 'HAIRCUT', description: 'Beard shaping and trimming', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_4', name: 'Hair Coloring', price: 500, duration: 60, category: 'COLOR', description: 'Full hair coloring', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_5', name: 'Hair Highlights', price: 800, duration: 90, category: 'COLOR', description: 'Partial highlights', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_6', name: 'Hair Spa & Treatment', price: 400, duration: 45, category: 'TREATMENT', description: 'Deep conditioning spa', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_7', name: 'Keratin Treatment', price: 2000, duration: 90, category: 'TREATMENT', description: 'Smoothing keratin treatment', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_8', name: 'Facial (Classic)', price: 300, duration: 40, category: 'SPA', description: 'Deep cleansing facial', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_9', name: 'Facial (Gold)', price: 600, duration: 60, category: 'SPA', description: 'Gold facial with glow', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_10', name: 'Head Massage', price: 150, duration: 20, category: 'SPA', description: 'Relaxing oil head massage', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_11', name: 'Bridal Makeup', price: 5000, duration: 120, category: 'BRIDAL', description: 'Complete bridal package', ownerPercent: 50, employeePercent: 50, isActive: true },
    { id: 'svc_12', name: 'Manicure & Pedicure', price: 350, duration: 40, category: 'SPA', description: 'Complete nail care', ownerPercent: 50, employeePercent: 50, isActive: true },
  ];
}

// GET /api/salon/services — List all active services
export async function GET() {
  // ── Strategy: Try SQLite → Firestore → Hardcoded fallback ──
  try {
    const services = await db.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    return NextResponse.json(services);
  } catch {
    console.log('[Services] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      // Use .orderBy('name', 'asc') only — filter isActive in JS to avoid needing a composite index
      const snapshot = await getFirebaseAdmin().firestore().collection('services').orderBy('name', 'asc').get();
      const services = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((s: Record<string, unknown>) => s.isActive === true);

      if (services.length === 0) {
        // Seed default services into Firestore for first-time Vercel access
        const defaultServices = getHardcodedServices();
        const batch = getFirebaseAdmin().firestore().batch();
        for (const svc of defaultServices) {
          batch.set(getFirebaseAdmin().firestore().collection('services').doc(svc.id), {
            ...svc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        await batch.commit();

        return NextResponse.json(defaultServices);
      }

      return NextResponse.json(services);
    } catch (err) {
      console.error('[Services] Firestore also unavailable, using hardcoded fallback:', err);
      // Last resort: return hardcoded services so the frontend never shows "Loading..." forever
      return NextResponse.json(getHardcodedServices());
    }
  }
}

// POST /api/salon/services — Create new service
export async function POST(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, price, duration, category, description, ownerPercent, employeePercent, performedBy } = body;
  if (!name || price === undefined || !duration || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  const oPct = ownerPercent || 50;
  const ePct = employeePercent || 50;
  if (oPct + ePct !== 100) return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });

  try {
    const service = await db.service.create({ data: { name: name as string, price: price as number, duration: duration as number, category: category as string, description: (description as string) || '', ownerPercent: oPct as number, employeePercent: ePct as number } });
    return NextResponse.json(service, { status: 201 });
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
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
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, name, price, duration, category, description, ownerPercent, employeePercent, isActive } = body;
  if (!id) return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
  if (ownerPercent !== undefined && employeePercent !== undefined && ownerPercent + employeePercent !== 100) {
    return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });
  }

  try {
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (ownerPercent !== undefined) updateData.ownerPercent = ownerPercent;
    if (employeePercent !== undefined) updateData.employeePercent = employeePercent;
    if (isActive !== undefined) updateData.isActive = isActive;
    const service = await db.service.update({ where: { id: id as string }, data: updateData });
    return NextResponse.json(service);
  } catch {
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = Number(price);
      if (duration !== undefined) updates.duration = Number(duration);
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;
      if (ownerPercent !== undefined) updates.ownerPercent = ownerPercent;
      if (employeePercent !== undefined) updates.employeePercent = employeePercent;
      if (isActive !== undefined) updates.isActive = isActive;
      await getFirebaseAdmin().firestore().collection('services').doc(id as string).set(updates, { merge: true });
      return NextResponse.json({ id, ...updates });
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }
  }
}
