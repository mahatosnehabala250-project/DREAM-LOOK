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
  } catch {
    console.log('[Attendance] SQLite not available, falling back to Firestore...')
    try {
      const { searchParams } = new URL(request.url)
      const storeId = searchParams.get('storeId')
      const date = searchParams.get('date')
      const employeeId = searchParams.get('employeeId')

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const firestore = getFirebaseAdmin().firestore();

      let query = firestore.collection('attendance')
      if (employeeId) query = query.where('employeeId', '==', employeeId)
      if (storeId) query = query.where('storeId', '==', storeId)
      if (date) query = query.where('date', '==', date)

      const snapshot = await query.get()

      const results = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data()
        let employee: Record<string, unknown> | null = null
        if (data.employeeId) {
          try {
            const empDoc = await firestore.collection('employees').doc(data.employeeId).get()
            if (empDoc.exists) {
              employee = { id: empDoc.id, ...empDoc.data() }
            }
          } catch {
            // employee lookup failed, skip
          }
        }
        return { id: doc.id, ...data, employee }
      }))

      return NextResponse.json(results)
    } catch (err) {
      console.error('Error fetching attendance (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      )
    }
  }
}

export async function POST(request: NextRequest) {
  // Read body ONCE before try-catch to avoid double-consumption
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
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
          employeeId: employeeId as string,
          date: date as string,
        },
      },
      update: {
        ...(checkIn !== undefined ? { checkIn } : {}),
        ...(checkOut !== undefined ? { checkOut } : {}),
        ...(status ? { status } : {}),
        storeId: storeId as string,
      },
      create: {
        employeeId: employeeId as string,
        storeId: storeId as string,
        date: date as string,
        checkIn: (checkIn as string) || null,
        checkOut: (checkOut as string) || null,
        status: (status as string) || 'PRESENT',
      },
      include: {
        employee: true,
        Store: true,
      },
    })

    return NextResponse.json(attendance, { status: 201 })
  } catch {
    console.log('[Attendance] SQLite not available, falling back to Firestore...')
    try {
      const { employeeId, storeId, date, checkIn, checkOut, status } = body

      if (!employeeId || !storeId || !date) {
        return NextResponse.json(
          { error: 'employeeId, storeId, and date are required' },
          { status: 400 }
        )
      }

      const { getFirebaseAdmin } = await import('@/lib/firebase-admin');
      const firestore = getFirebaseAdmin().firestore();

      const docId = `${employeeId}_${date}`
      const docData: Record<string, unknown> = {
        employeeId,
        storeId,
        date,
        checkIn: (checkIn as string) || null,
        checkOut: (checkOut as string) || null,
        status: (status as string) || 'PRESENT',
        updatedAt: new Date().toISOString(),
      }

      await firestore.collection('attendance').doc(docId).set(docData, { merge: true })

      // Fetch the merged document to return it
      const mergedDoc = await firestore.collection('attendance').doc(docId).get()
      const result = { id: mergedDoc.id, ...mergedDoc.data(), createdAt: (mergedDoc.data() as Record<string, unknown>)?.createdAt || new Date().toISOString() }

      return NextResponse.json(result, { status: 201 })
    } catch (err) {
      console.error('Error creating/updating attendance (Firestore):', err)
      return NextResponse.json(
        { error: 'Failed to create/update attendance' },
        { status: 500 }
      )
    }
  }
}
