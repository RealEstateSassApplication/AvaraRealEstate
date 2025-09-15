'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Heart, MapPin, Bed, Bath, Square, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Property {
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

interface PropertyCardProps {
  property: Property;
  onToggleFavorite?: (propertyId: string) => void;
  isFavorite?: boolean;
  className?: string;
}

export default function PropertyCard({ 
  property, 
  onToggleFavorite, 
  isFavorite = false,
  className = ''
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageErrored, setImageErrored] = useState(false);

  const images = useMemo(() => {
    const imgs = Array.isArray(property.images) ? property.images.filter(Boolean) : [];
    if (!imgs.length) return ['/images/property-placeholder.jpg'];
    return imgs;
  }, [property.images]);

  const formatPrice = (price: number, currency: string, purpose: string, frequency?: string) => {
    const formatter = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency === 'LKR' ? 'LKR' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    let formattedPrice = formatter.format(price);
    
    if (purpose === 'rent' && frequency) {
      const freq = frequency === 'monthly' ? '/month' : frequency === 'weekly' ? '/week' : '/day';
      formattedPrice += freq;
    } else if (purpose === 'short-term') {
      formattedPrice += '/night';
    }

    return formattedPrice;
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(property._id);
    }
  };

  return (
    <Link href={`/listings/${property._id}`}>
      <Card className={`group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${className}`}>
        <div className="relative">
          {/* Image Carousel */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={imageErrored ? '/images/property-placeholder.jpg' : (images[currentImageIndex] || '/images/property-placeholder.jpg')}
              alt={property.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                imageLoading ? 'animate-pulse bg-gray-200' : ''
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                if (!imageErrored) {
                  setImageErrored(true);
                  setImageLoading(false);
                }
              }}
            />

            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handlePrevImage}
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleNextImage}
                >
                  →
                </Button>

                {/* Image Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {property.featured && (
                <Badge className="bg-orange-500 hover:bg-orange-600">
                  Featured
                </Badge>
              )}
              {property.verified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
              )}
              <Badge variant="outline" className="bg-white/90 capitalize">
                {property.purpose === 'short-term' ? 'Stay' : property.purpose}
              </Badge>
            </div>

            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 p-2"
              onClick={handleToggleFavorite}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </Button>
          </div>

          <CardContent className="p-4">
            {/* Location */}
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {property.address.city}, {property.address.district}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
              {property.title}
            </h3>

            {/* Property Details */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              {property.bedrooms && (
                <div className="flex items-center">
                  <Bed className="w-4 h-4 mr-1" />
                  {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center">
                  <Bath className="w-4 h-4 mr-1" />
                  {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                </div>
              )}
              {property.areaSqft && (
                <div className="flex items-center">
                  <Square className="w-4 h-4 mr-1" />
                  {property.areaSqft.toLocaleString()} sqft
                </div>
              )}
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {property.amenities.slice(0, 3).map((amenity) => (
                  <Badge
                    key={amenity}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700"
                  >
                    {amenity}
                  </Badge>
                ))}
                {property.amenities.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                    +{property.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Rating */}
            {property.ratings.count > 0 && (
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{property.ratings.average.toFixed(1)}</span>
                <span className="mx-1">·</span>
                <span>{property.ratings.count} review{property.ratings.count !== 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(property.price, property.currency, property.purpose, property.rentFrequency)}
              </div>
              {property.purpose === 'short-term' && (
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Check Dates
                </Button>
              )}
            </div>

            {/* Owner Info */}
            <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
              <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 overflow-hidden">
                {property.owner.profilePhoto ? (
                  <img
                    src={property.owner.profilePhoto}
                    alt={property.owner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                    {property.owner.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {property.owner.name}
                {property.owner.verified && (
                  <span className="ml-1 text-green-600">✓</span>
                )}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}