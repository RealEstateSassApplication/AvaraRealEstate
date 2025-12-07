import { notFound } from 'next/navigation';
import Image from 'next/image';
import PropertyService from '@/services/propertyService';
import Header from '@/components/ui/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1 font-medium underline cursor-pointer hover:text-gray-900">
              <MapPin className="w-4 h-4" />
              <span>{property.address?.city}, {property.address?.district}</span>
            </div>

            <span className="hidden sm:inline text-gray-300">|</span>

            {property.ratings?.average > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                <span className="font-semibold text-gray-900">{property.ratings.average}</span>
                <span className="underline decoration-gray-300">({property.ratings.count} reviews)</span>
              </div>
            )}

            {property.verified && (
              <>
                <span className="hidden sm:inline text-gray-300">|</span>
                <div className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                  <Verified className="w-3 h-3" />
                  <span className="font-medium text-xs">Verified Listing</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-12 rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 h-[400px] md:h-[500px]">
            {/* Main Image */}
            <div className="md:col-span-2 lg:col-span-2 md:row-span-2 relative group cursor-pointer">
              <Image
                src={mainImage}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                priority
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {property.featured && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm border-0 shadow-sm font-semibold">
                    Featured Collection
                  </Badge>
                </div>
              )}
            </div>

            {/* Additional Images Grid */}
            <div className="hidden md:grid col-span-2 lg:col-span-2 grid-cols-2 gap-1 h-full">
              {additionalImages.map((image, index) => (
                <div key={index} className="relative group cursor-pointer overflow-hidden">
                  <Image
                    src={image}
                    alt={`${property.title} - View ${index + 2}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {index === 3 && additionalImages.length > 4 && (
                    <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white font-medium text-lg">+{additionalImages.length - 4} photos</span>
                    </div>
                  )}
                </div>
              ))}
              {/* Fallback placeholders if not enough images to fill the grid nicely could go here, or handled by CSS */}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-b border-gray-100">
              <div className="space-y-1">
                <div className="text-2xl font-semibold capitalize">{property.type} hosted by {(property.owner as any)?.name?.split(' ')[0] || 'Host'}</div>
                <div className="text-gray-500 flex gap-2 text-sm">
                  {property.bedrooms && <span>{property.bedrooms} beds</span>}
                  <span>·</span>
                  {property.bathrooms && <span>{property.bathrooms} baths</span>}
                  <span>·</span>
                  {property.areaSqft && <span>{property.areaSqft} sqft</span>}
                </div>
              </div>

              <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white shadow-md">
                {/* Placeholder Avatar logic */}
                <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {((property.owner as any)?.name || 'H').charAt(0)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">About this space</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg font-light">
                {property.description}
              </p>
            </div>

            {/* Amenities Section */}
            {property.amenities?.length > 0 && (
              <div className="py-8 border-t border-gray-100">
                <h2 className="text-xl font-semibold mb-6">What this place offers</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-8">
                  {property.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Mountain;
                    return (
                      <div key={amenity} className="flex items-center gap-4 text-gray-700">
                        <IconComponent className="w-6 h-6 text-gray-900 stroke-1" />
                        <span className="capitalize text-lg font-light">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Section */}
            <div className="py-8 border-t border-gray-100">
              <h2 className="text-xl font-semibold mb-6">Meet your host</h2>
              <div className="bg-gray-50 rounded-2xl p-8 flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    {((property.owner as any)?.name || 'H').charAt(0)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{(property.owner as any)?.name || 'Host'}</h3>
                    <p className="text-sm text-gray-500">Joined in 2023</p>
                  </div>
                  <div className="flex gap-2">
                    {(property.owner as any)?.verified && (
                      <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">Verified Identity</Badge>
                    )}
                    <Badge variant="outline" className="bg-white text-gray-700 border-gray-200">Superhost</Badge>
                  </div>
                  <p className="text-gray-600 max-w-md">The host is a verified Avara member. We've confirmed their identity to ensure a safe experience for you.</p>

                  <Button variant="outline" className="mt-2 border-gray-900 text-gray-900 hover:bg-gray-100"> Contact Host </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="border border-gray-200 rounded-2xl shadow-xl bg-white p-6 md:p-8">
                {/* Price Header */}
                <div className="mb-6 flex items-baseline justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-gray-900">
                        {property.currency || 'LKR'} {property.price.toLocaleString()}
                      </span>
                      {property.purpose === 'booking' ? (
                        <span className="text-gray-500 font-medium">/ night</span>
                      ) : (
                        property.rentFrequency && property.purpose !== 'sale' && (
                          <span className="text-gray-500 font-medium">/ {property.rentFrequency}</span>
                        )
                      )}
                    </div>
                    {property.purpose === 'sale' && <span className="text-sm text-gray-500 font-medium">Sales Price</span>}
                  </div>
                </div>

                {/* Secure Badge */}
                <div className="mb-6 bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                  <Verified className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Avara Cover</p>
                    <p className="text-xs text-gray-600">Every booking includes free protection from cancellations, accuracy issues, and more.</p>
                  </div>
                </div>

                {/* Action Component */}
                <div className="space-y-4">
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

                  <div className="text-center">
                    <p className="text-xs text-gray-400 mt-4">You won't be charged yet</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-between text-sm text-gray-600">
                  <span className="underline">Avara Fee</span>
                  <span>$0</span>
                </div>

              </div>

              <div className="mt-8 text-center">
                <button className="text-gray-400 text-sm hover:underline flex items-center justify-center gap-2 w-full">
                  <MapPin className="w-4 h-4" /> Report this listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
