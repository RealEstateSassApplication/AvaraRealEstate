import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import storage from '@/lib/storage';
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

    // The PUT route performs the authoritative size check after reading the body.
    assertImageUpload(parsed.data.contentType, parsed.data.size || 1);
    const key = storage.generateUploadKey(parsed.data.fileName);
    const uploadUrl = `/api/uploads/local?key=${encodeURIComponent(key)}`;
    const publicUrl = storage.getPublicUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (err?.message === 'Unsupported file type' || err?.message?.includes('File must')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Upload URL error:', err);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
