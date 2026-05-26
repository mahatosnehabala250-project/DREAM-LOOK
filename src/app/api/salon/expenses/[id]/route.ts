import { NextRequest, NextResponse } from 'next/server';
import { updateDoc, deleteDoc, getDoc, resolveStore } from '@/lib/firestore';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc('expenses', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, description, amount, expenseDate } = body;

    const updateData: Record<string, unknown> = {};
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (expenseDate) updateData.expenseDate = expenseDate;

    await updateDoc('expenses', id, updateData);

    const expense = await getDoc('expenses', id);
    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Include store relation
    const store = expense.storeId ? await resolveStore(expense.storeId) : null;

    return NextResponse.json({ ...expense, store });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}
