import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/salon/customer-search?phone=XXXXXXXXXX
// Search customer by phone number (for auto-lookup in service entry)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'phone query parameter is required' },
        { status: 400 }
      )
    }

    // Search by phone (case-insensitive endsWith match for partial / formatted numbers)
    const customers = await db.customer.findMany({
      where: {
        phone: { endsWith: phone.toLowerCase() },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.log('[customer-search] SQLite not available, falling back to Firestore...')
    try {
      const { searchParams } = new URL(request.url)
      const phone = searchParams.get('phone')

      if (!phone) {
        return NextResponse.json(
          { error: 'phone query parameter is required' },
          { status: 400 }
        )
      }

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      const phoneLower = phone.toLowerCase()
      const snapshot = await firestore
        .collection('customers')
        .where('phone', '>=', phoneLower)
        .where('phone', '<=', phoneLower + '\uf8ff')
        .limit(5)
        .get()

      const customers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return NextResponse.json(customers)
    } catch (err) {
      console.error('[customer-search] Error searching customers (Firestore):', err)
      return NextResponse.json([])
    }
  }
}
