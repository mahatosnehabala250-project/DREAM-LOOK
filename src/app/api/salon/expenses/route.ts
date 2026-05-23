import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (storeId) where.storeId = storeId
    if (category) where.category = category
    if (from || to) {
      where.expenseDate = {}
      if (from) (where.expenseDate as Record<string, unknown>).gte = from
      if (to) (where.expenseDate as Record<string, unknown>).lte = to
    }

    const expenses = await db.expense.findMany({
      where,
      include: { store: true },
      orderBy: { expenseDate: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, category, description, amount, expenseDate } = body

    if (!storeId || !category || !description || !amount || !expenseDate) {
      return NextResponse.json(
        { error: 'Missing required fields: storeId, category, description, amount, expenseDate' },
        { status: 400 }
      )
    }

    const expense = await db.expense.create({
      data: { storeId, category, description, amount: parseFloat(amount), expenseDate },
      include: { store: true },
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
