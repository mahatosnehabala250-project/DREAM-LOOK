import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapAdvance } from '@/lib/prisma-map';

// GET /api/salon/advances?branchId=&employeeId=&status=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const advances = await db.advance.findMany({
      where,
      include: {
        Employee: { select: { id: true, name: true, role: true, avatar: true } },
        Store: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }],
    });
    return NextResponse.json(advances.map(mapAdvance));
  } catch (error) {
    console.log('[advances] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  }
}

// POST /api/salon/advances — Give advance
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, branchId, amount, reason, givenBy } = body;

    if (!employeeId || !branchId || !amount || !reason || !givenBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const advance = await db.advance.create({
      data: {
        employeeId, branchId, amount, reason, date: new Date().toISOString().slice(0, 10),
        recoveredAmount: 0, remainingAmount: amount, givenBy, status: 'ACTIVE',
      },
      include: { Employee: true, Store: true },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'ADVANCE_GIVEN',
        performedBy: givenBy,
        targetData: JSON.stringify({ advanceId: advance.id, employeeName: advance.Employee.name }),
        newValue: JSON.stringify({ amount, reason }),
        branchId,
      },
    });

    return NextResponse.json(mapAdvance(advance), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create advance' }, { status: 500 });
  }
}

// PATCH /api/salon/advances — Update recovery
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { advanceId, recoveredAmount } = body;

    if (!advanceId || recoveredAmount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const advance = await db.advance.findUnique({ where: { id: advanceId } });
    if (!advance) return NextResponse.json({ error: 'Advance not found' }, { status: 404 });

    const newRecovered = advance.recoveredAmount + recoveredAmount;
    const remaining = advance.amount - newRecovered;
    const newStatus = remaining <= 0 ? 'RECOVERED' : 'ACTIVE';

    const updated = await db.advance.update({
      where: { id: advanceId },
      data: { recoveredAmount: newRecovered, remainingAmount: Math.max(0, remaining), status: newStatus },
      include: { Employee: true, Store: true },
    });

    return NextResponse.json(mapAdvance(updated));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update advance' }, { status: 500 });
  }
}
