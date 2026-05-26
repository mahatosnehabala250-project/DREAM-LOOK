import { NextResponse } from 'next/server';
import { seedFirebase } from '@/lib/firebase-seed';

export async function POST() {
  try {
    const result = await seedFirebase();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    return NextResponse.json(
      { error: 'Failed to seed Firestore', details: String(error) },
      { status: 500 }
    );
  }
}
