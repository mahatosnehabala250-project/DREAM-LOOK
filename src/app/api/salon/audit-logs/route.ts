import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapAuditLog } from '@/lib/prisma-map';

// GET /api/salon/audit-logs?branchId=&action=&limit=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (action) where.action = action;

    const logs = await db.auditLog.findMany({
      where,
      include: {
        Employee: { select: { id: true, name: true, role: true, avatar: true } },
      },
      orderBy: [{ timestamp: 'desc' }],
      take: limit,
    });
    return NextResponse.json(logs.map(mapAuditLog));
  } catch (error) {
    console.log('[audit-logs] SQLite not available, returning empty array fallback for Vercel...');
    return NextResponse.json([]);
  }
}
