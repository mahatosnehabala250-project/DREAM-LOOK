import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mapTransaction, mapAppointment } from '@/lib/prisma-map'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const storeId = searchParams.get('storeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (storeId) where.storeId = storeId
    if (from || to) {
      where.completedAt = {}
      if (from) (where.completedAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.completedAt as Record<string, unknown>).lte = new Date(to + 'T23:59:59.999Z')
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        Employee: true,
        Service: true,
        Store: true,
        TransactionProduct: {
          include: { Product: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json(transactions.map(mapTransaction))
  } catch (error) {
    console.log('[Transactions] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(request.url);
      const storeId = searchParams.get('storeId');
      const employeeId = searchParams.get('employeeId');
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      let query: any = getFirebaseAdmin().firestore().collection('transactions');
      if (storeId) {
        query = query.where('storeId', '==', storeId);
      }
      if (employeeId) {
        query = query.where('employeeId', '==', employeeId);
      }
      
      const snapshot = await query.get();
      let transactions = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: new Date(doc.data().completedAt || doc.data().createdAt),
        employee: { name: doc.data().employeeName || 'Unknown' },
        service: { name: doc.data().serviceName || 'Unknown' },
        Store: { name: doc.data().storeName || 'Unknown' },
        productsUsed: []
      }));

      // In-memory filtering for dates if provided
      if (from || to) {
        transactions = transactions.filter((t: any) => {
          const tDate = t.completedAt.getTime();
          let valid = true;
          if (from) valid = valid && tDate >= new Date(from).getTime();
          if (to) valid = valid && tDate <= new Date(to + 'T23:59:59.999Z').getTime();
          return valid;
        });
      }

      transactions.sort((a: any, b: any) => b.completedAt.getTime() - a.completedAt.getTime());

      return NextResponse.json(transactions);
    } catch (firebaseError) {
      console.error('Error fetching transactions from Firebase:', firebaseError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appointmentId, productsUsed = [] } = body

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointmentId is required' },
        { status: 400 }
      )
    }

    // Fetch the appointment with relations
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        Service: true,
        Employee: true,
        Store: true,
        Customer: true,
        Transaction: true,
      },
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    if (appointment.Transaction) {
      return NextResponse.json(
        { error: 'Transaction already exists for this appointment' },
        { status: 400 }
      )
    }

    const servicePrice = appointment.Service.price
    const ownerShare = servicePrice * 0.5
    const employeeGrossShare = servicePrice * 0.5

    // Calculate total product cost
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

    // Create transaction with products in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          appointmentId,
          employeeId: appointment.employeeId,
          storeId: appointment.storeId,
          serviceId: appointment.serviceId,
          servicePrice,
          ownerShare,
          employeeGrossShare,
          totalProductCost,
          employeeNetShare,
          completedAt: new Date(),
          TransactionProduct: {
            create: transactionProductsData,
          },
        },
        include: {
          Employee: true,
          Service: true,
          Store: true,
          TransactionProduct: {
            include: { Product: true },
          },
        },
      })

      // Update appointment status to COMPLETED
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      })

      // Decrease inventory for each product used
      for (const item of productsUsed) {
        const inventory = await tx.inventory.findUnique({
          where: {
            storeId_productId: {
              storeId: appointment.storeId,
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

      return newTransaction
    })

    return NextResponse.json(mapTransaction(transaction), { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
