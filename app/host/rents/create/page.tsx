'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Property {
  _id: string;
  title: string;
  address?: { city?: string; district?: string };
  price: number;
  currency?: string;
}

export default function CreateRentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    amount: '',
    currency: 'LKR',
    frequency: 'monthly',
    firstDueDate: '',
    leaseStartDate: '',
    leaseEndDate: '',
    securityDeposit: '',
    gracePeriodDays: '0',
    notes: ''
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/host/properties');
        if (res.ok) {
          const json = await res.json();
          setProperties(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load properties', err);
      } finally {
        setLoadingProperties(false);
      }
    };
    void fetchProperties();
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const propertyId = searchParams.get('propertyId');
    const tenantEmail = searchParams.get('tenantEmail');
    const tenantName = searchParams.get('tenantName');
    const amount = searchParams.get('amount');

    setFormData((prev) => ({
      ...prev,
      propertyId: propertyId || prev.propertyId,
      tenantEmail: tenantEmail || prev.tenantEmail,
      tenantName: tenantName || prev.tenantName,
      amount: amount || prev.amount
    }));
  }, [searchParams]);

  const chooseProperty = (propertyId: string) => {
    const property = properties.find((item) => item._id === propertyId);
    setFormData((current) => ({
      ...current,
      propertyId,
      amount: current.amount || (property?.price ? String(property.price) : ''),
      currency: property?.currency || current.currency,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (formData.leaseEndDate && formData.leaseStartDate && formData.leaseEndDate <= formData.leaseStartDate) {
        alert('Lease end date must be after the lease start date.');
        return;
      }

      const tenantResponse = await fetch('/api/host/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.tenantName,
          email: formData.tenantEmail,
          phone: formData.tenantPhone,
        })
      });

      if (!tenantResponse.ok) {
        const errJson = await tenantResponse.json().catch(() => ({}));
        alert(`Failed to create/find tenant: ${errJson.error || 'Unknown error'}`);
        return;
      }

      const tenant = await tenantResponse.json();
      const tenantId = tenant.user?._id;
      if (!tenantId) {
        alert('Failed to get tenant ID');
        return;
      }

      const rentResponse = await fetch('/api/rents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          tenantId,
          amount: Number(formData.amount),
          currency: formData.currency,
          frequency: formData.frequency,
          firstDueDate: formData.firstDueDate,
          leaseStartDate: formData.leaseStartDate || formData.firstDueDate,
          leaseEndDate: formData.leaseEndDate || undefined,
          securityDeposit: Number(formData.securityDeposit) || 0,
          gracePeriodDays: Number(formData.gracePeriodDays) || 0,
          notes: formData.notes
        })
      });

      if (rentResponse.ok) {
        router.push('/owner');
      } else {
        const error = await rentResponse.json().catch(() => ({}));
        alert(`Error: ${error.error || 'Failed to create rent'}`);
      }
    } catch (error) {
      console.error('Error creating rent:', error);
      alert('Failed to create rent agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-6 py-10">
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Avara Owner OS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create lease</h1>
          <p className="mt-2 text-slate-600">Create the tenant relationship, rent schedule and lease lifecycle in one record.</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Lease details</CardTitle>
            <CardDescription>This agreement will feed rent collection, tenant management and portfolio reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select value={formData.propertyId} onValueChange={chooseProperty} required disabled={loadingProperties}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProperties ? 'Loading properties...' : 'Select a property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 && !loadingProperties && <SelectItem value="none" disabled>No properties available</SelectItem>}
                    {properties.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title} · {property.address?.city || 'Sri Lanka'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-semibold">Tenant</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">Full name *</Label>
                    <Input id="tenantName" value={formData.tenantName} onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenantEmail">Email *</Label>
                    <Input id="tenantEmail" type="email" value={formData.tenantEmail} onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantPhone">Phone *</Label>
                  <Input id="tenantPhone" type="tel" value={formData.tenantPhone} onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })} required />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-semibold">Rent schedule</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Rent amount *</Label>
                    <Input id="amount" type="number" min="1" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LKR">LKR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstDueDate">First due date *</Label>
                    <Input id="firstDueDate" type="date" value={formData.firstDueDate} onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-semibold">Lease lifecycle</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="leaseStartDate">Lease starts</Label>
                    <Input id="leaseStartDate" type="date" value={formData.leaseStartDate} onChange={(e) => setFormData({ ...formData, leaseStartDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaseEndDate">Lease ends</Label>
                    <Input id="leaseEndDate" type="date" value={formData.leaseEndDate} onChange={(e) => setFormData({ ...formData, leaseEndDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="securityDeposit">Security deposit</Label>
                    <Input id="securityDeposit" type="number" min="0" value={formData.securityDeposit} onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriodDays">Grace period (days)</Label>
                    <Input id="gracePeriodDays" type="number" min="0" max="60" value={formData.gracePeriodDays} onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={4} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Lease terms, special conditions or internal notes…" />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-slate-950 text-white hover:bg-slate-800">
                  {loading ? 'Creating…' : 'Create lease'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
