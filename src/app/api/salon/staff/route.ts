import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/salon/staff — Add new employee/manager
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, role, storeId, skillTags, createdBy } = body;

    if (!name || !phone || !role || !storeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if phone already exists
    const existing = await db.employee.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
    }

    const employee = await db.employee.create({
      data: {
        name, phone, role: role.toUpperCase(),
        storeId, skillTags: skillTags || '',
        joiningDate: new Date().toISOString().slice(0, 10),
      },
      include: { store: true },
    });

    // Audit log
    if (createdBy) {
      await db.auditLog.create({
        data: {
          action: 'STAFF_ADDED',
          performedBy: createdBy,
          targetData: JSON.stringify({ employeeId: employee.id, name, role }),
          branchId: storeId,
        },
      });
    }

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}

// PATCH /api/salon/staff — Transfer, deactivate, update
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, action, ...data } = body;

    if (!employeeId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const employee = await db.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    let updated;
    const performedBy = data.performedBy || '';

    if (action === 'transfer') {
      if (!data.newStoreId) return NextResponse.json({ error: 'New store ID required' }, { status: 400 });
      const oldStoreId = employee.storeId;
      updated = await db.employee.update({
        where: { id: employeeId },
        data: { storeId: data.newStoreId },
        include: { store: true },
      });
      await db.auditLog.create({
        data: {
          action: 'STAFF_TRANSFERRED',
          performedBy,
          targetData: JSON.stringify({ employeeId, name: employee.name }),
          oldValue: oldStoreId,
          newValue: data.newStoreId,
          branchId: data.newStoreId,
        },
      });
    } else if (action === 'deactivate') {
      updated = await db.employee.update({
        where: { id: employeeId },
        data: { isActive: false },
      });
      await db.auditLog.create({
        data: {
          action: 'STAFF_DEACTIVATED',
          performedBy,
          targetData: JSON.stringify({ employeeId, name: employee.name }),
          branchId: employee.storeId,
        },
      });
    } else if (action === 'activate') {
      updated = await db.employee.update({
        where: { id: employeeId },
        data: { isActive: true },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}
