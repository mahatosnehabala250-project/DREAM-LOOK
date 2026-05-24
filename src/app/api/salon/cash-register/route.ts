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
    console.error('Error fetching cash register:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash register data' },
      { status: 500 }
    )
  }
}

// POST /api/salon/cash-register — Open/Save (close) cash register for the day
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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

    // Calculate actual totals from transactions
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    const transactions = await db.transaction.findMany({
      where: {
        storeId: branchId,
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
      where: { branchId_date: { branchId, date } },
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
      where: { branchId_date: { branchId, date } },
      update: updateData,
      create: {
        branchId,
        date,
        totalRevenue,
        totalCash,
        totalOnline,
        totalServices,
        isLocked: isClosing,
        closedBy: isClosing ? closedBy : null,
      },
      include: { Store: { select: { id: true, name: true } } },
    })

    // Create audit log entry
    const auditAction = isClosing ? 'CASH_REGISTER_CLOSED' : 'CASH_REGISTER_OPENED'
    await db.auditLog.create({
      data: {
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
    console.error('Error saving cash register:', error)
    return NextResponse.json(
      { error: 'Failed to save cash register' },
      { status: 500 }
    )
  }
}
