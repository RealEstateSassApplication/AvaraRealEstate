"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PropertyCard from '@/components/property/PropertyCard';

interface MeResponse {
  data?: any;
  user?: any;
}

export default function UserProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [propLoading, setPropLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const json: MeResponse = await res.json();
          const u = json.data || json.user;
          setUser(u || null);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPropLoading(true);
      try {
        const id = user.id || user._id || user._id_string;
        if (!id) return;
        const res = await fetch(`/api/properties?owner=${id}&limit=100`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          // property route returns { properties, total }
          const props = json.properties || json.data || [];
          setProperties(props || []);
        } else {
          console.warn('Failed to fetch properties for profile');
        }
      } catch (err) {
        console.error('Failed to load properties', err);
      } finally {
        setPropLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (!user) return <div className="p-6">You must be signed in to view your profile.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row gap-6">
        <div className="flex items-center gap-4">
          <Avatar>
            {user.profilePhoto ? (
              <AvatarImage src={user.profilePhoto} alt={user.name || 'User'} />
            ) : (
              <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/user/profile/edit">Edit Profile</Link>
            </Button>
            <Button asChild>
              <Link href="/host/listings/create">Create Listing</Link>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-48">
          <div className="bg-black text-white rounded-md p-4 text-center">
            <div className="text-xs uppercase text-gray-300">Listings</div>
            <div className="text-2xl font-bold">{propLoading ? '...' : properties.length}</div>
            <div className="text-xs text-gray-400">Active & Pending</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Listings</h2>
            <Button asChild>
              <Link href="/host/listings/create">New Listing</Link>
            </Button>
          </div>

          {propLoading ? (
            <div className="p-6">Loading listings...</div>
          ) : properties.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No listings found. Create your first listing.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((p: any) => (
                <div key={p._id} className="bg-white border rounded-lg overflow-hidden">
                  <PropertyCard property={{ _id: p._id, title: p.title, description: p.description || p.title, type: p.type || 'apartment', purpose: p.purpose || 'rent', price: p.price, currency: p.currency || 'LKR', rentFrequency: p.rentFrequency, bedrooms: p.bedrooms, bathrooms: p.bathrooms, areaSqft: p.areaSqft, images: p.images && p.images.length ? p.images : ['/images/property-placeholder.jpg'], address: { city: p.address?.city || 'Unknown', district: p.address?.district || 'Unknown' }, amenities: p.amenities || [], ratings: { average: p.ratings?.average || 0, count: p.ratings?.count || 0 }, featured: !!p.featured, verified: !!p.verified, owner: { name: user.name, profilePhoto: user.profilePhoto, verified: !!user.verified } }} />
                  <div className="p-3 flex items-center justify-between">
                    <Button asChild>
                      <Link href={`/listings/${p._id}`}>View</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/host/listings/${p._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Account</h3>
            <div className="text-sm text-muted-foreground">Role</div>
            <div className="mb-2">{user.role || (user.roles && user.roles.join(', ')) || 'User'}</div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="mb-2">{user.email}</div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/favorites">View Favorites</Link>
              </Button>
              <Button asChild>
                <Link href="/bookings">My Bookings</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
