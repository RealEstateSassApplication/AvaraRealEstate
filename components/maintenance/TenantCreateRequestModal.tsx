'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';

interface Property {
  _id: string;
  title: string;
  address: {
    city: string;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function TenantCreateRequestModal({ open, onOpenChange, onSuccess }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);

  useEffect(() => {
    if (open) {
      fetchRentedProperties();
    }
  }, [open]);

  const fetchRentedProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await fetch('/api/user/rents?status=active');
      if (!response.ok) throw new Error('Failed to fetch properties');
      
      const data = await response.json();
      const rentedProperties = data.rents?.map((rent: any) => rent.property) || [];
      setProperties(rentedProperties);
      
      if (rentedProperties.length === 1) {
        setSelectedProperty(rentedProperties[0]._id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load your rented properties');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProperty) {
      toast.error('Please select a property');
      return;
    }
    
    if (!title || !description) {
      toast.error('Please provide a title and description');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty,
          title,
          description,
          category,
          priority
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create maintenance request');
      }

      toast.success('Maintenance request submitted successfully');
      
      // Reset form
      setSelectedProperty('');
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting maintenance request:', error);
      toast.error(error.message || 'Failed to submit maintenance request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Submit Maintenance Request
          </DialogTitle>
          <DialogDescription>
            Report a maintenance issue for your rented property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Property *</Label>
            {loadingProperties ? (
              <div className="text-sm text-gray-500">Loading your properties...</div>
            ) : properties.length === 0 ? (
              <div className="text-sm text-gray-500">
                You don&apos;t have any active rentals. Only tenants with active rental agreements can submit maintenance requests.
              </div>
            ) : (
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property._id} value={property._id}>
                      {property.title} - {property.address.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Leaking faucet in kitchen"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting || properties.length === 0}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={submitting || properties.length === 0}
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="appliances">Appliances</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="pest_control">Pest Control</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || properties.length === 0 || !selectedProperty}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
