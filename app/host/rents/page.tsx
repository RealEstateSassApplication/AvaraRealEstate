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

  const [form, setForm] = useState({ propertyId: '', tenantId: '', tenantName: '', tenantEmail: '', tenantPhone: '', amount: '', frequency: 'monthly', firstDueDate: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const props = await PropertyServiceClient.listMyProperties();
        setProperties(props || []);
        // fetch current user id to ask rents for this host
        let hostId = undefined as string | undefined;
        try {
          const me = await fetch('/api/auth/me');
          if (me.ok) {
            const js = await me.json();
            hostId = js.user?._id || js._id;
          }
        } catch (err) {}
        const res = await RentServiceClient.listForHost(hostId);
        setRents(res || []);
      } catch (err) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  const handleCreate = async () => {
    try {
      let tenantId = form.tenantId;

      // if tenantId not provided, try to create/find tenant by email/name
      if (!tenantId) {
        if (!form.tenantEmail && !form.tenantName) {
          alert('Please provide Tenant ID or at least Tenant Email/Name');
          return;
        }

        const resp = await fetch('/api/auth/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.tenantName || form.tenantEmail, email: form.tenantEmail, phone: form.tenantPhone, role: 'tenant', skipPassword: true })
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          alert(`Failed to create/find tenant: ${err.error || 'Unknown error'}`);
          return;
        }

        const data = await resp.json().catch(() => ({}));
        tenantId = data.user?._id || data.data?._id || data._id || data.user?.id || data.id;
        if (!tenantId) {
          console.error('Tenant creation response', data);
          alert('Failed to resolve tenant id from response');
          return;
        }
      }

      await RentServiceClient.create({ propertyId: form.propertyId, tenantId, amount: Number(form.amount), frequency: form.frequency as any, firstDueDate: form.firstDueDate });
      // refresh rents
      let hostId = undefined as string | undefined;
      try {
        const me = await fetch('/api/auth/me');
        if (me.ok) {
          const js = await me.json();
          hostId = js.user?._id || js._id;
        }
      } catch (err) {}
      const res = await RentServiceClient.listForHost(hostId);
      setRents(res || []);
      // clear small fields
      setForm(s => ({ ...s, tenantId: '', tenantName: '', tenantEmail: '', tenantPhone: '', amount: '', firstDueDate: '' }));
    } catch (err) {
      console.error('Create rent error', err);
      alert('Failed to create rent');
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
              <Input placeholder="Tenant ID (optional)" value={form.tenantId} onChange={e => setForm(s => ({ ...s, tenantId: e.target.value }))} />
              <Input placeholder="Tenant Full Name (optional)" value={form.tenantName} onChange={e => setForm(s => ({ ...s, tenantName: e.target.value }))} />
              <Input placeholder="Tenant Email (optional)" value={form.tenantEmail} onChange={e => setForm(s => ({ ...s, tenantEmail: e.target.value }))} />
              <Input placeholder="Tenant Phone (optional)" value={form.tenantPhone} onChange={e => setForm(s => ({ ...s, tenantPhone: e.target.value }))} />
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
