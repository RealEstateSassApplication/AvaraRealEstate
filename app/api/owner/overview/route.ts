import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import OwnerService from '@/services/ownerService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const overview = await OwnerService.getOverview(user._id.toString());
    return NextResponse.json({ ok: true, data: overview });
  } catch (err: any) {
    if (err?.message?.includes('Authentication')) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 });
    }
    console.error('Owner overview error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to load owner overview' }, { status: 500 });
  }
}
