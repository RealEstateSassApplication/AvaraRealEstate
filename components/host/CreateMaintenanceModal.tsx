"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  properties: any[];
  onCreated?: () => void;
}

export default function CreateMaintenanceModal({ properties = [], onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState(properties[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!propertyId) return alert('Please select a property');
    if (!title) return alert('Please enter a title');
    setLoading(true);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, title, description, category, priority })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json.error || 'Failed to create maintenance request');
        return;
      }
      toast.success('Maintenance request created');
      setOpen(false);
      setTitle(''); setDescription(''); setCategory('general'); setPriority('normal');
      onCreated?.();
    } catch (err) {
      console.error('Create maintenance failed', err);
      alert('Network error creating maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Create Maintenance Request</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Property</label>
                <Select onValueChange={(v) => setPropertyId(v)} defaultValue={propertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Title</label>
                <Input value={title} onChange={(e) => setTitle((e.target as HTMLInputElement).value)} />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <Textarea value={description} onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Category</label>
                  <Select onValueChange={(v) => setCategory(v)} defaultValue={category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="appliance">Appliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Priority</label>
                  <Select onValueChange={(v) => setPriority(v)} defaultValue={priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </DialogContent>
    </Dialog>
  );
}
