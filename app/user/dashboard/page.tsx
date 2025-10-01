'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckSquare, DollarSign, Clock, Home, Star, AlertCircle } from 'lucide-react';

export default function UserDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites'>('bookings');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, favoritesRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/favorites')
      ]);
      
      if (bookingsRes.ok) {
        const bookingsJson = await bookingsRes.json();
        setBookings(bookingsJson.data || bookingsJson.bookings || []);
      }
      
      if (favoritesRes.ok) {
        const favoritesJson = await favoritesRes.json();
        setFavorites(favoritesJson.data || favoritesJson.favorites || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.startDate) > new Date() && b.status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pastBookings = bookings.filter(b => new Date(b.endDate) < new Date());
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your bookings and manage your rentals</p>
          </div>
          <Button asChild>
            <Link href="/listings">Find Properties</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
                  {pendingBookings.length > 0 && (
                    <p className="text-sm text-orange-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Awaiting host response
                    </p>
                  )}
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{pastBookings.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-3 rounded-lg">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">LKR {totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Bookings and Favorites */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Rental History</CardTitle>
                <CardDescription>All your booking requests and confirmed rentals</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                    <p className="text-gray-600 mb-4">Start exploring and book your first property</p>
                    <Button asChild>
                      <Link href="/listings">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={booking.property?.images?.[0] || '/images/property-placeholder.jpg'}
                                alt={booking.property?.title || 'Property'}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium">{booking.property?.title || 'Unknown Property'}</p>
                                <p className="text-sm text-gray-600">
                                  {booking.property?.address?.city || 'Unknown'}, {booking.property?.address?.district || 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {new Date(booking.startDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                to {new Date(booking.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBookingStatusColor(booking.status)}>
                              {booking.status || 'pending'}
                            </Badge>
                            {booking.status === 'pending' && (
                              <p className="text-xs text-gray-500 mt-1">Awaiting host approval</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {booking.currency || 'LKR'} {(booking.totalAmount || 0).toLocaleString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {booking.property?._id && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/listings/${booking.property._id}`}>
                                    View Property
                                  </Link>
                                </Button>
                              )}
                              {booking.status === 'confirmed' && new Date(booking.startDate) > new Date() && (
                                <Button size="sm" variant="outline">
                                  Contact Host
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Properties</CardTitle>
                <CardDescription>Properties you've saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-600 mb-4">Save properties you like to view them later</p>
                    <Button asChild>
                      <Link href="/listings">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((property) => (
                      <div key={property._id} className="border rounded-lg overflow-hidden">
                        <img
                          src={property.images?.[0] || '/images/property-placeholder.jpg'}
                          alt={property.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold mb-2">{property.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {property.address?.city}, {property.address?.district}
                          </p>
                          <p className="font-bold text-lg mb-3">
                            {property.currency || 'LKR'} {property.price.toLocaleString()}
                            {property.rentFrequency && (
                              <span className="text-sm font-medium text-gray-600"> / {property.rentFrequency}</span>
                            )}
                          </p>
                          <Button asChild className="w-full">
                            <Link href={`/listings/${property._id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
