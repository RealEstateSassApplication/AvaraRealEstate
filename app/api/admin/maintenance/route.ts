import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import MaintenanceRequest from '@/models/MaintenanceRequest';

// GET /api/admin/maintenance - Get all maintenance requests for admin
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = Number(searchParams.get('limit')) || 50;
    const page = Number(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const [requests, total] = await Promise.all([
      MaintenanceRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('property', 'title images address')
        .populate('tenant', 'name email phone')
        .populate('host', 'name email phone')
        .lean(),
      MaintenanceRequest.countDocuments(query)
    ]);

    // Calculate stats
    const stats = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await MaintenanceRequest.aggregate([
      {
        $match: { status: { $nin: ['resolved', 'closed'] } }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const maintenanceStats = {
      total: total,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      urgent: 0,
      high: 0
    };

    stats.forEach((s: any) => {
      if (s._id === 'pending') maintenanceStats.pending = s.count;
      if (s._id === 'in_progress') maintenanceStats.inProgress = s.count;
      if (s._id === 'resolved') maintenanceStats.resolved = s.count;
    });

    priorityStats.forEach((s: any) => {
      if (s._id === 'urgent') maintenanceStats.urgent = s.count;
      if (s._id === 'high') maintenanceStats.high = s.count;
    });

    return NextResponse.json({
      success: true,
      requests,
      stats: maintenanceStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Admin maintenance list error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
