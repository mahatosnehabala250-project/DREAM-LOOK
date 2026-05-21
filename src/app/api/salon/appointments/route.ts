import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')

    const appointments = await db.appointment.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        ...(date ? { date } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        customer: true,
        store: true,
        employee: true,
        service: true,
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
