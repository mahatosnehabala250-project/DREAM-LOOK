import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.log('[Customers] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const snapshot = await getFirebaseAdmin().firestore().collection('customers').get();
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return NextResponse.json(customers);
    } catch (firebaseError) {
      console.error('Error fetching customers from Firebase:', firebaseError);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 })
    }

    // Check for duplicate phone
    const existing = await db.customer.findFirst({ where: { phone: phone.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'A customer with this phone number already exists', customer: existing }, { status: 409 })
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
