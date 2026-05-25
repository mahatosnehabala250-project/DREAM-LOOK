import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapInventory } from '@/lib/prisma-map'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        { error: 'A valid quantity (>= 0) is required' },
        { status: 400 }
      )
    }

    const inventory = await db.inventory.update({
      where: { id },
      data: { quantity },
      include: {
        Product: true,
        Store: true,
      },
    })

    const enriched = mapInventory({
      ...inventory,
      isLow: inventory.quantity < inventory.reorderLevel,
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
