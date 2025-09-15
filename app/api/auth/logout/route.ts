import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const res = NextResponse.json({ message: 'Logged out' });

    // Clear the auth token cookie used by the app
    // Adjust cookie attributes (Secure, SameSite) to match your production requirements
    res.headers.set('Set-Cookie', 'token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');

    return res;
  } catch (err: any) {
    console.error('Logout route error:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
