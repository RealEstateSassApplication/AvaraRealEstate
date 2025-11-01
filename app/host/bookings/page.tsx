'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Users, DollarSign, Clock, MapPin, Mail, Phone } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: {
      city: string;
    };
  };
  guest: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  currency: string;
  numberOfGuests: number;
  status: string;
  specialRequests?: string;
  createdAt: Date;
}

interface BookingStats {
  totalBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const initiate = async () => {
      await fetchBookings();
    };
    initiate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/host/bookings?includeStats=true', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);

      if (data.stats) {
        setStats(data.stats);
      } else {
        calculateStats(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingList: Booking[]) => {
    const now = new Date();
    const activeBookings = bookingList.filter(b => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      return checkIn <= now && checkOut >= now;
    }).length;

    const upcomingBookings = bookingList.filter(b => {
      const checkIn = new Date(b.checkInDate);
      return checkIn > now;
    }).length;

    const totalRevenue = bookingList.reduce((sum, b) => sum + b.totalPrice, 0);

    setStats({
      totalBookings: bookingList.length,
      activeBookings,
      upcomingBookings,
      totalRevenue,
      occupancyRate: Math.round((activeBookings / Math.max(bookingList.length, 1)) * 100),
    });
  };

  const applyFilters = () => {
    let filtered = bookings;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.property.title.toLowerCase().includes(term) ||
        b.guest.name.toLowerCase().includes(term) ||
        b.guest.email.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const calculateDays = (checkIn: Date, checkOut: Date) => {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / msPerDay);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg" />
            <div className="h-96 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-2">Manage all your short-term property bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Now</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeBookings}</p>
                </div>
                <Clock className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingBookings}</p>
                </div>
                <Calendar className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalRevenue > 999999 ? (stats.totalRevenue / 1000000).toFixed(1) + 'M' : (stats.totalRevenue / 1000).toFixed(0) + 'K'}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.occupancyRate}%</p>
                </div>
                <Users className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by property, guest name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm">
          <TabsList className="border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{booking.property.title}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {booking.property.address.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{booking.guest.name}</p>
                            <p className="text-sm text-gray-500">{booking.guest.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(booking.checkInDate)}</TableCell>
                        <TableCell>{formatDate(booking.checkOutDate)}</TableCell>
                        <TableCell>{calculateDays(booking.checkInDate, booking.checkOutDate)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(booking.totalPrice, booking.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link href={`/host/bookings/${booking._id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Other tabs with filtered content */}
          {['active', 'upcoming', 'past'].map((tab) => (
            <TabsContent key={tab} value={tab} className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings
                      .filter(b => {
                        const now = new Date();
                        const checkIn = new Date(b.checkInDate);
                        const checkOut = new Date(b.checkOutDate);
                        if (tab === 'active') return checkIn <= now && checkOut >= now;
                        if (tab === 'upcoming') return checkIn > now;
                        if (tab === 'past') return checkOut < now;
                        return false;
                      })
                      .map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <p className="font-semibold">{booking.property.title}</p>
                          </TableCell>
                          <TableCell>{booking.guest.name}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(booking.totalPrice, booking.currency)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link href={`/host/bookings/${booking._id}`}>Details</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {filteredBookings.filter(b => {
                const now = new Date();
                const checkIn = new Date(b.checkInDate);
                const checkOut = new Date(b.checkOutDate);
                if (tab === 'active') return checkIn <= now && checkOut >= now;
                if (tab === 'upcoming') return checkIn > now;
                if (tab === 'past') return checkOut < now;
                return false;
              }).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No {tab} bookings</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
