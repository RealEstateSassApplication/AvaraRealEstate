import { NextRequest, NextResponse } from 'next/server';
import PropertyService, { PropertyFilters } from '@/services/propertyService';
import getUserFromReq from '@/lib/auth';
import { createPropertySchema } from '@/lib/propertyInput';
import { parsePositiveInt } from '@/lib/security';

function parseBoolean(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: PropertyFilters = {};

    const purpose = searchParams.get('purpose');
    if (purpose && ['rent', 'sale', 'booking'].includes(purpose)) {
      filters.purpose = purpose as PropertyFilters['purpose'];
    }

    const types = searchParams.getAll('type').filter(Boolean);
    if (types.length) filters.type = types;
    const amenities = searchParams.getAll('amenities').filter(Boolean);
    if (amenities.length) filters.amenities = amenities;

    const numericKeys = ['minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'lat', 'lng', 'radius'] as const;
    for (const key of numericKeys) {
      const raw = searchParams.get(key);
      if (raw === null || raw === '') continue;
      const value = Number(raw);
      if (Number.isFinite(value)) (filters as any)[key] = value;
    }

    const city = searchParams.get('city')?.trim();
    const district = searchParams.get('district')?.trim();
    const province = searchParams.get('province')?.trim();
    const search = searchParams.get('search')?.trim();
    if (city) filters.city = city.slice(0, 120);
    if (district) filters.district = district.slice(0, 120);
    if (province) filters.province = province.slice(0, 120);
    if (search) filters.search = search.slice(0, 200);

    const featured = parseBoolean(searchParams.get('featured'));
    const verified = parseBoolean(searchParams.get('verified'));
    if (featured !== undefined) filters.featured = featured;
    if (verified !== undefined) filters.verified = verified;

    const page = parsePositiveInt(searchParams.get('page'), 1, 100000);
    const limit = parsePositiveInt(searchParams.get('limit'), 20, 100);
    const results = await PropertyService.searchProperties(filters, page, limit);

    return NextResponse.json({
      properties: results.properties || [],
      total: results.total || 0,
      totalPages: results.totalPages || 1,
      page: results.page || page,
    });
  } catch (err: any) {
    console.error('Property GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = createPropertySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid property data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const property = await PropertyService.create(parsed.data as any, user._id.toString());
    return NextResponse.json({ data: property, message: 'Property submitted for review' }, { status: 201 });
  } catch (err: any) {
    console.error('Property POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
