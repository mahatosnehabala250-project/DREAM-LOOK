import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { format } from 'date-fns'

// POST /api/salon/service-entry
// Create a complete service entry (appointment + transaction) in one shot
// For walk-in / direct service recording
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      employeeId,
      storeId,
      serviceId,
      customerName,
      customerPhone,
      paymentMethod = 'CASH',
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
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Must be one of: ${validPaymentMethods.join(', ')}` },
        { status: 400 }
      )
    }

    // 2. Find or create customer
    let customer
    let isNewCustomer = false

    if (customerPhone) {
      // Search existing customers by phone (case-insensitive endsWith match)
      customer = await db.customer.findFirst({
        where: {
          phone: { endsWith: customerPhone.toLowerCase() },
        },
      })
    }

    if (!customer) {
      // Create new customer
      customer = await db.customer.create({
        data: {
          name: customerName,
          phone: customerPhone || `service_${Date.now()}`,
        },
      })
      isNewCustomer = true
    }

    // Fetch service to get price
    const service = await db.service.findUnique({
      where: { id: serviceId },
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

    for (const item of productsUsed) {
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
      // Default split: 50/50
      cashAmount = servicePrice / 2
      onlineAmount = servicePrice / 2
    }

    // 3 & 4. Create appointment + transaction in one atomic operation
    const result = await db.$transaction(async (tx) => {
      // 3. Create appointment with COMPLETED status
      const appointment = await tx.appointment.create({
        data: {
          customerId: customer.id,
          storeId,
          employeeId,
          serviceId,
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
      for (const item of productsUsed) {
        const inventory = await tx.inventory.findUnique({
          where: {
            storeId_productId: {
              storeId,
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
    console.error('Error creating service entry:', error)
    return NextResponse.json(
      { error: 'Failed to create service entry' },
      { status: 500 }
    )
  }
}
