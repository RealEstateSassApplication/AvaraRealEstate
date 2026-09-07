import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Property from '@/models/Property';
import {
  calculatePropertyTrustScore,
  isPropertyVerified,
  trustLevelForScore,
} from '@/lib/propertyTrust';

const patchSchema = z.object({
  featured: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'rejected', 'sold', 'rented']).optional(),
  // Backwards compatibility for the existing admin UI. `verified: true`
  // now means the three core verification checks passed.
  verified: z.boolean().optional(),
  verification: z.object({
    identityVerified: z.boolean().optional(),
    ownershipVerified: z.boolean().optional(),
    addressVerified: z.boolean().optional(),
    inspectionVerified: z.boolean().optional(),
    pricingReviewed: z.boolean().optional(),
    notes: z.string().trim().max(2000).optional(),
  }).partial().optional(),
}).strict();

function authError(err: any) {
  const message = err?.message || '';
  if (message.includes('Authentication')) return 401;
  if (message.includes('permissions')) return 403;
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();
    const property = await Property.findById(params.id)
      .populate('owner', 'name email phone')
      .populate('verification.reviewedBy', 'name email');
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ property });
  } catch (err: any) {
    const status = authError(err);
    if (status) return NextResponse.json({ error: status === 401 ? 'Authentication required' : 'Forbidden' }, { status });
    console.error('Admin get property error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();
    const property = await Property.findByIdAndDelete(params.id);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (err: any) {
    const status = authError(err);
    if (status) return NextResponse.json({ error: status === 401 ? 'Authentication required' : 'Forbidden' }, { status });
    console.error('Admin delete property error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewer = await requireRole(request, ['admin', 'super-admin']);
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Invalid property update' }, { status: 400 });
    }

    await dbConnect();
    const property = await Property.findById(params.id);
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    if (parsed.data.featured !== undefined) property.featured = parsed.data.featured;
    if (parsed.data.status) property.status = parsed.data.status;

    const hasVerificationChange = parsed.data.verified !== undefined || parsed.data.verification !== undefined;
    if (hasVerificationChange) {
      const current = property.verification || ({} as any);
      const verification: any = {
        identityVerified: Boolean(current.identityVerified),
        ownershipVerified: Boolean(current.ownershipVerified),
        addressVerified: Boolean(current.addressVerified),
        inspectionVerified: Boolean(current.inspectionVerified),
        pricingReviewed: Boolean(current.pricingReviewed),
        notes: current.notes,
      };

      if (parsed.data.verified === true) {
        verification.identityVerified = true;
        verification.ownershipVerified = true;
        verification.addressVerified = true;
      } else if (parsed.data.verified === false) {
        verification.identityVerified = false;
        verification.ownershipVerified = false;
        verification.addressVerified = false;
      }

      Object.assign(verification, parsed.data.verification || {});
      verification.reviewedAt = new Date();
      verification.reviewedBy = reviewer._id;

      const score = calculatePropertyTrustScore(verification);
      property.verification = verification;
      property.trustScore = score;
      property.trustLevel = trustLevelForScore(score);
      property.verified = isPropertyVerified(verification);
    }

    await property.save();
    await property.populate('owner', 'name email');

    return NextResponse.json({
      success: true,
      property,
      message: 'Property updated successfully',
    });
  } catch (err: any) {
    const status = authError(err);
    if (status) return NextResponse.json({ error: status === 401 ? 'Authentication required' : 'Forbidden' }, { status });
    console.error('Admin update property error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
