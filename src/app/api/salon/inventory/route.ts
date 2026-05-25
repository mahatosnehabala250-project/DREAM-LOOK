import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapInventory } from '@/lib/prisma-map'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    const inventory = await db.inventory.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
      },
      include: {
        Product: true,
        Store: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Add computed isLow field and map PascalCase to camelCase
    const enriched = inventory.map((item) => mapInventory({
      ...item,
      isLow: item.quantity < item.reorderLevel,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.log('[Inventory] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(request.url);
      const storeId = searchParams.get('storeId');
      
      let query: any = getFirebaseAdmin().firestore().collection('inventory');
      if (storeId) {
        query = query.where('storeId', '==', storeId);
      }
      
      const snapshot = await query.get();
      const inventory = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        product: { name: doc.data().productName || 'Unknown Product' },
        store: { name: doc.data().storeName || 'Unknown Store' }
      }));
      return NextResponse.json(inventory);
    } catch (firebaseError) {
      console.error('Error fetching inventory from Firebase:', firebaseError);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
  }
}
