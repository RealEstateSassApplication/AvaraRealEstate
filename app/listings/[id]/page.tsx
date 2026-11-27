import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import ListingGallery from '@/components/discovery/ListingGallery';
import DiscoveryFooter from '@/components/discovery/DiscoveryFooter';
import {postgresPreview,postgresDetail} from '@/lib/postgres/public-read';
import PropertyService from '@/services/propertyService';
import Header from '@/components/ui/layout/Header';
import { Badge } from '@/components/ui/badge';
import ListingActions from '@/components/listing/ListingActions';
import { RealEstateListingSchema, BreadcrumbSchema } from '@/components/seo/JsonLd';
import { MapPin, Wifi, Car, Mountain, Users, Bed, Bath, Square, Star, Verified } from 'lucide-react';

interface PageProps { params: { id: string } }

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://avara.lk';

export const revalidate = 0; // always fresh in dev

// Generate dynamic metadata for each property page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const property = (postgresPreview()?await postgresDetail(params.id):await PropertyService.getById(params.id,true));

  if (!property) {
    return {
      title: 'Property Not Found',
      description: 'The property you are looking for does not exist.',robots:{index:false,follow:false},
    };
  }

  const purposeText = property.purpose === 'sale' ? 'for Sale' :
    property.purpose === 'rent' ? 'for Rent' :
      'for Booking';

  const title = `${property.title} | ${property.type} ${purposeText} in ${property.address?.city}`;
  const description = property.description?.substring(0, 160) ||
    `${property.type} ${purposeText} in ${property.address?.city}, ${property.address?.district}. ${property.bedrooms || ''} bedrooms, ${property.bathrooms || ''} bathrooms. Price: ${property.currency} ${property.price?.toLocaleString()}`;

  const images = property.images?.length > 0
    ? property.images.map((img: string) => ({
      url: img,
      width: 1200,
      height: 630,
      alt: property.title,
    }))
    : [{ url: `${BASE_URL}/opengraph-image`, width: 1200, height: 630, alt: 'Avara Real Estate' }];

  return {
    title,
    description,
    keywords: [
      `${property.type} ${purposeText} ${property.address?.city}`,
      `property ${property.address?.city}`,
      `${property.type} Sri Lanka`,
      property.address?.district,
      'Avara Real Estate',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'en_LK',
      url: `${BASE_URL}/listings/${params.id}`,
      siteName: 'Avara',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: property.images?.[0] || `${BASE_URL}/opengraph-image`,
    },
    alternates: {
      canonical: `${BASE_URL}/listings/${params.id}`,
    },
    other: {
      'geo.region': 'LK',
      'geo.placename': property.address?.city || 'Sri Lanka',
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const property = (postgresPreview()?await postgresDetail(params.id):await PropertyService.getById(params.id,true));
  if (!property) {
    notFound();
  }


  const amenityIcons: { [key: string]: any } = {
    wifi: Wifi,
    parking: Car,
    garden: Mountain,
    pool: Mountain,
    gym: Users,
    security: Verified
  };

  return (
    <div className="avara-editorial min-h-screen">
      {/* JSON-LD Structured Data for SEO */}
      <RealEstateListingSchema
        name={property.title}
        description={property.description || ''}
        url={`${BASE_URL}/listings/${params.id}`}
        image={property.images || []}
        price={property.price}
        priceCurrency={property.currency || 'LKR'}
        address={{
          city: property.address?.city || '',
          district: property.address?.district || '',
          country: 'Sri Lanka'
        }}
        propertyType={property.type}
        purpose={property.purpose}
        bedrooms={property.bedrooms}
        bathrooms={property.bathrooms}
        floorSize={property.areaSqft}
        datePosted={property.createdAt?.toISOString()}
        period={property.rentFrequency}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Listings', url: `${BASE_URL}/listings` },
          { name: property.address?.city || 'Property', url: `${BASE_URL}/listings?city=${encodeURIComponent(property.address?.city||'')}` },
          { name: property.title, url: `${BASE_URL}/listings/${params.id}` },
        ]}
      />

      <Header />
      <div className="avara-shell py-8 sm:py-14">

        <Link href="/listings" className="avara-text-link mb-6">← All properties</Link>
        {/* Header Section */}
        <div className="flex flex-col gap-5 mb-10">
          <h1 className="avara-display text-[clamp(2.5rem,5vw,4.8rem)] leading-tight">
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

        <ListingGallery images={property.images || []} title={property.title}/>

        <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-14">
          {/* Left Column: Details */}
          <div className="min-w-0 space-y-10 lg:col-span-2 lg:space-y-12">

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-200">
              <div className="space-y-2">
                <div className="avara-display text-3xl capitalize">
                  {property.type} hosted by {(property.owner as any)?.name?.split(' ')[0] || 'Host'}
                </div>
                <div className="text-slate-500 flex flex-wrap items-center gap-3 text-sm">
                  {property.bedrooms && <span>{property.bedrooms} bedrooms</span>}
                  {property.bathrooms && <span>{property.bathrooms} bathrooms</span>}
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
              <h2 className="avara-display text-3xl">About this place</h2>
              <p className="text-slate-600 leading-loose whitespace-pre-line text-lg font-normal">
                {property.description}
              </p>
            </div>

            {/* Amenities Section */}
            {property.amenities?.length > 0 && (
              <div className="py-10 border-t border-slate-200">
                <h2 className="avara-display mb-6 text-3xl">What this place offers</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  {property.amenities.map((amenity) => {
                    const IconComponent = amenityIcons[amenity.toLowerCase()] || Mountain;
                    return (
                      <div key={amenity} className="flex items-center gap-4 text-slate-700 group">
                        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-6 h-6 text-slate-900" />
                        </div>
                        <span className="break-words capitalize text-base font-medium">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host Section */}
            <div className="py-10 border-t border-slate-200">
              <h2 className="avara-display mb-6 text-3xl">Meet your host</h2>
              <div className="rounded-xl border bg-white p-5 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold shadow-xl ring-4 ring-white">
                    {((property.owner as any)?.name || 'H').charAt(0)}
                  </div>
                </div>
                <div className="min-w-0 space-y-5 flex-1">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{(property.owner as any)?.name || 'Host'}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(property.owner as any)?.verified && (
                      <Badge variant="outline" className="bg-white text-slate-700 border-slate-200 px-3 py-1 text-sm font-medium shadow-sm">Verified Identity</Badge>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">Use the enquiry option to request further information directly through Avara. Independently confirm property and agreement details.</p>

                  <p className="text-sm text-slate-600">Contact the owner through the enquiry form.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="relative min-w-0">
            <div className="lg:sticky lg:top-28">
              <div className="border border-[#dedbd0] rounded-xl bg-white p-5 sm:p-7 overflow-hidden relative">

                {/* Decorative background blur */}

                {/* Price Header */}
                <div className="mb-8 flex flex-col gap-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="avara-display break-words text-3xl sm:text-4xl">
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
                    <p className="text-sm font-bold text-slate-900">Property verification</p>
                    <p className="text-xs text-slate-600 mt-1 leading-normal">Check the listing details, verification record and applicable terms before making a payment.</p>
                  </div>
                </div>

                {/* Action Component */}
                <div className="space-y-6">
                  {postgresPreview()?<p className="text-sm text-slate-600">This is a read-only discovery preview. Enquiries and saved listings are not yet enabled.</p>:<ListingActions
                    propertyId={String(property._id)}
                    initialFavorite={false}
                    hostContact={{
                      name: (property.owner as any)?.name,
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
                  />}


                </div>

              </div>


            </div>
          </div>
        </div>
      </div>
      <DiscoveryFooter/>
    </div>
  );
}

