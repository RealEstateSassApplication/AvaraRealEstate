"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ApplicationForm from './ApplicationForm';
import BookingModal from '@/components/booking/BookingModal';
import { toast } from '@/hooks/use-toast';
import { CalendarDays, MapPin, ShieldCheck, CheckCircle2, CircleDashed, Send } from 'lucide-react';

interface HostContact {
  name?: string;
  // Kept for compatibility with the existing server component shape. These are
  // intentionally not rendered; public property queries no longer populate them.
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

interface PropertyPassport {
  trustScore: number;
  trustLevel: 'unverified' | 'reviewed' | 'verified' | 'premier';
  verified: boolean;
  verification: {
    identityVerified?: boolean;
    ownershipVerified?: boolean;
    addressVerified?: boolean;
    inspectionVerified?: boolean;
    pricingReviewed?: boolean;
    reviewedAt?: string;
  };
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
  const [contactLoading, setContactLoading] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [passport, setPassport] = useState<PropertyPassport | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/properties/${propertyId}`, { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        const p = data?.property;
        if (!mounted || !p) return;
        setPassport({
          trustScore: Number(p.trustScore) || 0,
          trustLevel: p.trustLevel || 'unverified',
          verified: Boolean(p.verified),
          verification: p.verification || {},
        });
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [propertyId]);

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
    } catch {
      toast({ title: 'Network error', description: 'Could not contact server' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmitted = () => {
    toast({ title: 'Application Submitted', description: 'Your application has been sent to the host.' });
    setShowRentModal(false);
  };

  const isRentable = property?.purpose === 'rent';
  const isBooking = property?.purpose === 'booking';
  const isPurchasable = property?.purpose === 'sale';

  const handleCheckAuth = async (callback: () => void) => {
    try {
      const me = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!me.ok) {
        toast({ title: 'Please sign in', description: 'You need to be signed in to continue.' });
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/auth/login?next=${next}`;
        return;
      }
      callback();
    } catch (err) {
      console.error('Auth check failed', err);
      toast({ title: 'Error', description: 'Could not verify login. Please sign in.' });
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?next=${next}`;
    }
  };

  const sendEnquiry = async (message: string) => {
    if (contactLoading) return;
    setContactLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Could not send enquiry', description: data.error || 'Please try again.' });
        return;
      }
      toast({ title: 'Enquiry sent', description: data.message || 'The property owner has been notified.' });
    } catch {
      toast({ title: 'Network error', description: 'Could not send your enquiry.' });
    } finally {
      setContactLoading(false);
    }
  };

  const passportChecks = passport ? [
    ['Identity verified', passport.verification.identityVerified],
    ['Ownership documents checked', passport.verification.ownershipVerified],
    ['Property address verified', passport.verification.addressVerified],
    ['Property inspected', passport.verification.inspectionVerified],
    ['Pricing reviewed', passport.verification.pricingReviewed],
  ] as const : [];

  return (
    <div className="space-y-5">
      {passport && (
        <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                <ShieldCheck className="w-4 h-4" />
                Avara Property Passport
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold">{passport.trustScore}</span>
                <span className="text-white/60">/100 Trust Score</span>
              </div>
            </div>
            <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold capitalize">
              {passport.trustLevel}
            </span>
          </div>

          <div className="space-y-2.5">
            {passportChecks.map(([label, passed]) => (
              <div key={label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/80">{label}</span>
                {passed ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" /> Checked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-white/45">
                    <CircleDashed className="w-4 h-4" /> Not yet
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 pt-4 border-t border-white/10 text-xs leading-relaxed text-white/55">
            The score reflects verification checks completed by Avara. It is a trust signal, not a property valuation or legal guarantee.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {isBooking && (
            <Button
              className="w-full h-12 bg-gray-900 hover:bg-black text-white text-lg font-medium transition-all shadow-lg hover:shadow-xl"
              onClick={() => handleCheckAuth(() => setShowBookingModal(true))}
            >
              <CalendarDays className="w-5 h-5 mr-2" />
              Book Now
            </Button>
          )}

          {isRentable && (
            <Dialog open={showRentModal} onOpenChange={setShowRentModal}>
              <DialogTrigger asChild>
                <Button
                  className="w-full h-12 bg-gray-900 hover:bg-black text-white text-lg font-medium transition-all shadow-lg hover:shadow-xl"
                  onClick={() => handleCheckAuth(() => setShowRentModal(true))}
                >
                  Apply to Rent
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
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property?.address?.city}, {property?.address?.district}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {property?.currency || 'LKR'} {property?.price.toLocaleString()}{' '}
                      <span className="text-sm font-medium text-gray-600">/ month</span>
                    </div>
                  </div>

                  <ApplicationForm
                    propertyId={propertyId}
                    monthlyRent={property?.price || 0}
                    onSubmitted={handleApplicationSubmitted}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}

          {isPurchasable && (
            <Button
              className="w-full bg-slate-900 hover:bg-black text-white text-lg py-3 font-semibold"
              disabled={contactLoading}
              onClick={() => handleCheckAuth(() => void sendEnquiry(`I am interested in purchasing ${property?.title || 'this property'}. Please contact me with the next steps.`))}
            >
              <Send className="w-4 h-4 mr-2" />
              {contactLoading ? 'Sending...' : 'Contact for Purchase'}
            </Button>
          )}
        </div>

        {hostContact && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{hostContact.name || 'Property owner'}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {hostContact.verified ? 'Verified Avara member' : 'Property owner'}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={contactLoading}
                onClick={() => handleCheckAuth(() => void sendEnquiry(`I am interested in ${property?.title || 'this property'}. Please contact me with more information.`))}
              >
                <Send className="w-4 h-4 mr-2" />
                Enquire
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full" variant="outline" onClick={toggleFavorite} disabled={loading}>
          {favorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>
      </div>

      {property && (
        <BookingModal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            toast({ title: 'Booking Submitted', description: 'Your booking request has been sent to the host.' });
            setShowBookingModal(false);
          }}
          property={{
            _id: propertyId,
            title: property.title,
            price: property.price,
            currency: property.currency,
            type: property.type,
            address: property.address,
            images: property.images,
          }}
        />
      )}
    </div>
  );
}
