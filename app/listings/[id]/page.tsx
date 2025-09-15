import { notFound } from 'next/navigation';
import Image from 'next/image';
import PropertyService from '@/services/propertyService';
import Header from '@/components/ui/layout/Header';
import { Badge } from '@/components/ui/badge';
import ListingActions from '@/components/listing/ListingActions';

interface PageProps { params: { id: string } }

export const revalidate = 0; // always fresh in dev

export default async function ListingDetailPage({ params }: PageProps) {
  const property = await PropertyService.getById(params.id, true);
  if (!property) {
    notFound();
  }

  const isLand = property.type === 'land';
  const cover = property.images?.[0] || '/images/property-placeholder.jpg';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <Image src={cover} alt={property.title} fill className="object-cover" />
              {property.featured && (
                <span className="absolute top-3 left-3"><Badge variant="default">Featured</Badge></span>
              )}
              {property.verified && (
                <span className="absolute top-3 right-3"><Badge variant="secondary">Verified</Badge></span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span className="capitalize">{property.purpose}</span>
                <span>•</span>
                <span className="capitalize">{property.type}</span>
                {property.rentFrequency && <><span>•</span><span>{property.rentFrequency}</span></>}
                <span>•</span>
                <span>{property.address?.city}, {property.address?.district}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {!isLand && property.bedrooms !== undefined && (
                <div className="p-3 rounded border bg-card"><div className="font-semibold text-xs uppercase mb-1">Bedrooms</div><div>{property.bedrooms}</div></div>
              )}
              {!isLand && property.bathrooms !== undefined && (
                <div className="p-3 rounded border bg-card"><div className="font-semibold text-xs uppercase mb-1">Bathrooms</div><div>{property.bathrooms}</div></div>
              )}
              {property.areaSqft && (
                <div className="p-3 rounded border bg-card"><div className="font-semibold text-xs uppercase mb-1">Area (sqft)</div><div>{property.areaSqft}</div></div>
              )}
              {property.landSize && (
                <div className="p-3 rounded border bg-card"><div className="font-semibold text-xs uppercase mb-1">Land Size</div><div>{property.landSize}</div></div>
              )}
            </div>

            {property.amenities?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a: string) => (
                    <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="p-5 rounded-lg border bg-card">
              <div className="text-2xl font-bold mb-1">
                {property.currency || 'LKR'} {property.price.toLocaleString()}
                {property.rentFrequency && property.purpose !== 'sale' && (
                  <span className="text-base font-medium text-muted-foreground"> / {property.rentFrequency}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-4 capitalize">{property.purpose}</div>
              <ListingActions
                propertyId={String(property._id)}
                initialFavorite={false}
                hostContact={{
                  name: (property.owner as any)?.name,
                  email: (property.owner as any)?.email,
                  phone: (property.owner as any)?.phone,
                  verified: (property.owner as any)?.verified,
                }}
              />
            </div>

            <div className="p-5 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Host</h3>
              <div className="text-sm flex flex-col gap-1">
                <span>{(property.owner as any)?.name || 'Host'}</span>
                {(property.owner as any)?.verified && <span className="text-green-600 text-xs">Verified Host</span>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
