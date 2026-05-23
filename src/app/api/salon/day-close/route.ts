import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/day-close?branchId=&date=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date');

    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 });

    const where: Record<string, unknown> = { branchId };
    if (date) where.date = date;

    const dayCloses = await db.dayClose.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }],
    });
    return NextResponse.json(dayCloses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch day closes' }, { status: 500 });
  }
}

// POST /api/salon/day-close — Close a day
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchId, date, closedBy } = body;

    if (!branchId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already closed
    const existing = await db.dayClose.findUnique({ where: { branchId_date: { branchId, date } } });
    if (existing) {
      return NextResponse.json({ error: 'Day already closed' }, { status: 400 });
    }

    // Calculate totals from transactions
    const txns = await db.transaction.findMany({ where: { storeId: branchId, completedAt: { gte: new Date(date + 'T00:00:00'), lt: new Date(date + 'T23:59:59') } } });
    const totalRevenue = txns.reduce((sum, t) => sum + t.servicePrice, 0);
    const totalCash = txns.reduce((sum, t) => sum + (t.cashAmount || 0), 0);
    const totalOnline = txns.reduce((sum, t) => sum + (t.onlineAmount || 0), 0);

    // Lock transactions
    await db.transaction.updateMany({
      where: { storeId: branchId, isClosed: false },
      data: { isClosed: true },
    });

    const dayClose = await db.dayClose.create({
      data: { branchId, date, totalRevenue, totalCash, totalOnline, totalServices: txns.length, closedBy, isLocked: true },
      include: { store: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DAY_CLOSED',
        performedBy: closedBy || '',
        targetData: JSON.stringify({ branchId, date }),
        newValue: JSON.stringify({ revenue: totalRevenue, cash: totalCash, online: totalOnline }),
        branchId,
      },
    });

    return NextResponse.json(dayClose, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to close day' }, { status: 500 });
  }
}

// DELETE /api/salon/day-close — Unlock a day (owner only)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const date = searchParams.get('date');
    const unlockedBy = searchParams.get('unlockedBy');

    if (!branchId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.dayClose.delete({ where: { branchId_date: { branchId, date } } });

    // Unlock transactions
    await db.transaction.updateMany({
      where: { storeId: branchId, isClosed: true },
      data: { isClosed: false },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DAY_UNLOCKED',
        performedBy: unlockedBy || '',
        targetData: JSON.stringify({ branchId, date }),
        branchId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unlock day' }, { status: 500 });
  }
}
