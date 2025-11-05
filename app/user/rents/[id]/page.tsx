'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Home, 
  Calendar, 
  DollarSign, 
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  date: Date;
  status: string;
  method: string;
}

interface Rent {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: {
      street: string;
      city: string;
      district: string;
      postalCode: string;
    };
    images: string[];
  };
  host: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  amount: number;
  currency: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  nextDue: Date;
  status: string;
  paymentHistory: Payment[];
}

export default function RentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rentId = params?.id as string;

  const [rent, setRent] = useState<Rent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRentDetails = async () => {
    if (!rentId) return;
    try {
      const response = await fetch(`/api/user/rents/${rentId}`);
      if (!response.ok) throw new Error('Failed to fetch rent details');
      
      const data = await response.json();
      setRent(data.rent);
    } catch (error) {
      console.error('Error fetching rent details:', error);
      toast.error('Failed to load rent details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentId]);

  const handlePayment = async () => {
    toast.info('Redirecting to payment gateway...');
    // Implement payment logic here
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!rent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rent not found</h2>
          <Button onClick={() => router.push('/user/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Agreement</h1>
            <p className="text-gray-600 mt-1">View and manage your rental details</p>
          </div>
          <Badge variant={getStatusColor(rent.status)} className="text-lg px-4 py-2">
            {rent.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{rent.property.title}</h3>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div>
                      <p>{rent.property.address.street}</p>
                      <p>{rent.property.address.city}, {rent.property.address.district}</p>
                      <p>{rent.property.address.postalCode}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/listings/${rent.property._id}`}>View Property</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Rental Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Rental Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {rent.currency} {rent.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Payment Frequency</p>
                    <p className="text-lg font-semibold capitalize">{rent.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <p className="font-medium">{new Date(rent.startDate).toLocaleDateString()}</p>
                  </div>
                  {rent.endDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">End Date</p>
                      <p className="font-medium">{new Date(rent.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Next Payment Due</p>
                    <p className="font-medium text-orange-600">
                      {new Date(rent.nextDue).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment History
                </CardTitle>
                <CardDescription>Your rent payment records</CardDescription>
              </CardHeader>
              <CardContent>
                {!rent.paymentHistory || rent.paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payment history yet</p>
                ) : (
                  <div className="space-y-3">
                    {rent.paymentHistory.map((payment) => (
                      <div key={payment._id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {payment.currency} {payment.amount.toLocaleString()}
                            </p>
                            <Badge variant={getPaymentStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.date).toLocaleDateString()} • {payment.method}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" size="lg" onClick={handlePayment}>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View Agreement
                </Button>
              </CardContent>
            </Card>

            {/* Host Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Landlord Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-lg">
                    {rent.host.firstName} {rent.host.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${rent.host.email}`} className="hover:text-blue-600">
                    {rent.host.email}
                  </a>
                </div>
                {rent.host.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${rent.host.phoneNumber}`} className="hover:text-blue-600">
                      {rent.host.phoneNumber}
                    </a>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-3">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Landlord
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-semibold">
                    {rent.currency}{' '}
                    {rent.paymentHistory
                      ?.filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payments Made</span>
                  <span className="font-semibold">
                    {rent.paymentHistory?.filter(p => p.status === 'completed').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">
                    {formatDistanceToNow(new Date(rent.startDate))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
