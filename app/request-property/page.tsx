'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Home, MapPin, DollarSign, Bed, Check, Mail, MessageSquare, Phone } from 'lucide-react';

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'bungalow', 'room', 'commercial', 'land'];

const SRI_LANKA_CITIES = [
  'Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Trincomalee',
  'Batticaloa', 'Matara', 'Anuradhapura', 'Kurunegala', 'Ratnapura',
  'Badulla', 'Gampaha', 'Kalutara', 'Nuwara Eliya', 'Ampara'
];

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Puttalam', 'Kurunegala', 'Anuradhapura',
  'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle',
  'Trincomalee', 'Batticaloa', 'Ampara'
];

const AMENITIES = [
  'WiFi', 'Parking', 'Air Conditioning', 'Swimming Pool', 'Gym',
  'Security', 'Furnished', 'Pet Friendly', 'Garden', 'Balcony',
  'Elevator', 'Backup Power', 'Water Supply', 'Cable TV'
];

export default function RequestPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [moveInDate, setMoveInDate] = useState<Date>();

  // Form state
  const [formData, setFormData] = useState({
    propertyTypes: [] as string[],
    purpose: 'rent',
    location: {
      cities: [] as string[],
      districts: [] as string[],
      flexible: false
    },
    budget: {
      min: '',
      max: '',
      currency: 'LKR',
      frequency: 'monthly'
    },
    requirements: {
      bedrooms: { min: '', max: '' },
      bathrooms: { min: '', max: '' },
      areaSqft: { min: '', max: '' }
    },
    amenities: [] as string[],
    durationMonths: '',
    occupants: '',
    hasPets: false,
    petDetails: '',
    additionalNotes: '',
    contactPreferences: {
      email: true,
      sms: false,
      whatsapp: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePropertyTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }));
  };

  const handleCityToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        cities: prev.location.cities.includes(city)
          ? prev.location.cities.filter(c => c !== city)
          : [...prev.location.cities, city]
      }
    }));
  };

  const handleDistrictToggle = (district: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        districts: prev.location.districts.includes(district)
          ? prev.location.districts.filter(d => d !== district)
          : [...prev.location.districts, district]
      }
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Budget validation
    const minBudget = parseFloat(formData.budget.min);
    const maxBudget = parseFloat(formData.budget.max);
    
    if (!formData.budget.min || isNaN(minBudget) || minBudget <= 0) {
      newErrors.budgetMin = 'Minimum budget must be greater than 0';
    }
    if (!formData.budget.max || isNaN(maxBudget) || maxBudget <= 0) {
      newErrors.budgetMax = 'Maximum budget must be greater than 0';
    }
    if (!isNaN(minBudget) && !isNaN(maxBudget) && minBudget > maxBudget) {
      newErrors.budget = 'Minimum budget cannot exceed maximum budget';
    }

    // Purpose validation
    if (!formData.purpose) {
      newErrors.purpose = 'Purpose is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        budget: {
          ...formData.budget,
          min: parseFloat(formData.budget.min),
          max: parseFloat(formData.budget.max)
        },
        requirements: {
          bedrooms: {
            min: formData.requirements.bedrooms.min ? parseInt(formData.requirements.bedrooms.min) : undefined,
            max: formData.requirements.bedrooms.max ? parseInt(formData.requirements.bedrooms.max) : undefined
          },
          bathrooms: {
            min: formData.requirements.bathrooms.min ? parseInt(formData.requirements.bathrooms.min) : undefined,
            max: formData.requirements.bathrooms.max ? parseInt(formData.requirements.bathrooms.max) : undefined
          },
          areaSqft: {
            min: formData.requirements.areaSqft.min ? parseFloat(formData.requirements.areaSqft.min) : undefined,
            max: formData.requirements.areaSqft.max ? parseFloat(formData.requirements.areaSqft.max) : undefined
          }
        },
        moveInDate: moveInDate?.toISOString(),
        durationMonths: formData.durationMonths ? parseInt(formData.durationMonths) : undefined,
        occupants: formData.occupants ? parseInt(formData.occupants) : undefined
      };

      const response = await fetch('/api/rental-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create rental request');
      }

      toast.success(
        `Rental request created! ${data.matchedCount || 0} matching properties found.`,
        {
          description: 'You can view your request in your dashboard'
        }
      );

      // Redirect to user dashboard
      router.push('/user/dashboard');
    } catch (error: any) {
      console.error('Error creating rental request:', error);
      toast.error(error.message || 'Failed to create rental request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Request a Property</h1>
          <p className="text-lg text-gray-600">
            Tell us what you're looking for and we'll match you with the perfect properties
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Property Preferences
              </CardTitle>
              <CardDescription>What type of property are you looking for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Property Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {PROPERTY_TYPES.map((type) => (
                    <div
                      key={type}
                      onClick={() => handlePropertyTypeToggle(type)}
                      className={`
                        cursor-pointer p-3 border rounded-lg text-center transition-all
                        ${formData.propertyTypes.includes(type)
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-teal-300'
                        }
                      `}
                    >
                      <span className="font-medium capitalize">{type}</span>
                      {formData.propertyTypes.includes(type) && (
                        <Check className="w-4 h-4 inline ml-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Purpose</Label>
                <RadioGroup
                  value={formData.purpose}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rent" id="rent" />
                    <Label htmlFor="rent" className="cursor-pointer">Long-term Rent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="booking" id="booking" />
                    <Label htmlFor="booking" className="cursor-pointer">Short-term Booking</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
              <CardDescription>Where would you like to live?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flexible"
                  checked={formData.location.flexible}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, flexible: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="flexible" className="cursor-pointer">
                  I'm flexible with location
                </Label>
              </div>

              {!formData.location.flexible && (
                <>
                  <div>
                    <Label>Preferred Cities</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SRI_LANKA_CITIES.map((city) => (
                        <Badge
                          key={city}
                          variant={formData.location.cities.includes(city) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleCityToggle(city)}
                        >
                          {city}
                          {formData.location.cities.includes(city) && <Check className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Districts</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SRI_LANKA_DISTRICTS.slice(0, 12).map((district) => (
                        <Badge
                          key={district}
                          variant={formData.location.districts.includes(district) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => handleDistrictToggle(district)}
                        >
                          {district}
                          {formData.location.districts.includes(district) && <Check className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget
              </CardTitle>
              <CardDescription>What's your budget range?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Minimum Budget *</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    min="0"
                    value={formData.budget.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      budget: { ...prev.budget, min: e.target.value }
                    }))}
                    placeholder="e.g., 50000"
                    className={errors.budgetMin ? 'border-red-500' : ''}
                  />
                  {errors.budgetMin && <p className="text-xs text-red-500 mt-1">{errors.budgetMin}</p>}
                </div>

                <div>
                  <Label htmlFor="budgetMax">Maximum Budget *</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    min="0"
                    value={formData.budget.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      budget: { ...prev.budget, max: e.target.value }
                    }))}
                    placeholder="e.g., 100000"
                    className={errors.budgetMax ? 'border-red-500' : ''}
                  />
                  {errors.budgetMax && <p className="text-xs text-red-500 mt-1">{errors.budgetMax}</p>}
                </div>
              </div>

              {errors.budget && <p className="text-xs text-red-500">{errors.budget}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.budget.currency}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      budget: { ...prev.budget, currency: value }
                    }))}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LKR">LKR (Sri Lankan Rupee)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.budget.frequency}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      budget: { ...prev.budget, frequency: value }
                    }))}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Requirements
              </CardTitle>
              <CardDescription>Specify your space requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bedrooms</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.requirements.bedrooms.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        bedrooms: { ...prev.requirements.bedrooms, min: e.target.value }
                      }
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.requirements.bedrooms.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        bedrooms: { ...prev.requirements.bedrooms, max: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Bathrooms</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.requirements.bathrooms.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        bathrooms: { ...prev.requirements.bathrooms, min: e.target.value }
                      }
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.requirements.bathrooms.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        bathrooms: { ...prev.requirements.bathrooms, max: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Area (sqft)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={formData.requirements.areaSqft.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        areaSqft: { ...prev.requirements.areaSqft, min: e.target.value }
                      }
                    }))}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={formData.requirements.areaSqft.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: {
                        ...prev.requirements,
                        areaSqft: { ...prev.requirements.areaSqft, max: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>Select amenities you'd like to have</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="cursor-pointer text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline & Details</CardTitle>
              <CardDescription>Additional information about your request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Move-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {moveInDate ? format(moveInDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={moveInDate}
                        onSelect={setMoveInDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (months)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationMonths: e.target.value }))}
                    placeholder="e.g., 12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="occupants">Number of Occupants</Label>
                <Input
                  id="occupants"
                  type="number"
                  min="1"
                  value={formData.occupants}
                  onChange={(e) => setFormData(prev => ({ ...prev, occupants: e.target.value }))}
                  placeholder="e.g., 2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPets"
                    checked={formData.hasPets}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, hasPets: checked as boolean }))
                    }
                  />
                  <Label htmlFor="hasPets" className="cursor-pointer">
                    I have pets
                  </Label>
                </div>

                {formData.hasPets && (
                  <Textarea
                    placeholder="Please describe your pets (type, breed, size, etc.)"
                    value={formData.petDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, petDetails: e.target.value }))}
                    rows={2}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any other requirements or preferences..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Preferences</CardTitle>
              <CardDescription>How would you like to be contacted about matches?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="email"
                    checked={formData.contactPreferences.email}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        contactPreferences: { ...prev.contactPreferences, email: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="email" className="cursor-pointer flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sms"
                    checked={formData.contactPreferences.sms}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        contactPreferences: { ...prev.contactPreferences, sms: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="sms" className="cursor-pointer flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsapp"
                    checked={formData.contactPreferences.whatsapp}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({
                        ...prev,
                        contactPreferences: { ...prev.contactPreferences, whatsapp: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="whatsapp" className="cursor-pointer flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    WhatsApp
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              size="lg"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Request...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
