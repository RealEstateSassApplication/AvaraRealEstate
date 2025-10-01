"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ApplicationForm from './ApplicationForm';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, Users, MapPin, Wifi, Car, Mountain } from 'lucide-react';

interface HostContact {
  name?: string;
  email?: string;
  phone?: string;
  verified?: boolean;
}

interface PropertyDetails {
  purpose: string;
  type: string;
  price: number;
  currency: string;
  rentFrequency?: string;
  title: string;
  address?: { city: string; district: string };
  amenities?: string[];
  images?: string[];
}

interface Props {
  propertyId: string;
  initialFavorite?: boolean;
  hostContact?: HostContact;
  property?: PropertyDetails;
}

export default function ListingActions({ propertyId, initialFavorite = false, hostContact, property }: Props) {
  const [favorite, setFavorite] = useState<boolean>(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [isSubmittingRent, setIsSubmittingRent] = useState(false);

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/favorite`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setFavorite(Boolean(data.favorite));
        toast({ title: data.favorite ? 'Added to favorites' : 'Removed from favorites' });
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err?.error || 'Could not toggle favorite' });
      }
    } catch (e) {
      toast({ title: 'Network error', description: 'Could not contact server' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: value });
    } catch {
      toast({ title: 'Copy failed', description: 'Select and copy manually.' });
    }
  };

  // New application flow replaces short-term booking
  const handleApplicationSubmitted = () => {
    toast({ title: 'Application Submitted', description: 'Your application has been sent to the host.' });
    setShowRentModal(false);
  };

  const isRentable = property?.purpose === 'rent' || property?.purpose === 'short-term';
  const isPurchasable = property?.purpose === 'sale';

  return (
    <div>
      <div className="flex flex-col gap-3">
        {/* Main Action Buttons */}
        <div className="flex flex-col gap-2">
          {isRentable && (
            <Dialog open={showRentModal} onOpenChange={setShowRentModal}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white text-lg py-3 font-semibold"
                  onClick={async () => {
                    console.log('Rent trigger clicked');
                    try {
                      const me = await fetch('/api/auth/me', { cache: 'no-store' });
                      if (!me.ok) {
                        toast({ title: 'Please sign in', description: 'You need to be signed in to request a rental.' });
                        const next = encodeURIComponent(window.location.pathname + window.location.search);
                        window.location.href = `/auth/login?next=${next}`;
                        return;
                      }
                      setShowRentModal(true);
                    } catch (err) {
                      console.error('Auth check failed', err);
                      toast({ title: 'Error', description: 'Could not verify login. Please sign in.' });
                      const next = encodeURIComponent(window.location.pathname + window.location.search);
                      window.location.href = `/auth/login?next=${next}`;
                    }
                  }}
                >
                  {property?.rentFrequency === 'monthly' ? 'Apply to Rent' : 'Apply to Rent'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Apply to Rent
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4 max-h-[80vh] overflow-auto">
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      {property?.images && property.images.length > 0 && (
                        <img src={property.images[0]} alt={property?.title} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <h3 className="font-semibold">{property?.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{property?.address?.city}, {property?.address?.district}</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#FF385C]">{property?.currency || 'LKR'} {property?.price.toLocaleString()} <span className="text-sm font-medium text-gray-600">/ month</span></div>
                  </div>

                  <ApplicationForm propertyId={propertyId} monthlyRent={property?.price || 0} onSubmitted={handleApplicationSubmitted} />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isPurchasable && (
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3 font-semibold">
              Contact for Purchase
            </Button>
          )}
        </div>

        {/* Host Contact */}
        {hostContact && (
          <>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowContact((s) => !s)}
            >
              {showContact ? 'Hide Contact' : 'Contact Host'}
            </Button>

            {showContact && (
              <div className="w-full mb-2 p-3 rounded border bg-card text-sm space-y-1">
                <div className="font-semibold">Host Contact</div>
                <div>Name: {hostContact.name || 'N/A'}</div>
                {hostContact.phone && (
                  <div className="flex items-center justify-between">
                    <span>Phone: {hostContact.phone}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => copyToClipboard(hostContact.phone)}>Copy</Button>
                  </div>
                )}
                {hostContact.email && (
                  <div className="flex items-center justify-between">
                    <span>Email: {hostContact.email}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => copyToClipboard(hostContact.email)}>Copy</Button>
                  </div>
                )}
                {!hostContact.phone && !hostContact.email && (
                  <div className="text-muted-foreground">No direct contact details.</div>
                )}
                {hostContact.verified && <div className="text-xs text-green-600">Verified Host</div>}
              </div>
            )}
          </>
        )}

        <Button className="w-full" variant="outline" onClick={toggleFavorite} disabled={loading}>
          {favorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>
      </div>
    </div>
  );
}
