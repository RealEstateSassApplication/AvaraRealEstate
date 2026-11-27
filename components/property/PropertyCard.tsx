'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Heart, MapPin, Bed, Bath, Square, Star, Calendar, ShieldCheck, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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
  trustScore?: number;
  trustLevel?: 'unverified' | 'reviewed' | 'verified' | 'premier';
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
    return imgs.length ? imgs : ['/images/property-placeholder.jpg'];
  }, [property.images]);

  const formatPrice = (price: number, currency: string, purpose: string, frequency?: string) => {
    const safeCurrency = /^[A-Z]{3}$/.test(currency || '') ? currency : 'LKR';
    const formatter = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    let formattedPrice = formatter.format(price);
    if (purpose === 'rent' && frequency) {
      const freq = frequency === 'monthly' ? '/month' : frequency === 'weekly' ? '/week' : '/day';
      formattedPrice += freq;
    } else if (purpose === 'booking') {
      formattedPrice += '/night';
    }
    return formattedPrice;
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageErrored(false); setImageLoading(true);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageErrored(false); setImageLoading(true);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(property._id);
  };

  return (
    <Card className={`group relative overflow-hidden border-[#dedbd0] bg-white text-[#243b31] shadow-none transition hover:border-[#8a9685] hover:shadow-md ${className}`}>
        <div className="avara-card-body relative">
          <div className="avara-card-photo relative aspect-[4/3] overflow-hidden">
            <Link href={`/listings/${property._id}`} aria-label={`View ${property.title}`} className="block h-full w-full">
            <img
              src={imageErrored ? '/images/property-placeholder.jpg' : (images[currentImageIndex] || '/images/property-placeholder.jpg')}
              alt={property.title}
              className={`w-full h-full object-cover motion-safe:group-hover:scale-[1.035] transition-transform duration-500 ${imageLoading ? 'animate-pulse bg-gray-200' : ''}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                if (!imageErrored) {
                  setImageErrored(true);
                  setImageLoading(false);
                }
              }}
            />
            </Link>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  aria-label="Previous property photo" onClick={handlePrevImage}
                >
                  <ChevronLeft size={18}/>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 rounded-full opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                  aria-label="Next property photo" onClick={handleNextImage}
                >
                  <ChevronRight size={18}/>
                </Button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
              {property.featured && <Badge className="bg-slate-950 text-white">Featured</Badge>}
              {(property.trustScore || 0) > 0 && (
                <Badge className="bg-white/95 text-slate-950 hover:bg-white border-0 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Avara Trust {property.trustScore}/100
                </Badge>
              )}
              {property.verified && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                  Avara Verified
                </Badge>
              )}
              <Badge variant="outline" className="bg-white/90 capitalize">
                {property.purpose === 'booking' ? 'Booking' : property.purpose}
              </Badge>
            </div>

            {onToggleFavorite && <Button
              aria-pressed={isFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 rounded-full bg-white/95 hover:bg-white p-2"
              onClick={handleToggleFavorite}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>}
          </div>

          <CardContent className="avara-card-content min-w-0 p-5">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {property.address.city}, {property.address.district}
            </div>

            <h3 className="avara-display mb-3 text-2xl leading-tight line-clamp-2"><Link href={`/listings/${property._id}`} className="hover:underline underline-offset-4">{property.title}</Link></h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
              {property.bedrooms !== undefined && property.bedrooms > 0 && (
                <div className="flex items-center"><Bed className="w-4 h-4 mr-1" />{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</div>
              )}
              {property.bathrooms !== undefined && property.bathrooms > 0 && (
                <div className="flex items-center"><Bath className="w-4 h-4 mr-1" />{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</div>
              )}
              {property.areaSqft !== undefined && property.areaSqft > 0 && (
                <div className="flex items-center"><Square className="w-4 h-4 mr-1" />{property.areaSqft.toLocaleString()} sqft</div>
              )}
            </div>

            {property.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {property.amenities.slice(0, 3).map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs bg-gray-100 text-gray-700">{amenity}</Badge>
                ))}
                {property.amenities.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">+{property.amenities.length - 3} more</Badge>
                )}
              </div>
            )}

            {property.ratings?.count > 0 && (
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{property.ratings.average.toFixed(1)}</span>
                <span className="mx-1">·</span>
                <span>{property.ratings.count} review{property.ratings.count !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e6e4db] pt-4">
              <div className="text-lg font-semibold text-[#243b31]">
                {formatPrice(property.price, property.currency, property.purpose, property.rentFrequency)}
              </div>
              <Link href={`/listings/${property._id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline">{property.purpose === 'booking' ? <><Calendar size={15}/> Check dates</> : <>View property <ArrowUpRight size={15}/></>}</Link>
            </div>

            {property.owner && (
              <div className="flex items-center mt-3 pt-3 border-t border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 overflow-hidden">
                  {property.owner.profilePhoto ? (
                    <img src={property.owner.profilePhoto} alt={property.owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                      {property.owner.name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {property.owner.name}
                  {property.owner.verified && <span className="ml-1 text-green-600">✓</span>}
                </span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
  );
}
