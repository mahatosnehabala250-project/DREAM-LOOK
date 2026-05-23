import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/salon/services — List all active services
export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

// PATCH /api/salon/services — Update service (commission %, price, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, duration, category, description, ownerPercent, employeePercent, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Service ID required' }, { status: 400 });

    // Validate commission percentages sum to 100
    if (ownerPercent !== undefined && employeePercent !== undefined) {
      if (ownerPercent + employeePercent !== 100) {
        return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });
      }
    }

    const oldService = await db.service.findUnique({ where: { id } });
    if (!oldService) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (duration !== undefined) updateData.duration = duration;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (ownerPercent !== undefined) updateData.ownerPercent = ownerPercent;
    if (employeePercent !== undefined) updateData.employeePercent = employeePercent;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await db.service.update({
      where: { id },
      data: updateData,
    });

    // Audit log for commission change
    if ((ownerPercent !== undefined && ownerPercent !== oldService.ownerPercent) ||
        (employeePercent !== undefined && employeePercent !== oldService.employeePercent)) {
      await db.auditLog.create({
        data: {
          action: 'COMMISSION_CHANGED',
          performedBy: body.performedBy || '',
          targetData: JSON.stringify({ serviceId: id, name: service.name }),
          oldValue: JSON.stringify({ ownerPercent: oldService.ownerPercent, employeePercent: oldService.employeePercent }),
          newValue: JSON.stringify({ ownerPercent: service.ownerPercent, employeePercent: service.employeePercent }),
        },
      });
    }

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

// POST /api/salon/services — Create new service
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, duration, category, description, ownerPercent, employeePercent, performedBy } = body;

    if (!name || price === undefined || !duration || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const oPct = ownerPercent || 50;
    const ePct = employeePercent || 50;

    if (oPct + ePct !== 100) {
      return NextResponse.json({ error: 'Owner% + Employee% must equal 100' }, { status: 400 });
    }

    const service = await db.service.create({
      data: { name, price, duration, category, description: description || '', ownerPercent: oPct, employeePercent: ePct },
    });

    // Audit log
    if (performedBy) {
      await db.auditLog.create({
        data: {
          action: 'SERVICE_CREATED',
          performedBy,
          targetData: JSON.stringify({ serviceId: service.id, name, price }),
          newValue: JSON.stringify({ ownerPercent: oPct, employeePercent: ePct }),
        },
      });
    }

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
