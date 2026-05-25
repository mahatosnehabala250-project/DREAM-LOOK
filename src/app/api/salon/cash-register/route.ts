import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/salon/cash-register?branchId=STORE_ID&date=YYYY-MM-DD
// Returns cash register summary for a branch on a given date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date')

    if (!branchId || !date) {
      return NextResponse.json(
        { error: 'branchId and date are required' },
        { status: 400 }
      )
    }

    // Fetch existing DayClose record (if day was previously closed)
    const dayClose = await db.dayClose.findUnique({
      where: { branchId_date: { branchId, date } },
    })

    // Fetch today's transactions for the branch
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    const transactions = await db.transaction.findMany({
      where: {
        storeId: branchId,
        completedAt: { gte: dayStart, lt: dayEnd },
      },
    })

    // Calculate cash and online totals from transactions
    let totalCash = 0
    let totalOnline = 0
    let totalRevenue = 0

    for (const txn of transactions) {
      totalRevenue += txn.servicePrice
      totalCash += txn.cashAmount || 0
      totalOnline += txn.onlineAmount || 0
    }

    const totalServices = transactions.length

    // Fetch expenses for the branch on that date
    const expenses = await db.expense.findMany({
      where: { storeId: branchId, expenseDate: date },
    })
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Fetch CASH payments made to staff on that date
    const payments = await db.payment.findMany({
      where: { branchId, date, paymentMethod: 'CASH' },
    })
    const totalPayments = payments.reduce((sum, p) => sum + p.netPaid, 0)

    // Expected cash in register = cash collected - expenses paid - staff payments
    const expectedCash = totalCash - totalExpenses - totalPayments

    return NextResponse.json({
      date,
      branchId,
      totalRevenue,
      totalCash,
      totalOnline,
      totalServices,
      totalExpenses,
      totalPayments,
      isClosed: dayClose?.isLocked ?? false,
      closedBy: dayClose?.closedBy ?? null,
      closedAt: dayClose?.closedAt ?? null,
      expectedCash,
    })
  } catch (error) {
    console.log('[cash-register] SQLite not available, falling back to Firestore...')
    try {
      const { searchParams } = new URL(req.url)
      const branchId = searchParams.get('branchId')
      const date = searchParams.get('date')

      if (!branchId || !date) {
        return NextResponse.json(
          { error: 'branchId and date are required' },
          { status: 400 }
        )
      }

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      const dayStart = new Date(date + 'T00:00:00')
      const dayEnd = new Date(date + 'T23:59:59')

      // Fetch transactions for this branch on this date
      const txSnap = await firestore
        .collection('transactions')
        .where('storeId', '==', branchId)
        .get()

      let totalRevenue = 0
      let totalCash = 0
      let totalOnline = 0
      let totalServices = 0

      for (const doc of txSnap.docs) {
        const data = doc.data()
        const completedAt = data.completedAt
        if (completedAt) {
          const completedDate = completedAt instanceof Date
            ? completedAt
            : new Date(completedAt)
          if (completedDate >= dayStart && completedDate < dayEnd) {
            totalRevenue += data.servicePrice || 0
            totalCash += data.cashAmount || 0
            totalOnline += data.onlineAmount || 0
            totalServices += 1
          }
        }
      }

      // Check for existing day_close record
      const dayCloseDoc = await firestore.collection('day_close').doc(`${branchId}_${date}`).get()
      const dayClose = dayCloseDoc.exists ? dayCloseDoc.data() : null

      return NextResponse.json({
        date,
        branchId,
        totalRevenue,
        totalCash,
        totalOnline,
        totalServices,
        totalExpenses: 0,
        totalPayments: 0,
        isClosed: dayClose?.isLocked ?? false,
        closedBy: dayClose?.closedBy ?? null,
        closedAt: dayClose?.closedAt ?? null,
        expectedCash: totalCash,
      })
    } catch (err) {
      console.error('[cash-register] Error fetching cash register (Firestore):', err)
      return NextResponse.json([])
    }
  }
}

// POST /api/salon/cash-register — Open/Save (close) cash register for the day
export async function POST(req: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { branchId, date, openingBalance, closingBalance, closedBy } = body

  if (!branchId || !date) {
    return NextResponse.json(
      { error: 'branchId and date are required' },
      { status: 400 }
    )
  }

  if (!closedBy) {
    return NextResponse.json(
      { error: 'closedBy (user ID) is required' },
      { status: 400 }
    )
  }

  try {
    // Calculate actual totals from transactions
    const dayStart = new Date((date as string) + 'T00:00:00')
    const dayEnd = new Date((date as string) + 'T23:59:59')
    const transactions = await db.transaction.findMany({
      where: {
        storeId: branchId as string,
        completedAt: { gte: dayStart, lt: dayEnd },
      },
    })

    let totalRevenue = 0
    let totalCash = 0
    let totalOnline = 0

    for (const txn of transactions) {
      totalRevenue += txn.servicePrice
      totalCash += txn.cashAmount || 0
      totalOnline += txn.onlineAmount || 0
    }

    const totalServices = transactions.length

    // Check if already locked
    const existing = await db.dayClose.findUnique({
      where: { branchId_date: { branchId: branchId as string, date: date as string } },
    })

    if (existing?.isLocked) {
      return NextResponse.json(
        { error: 'Cash register already closed and locked for this date' },
        { status: 400 }
      )
    }

    // Determine if this is a close operation
    const isClosing = typeof closingBalance === 'number'

    // Build update data — closedAt is non-nullable, only include when closing
    const updateData: Record<string, unknown> = {
      totalRevenue,
      totalCash,
      totalOnline,
      totalServices,
      isLocked: isClosing,
      closedBy: isClosing ? closedBy : null,
    }
    if (isClosing) {
      updateData.closedAt = new Date()
    }

    // Upsert the DayClose record
    const dayClose = await db.dayClose.upsert({
      where: { branchId_date: { branchId: branchId as string, date: date as string } },
      update: updateData,
      create: {
        branchId: branchId as string,
        date: date as string,
        totalRevenue,
        totalCash,
        totalOnline,
        totalServices,
        isLocked: isClosing,
        closedBy: isClosing ? closedBy as string : null,
      },
      include: { Store: { select: { id: true, name: true } } },
    })

    // Create audit log entry
    const auditAction = isClosing ? 'CASH_REGISTER_CLOSED' : 'CASH_REGISTER_OPENED'
    await db.auditLog.create({
      data: {
        action: auditAction,
        performedBy: closedBy as string,
        targetData: JSON.stringify({ branchId, date }),
        newValue: JSON.stringify({
          totalRevenue,
          totalCash,
          totalOnline,
          totalServices,
          openingBalance: openingBalance ?? null,
          closingBalance: closingBalance ?? null,
        }),
        branchId: branchId as string,
      },
    })

    return NextResponse.json(
      {
        ...dayClose,
        openingBalance: openingBalance ?? null,
        closingBalance: closingBalance ?? null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log('[cash-register] SQLite not available, falling back to Firestore...')
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin')
      const firestore = getFirebaseAdmin().firestore()

      const dayStart = new Date((date as string) + 'T00:00:00')
      const dayEnd = new Date((date as string) + 'T23:59:59')

      // Calculate totals from transactions
      const txSnap = await firestore
        .collection('transactions')
        .where('storeId', '==', branchId)
        .get()

      let totalRevenue = 0
      let totalCash = 0
      let totalOnline = 0
      let totalServices = 0

      for (const doc of txSnap.docs) {
        const data = doc.data()
        const completedAt = data.completedAt
        if (completedAt) {
          const completedDate = completedAt instanceof Date
            ? completedAt
            : new Date(completedAt)
          if (completedDate >= dayStart && completedDate < dayEnd) {
            totalRevenue += data.servicePrice || 0
            totalCash += data.cashAmount || 0
            totalOnline += data.onlineAmount || 0
            totalServices += 1
          }
        }
      }

      // Check if already locked
      const docId = `${branchId}_${date}`
      const existingDoc = await firestore.collection('day_close').doc(docId).get()

      if (existingDoc.exists && existingDoc.data()?.isLocked) {
        return NextResponse.json(
          { error: 'Cash register already closed and locked for this date' },
          { status: 400 }
        )
      }

      const isClosing = typeof closingBalance === 'number'

      const docData: Record<string, unknown> = {
        branchId,
        date,
        totalRevenue,
        totalCash,
        totalOnline,
        totalServices,
        isLocked: isClosing,
        closedBy: isClosing ? closedBy : null,
        updatedAt: new Date().toISOString(),
      }
      if (isClosing) {
        docData.closedAt = new Date().toISOString()
      }

      await firestore.collection('day_close').doc(docId).set(docData, { merge: true })

      // Create audit log entry
      const auditAction = isClosing ? 'CASH_REGISTER_CLOSED' : 'CASH_REGISTER_OPENED'
      await firestore.collection('audit_logs').add({
        action: auditAction,
        performedBy: closedBy,
        targetData: JSON.stringify({ branchId, date }),
        newValue: JSON.stringify({
          totalRevenue,
          totalCash,
          totalOnline,
          totalServices,
          openingBalance: openingBalance ?? null,
          closingBalance: closingBalance ?? null,
        }),
        branchId,
        createdAt: new Date().toISOString(),
      })

      return NextResponse.json(
        {
          id: docId,
          branchId,
          date,
          totalRevenue,
          totalCash,
          totalOnline,
          totalServices,
          isLocked: isClosing,
          closedBy: isClosing ? closedBy : null,
          closedAt: isClosing ? new Date().toISOString() : null,
          openingBalance: openingBalance ?? null,
          closingBalance: closingBalance ?? null,
        },
        { status: 201 }
      )
    } catch (err) {
      console.error('[cash-register] Error saving cash register (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to save cash register' },
        { status: 500 }
      )
    }
  }
}
