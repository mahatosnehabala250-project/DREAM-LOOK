import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, role } = body as { phone: string; role: string };

    if (!phone || !role) {
      return NextResponse.json(
        { error: 'Phone number and role are required' },
        { status: 400 }
      );
    }

    // Normalize phone: strip spaces, +91 prefix, etc.
    const normalizedPhone = phone.replace(/[\s\-+()]/g, '').replace(/^91/, '');

    // Map frontend role names to database roles
    const dbRoleMap: Record<string, string[]> = {
      employee: ['STYLIST'],
      manager: ['MANAGER'],
      owner: ['OWNER'],
    };

    const allowedRoles = dbRoleMap[role];
    if (!allowedRoles) {
      return NextResponse.json(
        { error: 'Invalid role. Must be employee, manager, or owner' },
        { status: 400 }
      );
    }

    const employee = await db.employee.findFirst({
      where: {
        role: { in: allowedRoles },
        phone: { endsWith: normalizedPhone },
        isActive: true,
      },
      include: {
        store: {
          select: { id: true, name: true, address: true, city: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'No account found. Please check your phone number and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        phone: employee.phone,
        role: employee.role,
        storeId: employee.storeId,
        storeName: employee.store?.name || '',
        storeCity: employee.store?.city || '',
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
