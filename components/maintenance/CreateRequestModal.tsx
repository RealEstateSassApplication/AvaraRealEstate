"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface Props {
  propertyId: string;
}

export default function CreateRequestModal({ propertyId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleOpen = async () => {
    try {
      const me = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!me.ok) {
        toast({ title: 'Please sign in', description: 'You need to be signed in to submit maintenance requests.' });
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/auth/login?next=${next}`;
        return;
      }
      setOpen(true);
    } catch (err) {
      console.error('Auth check failed', err);
      toast({ title: 'Error', description: 'Could not verify login. Please sign in.' });
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      toast({ title: 'Missing fields', description: 'Please provide a title and description' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, title, description, category, priority })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: err.error || 'Failed to create maintenance request' });
        return;
      }
      const json = await res.json().catch(() => ({}));
      toast({ title: 'Request submitted', description: 'Maintenance request sent to host.' });
      setOpen(false);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Create maintenance failed', err);
      toast({ title: 'Network error', description: 'Could not submit maintenance request' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full mt-4" onClick={handleOpen}>Report Maintenance Issue</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-2">
          <Input placeholder="Short title e.g. Leaking faucet" value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} />
          <Textarea placeholder="Describe the issue in detail" value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
          <div className="grid grid-cols-2 gap-2">
            <select value={category} onChange={(e) => setCategory((e.target as HTMLSelectElement).value)} className="p-2 border rounded">
              <option value="general">General</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="appliances">Appliances</option>
              <option value="other">Other</option>
            </select>
            <select value={priority} onChange={(e) => setPriority((e.target as HTMLSelectElement).value)} className="p-2 border rounded">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} className="mr-2">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
