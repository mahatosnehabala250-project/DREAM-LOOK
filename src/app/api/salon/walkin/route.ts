import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { format } from 'date-fns'

// GET /api/salon/walkin?storeId=STORE_ID&date=YYYY-MM-DD&status=WALK_IN
// Fetch walk-in queue for a store and date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const date = searchParams.get('date')
    const status = searchParams.get('status') || 'WALK_IN'

    const where: Record<string, unknown> = {
      status,
    }

    if (storeId) where.storeId = storeId
    if (date) where.date = date

    const walkins = await db.appointment.findMany({
      where,
      include: {
        employee: true,
        service: true,
        customer: true,
        Store: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(walkins)
  } catch (error) {
    console.error('Error fetching walk-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch walk-ins' },
      { status: 500 }
    )
  }
}

// POST /api/salon/walkin - Add walk-in to queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      storeId,
      employeeId,
      serviceId,
      customerName,
      customerPhone,
      notes,
    } = body

    // Validate required fields
    if (!storeId || !employeeId || !serviceId || !customerName) {
      return NextResponse.json(
        { error: 'storeId, employeeId, serviceId, and customerName are required' },
        { status: 400 }
      )
    }

    // Find or create customer by phone
    let customerId: string | undefined

    if (customerPhone) {
      const existingCustomer = await db.customer.findFirst({
        where: { phone: customerPhone },
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const newCustomer = await db.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
          },
        })
        customerId = newCustomer.id
      }
    }

    // If no phone was provided, create a new customer anyway
    if (!customerId) {
      const newCustomer = await db.customer.create({
        data: {
          name: customerName,
          phone: `walkin_${Date.now()}`,
        },
      })
      customerId = newCustomer.id
    }

    // Build notes with "Walk-in" prefix
    const appointmentNotes = notes
      ? `Walk-in - ${notes}`
      : 'Walk-in'

    // Create appointment with WALK_IN status
    const today = format(new Date(), 'yyyy-MM-dd')
    const currentTime = format(new Date(), 'HH:mm')

    const appointment = await db.appointment.create({
      data: {
        customerId,
        storeId,
        employeeId,
        serviceId,
        date: today,
        time: currentTime,
        status: 'WALK_IN',
        notes: appointmentNotes,
      },
      include: {
        customer: true,
        Store: true,
        employee: true,
        service: true,
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating walk-in:', error)
    return NextResponse.json(
      { error: 'Failed to create walk-in' },
      { status: 500 }
    )
  }
}

// PATCH /api/salon/walkin - Update walk-in status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, status } = body

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'appointmentId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find the appointment
    const existingAppointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Update the appointment status
    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        customer: true,
        Store: true,
        employee: true,
        service: true,
      },
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating walk-in status:', error)
    return NextResponse.json(
      { error: 'Failed to update walk-in status' },
      { status: 500 }
    )
  }
}
