import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapAppointment } from '@/lib/prisma-map'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerId,
      storeId,
      employeeId,
      serviceId,
      date,
      time,
      customerName,
      customerPhone,
    } = body

    if (!storeId || !employeeId || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'storeId, employeeId, serviceId, date, and time are required' },
        { status: 400 }
      )
    }

    // Find or create customer
    let finalCustomerId = customerId

    if (!finalCustomerId && customerName && customerPhone) {
      // Try to find existing customer by phone
      const existingCustomer = await db.customer.findFirst({
        where: { phone: customerPhone },
      })

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id
      } else {
        // Create new customer
        const newCustomer = await db.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
          },
        })
        finalCustomerId = newCustomer.id
      }
    }

    if (!finalCustomerId) {
      return NextResponse.json(
        { error: 'Either customerId or customerName + customerPhone is required' },
        { status: 400 }
      )
    }

    // Create the appointment
    const appointment = await db.appointment.create({
      data: {
        customerId: finalCustomerId,
        storeId,
        employeeId,
        serviceId,
        date,
        time,
        status: 'PENDING',
      },
      include: {
        Customer: true,
        Store: true,
        Employee: true,
        Service: true,
      },
    })

    return NextResponse.json(mapAppointment(appointment), { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}
