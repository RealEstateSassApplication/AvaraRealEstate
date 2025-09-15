'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RentServiceClient from '@/services/rentServiceClient';
import PropertyServiceClient from '@/services/propertyServiceClient';

export default function HostRentsPage() {
  const [rents, setRents] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ propertyId: '', tenantId: '', amount: '', frequency: 'monthly', firstDueDate: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const props = await PropertyServiceClient.listMyProperties();
        setProperties(props || []);
        const res = await RentServiceClient.listForHost();
        setRents(res || []);
      } catch (err) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    try {
      await RentServiceClient.create({ propertyId: form.propertyId, tenantId: form.tenantId, amount: Number(form.amount), frequency: form.frequency as any, firstDueDate: form.firstDueDate });
      const res = await RentServiceClient.listForHost();
      setRents(res || []);
    } catch (err) {
      // ignore
    }
  };

  const markPaid = async (id: string) => {
    try {
      await RentServiceClient.markPaid(id);
      const res = await RentServiceClient.listForHost();
      setRents(res || []);
    } catch (err) {}
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Host Rent Management</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Rent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.propertyId} onChange={e => setForm(s => ({ ...s, propertyId: e.target.value }))} className="p-2 border rounded">
              <option value="">Select property</option>
              {properties.map(p => <option key={p._id} value={p._id}>{p.title || p.address?.city}</option>)}
            </select>
            <Input placeholder="Tenant ID" value={form.tenantId} onChange={e => setForm(s => ({ ...s, tenantId: e.target.value }))} />
            <Input placeholder="Amount" value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} />
            <select value={form.frequency} onChange={e => setForm(s => ({ ...s, frequency: e.target.value }))} className="p-2 border rounded">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Input placeholder="First due date (YYYY-MM-DD)" value={form.firstDueDate} onChange={e => setForm(s => ({ ...s, firstDueDate: e.target.value }))} />
            <div />
            <div className="col-span-2">
              <Button onClick={handleCreate}>Create Rent</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
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
    </div>
  );
}
