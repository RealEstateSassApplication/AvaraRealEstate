import { NextRequest, NextResponse } from 'next/server';
import PropertyService from '@/services/propertyService';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const userId = (user as any)._id?.toString();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const fav = await PropertyService.toggleFavorite(userId, params.id);
    return NextResponse.json({ favorite: fav });
  } catch (err: any) {
    console.error('Toggle favorite error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
