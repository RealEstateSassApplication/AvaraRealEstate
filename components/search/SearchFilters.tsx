'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

interface SearchFilters {
  search?: string;
  purpose?: 'rent' | 'sale' | 'short-term';
  type?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  city?: string;
  district?: string;
  province?: string;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  loading?: boolean;
}

const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'room', label: 'Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'shop', label: 'Shop' },
  { value: 'serviced-apartment', label: 'Serviced Apartment' },
];

const amenitiesList = [
  'Parking', 'Swimming Pool', 'Garden', 'Security', 'Elevator', 
  'Balcony', 'Air Conditioning', 'Furnished', 'Internet', 'Gym',
  'Playground', 'Backup Power', 'CCTV', 'Gated Community'
];

const sriLankanCities = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const sriLankanProvinces = [
  'Western','Central','Southern','Northern','Eastern','North Western','North Central','Uva','Sabaragamuwa'
];

const PURPOSES = [
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Buy' },
  { value: 'short-term', label: 'Stay' },
];

export default function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onSearch, 
  loading = false 
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onSearch();
    setShowMobileFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = { search: localFilters.search };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onSearch();
  };

  // If 'land' type is selected, remove bedroom/bathroom filters and hide controls
  useEffect(() => {
    const types = localFilters.type || [];
    if (types.includes('land')) {
      // clear bedroom/bathroom when land selected
      if (localFilters.bedrooms || localFilters.bathrooms) {
        setLocalFilters((prev) => ({ ...prev, bedrooms: undefined, bathrooms: undefined }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.type]);

  const getPriceRange = (purpose?: string) => {
    switch (purpose) {
      case 'rent':
        return { min: 10000, max: 500000, step: 5000, default: [25000, 150000] };
      case 'sale':
        return { min: 1000000, max: 100000000, step: 500000, default: [5000000, 25000000] };
      case 'short-term':
        return { min: 1000, max: 50000, step: 500, default: [3000, 15000] };
      default:
        return { min: 1000, max: 100000000, step: 10000, default: [50000, 10000000] };
    }
  };

  const priceRange = getPriceRange(localFilters.purpose);

  const FilterContent = ({ showPurpose = true, showLocation = true }: { showPurpose?: boolean; showLocation?: boolean }) => (
    <div className="space-y-6">
      {/* Purpose */}
      {showPurpose && (
        <div>
          <Label className="text-base font-semibold mb-3 block">Property For</Label>
          <div className="grid grid-cols-3 gap-2">
            {PURPOSES.map((purpose) => (
              <Button
                key={purpose.value}
                variant={localFilters.purpose === purpose.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('purpose', purpose.value)}
              >
                {purpose.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {showLocation && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>City</Label>
            <Select 
              value={localFilters.city} 
              onValueChange={(value) => handleFilterChange('city', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {sriLankanCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>District</Label>
            <Input
              placeholder="Enter district"
              value={localFilters.district || ''}
              onChange={(e) => handleFilterChange('district', e.target.value)}
            />
          </div>
          <div>
            <Label>Province</Label>
            <Select
              value={localFilters.province}
              onValueChange={(value) => handleFilterChange('province', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                {sriLankanProvinces.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Property Type */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Property Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {propertyTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={localFilters.type?.includes(type.value) || false}
                onCheckedChange={(checked) => {
                  const currentTypes = localFilters.type || [];
                  if (checked) {
                    handleFilterChange('type', [...currentTypes, type.value]);
                  } else {
                    handleFilterChange('type', currentTypes.filter(t => t !== type.value));
                  }
                }}
              />
              <Label htmlFor={type.value} className="text-sm">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Price Range (LKR)
        </Label>
        <div className="px-2">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              className="w-28 p-2 border rounded text-sm bg-white text-black"
              value={localFilters.minPrice ?? priceRange.default[0]}
              min={priceRange.min}
              max={priceRange.max}
              onChange={(e) => {
                const v = Number(e.target.value || priceRange.min);
                handleFilterChange('minPrice', v);
              }}
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="number"
              className="w-28 p-2 border rounded text-sm bg-white text-black"
              value={localFilters.maxPrice ?? priceRange.default[1]}
              min={priceRange.min}
              max={priceRange.max}
              onChange={(e) => {
                const v = Number(e.target.value || priceRange.max);
                handleFilterChange('maxPrice', v);
              }}
            />
          </div>

          <Slider
            value={[
              localFilters.minPrice || priceRange.default[0],
              localFilters.maxPrice || priceRange.default[1]
            ]}
            onValueChange={([min, max]) => {
              handleFilterChange('minPrice', min);
              handleFilterChange('maxPrice', max);
            }}
            min={priceRange.min}
            max={priceRange.max}
            step={priceRange.step}
            className="mb-4"
            range={true}
          />

          <div className="flex justify-between text-sm text-gray-700">
            <span className="font-medium">
              {new Intl.NumberFormat('en-LK').format(
                localFilters.minPrice || priceRange.default[0]
              )}
            </span>
            <span className="font-medium">
              {new Intl.NumberFormat('en-LK').format(
                localFilters.maxPrice || priceRange.default[1]
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min Bedrooms</Label>
          <Select 
            value={localFilters.bedrooms?.toString()} 
            onValueChange={(value) => handleFilterChange('bedrooms', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Min Bathrooms</Label>
          <Select 
            value={localFilters.bathrooms?.toString()} 
            onValueChange={(value) => handleFilterChange('bathrooms', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Amenities</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {amenitiesList.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={localFilters.amenities?.includes(amenity) || false}
                onCheckedChange={(checked) => {
                  const currentAmenities = localFilters.amenities || [];
                  if (checked) {
                    handleFilterChange('amenities', [...currentAmenities, amenity]);
                  } else {
                    handleFilterChange('amenities', currentAmenities.filter(a => a !== amenity));
                  }
                }}
              />
              <Label htmlFor={amenity} className="text-sm">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          onClick={handleApplyFilters}
          className="flex-1"
          disabled={loading}
        >
          Apply Filters
        </Button>
        <Button
          onClick={handleClearFilters}
          variant="outline"
          disabled={loading}
        >
          Clear
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search properties, locations..."
            className="pl-10"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleApplyFilters();
              }
            }}
          />
        </div>
        <Button onClick={handleApplyFilters} disabled={loading}>
          Search
        </Button>
      </div>

      {/* Quick Filters - Desktop */}
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Purpose Quick Select */}
          {PURPOSES.map((purpose) => (
            <Button
              key={purpose.value}
              variant={localFilters.purpose === purpose.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                handleFilterChange('purpose', purpose.value);
                setTimeout(handleApplyFilters, 100);
              }}
            >
              {purpose.label}
            </Button>
          ))}

          {/* Location */}
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <Select 
              value={localFilters.city} 
              onValueChange={(value) => {
                handleFilterChange('city', value);
                setTimeout(handleApplyFilters, 100);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {sriLankanCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localFilters.province}
              onValueChange={(value) => {
                handleFilterChange('province', value);
                setTimeout(handleApplyFilters, 100);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Province" />
              </SelectTrigger>
              <SelectContent>
                {sriLankanProvinces.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="border-t pt-4">
          <FilterContent showPurpose={false} showLocation={false} />
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh]">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
              <SheetDescription>
                Find your perfect property with advanced filters
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto h-full pb-20">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Display */}
      {(localFilters.purpose || localFilters.city || localFilters.province || (localFilters.type && localFilters.type.length > 0)) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
          {localFilters.purpose && (
            <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              {localFilters.purpose === 'short-term' ? 'Stay' : localFilters.purpose}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  handleFilterChange('purpose', undefined);
                  setTimeout(handleApplyFilters, 100);
                }}
              />
            </div>
          )}
          {localFilters.city && (
            <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
              {localFilters.city}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  handleFilterChange('city', undefined);
                  setTimeout(handleApplyFilters, 100);
                }}
              />
            </div>
          )}
          {localFilters.province && (
            <div className="flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm">
              {localFilters.province}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  handleFilterChange('province', undefined);
                  setTimeout(handleApplyFilters, 100);
                }}
              />
            </div>
          )}
          {localFilters.type && localFilters.type.map((type) => (
            <div
              key={type}
              className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-sm"
            >
              {propertyTypes.find(t => t.value === type)?.label}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => {
                  const newTypes = localFilters.type?.filter(t => t !== type);
                  handleFilterChange('type', newTypes);
                  setTimeout(handleApplyFilters, 100);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}