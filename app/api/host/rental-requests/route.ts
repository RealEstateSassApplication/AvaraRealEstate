import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import RentalRequest from '@/models/RentalRequest';
import Property from '@/models/Property';
import { checkPropertyMatch } from '@/lib/matchRentalRequests';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    // Get host's properties
    const hostProperties = await Property.find({
      owner: (user as any)._id,
      status: 'active'
    }).lean();

    if (hostProperties.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get active rental requests
    const query: any = { status: { $in: ['active', 'matched'] } };

    // Optional filters
    const propertyType = searchParams.get('propertyType');
    if (propertyType) {
      query.propertyTypes = propertyType;
    }

    const location = searchParams.get('location');
    if (location) {
      query.$or = [
        { 'location.cities': location },
        { 'location.districts': location }
      ];
    }

    const rentalRequests = await RentalRequest.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Match each request against host's properties
    const matchedRequests = [];

    for (const request of rentalRequests) {
      let bestMatchScore = 0;
      let matchingPropertyCount = 0;
      const matchingProperties: any[] = [];

      for (const property of hostProperties) {
        const match = checkPropertyMatch(property as any, request as any);
        if (match.matches) {
          matchingPropertyCount++;
          matchingProperties.push({
            propertyId: property._id,
            propertyTitle: property.title,
            score: match.score
          });
          if (match.score > bestMatchScore) {
            bestMatchScore = match.score;
          }
        }
      }

      // Only include requests that match at least one property
      if (matchingPropertyCount > 0) {
        matchedRequests.push({
          ...request,
          relevanceScore: bestMatchScore,
          matchingPropertyCount,
          matchingProperties: matchingProperties.sort((a, b) => b.score - a.score)
        });
      }
    }

    // Sort by relevance score
    matchedRequests.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ data: matchedRequests });
  } catch (err: any) {
    console.error('Host rental requests GET error:', err);
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
