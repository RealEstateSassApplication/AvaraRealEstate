'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import RentServiceClient from '@/services/rentServiceClient';
import RentDetailsModal from '@/components/rent/RentDetailsModal';
import Header from '@/components/ui/layout/Header';
import { Eye, DollarSign, Calendar, AlertCircle, Loader2, Home } from 'lucide-react';
import { format } from 'date-fns';

export default function UserRentsPage() {
  const [rents, setRents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRent, setSelectedRent] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRents();
  }, []);

  const fetchRents = async () => {
    setLoading(true);
    try {
      const res = await RentServiceClient.listForUser();
      setRents(res || []);
    } catch (err) {
      console.error('Failed to fetch rents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await RentServiceClient.markPaid(id);
      await fetchRents();
    } catch (err) {
      console.error('Failed to mark as paid:', err);
      alert('Failed to mark rent as paid. Please try again.');
    }
  };

  const handleViewDetails = (rent: any) => {
    setSelectedRent(rent);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gray-900 text-white';
      case 'paused':
        return 'bg-gray-500 text-white';
      case 'cancelled':
        return 'bg-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (nextDue: string) => {
    return new Date(nextDue) < new Date();
  };

  const getDaysUntilDue = (nextDue: string) => {
    const days = Math.ceil(
      (new Date(nextDue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const stats = {
    total: rents.length,
    overdue: rents.filter((r) => isOverdue(r.nextDue)).length,
    totalAmount: rents
      .filter((r) => r.status === 'active')
      .reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rental Payments</h1>
          <p className="text-gray-600 mt-2">
            View and manage your rent payments
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Rents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-gray-100 text-gray-700 p-3 rounded-lg">
                  <Home className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
                <div className="bg-gray-200 text-gray-700 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Monthly</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-LK', {
                      style: 'currency',
                      currency: 'LKR',
                      minimumFractionDigits: 0,
                    }).format(stats.totalAmount)}
                  </p>
                </div>
                <div className="bg-gray-100 text-gray-700 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rents Table */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
                <span className="ml-3 text-gray-600">Loading rents...</span>
              </div>
            ) : rents.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Active Rents
                </h3>
                <p className="text-gray-600">
                  You don&apos;t have any active rental agreements at the moment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rents.map((rent) => {
                      const overdue = isOverdue(rent.nextDue);
                      const daysUntilDue = getDaysUntilDue(rent.nextDue);

                      return (
                        <TableRow key={rent._id}>
                          <TableCell>
                            <div className="font-medium">
                              {rent.property?.title || 'Unknown Property'}
                            </div>
                            {rent.property?.address && (
                              <div className="text-sm text-gray-600">
                                {rent.property.address.city}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {new Intl.NumberFormat('en-LK', {
                              style: 'currency',
                              currency: rent.currency || 'LKR',
                              minimumFractionDigits: 0,
                            }).format(rent.amount)}
                          </TableCell>
                          <TableCell className="capitalize">
                            {rent.frequency}
                          </TableCell>
                          <TableCell>
                            <div>
                              {format(new Date(rent.nextDue), 'MMM dd, yyyy')}
                            </div>
                            {overdue ? (
                              <div className="text-xs text-red-600 font-medium">
                                Overdue by {Math.abs(daysUntilDue)} days
                              </div>
                            ) : daysUntilDue <= 7 ? (
                              <div className="text-xs text-orange-600">
                                Due in {daysUntilDue} days
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Due in {daysUntilDue} days
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(rent.status)} capitalize`}>
                              {rent.status}
                            </Badge>
                            {overdue && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(rent)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rent Details Modal */}
      {selectedRent && (
        <RentDetailsModal
          rent={selectedRent}
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRent(null);
          }}
          onMarkPaid={handleMarkPaid}
          showActions={false}
          userType="tenant"
        />
      )}
    </div>
  );
}
