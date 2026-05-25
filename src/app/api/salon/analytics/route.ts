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
        Store: true,
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

    // Payment method breakdown
    const totalCash = transactions.reduce((sum, t) => sum + (t.cashAmount || 0), 0);
    const totalOnline = transactions.reduce((sum, t) => sum + (t.onlineAmount || 0), 0);
    const totalSplitCount = transactions.filter(t => t.paymentMethod === 'SPLIT').length;
    const paymentMethodBreakdown = ['CASH', 'ONLINE', 'SPLIT'].map(method => ({
      method,
      count: transactions.filter(t => t.paymentMethod === method).length,
      amount: transactions.filter(t => t.paymentMethod === method).reduce((sum, t) => sum + t.servicePrice, 0),
    }));

    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      totalProductCost,
      totalOwnerShare,
      totalEmployeePayout,
      dailyRevenue,
      servicePopularity,
      employeePerformance,
      totalCash,
      totalOnline,
      totalSplitCount,
      paymentMethodBreakdown,
    })
  } catch (error) {
    console.log('[Analytics] SQLite not available, falling back to Firestore...');
    try {
      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const { searchParams } = new URL(request.url);
      const storeId = searchParams.get('storeId');
      const from = searchParams.get('from');
      const to = searchParams.get('to');

      let query: any = getFirebaseAdmin().firestore().collection('transactions');
      if (storeId) {
        query = query.where('storeId', '==', storeId);
      }
      
      const snapshot = await query.get();
      let transactions = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: new Date(doc.data().completedAt || doc.data().createdAt)
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

      transactions.sort((a: any, b: any) => a.completedAt.getTime() - b.completedAt.getTime());

      // Total revenue = sum of all service prices
      const totalRevenue = transactions.reduce((sum: number, t: any) => sum + (t.servicePrice || 0), 0)
      const totalTransactions = transactions.length
      const totalProductCost = transactions.reduce((sum: number, t: any) => sum + (t.totalProductCost || 0), 0)
      const totalOwnerShare = transactions.reduce((sum: number, t: any) => sum + (t.ownerShare || 0), 0)
      const totalEmployeePayout = transactions.reduce((sum: number, t: any) => sum + (t.employeeNetShare || 0), 0)

      // Daily revenue grouped by date
      const dailyMap = new Map<string, { date: string; revenue: number; transactions: number }>()
      for (const t of transactions) {
        const dateStr = t.completedAt.toISOString().split('T')[0]
        const existing = dailyMap.get(dateStr)
        if (existing) {
          existing.revenue += (t.servicePrice || 0)
          existing.transactions += 1
        } else {
          dailyMap.set(dateStr, { date: dateStr, revenue: (t.servicePrice || 0), transactions: 1 })
        }
      }
      const dailyRevenue = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

      // Service popularity
      const serviceMap = new Map<string, { serviceName: string; count: number; revenue: number }>()
      for (const t of transactions) {
        const key = t.serviceId || 'unknown'
        const existing = serviceMap.get(key)
        if (existing) {
          existing.count += 1
          existing.revenue += (t.servicePrice || 0)
        } else {
          serviceMap.set(key, {
            serviceName: t.serviceName || 'Unknown Service',
            count: 1,
            revenue: (t.servicePrice || 0),
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
        const empId = t.employeeId || 'unknown'
        const existing = empMap.get(empId)
        if (existing) {
          existing.transactions += 1
          existing.totalRevenue += (t.servicePrice || 0)
          existing.totalEarnings += (t.employeeNetShare || 0)
        } else {
          empMap.set(empId, {
            employeeId: empId,
            employeeName: t.employeeName || 'Unknown Employee',
            transactions: 1,
            totalRevenue: (t.servicePrice || 0),
            totalEarnings: (t.employeeNetShare || 0),
          })
        }
      }
      const employeePerformance = Array.from(empMap.values()).map((e) => ({
        ...e,
        avgPerTransaction: e.totalRevenue / e.transactions,
      })).sort((a, b) => b.totalRevenue - a.totalRevenue)

      // Payment method breakdown
      const totalCash = transactions.reduce((sum: number, t: any) => sum + (t.cashAmount || 0), 0);
      const totalOnline = transactions.reduce((sum: number, t: any) => sum + (t.onlineAmount || 0), 0);
      const totalSplitCount = transactions.filter((t: any) => (t.paymentMethod || 'CASH') === 'SPLIT').length;
      const paymentMethodBreakdown = ['CASH', 'ONLINE', 'SPLIT'].map(method => ({
        method,
        count: transactions.filter((t: any) => (t.paymentMethod || 'CASH') === method).length,
        amount: transactions.filter((t: any) => (t.paymentMethod || 'CASH') === method).reduce((sum: number, t: any) => sum + (t.servicePrice || 0), 0),
      }));

      return NextResponse.json({
        totalRevenue,
        totalTransactions,
        totalProductCost,
        totalOwnerShare,
        totalEmployeePayout,
        dailyRevenue,
        servicePopularity,
        employeePerformance,
        totalCash,
        totalOnline,
        totalSplitCount,
        paymentMethodBreakdown,
      })
    } catch (firebaseError) {
      console.error('Error fetching analytics from Firebase:', firebaseError)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }
  }
}
