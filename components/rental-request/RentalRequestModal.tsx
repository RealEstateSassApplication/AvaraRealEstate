'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Calendar,
  Users,
  PawPrint,
  Mail,
  MessageSquare,
  Phone,
  Home,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface RentalRequestModalProps {
  request: {
    _id: string;
    propertyTypes: string[];
    purpose: string;
    location: {
      cities: string[];
      districts: string[];
      flexible: boolean;
    };
    budget: {
      min: number;
      max: number;
      currency: string;
      frequency: string;
    };
    requirements: {
      bedrooms?: { min?: number; max?: number };
      bathrooms?: { min?: number; max?: number };
      areaSqft?: { min?: number; max?: number };
    };
    amenities: string[];
    moveInDate?: string;
    durationMonths?: number;
    occupants?: number;
    hasPets: boolean;
    petDetails?: string;
    additionalNotes?: string;
    status: string;
    matchedProperties: any[];
    contactPreferences: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
    createdAt: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export default function RentalRequestModal({
  request,
  isOpen,
  onClose,
  onEdit,
  onCancel
}: RentalRequestModalProps) {
  if (!request) return null;

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency === 'LKR' ? 'LKR' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'fulfilled':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Rental Request Details</DialogTitle>
            <Badge className={getStatusColor(request.status)}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
          <DialogDescription>
            Created {format(new Date(request.createdAt), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Property Type & Purpose */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Property Preferences
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Type:</span>{' '}
                  {request.propertyTypes.length > 0
                    ? request.propertyTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
                    : 'Any'}
                </p>
                <p>
                  <span className="font-medium">Purpose:</span>{' '}
                  {request.purpose.charAt(0).toUpperCase() + request.purpose.slice(1)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </h3>
              <div className="text-sm text-gray-600">
                {request.location.flexible ? (
                  <p>Flexible with location</p>
                ) : (
                  <>
                    {request.location.cities.length > 0 && (
                      <p>
                        <span className="font-medium">Cities:</span> {request.location.cities.join(', ')}
                      </p>
                    )}
                    {request.location.districts.length > 0 && (
                      <p>
                        <span className="font-medium">Districts:</span> {request.location.districts.join(', ')}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Budget */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget
              </h3>
              <div className="text-sm text-gray-600">
                <p>
                  {formatPrice(request.budget.min, request.budget.currency)} -{' '}
                  {formatPrice(request.budget.max, request.budget.currency)}
                  {' '}({request.budget.frequency})
                </p>
              </div>
            </div>

            <Separator />

            {/* Requirements */}
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                {request.requirements.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="w-4 h-4" />
                    <span>
                      {request.requirements.bedrooms.min && request.requirements.bedrooms.max
                        ? `${request.requirements.bedrooms.min}-${request.requirements.bedrooms.max}`
                        : request.requirements.bedrooms.min
                        ? `${request.requirements.bedrooms.min}+`
                        : request.requirements.bedrooms.max
                        ? `Up to ${request.requirements.bedrooms.max}`
                        : 'Any'}{' '}
                      bedrooms
                    </span>
                  </div>
                )}
                {request.requirements.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="w-4 h-4" />
                    <span>
                      {request.requirements.bathrooms.min && request.requirements.bathrooms.max
                        ? `${request.requirements.bathrooms.min}-${request.requirements.bathrooms.max}`
                        : request.requirements.bathrooms.min
                        ? `${request.requirements.bathrooms.min}+`
                        : request.requirements.bathrooms.max
                        ? `Up to ${request.requirements.bathrooms.max}`
                        : 'Any'}{' '}
                      bathrooms
                    </span>
                  </div>
                )}
                {request.requirements.areaSqft && (
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    <span>
                      {request.requirements.areaSqft.min && request.requirements.areaSqft.max
                        ? `${request.requirements.areaSqft.min}-${request.requirements.areaSqft.max}`
                        : request.requirements.areaSqft.min
                        ? `${request.requirements.areaSqft.min}+`
                        : request.requirements.areaSqft.max
                        ? `Up to ${request.requirements.areaSqft.max}`
                        : 'Any'}{' '}
                      sqft
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {request.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Required Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {request.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Timeline & Details */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Timeline & Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {request.moveInDate && (
                  <p>
                    <span className="font-medium">Move-in Date:</span>{' '}
                    {format(new Date(request.moveInDate), 'PPP')}
                  </p>
                )}
                {request.durationMonths && (
                  <p>
                    <span className="font-medium">Duration:</span> {request.durationMonths} months
                  </p>
                )}
                {request.occupants && (
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{request.occupants} occupants</span>
                  </p>
                )}
                {request.hasPets && (
                  <p className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4" />
                    <span>Has pets{request.petDetails && `: ${request.petDetails}`}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            {request.additionalNotes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Additional Notes</h3>
                  <p className="text-sm text-gray-600">{request.additionalNotes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Contact Preferences */}
            <div>
              <h3 className="font-semibold mb-2">Contact Preferences</h3>
              <div className="flex flex-wrap gap-2">
                {request.contactPreferences.email && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </Badge>
                )}
                {request.contactPreferences.sms && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    SMS
                  </Badge>
                )}
                {request.contactPreferences.whatsapp && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Matched Properties Count */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-teal-800">
                {request.matchedProperties?.length || 0} matching{' '}
                {request.matchedProperties?.length === 1 ? 'property' : 'properties'} found
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {onEdit && request.status !== 'cancelled' && request.status !== 'fulfilled' && (
            <Button onClick={() => onEdit(request._id)} className="flex-1">
              Edit Request
            </Button>
          )}
          {onCancel && request.status !== 'cancelled' && request.status !== 'fulfilled' && (
            <Button
              variant="outline"
              onClick={() => onCancel(request._id)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
