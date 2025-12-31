import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import RentalRequest from '@/models/RentalRequest';
import Notification from '@/models/Notification';
import { findMatchingProperties } from '@/lib/matchRentalRequests';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate required fields
    const required = ['purpose', 'budget'];
    const missing = required.filter(f => !body[f]);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate budget
    if (!body.budget.min || !body.budget.max || !body.budget.frequency) {
      return NextResponse.json(
        { error: 'Budget must include min, max, and frequency' },
        { status: 400 }
      );
    }

    if (body.budget.min <= 0 || body.budget.max <= 0) {
      return NextResponse.json(
        { error: 'Budget values must be greater than 0' },
        { status: 400 }
      );
    }

    if (body.budget.min > body.budget.max) {
      return NextResponse.json(
        { error: 'Minimum budget cannot exceed maximum budget' },
        { status: 400 }
      );
    }

    // Create rental request
    const rentalRequest = await RentalRequest.create({
      user: (user as any)._id,
      propertyTypes: body.propertyTypes || [],
      purpose: body.purpose,
      location: {
        cities: body.location?.cities || [],
        districts: body.location?.districts || [],
        flexible: body.location?.flexible || false
      },
      budget: {
        min: body.budget.min,
        max: body.budget.max,
        currency: body.budget.currency || 'LKR',
        frequency: body.budget.frequency
      },
      requirements: {
        bedrooms: {
          min: body.requirements?.bedrooms?.min,
          max: body.requirements?.bedrooms?.max
        },
        bathrooms: {
          min: body.requirements?.bathrooms?.min,
          max: body.requirements?.bathrooms?.max
        },
        areaSqft: {
          min: body.requirements?.areaSqft?.min,
          max: body.requirements?.areaSqft?.max
        }
      },
      amenities: body.amenities || [],
      moveInDate: body.moveInDate ? new Date(body.moveInDate) : undefined,
      durationMonths: body.durationMonths,
      occupants: body.occupants,
      hasPets: body.hasPets || false,
      petDetails: body.petDetails,
      additionalNotes: body.additionalNotes,
      contactPreferences: {
        email: body.contactPreferences?.email !== false,
        sms: body.contactPreferences?.sms || false,
        whatsapp: body.contactPreferences?.whatsapp || false
      }
    });

    // Find matching properties
    const matches = await findMatchingProperties(rentalRequest);
    const matchedPropertyIds = matches.map(m => m.property._id);

    // Update rental request with matched properties
    rentalRequest.matchedProperties = matchedPropertyIds;
    if (matchedPropertyIds.length > 0) {
      rentalRequest.status = 'matched';
    }
    await rentalRequest.save();

    // Create notification for user
    try {
      await Notification.create({
        user: (user as any)._id,
        type: 'rental_request_created',
        message: `Your rental request has been created. ${matchedPropertyIds.length} properties match your criteria.`,
        metadata: {
          rentalRequestId: rentalRequest._id,
          matchCount: matchedPropertyIds.length
        }
      });
    } catch (notifyErr) {
      console.error('Failed to create notification:', notifyErr);
    }

    // Populate the matched properties for response
    await rentalRequest.populate('matchedProperties', 'title price currency images address type bedrooms bathrooms areaSqft amenities');

    return NextResponse.json({
      message: 'Rental request created successfully',
      data: rentalRequest,
      matchedCount: matchedPropertyIds.length
    }, { status: 201 });
  } catch (err: any) {
    console.error('Rental request POST error:', err);
    if (err?.message && err.message.toLowerCase().includes('authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = { user: (user as any)._id };
    if (status) {
      query.status = status;
    }

    const requests = await RentalRequest.find(query)
      .populate('matchedProperties', 'title price currency images address type bedrooms bathrooms areaSqft')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: requests });
  } catch (err: any) {
    console.error('Rental requests GET error:', err);
    if (err?.message && err.message.toLowerCase().includes('authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
