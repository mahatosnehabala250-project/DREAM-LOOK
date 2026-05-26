import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapPayment } from '@/lib/prisma-map';

// GET /api/salon/payments?branchId=&employeeId=&month=&from=&to=&purpose=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month'); // YYYY-MM
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');
    const purpose = searchParams.get('purpose');

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (employeeId) where.employeeId = employeeId;
    if (month) where.date = { startsWith: month };
    if (date) where.date = date;
    if (from || to) {
      const dateFilter: Record<string, unknown> = {};
      if (from) dateFilter.gte = from;
      if (to) dateFilter.lte = to;
      where.date = dateFilter;
    }
    if (purpose) where.purpose = purpose;

    const payments = await db.payment.findMany({
      where,
      include: {
        Employee: { select: { id: true, name: true, role: true, avatar: true } },
        Store: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ date: 'desc' }, { paidAt: 'desc' }],
    });

    // Sync to Firebase
    try {
      const { setFirestoreDoc } = await import('@/lib/firebase-admin');
      for (const p of payments) {
        await setFirestoreDoc('payments', p.id, {
          employeeId: p.employeeId,
          branchId: p.branchId,
          date: p.date,
          amount: p.amount,
          earnedAmount: p.earnedAmount,
          advanceDeducted: p.advanceDeducted,
          netPaid: p.netPaid,
          paymentMethod: p.paymentMethod,
          purpose: p.purpose,
          notes: p.notes,
          receiptNumber: p.receiptNumber,
          paidBy: p.paidBy,
          paidAt: p.paidAt.toISOString(),
        });
      }
    } catch { /* Firebase sync optional */ }

    return NextResponse.json(payments.map(mapPayment));
  } catch (error) {
    console.error('[payments GET] Error:', error);
    return NextResponse.json([]);
  }
}

// POST /api/salon/payments — Record payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, branchId, date, amount, earnedAmount, advanceDeducted, netPaid, paymentMethod, purpose, notes, receiptNumber, paidBy } = body;

    if (!employeeId || !branchId || !date || amount === undefined || netPaid === undefined) {
      return NextResponse.json({ error: 'Missing required fields: employeeId, branchId, date, amount, netPaid' }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        employeeId, branchId, date, amount: amount ?? netPaid,
        earnedAmount: earnedAmount ?? 0, advanceDeducted: advanceDeducted ?? 0,
        netPaid, paymentMethod: paymentMethod || 'CASH',
        purpose: purpose || 'DAILY_EARNINGS',
        notes, receiptNumber,
        paidBy,
      },
      include: { Employee: true, Store: true },
    });

    // Sync to Firebase
    try {
      const { setFirestoreDoc } = await import('@/lib/firebase-admin');
      await setFirestoreDoc('payments', payment.id, {
        employeeId, branchId, date,
        amount: amount ?? netPaid,
        earnedAmount: earnedAmount ?? 0,
        advanceDeducted: advanceDeducted ?? 0,
        netPaid, paymentMethod: paymentMethod || 'CASH',
        purpose: purpose || 'DAILY_EARNINGS',
        notes, receiptNumber, paidBy,
        paidAt: payment.paidAt.toISOString(),
      });
    } catch { /* Firebase sync optional */ }

    return NextResponse.json(mapPayment(payment), { status: 201 });
  } catch (error) {
    console.error('[payments POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
