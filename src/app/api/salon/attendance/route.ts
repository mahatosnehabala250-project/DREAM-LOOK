import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const date = searchParams.get('date')
    const employeeId = searchParams.get('employeeId')

    const attendance = await db.attendance.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        ...(date ? { date } : {}),
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: true,
        Store: true,
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'asc' }],
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employeeId, storeId, date, checkIn, checkOut, status } = body

    if (!employeeId || !storeId || !date) {
      return NextResponse.json(
        { error: 'employeeId, storeId, and date are required' },
        { status: 400 }
      )
    }

    // Upsert: create or update based on unique constraint [employeeId, date]
    const attendance = await db.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date,
        },
      },
      update: {
        ...(checkIn !== undefined ? { checkIn } : {}),
        ...(checkOut !== undefined ? { checkOut } : {}),
        ...(status ? { status } : {}),
        storeId,
      },
      create: {
        employeeId,
        storeId,
        date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || 'PRESENT',
      },
      include: {
        employee: true,
        Store: true,
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating attendance:', error)
    return NextResponse.json(
      { error: 'Failed to create/update attendance' },
      { status: 500 }
    )
  }
}
