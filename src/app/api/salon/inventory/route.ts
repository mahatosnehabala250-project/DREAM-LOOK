import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    const inventory = await db.inventory.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
      },
      include: {
        product: true,
        store: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Add computed isLow field
    const enriched = inventory.map((item) => ({
      ...item,
      isLow: item.quantity < item.reorderLevel,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
