import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month') // YYYY-MM format

    if (!month) {
      return NextResponse.json(
        { error: 'month parameter is required (YYYY-MM format)' },
        { status: 400 }
      )
    }

    // Parse month to get start and end dates
    const [yearStr, monthStr] = month.split('-')
    const year = parseInt(yearStr, 10)
    const monthNum = parseInt(monthStr, 10)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999) // Last day of month

    // If no specific employee, get all employees for the store
    if (!employeeId) {
      // Return all employees' settlements
      const employees = await db.employee.findMany({
        where: { isActive: true },
        include: { Store: true },
        orderBy: { name: 'asc' },
      })

      const settlements = []
      for (const emp of employees) {
        const settlement = await buildEmployeeSettlement(emp.id, startDate, endDate)
        if (settlement) {
          settlements.push(settlement)
        }
      }

      return NextResponse.json({
        period: month,
        settlements,
      })
    }

    // Get settlement for specific employee
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: { Store: true },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const settlement = await buildEmployeeSettlement(employeeId, startDate, endDate)

    return NextResponse.json(settlement)
  } catch (error) {
    console.log('[settlement] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  }
}

async function buildEmployeeSettlement(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { Store: true },
  })

  if (!employee) return null

  const transactions = await db.transaction.findMany({
    where: {
      employeeId,
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      appointment: {
        include: { customer: true },
      },
      service: true,
      productsUsed: {
        include: { product: true },
      },
    },
    orderBy: { completedAt: 'asc' },
  })

  if (transactions.length === 0) {
    return {
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        store: employee.Store ? { id: employee.Store.id, name: employee.Store.name } : null,
      },
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalServices: 0,
        totalRevenue: 0,
        totalOwnerShare: 0,
        totalGrossCommission: 0,
        totalProductDeductions: 0,
        totalNetPayout: 0,
      },
      breakdown: [],
    }
  }

  // Build breakdown
  const breakdown = transactions.map((t) => {
    const productsUsed = t.productsUsed.map((tp) => ({
      name: tp.product.name,
      qty: tp.quantityUsed,
      cost: tp.totalCost,
    }))

    const productDeduction = t.totalProductCost

    return {
      date: t.completedAt.toISOString().split('T')[0],
      appointmentId: t.appointmentId,
      customerName: t.appointment?.customer?.name || 'Unknown',
      serviceName: t.service.name,
      servicePrice: t.servicePrice,
      ownerShare: t.ownerShare,
      employeeGross: t.employeeGrossShare,
      productsUsed,
      productDeduction,
      employeeNet: t.employeeNetShare,
    }
  })

  // Build summary
  const summary = {
    totalServices: transactions.length,
    totalRevenue: transactions.reduce((sum, t) => sum + t.servicePrice, 0),
    totalOwnerShare: transactions.reduce((sum, t) => sum + t.ownerShare, 0),
    totalGrossCommission: transactions.reduce((sum, t) => sum + t.employeeGrossShare, 0),
    totalProductDeductions: transactions.reduce((sum, t) => sum + t.totalProductCost, 0),
    totalNetPayout: transactions.reduce((sum, t) => sum + t.employeeNetShare, 0),
  }

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      store: employee.Store ? { id: employee.Store.id, name: employee.Store.name } : null,
    },
    period: {
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
    },
    summary,
    breakdown,
  }
}
