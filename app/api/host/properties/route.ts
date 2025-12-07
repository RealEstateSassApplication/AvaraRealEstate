import { NextRequest, NextResponse } from 'next/server';
import getUserFromReq from '@/lib/auth';
import { hasRole } from '@/lib/permissions';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, 'host')) return NextResponse.json({ error: 'Host role required' }, { status: 403 });
    await dbConnect();
    const properties = await Property.find({ owner: user._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: properties });
  } catch (err: any) {
    console.error('Host properties error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromReq(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasRole(user, 'host')) return NextResponse.json({ error: 'Host role required' }, { status: 403 });
    const body = await request.json();
    // basic required fields (address can be partially missing; we'll default it)
    const required = ['title', 'description', 'type', 'purpose', 'price'];
    const missing = required.filter((k) => !body[k] && body[k] !== 0);
    if (missing.length) return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });

    const {
      title,
      description,
      type,
      purpose,
      price,
      rentFrequency,
      bedrooms,
      bathrooms,
      areaSqft,
      address,
      images,
      amenities
    } = body;

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    await dbConnect();

    const propertyData: any = {
      title,
      description,
      type,
      purpose,
      price: numericPrice,
      rentFrequency: purpose !== 'sale' ? (rentFrequency || 'monthly') : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      areaSqft: areaSqft ? Number(areaSqft) : undefined,
      address: {
        street: address?.street || 'N/A',
        city: address?.city || 'Unknown',
        district: address?.district || 'Unknown',
        country: address?.country || 'Sri Lanka'
      },
      images: Array.isArray(images) ? images : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      owner: user._id,
      status: 'pending',
      availability: {
        minimumStay: body.minStay ? Number(body.minStay) : 1,
        maximumStay: body.maxStay ? Number(body.maxStay) : undefined,
        immediate: true
      },
      policies: {
        checkInTime: body.checkInTime || '14:00',
        checkOutTime: body.checkOutTime || '11:00'
      }
    };

    // We intentionally do not accept lat/lng coordinates anymore.

    const prop = await Property.create(propertyData);
    return NextResponse.json({ data: prop, message: 'Property created' }, { status: 201 });
  } catch (err: any) {
    console.error('Host create property error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
