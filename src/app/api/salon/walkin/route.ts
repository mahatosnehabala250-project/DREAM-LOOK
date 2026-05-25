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
    console.log('[walkin] SQLite not available, falling back to Firestore...')
    try {
      const { searchParams } = new URL(request.url)
      const storeId = searchParams.get('storeId')
      const date = searchParams.get('date')
      const status = searchParams.get('status') || 'WALK_IN'

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      let query = firestore.collection('appointments').where('status', '==', status)
      if (storeId) query = query.where('storeId', '==', storeId)
      if (date) query = query.where('date', '==', date)

      const snapshot = await query.orderBy('createdAt', 'asc').get()

      const results = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data()
        let customer: Record<string, unknown> | null = null
        let employee: Record<string, unknown> | null = null
        let service: Record<string, unknown> | null = null

        try {
          if (data.customerId) {
            const custDoc = await firestore.collection('customers').doc(data.customerId).get()
            if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() }
          }
        } catch { /* skip */ }

        try {
          if (data.employeeId) {
            const empDoc = await firestore.collection('employees').doc(data.employeeId).get()
            if (empDoc.exists) employee = { id: empDoc.id, ...empDoc.data() }
          }
        } catch { /* skip */ }

        try {
          if (data.serviceId) {
            const svcDoc = await firestore.collection('services').doc(data.serviceId).get()
            if (svcDoc.exists) service = { id: svcDoc.id, ...svcDoc.data() }
          }
        } catch { /* skip */ }

        return { id: doc.id, ...data, customer, employee, service }
      }))

      return NextResponse.json(results)
    } catch (err) {
      console.error('[walkin] Error fetching walkins (Firestore):', err)
      return NextResponse.json([])
    }
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
    console.log('[walkin] SQLite not available, falling back to Firestore...')
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

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      // Find or create customer
      let customerId: string

      if (customerPhone) {
        const customersSnap = await firestore
          .collection('customers')
          .where('phone', '==', customerPhone)
          .limit(1)
          .get()

        if (!customersSnap.empty) {
          customerId = customersSnap.docs[0].id
        } else {
          const newCustomerRef = await firestore.collection('customers').add({
            name: customerName,
            phone: customerPhone,
            createdAt: new Date().toISOString(),
          })
          customerId = newCustomerRef.id
        }
      } else {
        const newCustomerRef = await firestore.collection('customers').add({
          name: customerName,
          phone: `walkin_${Date.now()}`,
          createdAt: new Date().toISOString(),
        })
        customerId = newCustomerRef.id
      }

      const appointmentNotes = notes ? `Walk-in - ${notes}` : 'Walk-in'
      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const currentTime = format(now, 'HH:mm')

      // Fetch related docs for response
      let customer: Record<string, unknown> | null = null
      let employee: Record<string, unknown> | null = null
      let service: Record<string, unknown> | null = null

      try {
        const custDoc = await firestore.collection('customers').doc(customerId).get()
        if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() }
      } catch { /* skip */ }

      try {
        const empDoc = await firestore.collection('employees').doc(employeeId).get()
        if (empDoc.exists) employee = { id: empDoc.id, ...empDoc.data() }
      } catch { /* skip */ }

      try {
        const svcDoc = await firestore.collection('services').doc(serviceId).get()
        if (svcDoc.exists) service = { id: svcDoc.id, ...svcDoc.data() }
      } catch { /* skip */ }

      const appointmentRef = await firestore.collection('appointments').add({
        customerId,
        storeId,
        employeeId,
        serviceId,
        date: today,
        time: currentTime,
        status: 'WALK_IN',
        notes: appointmentNotes,
        customerName,
        serviceName: service?.name || '',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })

      return NextResponse.json(
        {
          id: appointmentRef.id,
          customerId,
          storeId,
          employeeId,
          serviceId,
          date: today,
          time: currentTime,
          status: 'WALK_IN',
          notes: appointmentNotes,
          customer,
          employee,
          service,
          createdAt: now.toISOString(),
        },
        { status: 201 }
      )
    } catch (err) {
      console.error('[walkin] Error creating walk-in (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to create walk-in' },
        { status: 500 }
      )
    }
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
    console.log('[walkin] SQLite not available, falling back to Firestore...')
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

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      // Check if appointment exists
      const apptDoc = await firestore.collection('appointments').doc(appointmentId).get()
      if (!apptDoc.exists) {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        )
      }

      // Update status
      await firestore.collection('appointments').doc(appointmentId).update({
        status,
        updatedAt: new Date().toISOString(),
      })

      // Fetch updated doc with includes
      const updatedDoc = await firestore.collection('appointments').doc(appointmentId).get()
      const data = updatedDoc.data()!

      let customer: Record<string, unknown> | null = null
      let employee: Record<string, unknown> | null = null
      let service: Record<string, unknown> | null = null

      try {
        if (data.customerId) {
          const custDoc = await firestore.collection('customers').doc(data.customerId).get()
          if (custDoc.exists) customer = { id: custDoc.id, ...custDoc.data() }
        }
      } catch { /* skip */ }

      try {
        if (data.employeeId) {
          const empDoc = await firestore.collection('employees').doc(data.employeeId).get()
          if (empDoc.exists) employee = { id: empDoc.id, ...empDoc.data() }
        }
      } catch { /* skip */ }

      try {
        if (data.serviceId) {
          const svcDoc = await firestore.collection('services').doc(data.serviceId).get()
          if (svcDoc.exists) service = { id: svcDoc.id, ...svcDoc.data() }
        }
      } catch { /* skip */ }

      return NextResponse.json({
        id: appointmentId,
        ...data,
        customer,
        employee,
        service,
      })
    } catch (err) {
      console.error('[walkin] Error updating walk-in status (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to update walk-in status' },
        { status: 500 }
      )
    }
  }
}
