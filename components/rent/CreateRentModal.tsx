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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import PropertyServiceClient from '@/services/propertyServiceClient';
import RentServiceClient from '@/services/rentServiceClient';

interface CreateRentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefilledData?: {
    propertyId?: string;
    tenantName?: string;
    tenantEmail?: string;
    tenantPhone?: string;
    amount?: string | number;
    currency?: string;
    applicationId?: string;
  };
}

export default function CreateRentModal({
  open,
  onClose,
  onSuccess,
  prefilledData,
}: CreateRentModalProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    propertyId: prefilledData?.propertyId || '',
    tenantId: '',
    tenantName: prefilledData?.tenantName || '',
    tenantEmail: prefilledData?.tenantEmail || '',
    tenantPhone: prefilledData?.tenantPhone || '',
    amount: prefilledData?.amount || '',
    currency: 'LKR',
    frequency: 'monthly',
    firstDueDate: '',
    notes: '',
    applicationId: prefilledData?.applicationId || '',
  });

  useEffect(() => {
    if (open) {
      fetchProperties();
      // Update form with prefilled data when modal opens
      if (prefilledData) {
        setFormData(prev => ({
          ...prev,
          propertyId: prefilledData.propertyId || prev.propertyId,
          tenantName: prefilledData.tenantName || prev.tenantName,
          tenantEmail: prefilledData.tenantEmail || prev.tenantEmail,
          tenantPhone: prefilledData.tenantPhone || prev.tenantPhone,
          amount: prefilledData.amount ? String(prefilledData.amount) : prev.amount,
          currency: prefilledData.currency || prev.currency,
          applicationId: prefilledData.applicationId || prev.applicationId,
        }));
      } else {
        resetForm();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledData]);

  const fetchProperties = async () => {
    setLoadingProperties(true);
    try {
      const props = await PropertyServiceClient.listMyProperties();
      setProperties(props || []);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const resetForm = () => {
    setFormData({
      propertyId: prefilledData?.propertyId || '',
      tenantId: '',
      tenantName: prefilledData?.tenantName || '',
      tenantEmail: prefilledData?.tenantEmail || '',
      tenantPhone: prefilledData?.tenantPhone || '',
      amount: prefilledData?.amount || '',
      currency: 'LKR',
      frequency: 'monthly',
      firstDueDate: '',
      notes: '',
      applicationId: prefilledData?.applicationId || '',
    });
    setError(null);
    setSuccess(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create rent
      const tenantId = formData.tenantId;
      const rentPayload = {
        propertyId: formData.propertyId,
        tenantId,
        amount: Number(formData.amount),
        currency: formData.currency,
        frequency: formData.frequency,
        firstDueDate: formData.firstDueDate,
        notes: formData.notes,
        applicationId: formData.applicationId,
      };

      await RentServiceClient.create(rentPayload);

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create rent:', err);
      setError(err.message || 'Failed to create rent agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Rent Agreement</DialogTitle>
          <DialogDescription>
            Create a new rent agreement for your property and tenant
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Rent agreement created successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">
              Property <span className="text-red-500">*</span>
            </Label>
            {loadingProperties ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading properties...</span>
              </div>
            ) : (
              <Select
                value={formData.propertyId}
                onValueChange={(value) => handleChange('propertyId', value)}
              >
                <SelectTrigger id="property">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      No properties available
                    </div>
                  ) : (
                    properties.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title || property.address?.city || 'Untitled Property'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Tenant Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700">Tenant Information</h3>

            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID (Optional)</Label>
              <Input
                id="tenantId"
                placeholder="Enter tenant ID if known"
                value={formData.tenantId}
                onChange={(e) => handleChange('tenantId', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Leave empty to create a new tenant account
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input
                  id="tenantName"
                  placeholder="Full name"
                  value={formData.tenantName}
                  onChange={(e) => handleChange('tenantName', e.target.value)}
                  disabled={!!formData.tenantId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantEmail">Tenant Email</Label>
                <Input
                  id="tenantEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.tenantEmail}
                  onChange={(e) => handleChange('tenantEmail', e.target.value)}
                  disabled={!!formData.tenantId}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantPhone">Tenant Phone</Label>
              <Input
                id="tenantPhone"
                placeholder="0771234567"
                value={formData.tenantPhone}
                onChange={(e) => handleChange('tenantPhone', e.target.value)}
                disabled={!!formData.tenantId}
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-700">Payment Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Rent Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LKR">LKR - Sri Lankan Rupee</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">
                  Payment Frequency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleChange('frequency', value)}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstDueDate">
                  First Due Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstDueDate"
                  type="date"
                  value={formData.firstDueDate}
                  onChange={(e) => handleChange('firstDueDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or terms..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="border-gray-200 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingProperties}
              className="bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Agreement'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
