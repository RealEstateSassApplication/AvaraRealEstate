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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header Section */}
        <div className="flex flex-col gap-5 mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {property.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-600">
            <div className="flex items-center gap-1.5 font-medium hover:text-slate-900 transition-colors cursor-pointer group">
              <MapPin className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              <span className="underline decoration-slate-300 underline-offset-4 group-hover:decoration-slate-900">
                {property.address?.city}, {property.address?.district}
              </span>
            </div>

            <span className="text-slate-300">|</span>

            {property.ratings?.average > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-slate-900">{property.ratings.average}</span>
                <span className="text-slate-500 underline decoration-slate-300 underline-offset-4">
                  ({property.ratings.count} reviews)
                </span>
              </div>
            )}

            {property.verified && (
              <>
                <span className="hidden sm:inline text-slate-300">|</span>
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                  <Verified className="w-4 h-4" />
                  <span className="font-semibold text-xs tracking-wide uppercase">Verified Listing</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1.5 h-[500px] md:h-[600px]">
            {/* Main Image */}
            <div className="md:col-span-2 lg:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden">
              <Image
                src={mainImage}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {property.featured && (
                <div className="absolute top-6 left-6">
                  <Badge className="bg-white/95 text-slate-900 hover:bg-white backdrop-blur-md border-0 shadow-lg px-4 py-1.5 text-sm font-bold tracking-wide uppercase">
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            {/* Additional Images Grid */}
            <div className="hidden md:grid col-span-2 lg:col-span-2 grid-cols-2 gap-1.5 h-full">
              {additionalImages.map((image, index) => (
                <div key={index} className="relative group cursor-pointer overflow-hidden">
                  <Image
                    src={image}
                    alt={`${property.title} - View ${index + 2}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  {index === 3 && additionalImages.length > 4 && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm transition-opacity hover:bg-slate-900/70">
                      <span className="text-white font-semibold text-xl tracking-tight">+{additionalImages.length - 4} photos</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-12">

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-200">
              <div className="space-y-2">
                <div className="text-3xl font-bold capitalize text-slate-800">
                  {property.type} hosted by {(property.owner as any)?.name?.split(' ')[0] || 'Host'}
                </div>
                <div className="text-slate-500 flex items-center gap-3 text-base">
                  {property.bedrooms && <span>{property.bedrooms} bedrooms</span>}
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {property.bathrooms && <span>{property.bathrooms} bathrooms</span>}
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {property.areaSqft && <span>{property.areaSqft} sqft</span>}
                </div>
              </div>

              <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-100 ring-4 ring-white shadow-lg">
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
                  {((property.owner as any)?.name || 'H').charAt(0)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">About this place</h2>
              <p className="text-slate-600 leading-loose whitespace-pre-line text-lg font-normal">
                {property.description}
              </p>
            </div>

            {/* Amenities Section */}
            {property.amenities?.length > 0 && (
              <div className="py-10 border-t border-slate-200">
                <h2 className="text-2xl font-bold mb-8 text-slate-900">What this place offers</h2>
                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                  {property.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Mountain;
                    return (
                      <div key={amenity} className="flex items-center gap-4 text-slate-700 group">
                        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-6 h-6 text-slate-900" />
                        </div>
                        <span className="capitalize text-lg font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Section */}
            <div className="py-10 border-t border-slate-200">
              <h2 className="text-2xl font-bold mb-8 text-slate-900">Meet your host</h2>
              <div className="bg-slate-50 rounded-3xl p-10 flex flex-col sm:flex-row gap-8 items-start shadow-sm ring-1 ring-slate-100">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shadow-xl ring-4 ring-white">
                    {((property.owner as any)?.name || 'H').charAt(0)}
                  </div>
                </div>
                <div className="space-y-5 flex-1">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{(property.owner as any)?.name || 'Host'}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Joined in 2023</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(property.owner as any)?.verified && (
                      <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1 text-sm font-medium shadow-sm">Verified Identity</Badge>
                    )}
                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1 text-sm font-medium shadow-sm">Superhost</Badge>
                  </div>
                  <p className="text-slate-600 leading-relaxed">The host is a verified Avara member. We've confirmed their identity to ensure a safe experience for you.</p>

                  <Button variant="outline" className="mt-4 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors px-6 py-5 text-base font-semibold">
                    Contact Host
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="relative">
            <div className="sticky top-28">
              <div className="border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/50 bg-white p-8 overflow-hidden relative">

                {/* Decorative background blur */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-teal-100/50 to-blue-100/50 rounded-full blur-3xl -z-10" />

                {/* Price Header */}
                <div className="mb-8 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {property.currency || 'LKR'} {property.price.toLocaleString()}
                    </span>
                    {property.purpose === 'booking' ? (
                      <span className="text-slate-500 font-medium text-lg">/ night</span>
                    ) : (
                      property.rentFrequency && property.purpose !== 'sale' && (
                        <span className="text-slate-500 font-medium text-lg">/ {property.rentFrequency}</span>
                      )
                    )}
                  </div>
                  {property.purpose === 'sale' && <span className="text-sm text-slate-500 font-bold uppercase tracking-wide">Sales Price</span>}
                </div>

                {/* Secure Badge */}
                <div className="mb-8 bg-slate-50/80 backdrop-blur-sm p-4 rounded-xl flex items-start gap-4 border border-slate-100">
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                    <Verified className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Avara Cover</p>
                    <p className="text-xs text-slate-600 mt-1 leading-normal">Every booking includes free protection from cancellations, accuracy issues, and more.</p>
                  </div>
                </div>

                {/* Action Component */}
                <div className="space-y-6">
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
                    <p className="text-xs font-medium text-slate-400">You won't be charged yet</p>
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="flex justify-between items-center text-sm font-medium text-slate-600">
                  <span className="underline decoration-slate-300 decoration-wavy cursor-help">Avara Fee</span>
                  <span className="font-bold text-slate-900">$0</span>
                </div>

              </div>

              <div className="mt-8 text-center">
                <button className="text-slate-400 text-sm font-medium hover:text-slate-600 hover:underline flex items-center justify-center gap-2 w-full transition-colors">
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

