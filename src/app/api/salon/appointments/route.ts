import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const phone = searchParams.get('phone')

    // Build where clause
    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (date) where.date = date
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    // If phone filter, first find matching customer(s)
    if (phone) {
      const customers = await db.customer.findMany({ where: { phone } })
      if (customers.length > 0) {
        where.customerId = { in: customers.map(c => c.id) }
      } else {
        return NextResponse.json([])
      }
    }

    const appointments = await db.appointment.findMany({
      where,
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
