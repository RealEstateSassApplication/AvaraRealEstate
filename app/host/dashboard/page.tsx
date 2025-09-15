'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PropertyCard from '@/components/property/PropertyCard';
// Card and icons removed — not used in the redesigned dashboard

// Minimal shape returned from API
interface HostPropertyApi {
  _id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  purpose?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  amenities?: string[];
  featured?: boolean;
  verified?: boolean;
  owner?: { name?: string; profilePhoto?: string; verified?: boolean };
  address?: { city?: string; district?: string };
  ratings?: { average?: number; count?: number };
  description?: string;
  rentFrequency?: string;
}

// Shape expected by PropertyCard (provide fallbacks)
interface PropertyCardReady {
  _id: string;
  title: string;
  description: string;
  type: string;
  purpose: 'rent' | 'sale' | 'short-term';
  price: number;
  currency: string;
  rentFrequency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  images: string[];
  address: { city: string; district: string };
  amenities: string[];
  ratings: { average: number; count: number };
  featured: boolean;
  verified: boolean;
  owner: { name: string; profilePhoto?: string; verified: boolean };
}

export default function HostDashboard() {
  const [properties, setProperties] = useState<PropertyCardReady[]>([]);
  const [rawProperties, setRawProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rent' | 'sale' | 'stay' | 'tenants'>('rent');
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => { fetchProperties(); fetchBookings(); }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/host/properties');
      if (res.ok) {
        const json = await res.json();
        const raw = (json.data as HostPropertyApi[]) || [];
        setRawProperties(raw);
        const mapped: PropertyCardReady[] = raw.map(p => ({
          _id: p._id,
          title: p.title,
          description: p.description || p.title,
          type: (p.type as string) || 'apartment',
          purpose: (p.purpose as 'rent' | 'sale' | 'short-term') || 'rent',
          price: p.price,
          currency: p.currency || 'LKR',
          rentFrequency: p.rentFrequency,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          areaSqft: p.areaSqft,
          images: p.images && p.images.length ? p.images : ['/images/property-placeholder.jpg'],
          address: { city: p.address?.city || 'Unknown', district: p.address?.district || 'Unknown' },
          amenities: p.amenities || [],
          ratings: { average: p.ratings?.average || 0, count: p.ratings?.count || 0 },
          featured: !!p.featured,
          verified: !!p.verified,
          owner: { name: p.owner?.name || 'You', profilePhoto: p.owner?.profilePhoto, verified: !!p.owner?.verified }
        }));
        setProperties(mapped);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || `Failed to load (status ${res.status})`);
      }
    } catch (err) {
      console.error('Failed to load host properties', err);
      setError('Network error while loading properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings?type=host');
      if (res.ok) {
        const json = await res.json();
        setBookings(json.bookings || json.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('Are you sure you want to delete this listing? This action cannot be undone.');
    if (!ok) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || 'Failed to delete listing');
        return;
      }
      setProperties((prev) => prev.filter((p) => p._id !== id));
      setRawProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete listing');
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
  setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: !current } : p)));
      setRawProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: !current } : p)));
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !current })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: current } : p)));
        setRawProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: current } : p)));
        alert(json.error || 'Failed to update listing');
      }
    } catch (err) {
      console.error('Toggle featured failed', err);
      alert('Failed to update listing');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your listings, bookings and tenants</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/host/listings/create">Create Listing</Link>
            </Button>
            <Button variant="ghost">Settings</Button>
          </div>
        </div>

        <div className="bg-black text-white rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <button className={`px-4 py-2 rounded ${activeTab==='rent'? 'bg-white text-black':'bg-transparent text-white/75'}`} onClick={() => setActiveTab('rent')}>Rent</button>
            <button className={`px-4 py-2 rounded ${activeTab==='sale'? 'bg-white text-black':'bg-transparent text-white/75'}`} onClick={() => setActiveTab('sale')}>Sale</button>
            <button className={`px-4 py-2 rounded ${activeTab==='stay'? 'bg-white text-black':'bg-transparent text-white/75'}`} onClick={() => setActiveTab('stay')}>Short Stays</button>
            <button className={`px-4 py-2 rounded ml-auto ${activeTab==='tenants'? 'bg-white text-black':'bg-transparent text-white/75'}`} onClick={() => setActiveTab('tenants')}>Tenant Management</button>
          </div>
        </div>

        {activeTab !== 'tenants' ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
            {properties.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No listings yet — create your first property.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.filter(p => (activeTab==='rent' ? p.purpose === 'rent' : activeTab==='sale' ? p.purpose === 'sale' : true)).map(p => (
                  <div key={p._id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                    <PropertyCard property={p} />
                    <div className="p-3 flex items-center gap-2 justify-between">
                      <div className="flex gap-2">
                        <Button asChild>
                          <Link href={`/host/listings/${p._id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href={`/listings/${p._id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => handleDelete(p._id)}>Delete</Button>
                        <Button variant="secondary" onClick={() => handleToggleFeatured(p._id, p.featured)}>{p.featured ? 'Unfeature' : 'Feature'}</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tenant Management</h2>
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No bookings found.</div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b: any) => (
                  <div key={b._id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{b.guestDetails?.name || b.user?.name || 'Guest'}</div>
                      <div className="text-sm text-gray-600">{b.property?.title || b.propertyTitle} — {new Date(b.startDate).toLocaleDateString()} to {new Date(b.endDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => alert('Contact placeholder')}>Contact</Button>
                      {b.status !== 'confirmed' && <Button onClick={() => alert('Confirm placeholder')}>Confirm</Button>}
                      <Button variant="destructive" onClick={() => alert('Cancel placeholder')}>Cancel</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
