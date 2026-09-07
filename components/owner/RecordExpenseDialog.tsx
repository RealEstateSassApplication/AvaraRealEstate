'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PropertyOption = {
  propertyId: string;
  title: string;
  currency?: string;
};

interface Props {
  properties: PropertyOption[];
  onCreated: () => void | Promise<void>;
}

const categories = [
  ['maintenance', 'Maintenance'],
  ['repairs', 'Repairs'],
  ['utilities', 'Utilities'],
  ['tax', 'Tax'],
  ['insurance', 'Insurance'],
  ['management', 'Management'],
  ['capital', 'Capital improvement'],
  ['legal', 'Legal'],
  ['other', 'Other'],
] as const;

export default function RecordExpenseDialog({ properties, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    category: 'maintenance',
    amount: '',
    currency: 'LKR',
    incurredAt: new Date().toISOString().slice(0, 10),
    description: '',
    vendor: '',
  });

  const chooseProperty = (propertyId: string) => {
    const property = properties.find((item) => item.propertyId === propertyId);
    setForm((current) => ({
      ...current,
      propertyId,
      currency: property?.currency || current.currency || 'LKR',
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/owner/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: form.propertyId,
          category: form.category,
          amount: Number(form.amount),
          currency: form.currency,
          incurredAt: form.incurredAt,
          description: form.description,
          vendor: form.vendor || undefined,
        }),
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to record expense');

      toast.success('Expense recorded');
      setOpen(false);
      setForm({
        propertyId: '',
        category: 'maintenance',
        amount: '',
        currency: 'LKR',
        incurredAt: new Date().toISOString().slice(0, 10),
        description: '',
        vendor: '',
      });
      await onCreated();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-950 text-white hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" />
          Record expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record property expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={form.propertyId} onValueChange={chooseProperty} required>
              <SelectTrigger><SelectValue placeholder="Choose a property" /></SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.propertyId} value={property.propertyId}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(category) => setForm((current) => ({ ...current, category }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.incurredAt} onChange={(event) => setForm((current) => ({ ...current, incurredAt: event.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form.currency} maxLength={3} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What was this expense for?" required />
          </div>

          <div className="space-y-2">
            <Label>Vendor or payee</Label>
            <Input value={form.vendor} onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))} placeholder="Optional" />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !properties.length} className="bg-slate-950 text-white hover:bg-slate-800">
              {saving ? 'Saving…' : 'Record expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
