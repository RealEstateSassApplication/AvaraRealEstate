import { NextResponse } from 'next/server';
import RentService from '@/services/rentService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'markPaid' || body.action === 'markAsPaid') {
      const rent = await RentService.markAsPaid(body.rentId);
      return NextResponse.json({ ok: true, data: rent });
    }
    const rent = await RentService.createRent(body);
    return NextResponse.json({ ok: true, data: rent });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const hostId = url.searchParams.get('hostId');
    const type = url.searchParams.get('type'); // 'host' or 'tenant'
    
    // If type is specified but no specific ID, try to get from session/headers
    if (type && !userId && !hostId) {
      // In a real app, get from session
      const currentUserId = request.headers.get('user-id') || 'placeholder-user-id';
      
      if (type === 'host') {
        const rents = await RentService.listRentsForHost(currentUserId);
        return NextResponse.json({ ok: true, rents: rents });
      } else if (type === 'tenant') {
        const rents = await RentService.listRentsForUser(currentUserId);
        return NextResponse.json({ ok: true, rents: rents });
      }
    }
    
    if (userId) {
      const rents = await RentService.listRentsForUser(userId);
      return NextResponse.json({ ok: true, rents: rents });
    }
    if (hostId) {
      const rents = await RentService.listRentsForHost(hostId);
      return NextResponse.json({ ok: true, rents: rents });
    }
    return NextResponse.json({ ok: true, rents: [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'triggerReminders') {
      const results = await RentService.triggerReminders({ daysBefore: body.daysBefore || 3 });
      return NextResponse.json({ ok: true, data: results });
    }
    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
