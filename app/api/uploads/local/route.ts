import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { assertImageUpload, assertSafeUploadKey } from '@/lib/security';

export async function PUT(request: NextRequest) {
  try {
    await requireAuth(request);
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const safeKey = assertSafeUploadKey(key);
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assertImageUpload(request.headers.get('content-type'), buffer.length);

    const publicUrl = await storage.saveFile(safeKey, buffer);
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (
      err?.message === 'Unsupported file type' ||
      err?.message === 'Invalid upload path' ||
      err?.message?.includes('File must')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Local upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { key, b64, contentType } = body;
    if (!key || !b64 || !contentType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const safeKey = assertSafeUploadKey(String(key));
    const buffer = Buffer.from(String(b64), 'base64');
    assertImageUpload(String(contentType), buffer.length);
    const publicUrl = await storage.saveFile(safeKey, buffer);
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (
      err?.message === 'Unsupported file type' ||
      err?.message === 'Invalid upload path' ||
      err?.message?.includes('File must')
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Local upload POST failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
