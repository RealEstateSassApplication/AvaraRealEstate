"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
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
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [guestCount, setGuestCount] = useState(1);
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

  const handleRentProperty = async () => {
    if (!startDate || !endDate) {
      toast({ title: 'Error', description: 'Please select start and end dates' });
      return;
    }

    if (!property) {
      toast({ title: 'Error', description: 'Property details not available' });
      return;
    }

    setIsSubmittingRent(true);
    try {
      // Calculate total amount based on dates and rent frequency
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let totalAmount = 0;
      if (property.rentFrequency === 'monthly') {
        totalAmount = Math.ceil(diffDays / 30) * property.price;
      } else if (property.rentFrequency === 'weekly') {
        totalAmount = Math.ceil(diffDays / 7) * property.price;
      } else {
        totalAmount = diffDays * property.price; // daily rate
      }

      const bookingData = {
        propertyId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        guestCount,
        totalAmount,
        currency: property.currency || 'LKR',
        guestDetails: {
          adults: guestCount,
          children: 0
        },
        specialRequests: 'Rental request via platform'
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        const result = await res.json();
        toast({ 
          title: 'Rental Request Sent!', 
          description: 'Your rental request has been sent to the host. They will be notified and can approve or decline your request.' 
        });
        setShowRentModal(false);
        // Reset form
        setStartDate(undefined);
        setEndDate(undefined);
        setGuestCount(1);
        
        // Send notification to host
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rental_request',
            propertyId,
            bookingId: result.data._id,
            message: `New rental request for ${property.title}`,
            recipientType: 'host'
          })
        }).catch(err => console.log('Notification error:', err));
        
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.error || 'Failed to send rental request' });
      }
    } catch (error) {
      console.error('Rent request error:', error);
      toast({ title: 'Network Error', description: 'Failed to send rental request. Please try again.' });
    } finally {
      setIsSubmittingRent(false);
    }
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
                <Button className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white text-lg py-3 font-semibold">
                  {property?.rentFrequency === 'monthly' ? 'Rent Monthly' :
                   property?.rentFrequency === 'weekly' ? 'Rent Weekly' : 
                   'Book Now'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Request to Rent
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  {/* Property Summary */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      {property?.images && property.images.length > 0 && (
                        <img 
                          src={property.images[0]} 
                          alt={property?.title} 
                          className="w-12 h-12 rounded-lg object-cover" 
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{property?.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property?.address?.city}, {property?.address?.district}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[#FF385C]">
                      {property?.currency || 'LKR'} {property?.price.toLocaleString()}
                      {property?.rentFrequency && (
                        <span className="text-sm font-medium text-gray-600"> / {property.rentFrequency}</span>
                      )}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date < new Date() || (startDate ? date <= startDate : false)}
                        className="rounded-md border w-full"
                      />
                    </div>
                  </div>

                  {/* Guest Count */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Number of Guests
                    </label>
                    <div className="flex items-center justify-between border rounded-lg p-3">
                      <span>Adults</span>
                      <div className="flex items-center gap-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{guestCount}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setGuestCount(guestCount + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Preview */}
                  {property?.amenities && property.amenities.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">What's Included</label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {property.amenities.slice(0, 6).map((amenity) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity === 'wifi' && <Wifi className="w-3 h-3 mr-1" />}
                            {amenity === 'parking' && <Car className="w-3 h-3 mr-1" />}
                            {amenity === 'garden' && <Mountain className="w-3 h-3 mr-1" />}
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total Calculation */}
                  {startDate && endDate && (
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="text-lg font-bold text-[#FF385C]">
                          {property?.currency || 'LKR'} {
                            (() => {
                              const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              if (property?.rentFrequency === 'monthly') {
                                return (Math.ceil(diffDays / 30) * (property?.price || 0)).toLocaleString();
                              } else if (property?.rentFrequency === 'weekly') {
                                return (Math.ceil(diffDays / 7) * (property?.price || 0)).toLocaleString();
                              } else {
                                return (diffDays * (property?.price || 0)).toLocaleString();
                              }
                            })()
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    onClick={handleRentProperty}
                    disabled={!startDate || !endDate || isSubmittingRent}
                    className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white py-3 font-semibold"
                  >
                    {isSubmittingRent ? 'Sending Request...' : 'Send Rental Request'}
                  </Button>
                  
                  <p className="text-xs text-gray-600 text-center">
                    Your request will be sent to the host for approval. No payment will be charged until approved.
                  </p>
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
