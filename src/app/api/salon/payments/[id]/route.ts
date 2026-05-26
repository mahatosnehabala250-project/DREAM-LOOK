import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapPayment } from '@/lib/prisma-map';

// DELETE /api/salon/payments/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get payment first for Firebase sync
    const payment = await db.payment.findUnique({ where: { id }, include: { Employee: true, Store: true } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await db.payment.delete({ where: { id } });

    // Remove from Firebase
    try {
      const { getFirebaseFirestore } = await import('@/lib/firebase-admin');
      await getFirebaseFirestore().collection('payments').doc(id).delete();
    } catch { /* Firebase sync optional */ }

    return NextResponse.json({ success: true, deleted: mapPayment(payment) });
  } catch (error) {
    console.error('[payments DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
  }
}

// PATCH /api/salon/payments/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, earnedAmount, advanceDeducted, netPaid, paymentMethod, purpose, notes, receiptNumber } = body;

    const updateData: Record<string, unknown> = {};
    if (amount !== undefined) updateData.amount = amount;
    if (earnedAmount !== undefined) updateData.earnedAmount = earnedAmount;
    if (advanceDeducted !== undefined) updateData.advanceDeducted = advanceDeducted;
    if (netPaid !== undefined) updateData.netPaid = netPaid;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (purpose) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber;

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
      include: { Employee: true, Store: true },
    });

    // Sync to Firebase
    try {
      const { setFirestoreDoc } = await import('@/lib/firebase-admin');
      await setFirestoreDoc('payments', id, {
        employeeId: payment.employeeId,
        branchId: payment.branchId,
        date: payment.date,
        amount: payment.amount,
        earnedAmount: payment.earnedAmount,
        advanceDeducted: payment.advanceDeducted,
        netPaid: payment.netPaid,
        paymentMethod: payment.paymentMethod,
        purpose: payment.purpose,
        notes: payment.notes,
        receiptNumber: payment.receiptNumber,
        paidBy: payment.paidBy,
        paidAt: payment.paidAt.toISOString(),
      });
    } catch { /* Firebase sync optional */ }

    return NextResponse.json(mapPayment(payment));
  } catch (error) {
    console.error('[payments PATCH] Error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
