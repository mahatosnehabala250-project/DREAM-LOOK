import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapAppointment } from '@/lib/prisma-map'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be CONFIRMED, COMPLETED, CANCELLED, or NO_SHOW' },
        { status: 400 }
      )
    }

    const appointment = await db.appointment.update({
      where: { id },
      data: { status },
      include: {
        Customer: true,
        Store: true,
        Employee: true,
        Service: true,
      },
    })

    return NextResponse.json(mapAppointment(appointment))
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}
