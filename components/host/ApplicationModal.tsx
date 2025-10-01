"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  application: any;
  onClose?: () => void;
  onActionCompleted?: () => void;
}

export default function ApplicationModal({ application, onClose, onActionCompleted }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!application) return null;

  const handleAction = async (action: 'accept' | 'reject' | 'request-info', payload?: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${application._id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Action failed');
      } else {
        onActionCompleted?.();
        setOpen(false);
      }
    } catch (err) {
      console.error('Action error', err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRent = async () => {
    setLoading(true);
    try {
      // Ensure tenant user exists (create or get)
      const tenantResp = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: application.user?.name || 'Tenant', email: application.user?.email, phone: application.user?.phone || '0000000000', role: 'tenant', skipPassword: true })
      });
      
      if (!tenantResp.ok && tenantResp.status !== 200) {
        const errJson = await tenantResp.json().catch(() => ({}));
        alert(`Failed to create/find tenant: ${errJson.error || 'Unknown error'}`);
        return;
      }
      
      const tenantJson = await tenantResp.json();
      const tenantId = tenantJson.user?._id || tenantJson.data?.id || tenantJson._id;
      
      if (!tenantId) {
        alert('Failed to get tenant ID');
        console.error('Tenant response:', tenantJson);
        return;
      }

      const rentResp = await fetch('/api/rents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: application.property._id || application.property,
          tenantId: tenantId,
          amount: application.monthlyRent,
          currency: application.currency || 'LKR',
          frequency: 'monthly',
          firstDueDate: application.startDate || new Date().toISOString(),
          notes: `Created from application ${application._id}`
        })
      });

      if (!rentResp.ok) {
        const json = await rentResp.json().catch(() => ({}));
        alert(json.error || 'Failed to create rent');
      } else {
        onActionCompleted?.();
        setOpen(false);
        alert('Rent agreement created');
      }
    } catch (err) {
      console.error('Create rent error', err);
      alert('Failed to create rent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">View</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{application.property?.title || 'Property'}</h3>
                <Badge>{application.status}</Badge>
              </div>

              <p className="text-sm text-gray-600">Applicant: {application.user?.name || application.user}</p>
              <p className="text-sm text-gray-600">Email: {application.user?.email}</p>
              <p className="text-sm text-gray-600">Phone: {application.user?.phone}</p>
              <p className="text-sm text-gray-600">Start date: {new Date(application.startDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Duration (months): {application.durationMonths}</p>
              <p className="text-sm text-gray-600">Monthly rent: {application.monthlyRent}</p>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="bg-green-600" onClick={() => handleAction('accept') } disabled={loading}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={() => handleAction('reject', { reason: 'Not suitable' })} disabled={loading}>Reject</Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('request-info', { request: 'Please provide proof of income' })} disabled={loading}>Request Info</Button>
                <div className="ml-auto" />
                <Button size="sm" onClick={handleCreateRent} disabled={loading}>Create Rent Agreement</Button>
              </div>

              <div className="mt-4">
                <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(application, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
        <DialogClose asChild>
          <Button variant="ghost" className="mt-4">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
