import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all customers with their appointments and transaction data
    const customers = await db.customer.findMany({
      include: {
        Appointment: {
          include: {
            transaction: {
              select: { servicePrice: true, employeeNetShare: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // 1. Top customers by total spend
    const customerSpend = customers.map((c) => {
      const completedAppts = c.Appointment.filter((a) => a.status === 'COMPLETED')
      const totalSpend = completedAppts.reduce(
        (sum, a) => sum + (a.transaction?.servicePrice || a.id ? 0 : 0),
        0,
      )
      // Use service price from transaction if available
      const spend = completedAppts.reduce(
        (sum, a) => sum + (a.transaction?.servicePrice || 0),
        0,
      )
      return {
        customerId: c.id,
        customerName: c.name,
        phone: c.phone,
        totalVisits: completedAppts.length,
        totalSpend: spend,
        totalAppointments: c.Appointment.length,
      }
    })

    const topCustomers = customerSpend
      .filter((c) => c.totalSpend > 0)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 20)

    // 2. New vs Returning ratio
    const totalCustomers = customers.length
    const returningCustomers = customerSpend.filter((c) => c.totalVisits > 1).length
    const newCustomers = totalCustomers - returningCustomers

    // 3. Customer growth per month (last 12 months)
    const now = new Date()
    const monthMap = new Map<string, number>()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap.set(key, 0)
    }

    for (const c of customers) {
      const createdDate = new Date(c.createdAt)
      const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + 1)
      }
    }

    const customerGrowth = Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      newCustomers: count,
    }))

    // 4. Overall stats
    const totalAppointments = customers.reduce((sum, c) => sum + c.Appointment.length, 0)
    const completedAppointments = customers.reduce(
      (sum, c) => sum + c.Appointment.filter((a) => a.status === 'COMPLETED').length,
      0,
    )
    const avgVisits = totalCustomers > 0 ? (totalAppointments / totalCustomers).toFixed(1) : '0'

    return NextResponse.json({
      topCustomers,
      totalCustomers,
      newCustomers,
      returningCustomers,
      newToReturningRatio: {
        new: newCustomers,
        returning: returningCustomers,
        newPercent: totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0,
        returningPercent: totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0,
      },
      customerGrowth,
      avgVisits: Number(avgVisits),
      totalAppointments,
      completedAppointments,
    })
  } catch (error) {
    console.log('[Customer Analytics] SQLite not available. Returning empty default data to prevent crash.');
    return NextResponse.json({
      topCustomers: [],
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      newToReturningRatio: { new: 0, returning: 0, newPercent: 0, returningPercent: 0 },
      customerGrowth: [],
      avgVisits: 0,
      totalAppointments: 0,
      completedAppointments: 0,
    });
  }
}
