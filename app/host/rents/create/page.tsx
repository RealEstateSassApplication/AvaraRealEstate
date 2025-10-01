'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon } from 'lucide-react';

export default function CreateRentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    amount: '',
    currency: 'LKR',
    frequency: 'monthly',
    firstDueDate: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, create or find the tenant user
      const tenantResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.tenantName,
          email: formData.tenantEmail,
          phone: formData.tenantPhone,
          role: 'tenant',
          skipPassword: true
        })
      });

      const tenant = await tenantResponse.json();
      const tenantId = tenant.user?._id || tenant._id;

      // Create the rent agreement
      const rentResponse = await fetch('/api/rents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          tenantId: tenantId,
          amount: Number(formData.amount),
          currency: formData.currency,
          frequency: formData.frequency,
          firstDueDate: formData.firstDueDate,
          notes: formData.notes
        })
      });

      if (rentResponse.ok) {
        router.push('/host/dashboard?tab=rents');
      } else {
        const error = await rentResponse.json();
        alert(`Error: ${error.error || 'Failed to create rent'}`);
      }
    } catch (error) {
      console.error('Error creating rent:', error);
      alert('Failed to create rent agreement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Rent Agreement</h1>
          <p className="text-gray-600 mt-2">Set up a new rental agreement for your property</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rent Agreement Details</CardTitle>
            <CardDescription>
              Fill in the details to create a new rent agreement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label htmlFor="property">Property *</Label>
                <Select 
                  value={formData.propertyId} 
                  onValueChange={(value) => setFormData({...formData, propertyId: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prop1">Modern Apartment - Colombo 03</SelectItem>
                    <SelectItem value="prop2">Villa - Kandy</SelectItem>
                    <SelectItem value="prop3">House - Mount Lavinia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tenant Information */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">Tenant Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenantName">Full Name *</Label>
                    <Input
                      id="tenantName"
                      type="text"
                      placeholder="Tenant's full name"
                      value={formData.tenantName}
                      onChange={(e) => setFormData({...formData, tenantName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenantEmail">Email Address *</Label>
                    <Input
                      id="tenantEmail"
                      type="email"
                      placeholder="tenant@example.com"
                      value={formData.tenantEmail}
                      onChange={(e) => setFormData({...formData, tenantEmail: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tenantPhone">Phone Number *</Label>
                  <Input
                    id="tenantPhone"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({...formData, tenantPhone: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Rent Details */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold">Rent Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Rent Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="85000"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => setFormData({...formData, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LKR">LKR (Sri Lankan Rupees)</SelectItem>
                        <SelectItem value="USD">USD (US Dollars)</SelectItem>
                        <SelectItem value="EUR">EUR (Euros)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Payment Frequency *</Label>
                    <Select 
                      value={formData.frequency} 
                      onValueChange={(value) => setFormData({...formData, frequency: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstDueDate">First Due Date *</Label>
                    <Input
                      id="firstDueDate"
                      type="date"
                      value={formData.firstDueDate}
                      onChange={(e) => setFormData({...formData, firstDueDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional terms, conditions, or notes about the rental agreement..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {loading ? 'Creating...' : 'Create Rent Agreement'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}