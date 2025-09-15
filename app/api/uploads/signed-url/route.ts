import { NextResponse } from 'next/server';
import storage from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;
    if (!fileName || !contentType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const key = storage.generateUploadKey(fileName);

    // The client can upload the file via PUT to this uploadUrl (same origin)
    const uploadUrl = `/api/uploads/local?key=${encodeURIComponent(key)}`;
    const publicUrl = storage.getPublicUrl(key);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    console.error('Signed url error', err);
    return NextResponse.json({ error: 'Failed to generate upload url' }, { status: 500 });
  }
}
