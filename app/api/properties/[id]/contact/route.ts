import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    // Placeholder: we'd send an email/SMS to the host here
    console.log(`Contact request from ${user.email} for property ${params.id}:`, body.message || body);
    return NextResponse.json({ success: true, message: 'Contact request sent (placeholder)' });
  } catch (err: any) {
    console.error('Contact host error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
