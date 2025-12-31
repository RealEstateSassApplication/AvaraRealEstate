'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, DollarSign, Bed, Calendar, Eye, Edit2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RentalRequestCardProps {
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
    };
    status: string;
    matchedProperties: any[];
    createdAt: string;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export default function RentalRequestCard({ request, onView, onEdit, onCancel }: RentalRequestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'matched':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'fulfilled':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency === 'LKR' ? 'LKR' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return '/month';
      case 'weekly':
        return '/week';
      case 'daily':
        return '/day';
      default:
        return '';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h3 className="font-semibold text-lg">
              Looking for {request.propertyTypes.length > 0 ? request.propertyTypes.join(', ') : 'property'}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
          <div className="text-sm">
            {request.location.flexible ? (
              <span className="text-gray-600">Flexible location</span>
            ) : (
              <span className="text-gray-600">
                {[...request.location.cities, ...request.location.districts].slice(0, 3).join(', ')}
                {([...request.location.cities, ...request.location.districts].length > 3) && '...'}
              </span>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {formatPrice(request.budget.min, request.budget.currency)} - {formatPrice(request.budget.max, request.budget.currency)}
            {getFrequencyLabel(request.budget.frequency)}
          </span>
        </div>

        {/* Bedrooms */}
        {request.requirements.bedrooms && (
          <div className="flex items-center gap-2">
            <Bed className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {request.requirements.bedrooms.min && request.requirements.bedrooms.max
                ? `${request.requirements.bedrooms.min} - ${request.requirements.bedrooms.max} bedrooms`
                : request.requirements.bedrooms.min
                ? `${request.requirements.bedrooms.min}+ bedrooms`
                : request.requirements.bedrooms.max
                ? `Up to ${request.requirements.bedrooms.max} bedrooms`
                : 'Any bedrooms'}
            </span>
          </div>
        )}

        {/* Matched Properties */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Home className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-600">
            {request.matchedProperties?.length || 0} matching {request.matchedProperties?.length === 1 ? 'property' : 'properties'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(request._id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
          )}
          {onEdit && request.status !== 'cancelled' && request.status !== 'fulfilled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(request._id)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {onCancel && request.status !== 'cancelled' && request.status !== 'fulfilled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(request._id)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
