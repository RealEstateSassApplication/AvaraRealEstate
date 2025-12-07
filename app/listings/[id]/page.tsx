import { notFound } from 'next/navigation';
import Image from 'next/image';
import PropertyService from '@/services/propertyService';
import Header from '@/components/ui/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ListingActions from '@/components/listing/ListingActions';
import { MapPin, Wifi, Car, Mountain, Users, Bed, Bath, Square, Star, Verified } from 'lucide-react';

interface PageProps { params: { id: string } }

export const revalidate = 0; // always fresh in dev

export default async function ListingDetailPage({ params }: PageProps) {
  const property = await PropertyService.getById(params.id, true);
  if (!property) {
    notFound();
  }

  const isLand = property.type === 'land';
  const mainImage = property.images?.[0] || '/images/property-placeholder.jpg';
  const additionalImages = property.images?.slice(1, 5) || [];

  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    parking: Car,
    garden: Mountain,
    pool: Mountain,
    gym: Users,
    security: Verified
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title and Location - Mobile First */}
        <div className="mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{property.address?.city}, {property.address?.district}</span>
            </div>
            {property.ratings?.average > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span>{property.ratings.average}</span>
                  <span>({property.ratings.count} reviews)</span>
                </div>
              </>
            )}
            {property.verified && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Verified className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Verified</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery - Airbnb Style */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 rounded-xl overflow-hidden">
            {/* Main Image */}
            <div className="lg:col-span-2 lg:row-span-2 relative aspect-video lg:aspect-square">
              <Image
                src={mainImage}
                alt={property.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                priority
              />
              {property.featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">Featured</Badge>
                </div>
              )}
            </div>

            {/* Additional Images */}
            {additionalImages.map((image, index) => (
              <div key={index} className="relative aspect-video">
                <Image
                  src={image}
                  alt={`${property.title} - Image ${index + 2}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
                {index === 3 && additionalImages.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold">+{additionalImages.length - 4} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Type and Basics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-semibold capitalize">{property.type}</span>
                <span className="text-gray-400">•</span>
                <span className="capitalize">{property.purpose}</span>
                {property.rentFrequency && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{property.rentFrequency}</span>
                  </>
                )}
              </div>

              {/* Property Stats */}
              {!isLand && (
                <div className="flex items-center gap-6 text-gray-600">
                  {property.bedrooms !== undefined && (
                    <div className="flex items-center gap-1">
                      <Bed className="w-5 h-5" />
                      <span>{property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.bathrooms !== undefined && (
                    <div className="flex items-center gap-1">
                      <Bath className="w-5 h-5" />
                      <span>{property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {property.areaSqft && (
                    <div className="flex items-center gap-1">
                      <Square className="w-5 h-5" />
                      <span>{property.areaSqft} sqft</span>
                    </div>
                  )}
                </div>
              )}

              {property.landSize && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Mountain className="w-5 h-5" />
                  <span>Land: {property.landSize}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">About this place</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            <Separator />

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Mountain;
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 border rounded-lg">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            {/* Host Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Meet your host</h2>
              <div className="flex items-start gap-4 p-6 border rounded-xl">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {((property.owner as any)?.name || 'H').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{(property.owner as any)?.name || 'Host'}</h3>
                  {(property.owner as any)?.verified && (
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <Verified className="w-4 h-4" />
                      <span>Verified Host</span>
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mt-2">
                    Typically responds within an hour
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="border border-gray-200 rounded-xl shadow-lg p-6">
              {/* Price */}
              <div className="mb-6">
                <div className="text-2xl font-bold flex items-baseline gap-2">
                  <span className="text-3xl">{property.currency || 'LKR'} {property.price.toLocaleString()}</span>
                  {property.purpose === 'booking' ? (
                    <span className="text-lg font-medium text-gray-600">/ night</span>
                  ) : (
                    property.rentFrequency && property.purpose !== 'sale' && (
                      <span className="text-lg font-medium text-gray-600">/ {property.rentFrequency}</span>
                    )
                  )}
                </div>
                <div className="text-sm text-gray-600 capitalize mt-1">
                  {property.purpose === 'sale' ? 'For Sale' : `For ${property.purpose}`}
                </div>
              </div>

              {/* Booking Actions */}
              <div>
                <ListingActions
                  propertyId={String(property._id)}
                  initialFavorite={false}
                  hostContact={{
                    name: (property.owner as any)?.name,
                    email: (property.owner as any)?.email,
                    phone: (property.owner as any)?.phone,
                    verified: (property.owner as any)?.verified,
                  }}
                  property={{
                    purpose: property.purpose,
                    type: property.type,
                    price: property.price,
                    currency: property.currency,
                    rentFrequency: property.rentFrequency,
                    title: property.title,
                    address: property.address,
                    amenities: property.amenities,
                    images: property.images
                  }}
                />
                {/* Maintenance requests are now only available through the tenant dashboard for active rentals */}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center text-sm text-gray-600">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Verified className="w-4 h-4" />
                    <span>Secure booking</span>
                  </div>
                  <p>Your information is protected and transactions are secure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
