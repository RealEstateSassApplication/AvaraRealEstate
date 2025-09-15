import { NextRequest, NextResponse } from 'next/server';
import Header from '@/components/ui/layout/Header';
import { Button } from '@/components/ui/button';
import getUserFromReq from '@/lib/auth';

export default async function HostApplyPage({ request }: { request: NextRequest }) {
  try {
    const user = await getUserFromReq(request as any);
    if (user) {
      const roles = Array.isArray((user as any).roles) ? (user as any).roles : (user as any).role ? [(user as any).role] : [];
      const listingsCount = Array.isArray((user as any).listings) ? (user as any).listings.length : 0;
      const isHost = roles.includes('host') || listingsCount > 0;
      if (isHost) {
        return NextResponse.redirect(new URL('/host/dashboard', request.url));
      }
    }
  } catch (err) {
    console.error('Host apply server check failed', err);
  }

  // Render a basic apply UI for non-hosts (server component)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Apply To Be A Host</h1>
        <p className="mb-4">It looks like you are not a host yet. You can create a listing to become a host, or request host access here.</p>
        <div className="space-x-2">
          <Button asChild>
            <a href="/host/listings/create">Create Listing</a>
          </Button>
          <Button variant="outline" onClick={() => {}}>Request Host Access</Button>
        </div>
      </div>
    </div>
  );
}
