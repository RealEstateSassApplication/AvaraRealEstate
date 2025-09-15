 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, CheckSquare, DollarSign } from 'lucide-react';

export default function UserDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const json = await res.json();
          setBookings(json.data || []);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming</CardTitle>
                  <Calendar className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.filter(b => new Date(b.startDate) > new Date()).length}</div>
                <div className="text-sm text-muted-foreground">Upcoming bookings</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Past</CardTitle>
                  <CheckSquare className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.filter(b => new Date(b.endDate) < new Date()).length}</div>
                <div className="text-sm text-muted-foreground">Completed bookings</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Spent</CardTitle>
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.reduce((sum, b) => sum + (b.total || 0), 0)}</div>
                <div className="text-sm text-muted-foreground">Total spent</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              bookings.slice(0,8).map((b) => (
                <div key={b._id} className="p-4 border rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{b.property?.title || 'Unknown property'}</div>
                      <div className="text-sm text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {b.property?._id ? (
                        <Link href={`/listings/${b.property._id}`}>
                          <Button variant="outline">View</Button>
                        </Link>
                      ) : (
                        <Button variant="outline" disabled>View</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
