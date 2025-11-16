'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function CreateListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'apartment',
    purpose: 'rent',
    price: '',
    rentFrequency: 'monthly',
    bedrooms: '',
    bathrooms: '',
    areaSqft: '' ,
    street: '',
    city: '',
    district: '',
    province: ''
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const priceNumber = Number(form.price);
      if (Number.isNaN(priceNumber) || priceNumber <= 0) {
        setError('Price must be a positive number');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/host/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          purpose: form.purpose,
          price: priceNumber,
          rentFrequency: form.purpose !== 'sale' ? form.rentFrequency : undefined,
          bedrooms: form.type !== 'land' && form.bedrooms ? Number(form.bedrooms) : undefined,
          bathrooms: form.type !== 'land' && form.bathrooms ? Number(form.bathrooms) : undefined,
          areaSqft: form.areaSqft ? Number(form.areaSqft) : undefined,
          address: {
            street: form.street || 'N/A',
            city: form.city || 'Unknown',
            district: form.district || 'Unknown',
            province: form.province || 'Unknown',
            country: 'Sri Lanka'
          },
          images,
          amenities,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        router.push('/host/dashboard');
      } else {
        setError(json.error || 'Failed to create listing');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
        <div className="px-6 py-8 bg-gradient-to-r from-emerald-400 to-sky-500 text-white">
          <h1 className="text-3xl font-extrabold">Create Listing</h1>
          <p className="mt-1 text-sm opacity-90">Add details about your property to attract more tenants or buyers.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Details</h2>
            <p className="text-sm text-muted-foreground">Title, description and primary images</p>
          </section>
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
        <div>
          <Label>Amenities</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Add amenity"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={() => {
              if (amenityInput.trim()) {
                setAmenities(a => [...a, amenityInput.trim()]);
                setAmenityInput('');
              }
            }}>Add</Button>
          </div>
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {amenities.map(a => (
                <span key={a} className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

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
              <option value="villa">Villa</option>
              <option value="bungalow">Bungalow</option>
              <option value="land">Land</option>
              <option value="commercial">Commercial</option>
              <option value="room">Room</option>
              <option value="studio">Studio</option>
              <option value="penthouse">Penthouse</option>
              <option value="duplex">Duplex</option>
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
              <option value="shop">Shop</option>
              <option value="serviced-apartment">Serviced Apartment</option>
            </select>
          </div>

          <div className="w-40">
            <Label htmlFor="purpose">Purpose</Label>
            <select id="purpose" name="purpose" value={form.purpose} onChange={handleChange} className="w-full border rounded p-2">
              <option value="rent">Rent</option>
              <option value="sale">Sale</option>
              <option value="booking">Booking</option>
            </select>
          </div>

          <div className="w-40">
            <Label htmlFor="price">Price (LKR)</Label>
            <Input id="price" name="price" value={form.price} onChange={handleChange} required />
          </div>
        </div>

        {(form.purpose === 'rent' || form.purpose === 'booking') && (
          <div className="flex gap-4">
            <div className="w-48">
              <Label htmlFor="rentFrequency">Rent Frequency</Label>
              <select id="rentFrequency" name="rentFrequency" value={form.rentFrequency} onChange={handleChange} className="w-full border rounded p-2">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        )}

          <div className="grid grid-cols-3 gap-4">
            {form.type !== 'land' && (
              <>
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" name="bedrooms" value={form.bedrooms} onChange={handleChange} placeholder="e.g. 3" />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" value={form.bathrooms} onChange={handleChange} placeholder="e.g. 2" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="areaSqft">Area (sqft)</Label>
              <Input id="areaSqft" name="areaSqft" value={form.areaSqft} onChange={handleChange} placeholder={form.type === 'land' ? 'e.g. 8000 (plot size)' : 'e.g. 1200'} />
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Location</h2>
            <p className="text-sm text-muted-foreground">Use a normal address format (street, city, district, province)</p>
          </section>

          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2">
              <Label htmlFor="street">Street / Address Line</Label>
              <Input id="street" name="street" value={form.street} onChange={handleChange} placeholder="123 Galle Road" className="w-full text-sm h-12 px-3" />
            </div>
          <div>
            <Label htmlFor="city">City / Town</Label>
            <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Colombo" />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" name="district" value={form.district} onChange={handleChange} placeholder="Colombo" />
          </div>
          <div>
            <Label htmlFor="province">Province</Label>
            <Input id="province" name="province" value={form.province} onChange={handleChange} placeholder="Western" />
          </div>
        </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="px-6 py-3 text-sm">{loading ? 'Creating...' : 'Create Listing'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
