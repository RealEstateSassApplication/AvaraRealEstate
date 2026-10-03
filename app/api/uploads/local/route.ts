import { NextRequest, NextResponse } from 'next/server';
import storage from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { assertImageUpload, assertSafeUploadKey } from '@/lib/security';

function localUploadsAllowed() {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_UPLOADS_ENABLED === 'true';
}

function disabledResponse() {
  return NextResponse.json(
    { error: 'Local uploads are disabled. Use persistent object storage.' },
    { status: 404 }
  );
}

export async function PUT(request: NextRequest) {
  try {
    if (!localUploadsAllowed()) return disabledResponse();

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
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (
      message === 'Unsupported file type' ||
      message === 'Invalid upload path' ||
      message.includes('File must')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Local upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!localUploadsAllowed()) return disabledResponse();

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
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (
      message === 'Unsupported file type' ||
      message === 'Invalid upload path' ||
      message.includes('File must')
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Local upload POST failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
