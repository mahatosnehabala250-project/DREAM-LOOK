import { NextRequest, NextResponse } from 'next/server';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase-admin';

// POST /api/salon/storage — Upload file to Firebase Cloud Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';
    const fileName = (formData.get('fileName') as string) || `${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${folder}/${fileName}-${Date.now()}.${ext}`;

    const publicUrl = await uploadToStorage(buffer, filePath, file.type);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('[Storage] Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/salon/storage — Delete file from Firebase Cloud Storage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    await deleteFromStorage(filePath);

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    console.error('[Storage] Delete error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
