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
    areaSqft: '',
    street: '',
    city: '',
    district: '',
    province: '',
    minStay: '1',
    maxStay: '',
    checkInTime: '14:00',
    checkOutTime: '11:00'
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
          minStay: form.purpose === 'booking' ? form.minStay : undefined,
          maxStay: form.purpose === 'booking' ? form.maxStay : undefined,
          checkInTime: form.purpose === 'booking' ? form.checkInTime : undefined,
          checkOutTime: form.purpose === 'booking' ? form.checkOutTime : undefined,
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Create a New Listing</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Share your property with millions of travelers and tenants. Fill in the details below to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Basic Details */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Property Details</h2>
              <p className="text-sm text-slate-500">The essentials of your listing</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 font-medium">Listing Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Modern Beachfront Villa"
                    className="h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-slate-700 font-medium">Price (LKR)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 15000"
                    className="h-11 border-slate-300 focus:border-slate-500 focus:ring-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 font-medium">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all text-slate-700 placeholder:text-slate-400"
                  placeholder="Describe what makes your place special..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-700 font-medium">Property Type</Label>
                  <div className="relative">
                    <select
                      id="type"
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full h-11 pl-3 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 appearance-none cursor-pointer text-slate-700"
                    >
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
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-slate-700 font-medium">Listing Purpose</Label>
                  <div className="relative">
                    <select
                      id="purpose"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      className="w-full h-11 pl-3 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 appearance-none cursor-pointer text-slate-700"
                    >
                      <option value="rent">Rent (Long Term)</option>
                      <option value="sale">Sale</option>
                      <option value="booking">Booking (Short Stay)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Key Features */}
          {form.type !== 'land' && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Key Features</h2>
                <p className="text-sm text-slate-500">Space and layout</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms" className="text-slate-700 font-medium">Bedrooms</Label>
                    <Input id="bedrooms" name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} placeholder="e.g. 3" className="h-11 border-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms" className="text-slate-700 font-medium">Bathrooms</Label>
                    <Input id="bathrooms" name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} placeholder="e.g. 2" className="h-11 border-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="areaSqft" className="text-slate-700 font-medium">Area (sqft)</Label>
                    <Input id="areaSqft" name="areaSqft" type="number" value={form.areaSqft} onChange={handleChange} placeholder="e.g. 1500" className="h-11 border-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Booking/Rent Settings (Conditional) */}
          {(form.purpose === 'booking' || form.purpose === 'rent') && (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">
                  {form.purpose === 'booking' ? 'Booking Settings' : 'Rental Terms'}
                </h2>
                <p className="text-sm text-slate-500">Configure how guests stay</p>
              </div>
              <div className="p-8 space-y-6">

                {form.purpose === 'rent' && (
                  <div className="max-w-xs space-y-2">
                    <Label htmlFor="rentFrequency" className="text-slate-700 font-medium">Rent Frequency</Label>
                    <div className="relative">
                      <select
                        id="rentFrequency"
                        name="rentFrequency"
                        value={form.rentFrequency}
                        onChange={handleChange}
                        className="w-full h-11 pl-3 pr-10 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 appearance-none cursor-pointer text-slate-700"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="annually">Annually</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                      </div>
                    </div>
                  </div>
                )}

                {form.purpose === 'booking' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minStay" className="text-slate-700 font-medium">Min Stay (Nights)</Label>
                      <Input id="minStay" name="minStay" type="number" min="1" value={form.minStay} onChange={handleChange} required className="h-11 border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStay" className="text-slate-700 font-medium">Max Stay (Optional)</Label>
                      <Input id="maxStay" name="maxStay" type="number" min="1" value={form.maxStay} onChange={handleChange} placeholder="∞" className="h-11 border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkInTime" className="text-slate-700 font-medium">Check-in Time</Label>
                      <Input id="checkInTime" name="checkInTime" type="time" value={form.checkInTime} onChange={handleChange} required className="h-11 border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkOutTime" className="text-slate-700 font-medium">Check-out Time</Label>
                      <Input id="checkOutTime" name="checkOutTime" type="time" value={form.checkOutTime} onChange={handleChange} required className="h-11 border-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Location */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Location Details</h2>
              <p className="text-sm text-slate-500">Where is your property located?</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street" className="text-slate-700 font-medium">Street Address</Label>
                  <Input id="street" name="street" value={form.street} onChange={handleChange} placeholder="123 Main St" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-slate-700 font-medium">City</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Colombo" className="h-11 border-slate-300" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="text-slate-700 font-medium">District</Label>
                  <Input id="district" name="district" value={form.district} onChange={handleChange} placeholder="Colombo" className="h-11 border-slate-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Gallery & Amenities */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Gallery & Amenities</h2>
              <p className="text-sm text-slate-500">Show off your property</p>
            </div>
            <div className="p-8 space-y-8">

              {/* Image Upload */}
              <div className="space-y-4">
                <Label className="text-slate-700 font-medium">Property Images</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;

                      for (const file of Array.from(files)) {
                        try {
                          const res = await fetch('/api/uploads/signed-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileName: file.name, contentType: file.type })
                          });
                          const json = await res.json();
                          if (!res.ok) { setError('Failed to get upload url'); continue; }

                          // Fix: Use uploadUrl instead of signedUrl
                          const uploadRes = await fetch(json.uploadUrl, {
                            method: 'PUT',
                            headers: { 'Content-Type': file.type },
                            body: file
                          });

                          if (uploadRes.ok) {
                            setImages((s) => [...s, json.publicUrl]);
                          } else {
                            setError(`Failed to upload ${file.name}`);
                          }
                        } catch (err) {
                          setError('Upload failed');
                        }
                      }
                    }}
                  />
                  <div className="pointer-events-none">
                    <p className="text-slate-900 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {images.map((src, idx) => (
                      <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-slate-200 group">
                        <Image src={src} alt="preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="text-white bg-red-600 rounded-full p-1 w-8 h-8 flex items-center justify-center hover:bg-red-700">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Amenities</Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add amenities (e.g. Wifi, Pool...)"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    className="h-11 border-slate-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (amenityInput.trim()) {
                          setAmenities(a => [...a, amenityInput.trim()]);
                          setAmenityInput('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (amenityInput.trim()) {
                        setAmenities(a => [...a, amenityInput.trim()]);
                        setAmenityInput('');
                      }
                    }}
                    className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Add
                  </Button>
                </div>

                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {amenities.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {a}
                        <button type="button" onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))} className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-400 hover:text-white transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 pb-12">
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-slate-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/10">
              {loading ? 'Creating Listing...' : 'Publish Listing'}
            </Button>
          </div>

          {error && (
            <div className="fixed bottom-8 right-8 bg-red-50 text-red-600 px-6 py-4 rounded-xl shadow-lg border border-red-100 animate-in fade-in slide-in-from-bottom-4">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
