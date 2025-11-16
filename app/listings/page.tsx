'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/ui/layout/Header';
import SearchFilters from '@/components/search/SearchFilters';
import PropertyCard from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, MapPin, SlidersHorizontal } from 'lucide-react';

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

interface SearchFilters {
  search?: string;
  purpose?: 'rent' | 'sale' | 'booking';
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  city?: string;
  district?: string;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>(() => {
    if (!searchParams) return {};
    return {
      search: searchParams.get('search') ?? undefined,
      purpose: (searchParams.get('purpose') as any) ?? undefined,
      type: searchParams.getAll('type') ?? [],
      city: searchParams.get('city') ?? undefined,
      district: searchParams.get('district') ?? undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
      bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
    };
  });

  const searchProperties = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/properties?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setCurrentPage(page);

        // Update URL without triggering a page reload
        const url = new URL(window.location.href);
        url.search = params.toString();
        window.history.replaceState({}, '', url.toString());
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error searching properties:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    searchProperties(1);
  }, [filters, searchProperties]);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleToggleFavorite = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/favorite`, { method: 'POST' });
      if (res.ok) {
        // For now we don't track per-item favorite state here; could refresh list or update a map
        const data = await res.json();
        console.log('Favorite toggled', data);
        // Optionally trigger a full refresh
        searchProperties(currentPage);
      } else {
        const err = await res.json();
        console.error('Favorite toggle error', err);
      }
    } catch (e) {
      console.error('Network error toggling favorite', e);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-300 aspect-[4/3] rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={() => searchProperties(1)}
          loading={loading}
        />

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.purpose ? (
                filters.purpose === 'booking' ? 'Properties for Booking' :
                filters.purpose === 'rent' ? 'Properties for Rent' :
                'Properties for Sale'
              ) : 'All Properties'}
              {filters.city && ` in ${filters.city}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Searching...' : `${total.toLocaleString()} properties found`}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSkeleton />
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Properties Found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search filters or browse all properties
            </p>
            <Button onClick={() => {
              setFilters({});
              searchProperties(1);
            }}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-6'
            }`}>
              {properties.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onToggleFavorite={handleToggleFavorite}
                  className={viewMode === 'list' ? 'flex overflow-hidden' : ''}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => searchProperties(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = Math.max(1, currentPage - 2) + i;
                    if (page > totalPages) return null;
                    
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => searchProperties(page)}
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => searchProperties(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded mb-8 w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i}>
                  <div className="bg-gray-300 aspect-[4/3] rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}