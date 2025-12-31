import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import RentalRequest from '@/models/RentalRequest';
import { findMatchingProperties } from '@/lib/matchRentalRequests';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = await requireAuth(request);

    const rentalRequest = await RentalRequest.findById(params.id)
      .populate('user', 'name email phone')
      .populate('matchedProperties', 'title price currency images address type bedrooms bathrooms areaSqft amenities ratings')
      .lean();

    if (!rentalRequest) {
      return NextResponse.json(
        { error: 'Rental request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (rentalRequest.user._id.toString() !== (user as any)._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: rentalRequest });
  } catch (err: any) {
    console.error('Rental request GET error:', err);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const body = await request.json();

    const rentalRequest = await RentalRequest.findById(params.id);

    if (!rentalRequest) {
      return NextResponse.json(
        { error: 'Rental request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (rentalRequest.user.toString() !== (user as any)._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Track if criteria changed (requires re-matching)
    let criteriaChanged = false;

    // Update allowed fields
    if (body.status) {
      rentalRequest.status = body.status;
    }

    if (body.additionalNotes !== undefined) {
      rentalRequest.additionalNotes = body.additionalNotes;
    }

    if (body.contactPreferences) {
      rentalRequest.contactPreferences = {
        ...rentalRequest.contactPreferences,
        ...body.contactPreferences
      };
    }

    // Fields that trigger re-matching
    if (body.propertyTypes) {
      rentalRequest.propertyTypes = body.propertyTypes;
      criteriaChanged = true;
    }

    if (body.location) {
      rentalRequest.location = {
        ...rentalRequest.location,
        ...body.location
      };
      criteriaChanged = true;
    }

    if (body.budget) {
      rentalRequest.budget = {
        ...rentalRequest.budget,
        ...body.budget
      };
      criteriaChanged = true;
    }

    if (body.requirements) {
      rentalRequest.requirements = {
        bedrooms: {
          ...rentalRequest.requirements.bedrooms,
          ...body.requirements.bedrooms
        },
        bathrooms: {
          ...rentalRequest.requirements.bathrooms,
          ...body.requirements.bathrooms
        },
        areaSqft: {
          ...rentalRequest.requirements.areaSqft,
          ...body.requirements.areaSqft
        }
      };
      criteriaChanged = true;
    }

    if (body.amenities) {
      rentalRequest.amenities = body.amenities;
      criteriaChanged = true;
    }

    if (body.moveInDate !== undefined) {
      rentalRequest.moveInDate = body.moveInDate ? new Date(body.moveInDate) : undefined;
      criteriaChanged = true;
    }

    if (body.durationMonths !== undefined) {
      rentalRequest.durationMonths = body.durationMonths;
    }

    if (body.occupants !== undefined) {
      rentalRequest.occupants = body.occupants;
    }

    if (body.hasPets !== undefined) {
      rentalRequest.hasPets = body.hasPets;
      criteriaChanged = true;
    }

    if (body.petDetails !== undefined) {
      rentalRequest.petDetails = body.petDetails;
    }

    // Re-calculate matched properties if criteria changed
    if (criteriaChanged) {
      const matches = await findMatchingProperties(rentalRequest);
      rentalRequest.matchedProperties = matches.map(m => m.property._id);
      
      if (rentalRequest.matchedProperties.length > 0 && rentalRequest.status === 'active') {
        rentalRequest.status = 'matched';
      }
    }

    await rentalRequest.save();

    // Populate for response
    await rentalRequest.populate('matchedProperties', 'title price currency images address type bedrooms bathrooms areaSqft');

    return NextResponse.json({
      message: 'Rental request updated successfully',
      data: rentalRequest
    });
  } catch (err: any) {
    console.error('Rental request PATCH error:', err);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const user = await requireAuth(request);

    const rentalRequest = await RentalRequest.findById(params.id);

    if (!rentalRequest) {
      return NextResponse.json(
        { error: 'Rental request not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (rentalRequest.user.toString() !== (user as any)._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete by setting status to cancelled
    rentalRequest.status = 'cancelled';
    await rentalRequest.save();

    return NextResponse.json({
      message: 'Rental request cancelled successfully'
    });
  } catch (err: any) {
    console.error('Rental request DELETE error:', err);
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
