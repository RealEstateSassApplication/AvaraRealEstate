"use client";

import { useEffect, useState } from 'react';
import {useRouter} from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ApplicationForm from './ApplicationForm';
import BookingModal from '@/components/booking/BookingModal';
import { toast } from '@/hooks/use-toast';
import { useSavedProperties } from '@/components/discovery/useSavedProperties';
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
  const router=useRouter();
  const [showContact,setShowContact]=useState(false),[draft,setDraft]=useState(''),[contactError,setContactError]=useState('');
  const openContact=()=>{setDraft('');setContactError('');setShowContact(true);};
  const saved = useSavedProperties();
  const favorite = saved.ready ? saved.ids.includes(propertyId) : initialFavorite;
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
    setContactLoading(true);setContactError('');
    try {
      const res = await fetch(`/api/properties/${propertyId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactError(data.error || 'Please try again.');
        return;
      }
      if(!data.conversationId){setContactError('Conversation unavailable. Please retry.');return;}setShowContact(false);router.push('/messages?thread='+encodeURIComponent(data.conversationId));
    } catch {
      setContactError('Network error. Could not send your enquiry.');
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
              <div key={label} className="flex flex-wrap items-center justify-between gap-3 text-sm">
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
              className="w-full min-h-[48px] avara-primary text-base font-medium transition-all shadow-lg hover:shadow-xl"
              onClick={() => handleCheckAuth(() => setShowBookingModal(true))}
            >
              <CalendarDays className="w-5 h-5 mr-2" />
              Book Now
            </Button>
          )}

          {isRentable && (
            <Dialog open={showRentModal} onOpenChange={setShowRentModal}>
                <Button
                  className="w-full min-h-[48px] avara-primary text-base font-medium transition-all shadow-lg hover:shadow-xl"
                  onClick={() => handleCheckAuth(() => setShowRentModal(true))}
                >
                  Apply to Rent
                </Button>
              <DialogContent className="w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Apply to Rent
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[75dvh] overflow-auto">
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
              className="w-full avara-primary text-base py-3 font-semibold"
              disabled={contactLoading}
              onClick={() => handleCheckAuth(openContact)}
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
                onClick={() => handleCheckAuth(openContact)}
              >
                <Send className="w-4 h-4 mr-2" />
                Message owner
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full" variant="outline" onClick={()=>void saved.toggle(propertyId)} disabled={!saved.ready}>
          {favorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </Button>
        {saved.error&&<p role="alert" className="text-sm text-red-700">{saved.error}</p>}
      </div>

      <Dialog open={showContact} onOpenChange={open=>{if(!contactLoading)setShowContact(open);}}><DialogContent className="w-[calc(100%_-_2rem)] max-w-md rounded-xl"><DialogHeader><DialogTitle>Message the property owner</DialogTitle></DialogHeader><form onSubmit={e=>{e.preventDefault();void sendEnquiry(draft.trim());}} className="space-y-4"><p className="text-sm text-[#5f685e]">Start a private conversation about {property?.title||'this property'}. Your email and phone are not automatically shared. If a conversation already exists, we will open it instead.</p><label htmlFor="enquiry-message" className="text-sm font-semibold">Your message</label><textarea id="enquiry-message" required minLength={5} maxLength={2000} className="min-h-32 w-full rounded-lg border p-3 text-base" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Is this property still available?"/>{contactError&&<p role="alert" className="text-sm text-red-700">{contactError}</p>}<Button className="w-full min-h-[48px] avara-primary" disabled={contactLoading||draft.trim().length<5}>{contactLoading?'Opening…':'Start conversation'}</Button></form></DialogContent></Dialog>
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
