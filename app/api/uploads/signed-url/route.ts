import { NextResponse } from 'next/server';
import { generateSignedUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;
    if (!fileName || !contentType) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const key = `properties/${Date.now()}-${fileName}`;
    const signedUrl = await generateSignedUrl(key, contentType);
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    return NextResponse.json({ signedUrl, publicUrl });
  } catch (err: any) {
    console.error('Signed url error', err);
    return NextResponse.json({ error: 'Failed to generate signed url' }, { status: 500 });
  }
}
