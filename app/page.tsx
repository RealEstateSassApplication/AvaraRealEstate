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
  const [activeTab, setActiveTab] = useState<'Buy' | 'Rent' | 'Book' | 'Sell'>('Buy');
  const [propertyType, setPropertyType] = useState('All Types');
  const [budget, setBudget] = useState('Flexible');
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
    const params = new URLSearchParams();

    // Search query
    const trimmed = searchQuery.trim();
    if (trimmed) params.append('search', trimmed);

    // Purpose mapping
    if (activeTab === 'Buy') params.append('purpose', 'sale');
    else if (activeTab === 'Rent') params.append('purpose', 'rent');
    else if (activeTab === 'Book') params.append('purpose', 'booking');
    // 'Sell' usually redirects to a listing flow, but for now we search 'sale' or handle differently.
    // Assuming 'Sell' is for listing a property, we might want to redirect to list property page?
    // Following user UI, let's treat it as a filter for now or maybe just 'sale'.
    // If Tab is 'Sell', maybe the user wants to see what's for sale? Or list?
    // Given the context of a search bar, 'Buy' looks for Sales. 'Sell' is ambiguous in search.
    // Let's assume 'Buy' -> purpose=sale.
    // If user clicked 'Sell' tab and searches, maybe they want to see sales to compare?
    // Or maybe we treat it as 'sale'.
    // Actually, distinct 'Buy' vs 'Sell' tabs usually imply user intent.
    // 'Buy' = I want to buy (Show me sales).
    // 'Sell' = I want to sell (List my property).
    // If activeTab === 'Sell', we should probably redirect to listing creation or evaluation.
    if (activeTab === 'Sell') {
      window.location.href = '/host/listings/create';
      return;
    }

    // Type mapping
    if (propertyType !== 'All Types') {
      params.append('type', propertyType.toLowerCase());
    }

    // Budget mapping
    if (budget !== 'Flexible') {
      if (budget === '$100k - $500k') {
        params.append('minPrice', '100000');
        params.append('maxPrice', '500000');
      } else if (budget === '$500k - $1M') {
        params.append('minPrice', '500000');
        params.append('maxPrice', '1000000');
      } else if (budget === '$1M+') {
        params.append('minPrice', '1000000');
      }
    }

    const queryString = params.toString();
    window.location.href = queryString ? `/listings?${queryString}` : '/listings';
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
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-[url('https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg')] bg-cover bg-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/40" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-white space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                #1 Real Estate Platform in Sri Lanka
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight tracking-tight">
                Find a home <br />
                that suits <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                  your lifestyle.
                </span>
              </h1>

              <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                Discover a curated selection of premium properties, from modern apartments in Colombo to serene villas by the coast.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 text-lg h-12 px-8"
                  onClick={() => window.location.href = '/listings'}
                >
                  Start Exploring
                </Button>
                <div className="flex -space-x-4 items-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                  <div className="pl-6 text-sm text-gray-400">
                    <span className="text-white font-bold">15k+</span> Happy Customers
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Search Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl p-2 rounded-2xl">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    {(['Buy', 'Rent', 'Book', 'Sell'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-sm font-medium pb-4 -mb-4 transition-colors ${activeTab === tab
                            ? 'text-gray-900 border-b-2 border-gray-900 font-semibold'
                            : 'text-gray-500 hover:text-gray-900'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          placeholder="City, neighborhood, or address"
                          className="h-14 pl-12 bg-gray-50 border-gray-100 focus:bg-white text-lg"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                        <select
                          className="w-full h-14 bg-gray-50 border-gray-100 rounded-md px-4 text-gray-700 outline-none focus:ring-2 focus:ring-black/5"
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                        >
                          <option>All Types</option>
                          <option>House</option>
                          <option>Apartment</option>
                          <option>Land</option>
                          <option>Villa</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget</label>
                        <select
                          className="w-full h-14 bg-gray-50 border-gray-100 rounded-md px-4 text-gray-700 outline-none focus:ring-2 focus:ring-black/5"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                        >
                          <option>Flexible</option>
                          <option>$100k - $500k</option>
                          <option>$500k - $1M</option>
                          <option>$1M+</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-gray-900 hover:bg-black transition-all"
                      onClick={handleSearch}
                    >
                      {activeTab === 'Sell' ? 'List My Property' : 'Search Properties'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
