import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { format } from 'date-fns'

// POST /api/salon/service-entry
// Create a complete service entry (appointment + transaction) in one shot
// For walk-in / direct service recording
export async function POST(request: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    employeeId,
    storeId,
    serviceId,
    customerName,
    customerPhone,
    paymentMethod = 'CASH',
    cashAmount: reqCashAmount,
    onlineAmount: reqOnlineAmount,
    productsUsed = [],
  } = body

  // 1. Validate required fields
  if (!employeeId || !storeId || !serviceId || !customerName) {
    return NextResponse.json(
      { error: 'employeeId, storeId, serviceId, and customerName are required' },
      { status: 400 }
    )
  }

  const validPaymentMethods = ['CASH', 'ONLINE', 'SPLIT']
  if (!validPaymentMethods.includes(paymentMethod as string)) {
    return NextResponse.json(
      { error: `Invalid paymentMethod. Must be one of: ${validPaymentMethods.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    // 2. Find or create customer
    let customer
    let isNewCustomer = false

    if (customerPhone) {
      // Search existing customers by phone (case-insensitive endsWith match)
      customer = await db.customer.findFirst({
        where: {
          phone: { endsWith: (customerPhone as string).toLowerCase() },
        },
      })
    }

    if (!customer) {
      // Create new customer
      customer = await db.customer.create({
        data: {
          name: customerName as string,
          phone: (customerPhone as string) || `service_${Date.now()}`,
        },
      })
      isNewCustomer = true
    }

    // Fetch service to get price
    const service = await db.service.findUnique({
      where: { id: serviceId as string },
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 400 }
      )
    }

    const servicePrice = service.price
    const ownerShare = servicePrice * 0.5
    const employeeGrossShare = servicePrice * 0.5

    // Calculate product costs
    let totalProductCost = 0
    const transactionProductsData: Array<{
      productId: string
      quantityUsed: number
      unitCost: number
      totalCost: number
    }> = []

    for (const item of productsUsed as Array<{ productId: string; quantityUsed: number }>) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }

      const unitCost = product.cost
      const quantityUsed = item.quantityUsed
      const totalCost = unitCost * quantityUsed

      totalProductCost += totalCost

      transactionProductsData.push({
        productId: item.productId,
        quantityUsed,
        unitCost,
        totalCost,
      })
    }

    const employeeNetShare = employeeGrossShare - totalProductCost

    // Calculate cash/online amounts based on payment method
    let cashAmount = 0
    let onlineAmount = 0
    if (paymentMethod === 'CASH') {
      cashAmount = servicePrice
    } else if (paymentMethod === 'ONLINE') {
      onlineAmount = servicePrice
    } else if (paymentMethod === 'SPLIT') {
      // Use client-provided split amounts if available, otherwise 50/50
      cashAmount = Number(reqCashAmount) || servicePrice / 2
      onlineAmount = Number(reqOnlineAmount) || servicePrice / 2
    }

    // 3 & 4. Create appointment + transaction in one atomic operation
    const result = await db.$transaction(async (tx) => {
      // 3. Create appointment with COMPLETED status
      const appointment = await tx.appointment.create({
        data: {
          customerId: customer.id,
          storeId: storeId as string,
          employeeId: employeeId as string,
          serviceId: serviceId as string,
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm'),
          status: 'COMPLETED',
          notes: 'Direct service entry',
        },
        include: {
          customer: true,
          Store: true,
          employee: true,
          service: true,
        },
      })

      // 4. Create transaction with commission logic
      const transaction = await tx.transaction.create({
        data: {
          appointmentId: appointment.id,
          employeeId: employeeId as string,
          storeId: storeId as string,
          serviceId: serviceId as string,
          servicePrice,
          ownerShare,
          employeeGrossShare,
          totalProductCost,
          employeeNetShare,
          paymentMethod: paymentMethod as string,
          cashAmount,
          onlineAmount,
          completedAt: new Date(),
          productsUsed: {
            create: transactionProductsData,
          },
        },
        include: {
          employee: true,
          service: true,
          Store: true,
          productsUsed: {
            include: { product: true },
          },
        },
      })

      // Decrease inventory for each product used
      for (const item of productsUsed as Array<{ productId: string; quantityUsed: number }>) {
        const inventory = await tx.inventory.findUnique({
          where: {
            storeId_productId: {
              storeId: storeId as string,
              productId: item.productId,
            },
          },
        })

        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: { quantity: { decrement: item.quantityUsed } },
          })
        }
      }

      return { appointment, transaction }
    })

    // 5. Return combined response
    return NextResponse.json(
      {
        success: true,
        appointment: result.appointment,
        transaction: result.transaction,
        isNewCustomer,
        customer,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log('[service-entry] SQLite not available, falling back to Firestore...')
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      // 2. Find or create customer
      let customerId: string
      let isNewCustomer = false

      if (customerPhone) {
        // Search customers by phone
        const phoneLower = (customerPhone as string).toLowerCase()
        const customersSnap = await firestore
          .collection('customers')
          .where('phone', '>=', phoneLower)
          .where('phone', '<=', phoneLower + '\uf8ff')
          .limit(1)
          .get()

        if (!customersSnap.empty) {
          customerId = customersSnap.docs[0].id
        } else {
          // Create new customer
          const newCustomerRef = await firestore.collection('customers').add({
            name: customerName,
            phone: customerPhone,
            createdAt: new Date().toISOString(),
          })
          customerId = newCustomerRef.id
          isNewCustomer = true
        }
      } else {
        // No phone — create customer anyway
        const newCustomerRef = await firestore.collection('customers').add({
          name: customerName,
          phone: `service_${Date.now()}`,
          createdAt: new Date().toISOString(),
        })
        customerId = newCustomerRef.id
        isNewCustomer = true
      }

      // Fetch customer data for response
      const customerDoc = await firestore.collection('customers').doc(customerId).get()
      const customerData = { id: customerDoc.id, ...customerDoc.data()! }

      // Fetch service to get price
      const serviceDoc = await firestore.collection('services').doc(serviceId as string).get()
      if (!serviceDoc.exists) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 400 }
        )
      }
      const serviceData = serviceDoc.data()!
      const servicePrice = serviceData.price || 0
      const ownerShare = servicePrice * 0.5
      const employeeGrossShare = servicePrice * 0.5

      // Calculate product costs
      let totalProductCost = 0
      for (const item of productsUsed as Array<{ productId: string; quantityUsed: number }>) {
        const productDoc = await firestore.collection('products').doc(item.productId).get()
        if (!productDoc.exists) {
          return NextResponse.json(
            { error: `Product not found: ${item.productId}` },
            { status: 400 }
          )
        }
        const productCost = productDoc.data()?.cost || 0
        totalProductCost += productCost * (item.quantityUsed || 1)
      }

      const employeeNetShare = employeeGrossShare - totalProductCost

      // Calculate cash/online amounts
      let cashAmount = 0
      let onlineAmount = 0
      if (paymentMethod === 'CASH') {
        cashAmount = servicePrice
      } else if (paymentMethod === 'ONLINE') {
        onlineAmount = servicePrice
      } else if (paymentMethod === 'SPLIT') {
        cashAmount = Number(reqCashAmount) || servicePrice / 2
        onlineAmount = Number(reqOnlineAmount) || servicePrice / 2
      }

      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')
      const currentTime = format(now, 'HH:mm')

      // Create appointment
      const appointmentRef = await firestore.collection('appointments').add({
        customerId,
        storeId,
        employeeId,
        serviceId,
        date: today,
        time: currentTime,
        status: 'COMPLETED',
        notes: 'Direct service entry',
        customerName,
        serviceName: serviceData.name || '',
        servicePrice,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })

      // Create transaction
      const transactionRef = await firestore.collection('transactions').add({
        appointmentId: appointmentRef.id,
        employeeId,
        storeId,
        serviceId,
        servicePrice,
        ownerShare,
        employeeGrossShare,
        totalProductCost,
        employeeNetShare,
        paymentMethod,
        cashAmount,
        onlineAmount,
        completedAt: now.toISOString(),
        isNewCustomer,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })

      // Build response matching SQLite structure
      const appointment = {
        id: appointmentRef.id,
        customerId,
        storeId,
        employeeId,
        serviceId,
        date: today,
        time: currentTime,
        status: 'COMPLETED',
        notes: 'Direct service entry',
        customer: customerData,
        service: { id: serviceId, ...serviceData },
        createdAt: now.toISOString(),
      }

      const transaction = {
        id: transactionRef.id,
        appointmentId: appointmentRef.id,
        employeeId,
        storeId,
        serviceId,
        servicePrice,
        ownerShare,
        employeeGrossShare,
        totalProductCost,
        employeeNetShare,
        paymentMethod,
        cashAmount,
        onlineAmount,
        completedAt: now.toISOString(),
        service: { id: serviceId, ...serviceData },
        createdAt: now.toISOString(),
      }

      return NextResponse.json(
        {
          success: true,
          appointment,
          transaction,
          isNewCustomer,
          customer: customerData,
        },
        { status: 201 }
      )
    } catch (err) {
      console.error('[service-entry] Error (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to create service entry' },
        { status: 500 }
      )
    }
  }
}
