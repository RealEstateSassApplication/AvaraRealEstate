import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';
import Property from '@/models/Property';
import getUserFromReq from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromReq(request as any);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const limit = Number(searchParams.get('limit')) || 50;

    // Get all properties owned by this host
    const properties = await Property.find({ owner: user._id }).select('_id');
    const propertyIds = properties.map((p: any) => p._id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        requests: [],
        stats: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          avgCompletionTime: 0,
        },
      });
    }

    // Get maintenance requests for these properties
    const requests = await MaintenanceRequest.find({
      property: { $in: propertyIds },
    })
      .populate('property', 'title address')
      .populate('tenant', 'name phone')
      .sort({ requestedDate: -1 })
      .limit(limit);

    if (includeStats) {
      const pending = requests.filter((r: any) => r.status === 'pending').length;
      const inProgress = requests.filter((r: any) => r.status === 'in_progress').length;
      const completed = requests.filter((r: any) => r.status === 'completed').length;

      const completedRequests = requests.filter((r: any) => r.completedDate && r.requestedDate);
      const avgTime = completedRequests.length > 0
        ? completedRequests.reduce((sum: number, r: any) => {
          if (r.completedDate && r.requestedDate) {
            const diff = new Date(r.completedDate).getTime() - new Date(r.requestedDate).getTime();
            return sum + diff;
          }
          return sum;
        }, 0) / completedRequests.length / (1000 * 60 * 60)
        : 0;

      return NextResponse.json({
        requests,
        stats: {
          total: requests.length,
          pending,
          inProgress,
          completed,
          avgCompletionTime: Math.round(avgTime),
        },
      });
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
