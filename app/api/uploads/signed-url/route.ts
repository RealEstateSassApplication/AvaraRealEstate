import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import storage from '@/lib/storage';
import { generateSignedUrl, getPublicUrl as getS3PublicUrl } from '@/lib/s3';
import { requireAuth } from '@/lib/auth';
import { assertImageUpload } from '@/lib/security';

const requestSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.string().trim().min(1).max(100),
  size: z.number().int().positive().max(10 * 1024 * 1024).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 });
    }

    assertImageUpload(parsed.data.contentType, parsed.data.size || 1);
    const key = storage.generateUploadKey(parsed.data.fileName);

    // Local filesystem uploads are useful only for explicit local development.
    // Production/serverless deployments must use persistent object storage.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.LOCAL_UPLOADS_ENABLED === 'true'
    ) {
      return NextResponse.json({
        uploadUrl: `/api/uploads/local?key=${encodeURIComponent(key)}`,
        publicUrl: storage.getPublicUrl(key),
        storage: 'local',
      });
    }

    const uploadUrl = await generateSignedUrl(key, parsed.data.contentType);
    const publicUrl = getS3PublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      storage: 's3',
      expiresIn: 300,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (message === 'Unsupported file type' || message.includes('File must')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (
      message.includes('S3_BUCKET') ||
      message.includes('S3_REGION') ||
      message.includes('S3_ACCESS_KEY_ID') ||
      message.includes('S3_SECRET_ACCESS_KEY')
    ) {
      console.error('Object storage is not configured:', message);
      return NextResponse.json(
        { error: 'Persistent object storage is not configured' },
        { status: 503 }
      );
    }

    console.error('Upload URL error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
