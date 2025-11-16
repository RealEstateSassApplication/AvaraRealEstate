'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  CheckCircle,
  MapPin,
  Home,
  Clock,
  DollarSign
} from 'lucide-react';
import { format, differenceInDays, addDays, isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  property: {
    _id: string;
    title: string;
    price: number;
    currency: string;
    type: string;
    address?: { city?: string; district?: string };
    images?: string[];
    minStay?: number;
    maxStay?: number;
  };
}

export default function BookingModal({
  open,
  onClose,
  onSuccess,
  property,
}: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Date selection
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

  // Booking details
  const [numberOfGuests, setNumberOfGuests] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Blocked dates (you can fetch this from API)
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  // Calculate stay duration and total price
  const numberOfNights =
    checkInDate && checkOutDate
      ? Math.max(0, differenceInDays(checkOutDate, checkInDate))
      : 0;

  const nightlyRate = property.price;
  const subtotal = nightlyRate * numberOfNights;
  const serviceFee = subtotal * 0.1; // 10% service fee
  const cleaningFee = numberOfNights > 0 ? 5000 : 0; // Fixed cleaning fee
  const totalPrice = subtotal + serviceFee + cleaningFee;

  useEffect(() => {
    if (open) {
      resetForm();
      fetchBlockedDates();
    }
  }, [open]);

  const fetchBlockedDates = async () => {
    // Fetch blocked/booked dates from API
    try {
      const res = await fetch(`/api/properties/${property._id}/availability`);
      if (res.ok) {
        const data = await res.json();
        // Convert string dates to Date objects
        const blocked = (data.blockedDates || []).map((d: string) => new Date(d));
        setBlockedDates(blocked);
      }
    } catch (err) {
      console.error('Failed to fetch blocked dates:', err);
    }
  };

  const resetForm = () => {
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setNumberOfGuests('2');
    setSpecialRequests('');
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setError(null);
    setSuccess(false);
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(
      (blocked) =>
        format(blocked, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const validateBooking = () => {
    if (!checkInDate) {
      setError('Please select a check-in date');
      return false;
    }

    if (!checkOutDate) {
      setError('Please select a check-out date');
      return false;
    }

    if (isBefore(checkOutDate, checkInDate)) {
      setError('Check-out date must be after check-in date');
      return false;
    }

    if (numberOfNights < 1) {
      setError('Minimum stay is 1 night');
      return false;
    }

    if (property.minStay && numberOfNights < property.minStay) {
      setError(`Minimum stay is ${property.minStay} nights`);
      return false;
    }

    if (property.maxStay && numberOfNights > property.maxStay) {
      setError(`Maximum stay is ${property.maxStay} nights`);
      return false;
    }

    if (!numberOfGuests || Number(numberOfGuests) < 1) {
      setError('Please enter number of guests');
      return false;
    }

    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please fill in all guest information');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateBooking()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property._id,
          checkInDate: checkInDate?.toISOString(),
          checkOutDate: checkOutDate?.toISOString(),
          numberOfGuests: Number(numberOfGuests),
          totalPrice,
          currency: property.currency,
          guestName,
          guestEmail,
          guestPhone,
          specialRequests,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const data = await response.json();
      setSuccess(true);
      toast.success('Booking request submitted successfully!');
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            Book Your Stay
          </DialogTitle>
          <DialogDescription>
            Complete the booking details for {property.title}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Booking Request Sent!</h3>
            <p className="text-gray-600">
              Your booking request has been submitted. The host will review and respond shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Info Card */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-4">
              {property.images?.[0] && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {property.address?.city}
                    {property.address?.district && `, ${property.address.district}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {property.currency} {nightlyRate.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600">per night</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Select Dates
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-in Date */}
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check-in</Label>
                  <Popover
                    open={showCheckInCalendar}
                    onOpenChange={setShowCheckInCalendar}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkInDate ? format(checkInDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={(date) => {
                          setCheckInDate(date);
                          setShowCheckInCalendar(false);
                          // Auto-set checkout to next day if not set
                          if (date && !checkOutDate) {
                            setCheckOutDate(addDays(date, 1));
                          }
                        }}
                        disabled={(date) =>
                          isBefore(date, startOfDay(new Date())) ||
                          isDateBlocked(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Check-out Date */}
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check-out</Label>
                  <Popover
                    open={showCheckOutCalendar}
                    onOpenChange={setShowCheckOutCalendar}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOutDate ? format(checkOutDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={(date) => {
                          setCheckOutDate(date);
                          setShowCheckOutCalendar(false);
                        }}
                        disabled={(date) =>
                          !checkInDate ||
                          isBefore(date, checkInDate) ||
                          isDateBlocked(date)
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Stay Duration Display */}
              {checkInDate && checkOutDate && numberOfNights > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">
                    {numberOfNights} night{numberOfNights !== 1 ? 's' : ''} stay
                  </span>
                  <span className="text-gray-600 text-sm">
                    ({format(checkInDate, 'MMM dd')} - {format(checkOutDate, 'MMM dd')})
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Guest Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guest Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Full Name *</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Email Address *</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone Number *</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfGuests">Number of Guests *</Label>
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    max="20"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">
                  Special Requests (Optional)
                </Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requirements or requests..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            {numberOfNights > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Breakdown
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {property.currency} {nightlyRate.toLocaleString()} x {numberOfNights} night
                      {numberOfNights !== 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">
                      {property.currency} {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Cleaning fee</span>
                    <span className="font-medium">
                      {property.currency} {cleaningFee.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Service fee (10%)</span>
                    <span className="font-medium">
                      {property.currency} {serviceFee.toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">
                      {property.currency} {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white"
                disabled={loading || numberOfNights === 0}
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Request Booking
                  </>
                )}
              </Button>
            </div>

            {/* Info Notice */}
            <div className="text-sm text-gray-600 text-center pt-2">
              <p>
                You won&apos;t be charged yet. The host will review your request and
                confirm availability.
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
