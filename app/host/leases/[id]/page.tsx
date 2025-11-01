'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  MapPin,
  Download,
  Edit2,
  Pause,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface LeaseDetail {
  _id: string;
  property: {
    _id: string;
    title: string;
    type: string;
    address: {
      street?: string;
      city: string;
      district?: string;
    };
    images: string[];
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    verified?: boolean;
  };
  amount: number;
  currency: string;
  frequency: string;
  startDate?: Date;
  endDate?: Date;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  status: string;
  nextDue: Date;
  lastPaidDate?: Date;
  lastPaidAmount?: number;
  securityDeposit?: number;
  notes?: string;
  createdAt: Date;
}

interface PaymentRecord {
  _id: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod?: string;
  providerTransactionId?: string;
  status: string;
  notes?: string;
}

export default function LeaseDetailPage({ params }: { params: { id: string } }) {
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLeaseDetails();
  }, [params.id]);

  const fetchLeaseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/rents/${params.id}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lease details');
      }

      const data = await response.json();
      setLease(data.rent || data.data);

      // Fetch payment history
      const paymentsResponse = await fetch(`/api/host/rents/${params.id}/payments`, {
        cache: 'no-store',
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error('Error fetching lease details:', error);
      toast.error('Failed to load lease details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/host/rents/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lease status');
      }

      toast.success(`Lease ${newStatus} successfully`);
      fetchLeaseDetails();
    } catch (error) {
      console.error('Error updating lease:', error);
      toast.error('Failed to update lease status');
    }
  };

  const downloadLeaseAgreement = () => {
    // TODO: Implement PDF generation
    toast.info('Lease agreement download coming soon');
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="h-96 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Lease not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/host/leases">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leases
            </Link>
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{lease.property.title}</h1>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {lease.property.address.city}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={lease.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {lease.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-8">
          <Button variant="outline" onClick={downloadLeaseAgreement}>
            <Download className="w-4 h-4 mr-2" />
            Download Agreement
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/host/leases/${params.id}/edit`}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Lease
            </Link>
          </Button>
          {lease.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-yellow-600">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pause Lease?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will temporarily pause rent collection for this lease. The tenant will be notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange('paused')}>
                    Pause
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {lease.status !== 'cancelled' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600">
                  <X className="w-4 h-4 mr-2" />
                  Terminate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminate Lease?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel the lease agreement. This action cannot be undone. The tenant will be notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange('cancelled')}>
                    Terminate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm">
          <TabsList className="border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenant">Tenant Info</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lease Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Lease Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Rent Amount</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(lease.amount, lease.currency)}
                    </p>
                    <p className="text-sm text-gray-500">per {lease.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Frequency</p>
                    <p className="text-lg font-semibold capitalize">{lease.frequency}</p>
                  </div>
                  {lease.securityDeposit && (
                    <div>
                      <p className="text-sm text-gray-600">Security Deposit</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(lease.securityDeposit, lease.currency)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Property Type</p>
                    <p className="text-lg font-semibold capitalize">{lease.property.type}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Lease Duration */}
              <Card>
                <CardHeader>
                  <CardTitle>Lease Duration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lease.leaseStartDate && (
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="text-lg font-semibold">{formatDate(lease.leaseStartDate)}</p>
                    </div>
                  )}
                  {lease.leaseEndDate && (
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="text-lg font-semibold">{formatDate(lease.leaseEndDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-lg font-semibold">{formatDate(lease.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Next Due</p>
                    <p className="text-lg font-semibold">{formatDate(lease.nextDue)}</p>
                  </div>
                  {lease.lastPaidDate && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Last Paid</p>
                        <p className="text-lg font-semibold">{formatDate(lease.lastPaidDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Amount</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(lease.lastPaidAmount || 0, lease.currency)}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {lease.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{lease.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tenant Info Tab */}
          <TabsContent value="tenant" className="p-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-2xl font-bold">{lease.tenant.name}</p>
                    </div>
                    {lease.tenant.verified && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </p>
                      <p className="text-lg font-semibold">{lease.tenant.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </p>
                      <p className="text-lg font-semibold">{lease.tenant.phone}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Message to Tenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Complete record of all rent payments</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment._id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                            <TableCell>{payment.paymentMethod || '-'}</TableCell>
                            <TableCell>
                              <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{payment.providerTransactionId || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Lease agreement and related documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Lease Agreement</p>
                      <p className="text-sm text-gray-500">PDF • Generated on {formatDate(lease.createdAt)}</p>
                    </div>
                    <Button size="sm" onClick={downloadLeaseAgreement}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
