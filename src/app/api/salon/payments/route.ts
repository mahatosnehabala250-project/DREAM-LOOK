import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/payments?branchId=&employeeId=&month=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month'); // YYYY-MM

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (employeeId) where.employeeId = employeeId;
    if (month) where.date = { startsWith: month };

    const payments = await db.payment.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, role: true, avatar: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }],
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/salon/payments — Record payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, branchId, date, earnedAmount, advanceDeducted, netPaid, paymentMethod, paidBy } = body;

    if (!employeeId || !branchId || !date || earnedAmount === undefined || netPaid === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: { employeeId, branchId, date, earnedAmount, advanceDeducted: advanceDeducted || 0, netPaid, paymentMethod: paymentMethod || 'CASH', paidBy },
      include: { employee: true, store: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
