import { NextResponse } from 'next/server';
import storage from '@/lib/storage';

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const publicUrl = await storage.saveFile(key, buffer);
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Local upload failed', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // For clients that cannot PUT binary, they can POST base64 JSON { key, b64 }
  try {
    const body = await request.json();
    const { key, b64 } = body;
    if (!key || !b64) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const buffer = Buffer.from(b64, 'base64');
    const publicUrl = await storage.saveFile(key, buffer);
    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Local upload POST failed', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
