import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (from || to) {
      where.completedAt = {}
      if (from) (where.completedAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.completedAt as Record<string, unknown>).lte = new Date(to + 'T23:59:59.999Z')
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        employee: true,
        service: true,
        store: true,
      },
      orderBy: { completedAt: 'asc' },
    })

    // Total revenue = sum of all service prices
    const totalRevenue = transactions.reduce((sum, t) => sum + t.servicePrice, 0)
    const totalTransactions = transactions.length
    const totalProductCost = transactions.reduce((sum, t) => sum + t.totalProductCost, 0)
    const totalOwnerShare = transactions.reduce((sum, t) => sum + t.ownerShare, 0)
    const totalEmployeePayout = transactions.reduce((sum, t) => sum + t.employeeNetShare, 0)

    // Daily revenue grouped by date
    const dailyMap = new Map<string, { date: string; revenue: number; transactions: number }>()
    for (const t of transactions) {
      const dateStr = t.completedAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateStr)
      if (existing) {
        existing.revenue += t.servicePrice
        existing.transactions += 1
      } else {
        dailyMap.set(dateStr, { date: dateStr, revenue: t.servicePrice, transactions: 1 })
      }
    }
    const dailyRevenue = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    // Service popularity
    const serviceMap = new Map<string, { serviceName: string; count: number; revenue: number }>()
    for (const t of transactions) {
      const key = t.serviceId
      const existing = serviceMap.get(key)
      if (existing) {
        existing.count += 1
        existing.revenue += t.servicePrice
      } else {
        serviceMap.set(key, {
          serviceName: t.service.name,
          count: 1,
          revenue: t.servicePrice,
        })
      }
    }
    const servicePopularity = Array.from(serviceMap.values()).sort((a, b) => b.count - a.count)

    // Employee performance
    const empMap = new Map<string, {
      employeeId: string
      employeeName: string
      transactions: number
      totalRevenue: number
      totalEarnings: number
    }>()
    for (const t of transactions) {
      const existing = empMap.get(t.employeeId)
      if (existing) {
        existing.transactions += 1
        existing.totalRevenue += t.servicePrice
        existing.totalEarnings += t.employeeNetShare
      } else {
        empMap.set(t.employeeId, {
          employeeId: t.employeeId,
          employeeName: t.employee.name,
          transactions: 1,
          totalRevenue: t.servicePrice,
          totalEarnings: t.employeeNetShare,
        })
      }
    }
    const employeePerformance = Array.from(empMap.values()).map((e) => ({
      ...e,
      avgPerTransaction: e.totalRevenue / e.transactions,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue)

    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      totalProductCost,
      totalOwnerShare,
      totalEmployeePayout,
      dailyRevenue,
      servicePopularity,
      employeePerformance,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
