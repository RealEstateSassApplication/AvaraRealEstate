import { NextRequest, NextResponse } from 'next/server';
import PropertyService from '@/services/propertyService';
import getUserFromReq from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // normalize params: support repeated keys as arrays and convert numeric params
    const keys = Array.from(new Set(Array.from(searchParams.keys())));
    const q: any = {};
    for (const key of keys) {
      if (key === 'page' || key === 'limit') continue;
      const vals = searchParams.getAll(key);
      if (!vals || vals.length === 0) continue;

      // numeric parameters
      if (['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'lat', 'lng', 'radius'].includes(key)) {
        const nums = vals.map(v => Number(v)).filter(n => !Number.isNaN(n));
        q[key] = nums.length === 1 ? nums[0] : nums;
        continue;
      }

      // multiple values -> array
      if (vals.length > 1) q[key] = vals;
      else q[key] = vals[0];
    }

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;
    const results = await PropertyService.search(q, { limit, skip });
    // normalize response shape for client: properties, total, totalPages, page
    return NextResponse.json({
      properties: results.properties || [],
      total: results.total || 0,
      totalPages: results.totalPages || 1,
      page: results.page || page,
    });
  } catch (err: any) {
    console.error('Property GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const requiredFields = ['title', 'description', 'type', 'purpose', 'price', 'images', 'address'];
    const missing = requiredFields.filter(f => !body[f]);
    if (missing.length) return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    body.owner = user._id;
    const prop = await PropertyService.create(body);
    return NextResponse.json({ data: prop, message: 'Property created' }, { status: 201 });
  } catch (err: any) {
    console.error('Property POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}