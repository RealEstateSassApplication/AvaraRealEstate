'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function EditListingPage() {
  const router = useRouter();
  const params: any = useParams();
  const id = params.id;

  const [form, setForm] = useState({ title: '', description: '', type: '', purpose: '', price: '' });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          const prop = json.property;
          setForm({ title: prop.title || '', description: prop.description || '', type: prop.type || '', purpose: prop.purpose || '', price: prop.price?.toString() || '' });
          setImages(prop.images || []);
        } else {
          setError('Failed to load property');
        }
      } catch (err) {
        if (mounted) setError('Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description, type: form.type, purpose: form.purpose, price: Number(form.price), images }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push('/host/dashboard');
      } else {
        setError(json.error || 'Failed to update');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/host/dashboard');
      else {
        const json = await res.json();
        setError(json.error || 'Failed to delete');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} className="w-full border rounded p-2" rows={6} required />
        </div>

        <div>
          <Label htmlFor="images">Images</Label>
          <input id="images" type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const res = await fetch('/api/uploads/signed-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, contentType: file.type }) });
            const json = await res.json();
            if (!res.ok) { setError('Failed to get upload url'); return; }
            try {
              await fetch(json.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
              setImages((s) => [...s, json.publicUrl]);
            } catch (err) { setError('Upload failed'); }
          }} />

          <div className="flex gap-2 mt-2">
            {images.map((src) => (
              <div key={src} className="w-24 h-24 relative">
                <Image src={src} alt="preview" fill className="object-cover rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="type">Type</Label>
            <select id="type" name="type" value={form.type} onChange={handleChange} className="w-full border rounded p-2">
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="land">Land</option>
            </select>
          </div>

          <div className="w-40">
            <Label htmlFor="purpose">Purpose</Label>
            <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange} className="w-full border rounded p-2">
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
              <option value="short-term">Short-term</option>
            </select>
          </div>

          <div className="w-40">
            <Label htmlFor="price">Price (LKR)</Label>
            <Input id="price" name="price" value={form.price} onChange={handleChange} required />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </form>
    </div>
  );
}
