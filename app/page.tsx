'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Home, Building, Bed, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ListPropertyButton from '@/components/ui/ListPropertyButton';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/ui/layout/Header';
import PropertyCard from '@/components/property/PropertyCard';

interface Property {
  _id: string;
  title: string;
  description: string;
  type: string;
  purpose: 'rent' | 'sale' | 'booking';
  price: number;
  currency: string;
  rentFrequency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  images: string[];
  address: {
    city: string;
    district: string;
  };
  amenities: string[];
  ratings: {
    average: number;
    count: number;
  };
  featured: boolean;
  verified: boolean;
  owner: {
    name: string;
    profilePhoto?: string;
    verified: boolean;
  };
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState({ props: 0, customers: 0, cities: 0 });

  useEffect(() => {
    fetchFeaturedProperties();
    const target = { props: 2500, customers: 15000, cities: 25 };
    const duration = 1200;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      setCounters({
        props: Math.round(target.props * progress),
        customers: Math.round(target.customers * progress),
        cities: Math.round(target.cities * progress),
      });
      if (progress === 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const response = await fetch('/api/properties?featured=true&limit=8');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      window.location.href = `/listings?search=${encodeURIComponent(trimmed)}`;
    } else {
      window.location.href = '/listings';
    }
  };

  const stats = [
    { label: 'Active Properties', value: `${counters.props.toLocaleString()}+`, icon: Home },
    { label: 'Happy Customers', value: `${counters.customers.toLocaleString()}+`, icon: Building },
    { label: 'Cities Covered', value: `${counters.cities}+`, icon: MapPin },
    { label: 'Average Rating', value: '4.8★', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg')] bg-cover bg-center opacity-30 blur-sm"
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
                Find your next property with
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-blue-600">Avara</span>
              </h1>

              <p className="mt-6 text-lg text-slate-700 max-w-xl">
                Avara — an intelligent property platform for Sri Lanka. Premium listings, verified owners, and precise search powered by modern technology.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="shadow-xl px-8"
                  onClick={() => (window.location.href = '/listings')}
                >
                  Browse Properties
                </Button>

                <ListPropertyButton size="lg" variant="ghost" className="border border-slate-200">List Your Property</ListPropertyButton>
              </div>

              {/* refined trust line */}
              <div className="mt-8 flex gap-4 items-center text-sm text-slate-600">
                <div>Trusted by</div>
                <div className="inline-flex items-center gap-3">
                  <div className="px-3 py-1 bg-white rounded-md shadow-sm">Leading agencies</div>
                  <div className="px-3 py-1 bg-white rounded-md shadow-sm">Verified listings</div>
                  <div className="px-3 py-1 bg-white rounded-md shadow-sm">Secure payments</div>
                </div>
              </div>
            </motion.div>

            {/* SEARCH CARD */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <Card className="backdrop-blur-md bg-white/80 shadow-2xl ring-1 ring-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500">Search</label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          placeholder="Search by city, neighbourhood, or property type"
                          className="pl-10 pr-4 h-12"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                      </div>

                      {searchQuery.trim() && (
                        <div className="mt-2 bg-white border rounded-md shadow-sm p-2">
                          {['Colombo', 'Kandy', 'Galle', 'Negombo']
                            .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 4)
                            .map((s) => (
                              <button
                                key={s}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded"
                                onClick={() => {
                                  setSearchQuery(s);
                                  window.location.href = `/listings?city=${encodeURIComponent(s)}`;
                                }}
                              >
                                {s}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="w-40">
                      <label className="text-xs text-slate-500">Purpose</label>
                      <select className="block w-full mt-2 h-12 rounded-md border border-slate-200 px-3 bg-white" defaultValue="any">
                        <option value="any">Any</option>
                        <option value="rent">Rent</option>
                        <option value="sale">Buy</option>
                        <option value="booking">Booking</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2">
                    <Button size="lg" className="flex-1" onClick={handleSearch}>
                      Search Properties
                    </Button>
                    <Button size="lg" variant="outline" className="w-36">
                      Advanced
                    </Button>
                  </div>

                  <div className="mt-4 text-sm text-slate-500">Examples: Colombo, 2 bedroom apartment, Bentota beach house</div>
                </CardContent>
              </Card>

              {/* Quick links below search */}
              <div className="mt-6 flex gap-3 flex-wrap">
                <Button asChild>
                  <Link href="/listings?purpose=rent" className="border rounded-full px-4 py-2">Rent</Link>
                </Button>
                <Button asChild>
                  <Link href="/listings?purpose=sale" className="border rounded-full px-4 py-2">Buy</Link>
                </Button>
                <Button asChild>
                  <Link href="/listings?purpose=booking" className="border rounded-full px-4 py-2">Booking</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <Button asChild>
              <Link href="/listings?featured=true">View All</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-lg p-4 shadow" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.length ? (
                featuredProperties.map((p) => (
                  <motion.div key={p._id} whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                    <PropertyCard property={p} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-slate-500 col-span-full">No featured properties found.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="py-12 bg-gradient-to-r from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-shadow border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="bg-black w-14 h-14 rounded-lg flex items-center justify-center text-white">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-black">{stat.value}</div>
                    <div className="text-sm text-slate-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Popular Locations in Sri Lanka</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Colombo', image: 'https://images.pexels.com/photos/3601423/pexels-photo-3601423.jpeg' },
              { name: 'Kandy', image: 'https://images.pexels.com/photos/5214413/pexels-photo-5214413.jpeg' },
              { name: 'Galle', image: 'https://images.pexels.com/photos/3586966/pexels-photo-3586966.jpeg' },
              { name: 'Negombo', image: 'https://images.pexels.com/photos/4825701/pexels-photo-4825701.jpeg' },
              { name: 'Nuwara Eliya', image: 'https://images.pexels.com/photos/14751274/pexels-photo-14751274.jpeg' },
              { name: 'Bentota', image: 'https://images.pexels.com/photos/5309919/pexels-photo-5309919.jpeg' },
            ].map((location) => (
              <Link key={location.name} href={`/listings?city=${location.name}`} className="group">
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <div
                    className="h-28 bg-cover bg-center relative transform group-hover:scale-105 transition-transform"
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url(${location.image})` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-white font-semibold text-sm tracking-wide">{location.name}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold mb-4">
            Ready to find your dream property?
          </motion.h2>
          <p className="mb-8 max-w-2xl mx-auto">Join thousands of satisfied customers and unlock a smarter way to search, list, and manage properties in Sri Lanka.</p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-teal-600">
              <Link href="/listings">Browse Properties</Link>
            </Button>
            <ListPropertyButton size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10">List Your Property</ListPropertyButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 text-white p-2 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Avara</h3>
                  <p className="text-sm text-slate-400">Sri Lanka</p>
                </div>
              </div>
              <p className="text-slate-400">Avara is the intelligent property platform in Sri Lanka for rentals, sales, and bookings.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-slate-300">
                <Link href="/listings" className="block hover:text-white">All Properties</Link>
                <Link href="/listings?purpose=rent" className="block hover:text-white">For Rent</Link>
                <Link href="/listings?purpose=sale" className="block hover:text-white">For Sale</Link>
                <Link href="/listings?purpose=booking" className="block hover:text-white">Booking</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Property Owners</h4>
              <div className="space-y-2 text-slate-300">
                <a
                  className="block hover:text-white cursor-pointer"
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch('/api/auth/me', { cache: 'no-store' });
                      if (!res.ok) { window.location.href = '/auth/login'; return; }
                      const json = await res.json().catch(() => ({}));
                      const u = json.data || json.user || null;
                      if (!u) { window.location.href = '/auth/login'; return; }
                      const isHost = (u.roles && Array.isArray(u.roles) && u.roles.includes('host')) || (u.role === 'host') || (typeof u.listingsCount === 'number' && u.listingsCount > 0);
                      if (isHost) { window.location.href = '/host/listings/create'; return; }
                      try { const prom = await fetch('/api/host/promote', { method: 'POST' }); if (prom.ok) { window.location.href = '/host/listings/create'; return; } } catch (err) { console.error('Promote failed', err); }
                      window.location.href = '/host/apply';
                    } catch (err) { console.error(err); window.location.href = '/auth/login'; }
                  }}
                >
                  List Your Property
                </a>
                <Link href="/host/dashboard" className="block hover:text-white">Owner Dashboard</Link>
                <Link href="/pricing" className="block hover:text-white">Pricing Plans</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <div className="space-y-2 text-slate-300">
                <p>contact@avara.lk</p>
                <p>+94 77 123 4567</p>
                <p>Colombo, Sri Lanka</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
            <p>© {new Date().getFullYear()} Avara. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
