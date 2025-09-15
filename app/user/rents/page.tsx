'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RentServiceClient from '@/services/rentServiceClient';

export default function UserRentsPage() {
  const [rents, setRents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await RentServiceClient.listForUser();
        setRents(res || []);
      } catch (err) {
      } finally { setLoading(false); }
    })();
  }, []);

  const markPaid = async (id: string) => {
    try {
      await RentServiceClient.markPaid(id);
      const res = await RentServiceClient.listForUser();
      setRents(res || []);
    } catch (err) {}
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Rents</h1>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {rents.length === 0 ? <p>No rents found.</p> : rents.map(r => (
            <Card key={r._id}>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{r.property?.title || r.property?.address?.city}</div>
                    <div className="text-sm text-muted-foreground">Due: {new Date(r.nextDue).toLocaleDateString()}</div>
                    <div className="text-sm">Amount: {r.amount} {r.currency}</div>
                    <div className="text-sm text-muted-foreground">Reminders sent: {r.remindersSent || 0}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => markPaid(r._id)}>Mark Paid</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
