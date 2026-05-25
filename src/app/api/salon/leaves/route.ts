import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/leaves?branchId=&status=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;

    const leaves = await db.leave.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, role: true, avatar: true } },
        Store: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }],
    });
    return NextResponse.json(leaves);
  } catch (error) {
    console.log('[leaves] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  }
}

// POST /api/salon/leaves — Apply for leave
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, branchId, date, reason } = body;

    if (!employeeId || !branchId || !date || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing leave on that date
    const existing = await db.leave.findUnique({ where: { employeeId_date: { employeeId, date } } });
    if (existing) {
      return NextResponse.json({ error: 'Leave already exists for this date' }, { status: 400 });
    }

    const leave = await db.leave.create({
      data: { employeeId, branchId, date, reason, status: 'PENDING' },
      include: { employee: true, Store: true },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'LEAVE_APPLIED',
        performedBy: employeeId,
        targetData: JSON.stringify({ leaveId: leave.id, date, reason }),
        branchId,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 });
  }
}

// PATCH /api/salon/leaves — Approve/Reject leave
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { leaveId, status, reviewedBy } = body;

    if (!leaveId || !status || !['APPROVED', 'REJECTED'].includes(status) || !reviewedBy) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const leave = await db.leave.update({
      where: { id: leaveId },
      data: { status, reviewedBy, reviewedAt: new Date() },
      include: { employee: true, Store: true },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'LEAVE_STATUS',
        performedBy: reviewedBy,
        targetData: JSON.stringify({ leaveId, employeeName: leave.employee.name, date: leave.date }),
        oldValue: 'PENDING',
        newValue: status,
        branchId: leave.branchId,
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}
