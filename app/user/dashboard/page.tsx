'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TenantCreateRequestModal from '@/components/maintenance/TenantCreateRequestModal';
import RentDetailsModal from '@/components/rent/RentDetailsModal';
import RentalRequestCard from '@/components/rental-request/RentalRequestCard';
import RentalRequestModal from '@/components/rental-request/RentalRequestModal';
import { 
  Calendar, 
  CheckSquare, 
  DollarSign, 
  Clock, 
  Home, 
  Star, 
  AlertCircle,
  FileText,
  Wrench,
  BellRing,
  TrendingUp,
  MapPin,
  CreditCard,
  MessageSquare,
  Eye,
  Download,
  Send,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Booking {
  _id: string;
  property: {
    _id: string;
    title: string;
    images: string[];
    address: { city: string; district: string };
  };
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
  totalPrice: number;
  currency: string;
}

interface RentalAgreement {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: { city: string };
  };
  amount: number;
  currency: string;
  frequency: string;
  nextDue: Date;
  status: string;
  startDate: Date;
  endDate?: Date;
}

interface Application {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: { city: string };
  };
  status: string;
  createdAt: Date;
  moveInDate?: Date;
}

interface MaintenanceRequest {
  _id: string;
  property: {
    _id: string;
    title: string;
  };
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
}

interface RentalRequest {
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
    bathrooms?: { min?: number; max?: number };
    areaSqft?: { min?: number; max?: number };
  };
  amenities: string[];
  moveInDate?: string;
  durationMonths?: number;
  occupants?: number;
  hasPets: boolean;
  petDetails?: string;
  additionalNotes?: string;
  status: string;
  matchedProperties: any[];
  contactPreferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  createdAt: string;
}

export default function UserDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentals, setRentals] = useState<RentalAgreement[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedRent, setSelectedRent] = useState<RentalAgreement | null>(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedRentalRequest, setSelectedRentalRequest] = useState<RentalRequest | null>(null);
  const [showRentalRequestModal, setShowRentalRequestModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, rentalsRes, applicationsRes, maintenanceRes, favoritesRes, rentalRequestsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/user/rents'),
        fetch('/api/applications'),
        fetch('/api/maintenance'),
        fetch('/api/favorites'),
        fetch('/api/rental-requests')
      ]);
      
      if (bookingsRes.ok) {
        const bookingsJson = await bookingsRes.json();
        setBookings(bookingsJson.data || bookingsJson.bookings || []);
      }

      if (rentalsRes.ok) {
        const rentalsJson = await rentalsRes.json();
        setRentals(rentalsJson.data || rentalsJson.rents || []);
      }

      if (applicationsRes.ok) {
        const applicationsJson = await applicationsRes.json();
        setApplications(applicationsJson.data || applicationsJson.applications || []);
      }

      if (maintenanceRes.ok) {
        const maintenanceJson = await maintenanceRes.json();
        setMaintenanceRequests(maintenanceJson.data || maintenanceJson.requests || []);
      }
      
      if (favoritesRes.ok) {
        const favoritesJson = await favoritesRes.json();
        setFavorites(favoritesJson.data || favoritesJson.favorites || []);
      }

      if (rentalRequestsRes.ok) {
        const rentalRequestsJson = await rentalRequestsRes.json();
        setRentalRequests(rentalRequestsJson.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'active':
      case 'approved':
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      case 'in_progress':
      case 'scheduled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.checkInDate) > new Date() && b.status === 'confirmed');
  const activeRentals = rentals.filter(r => r.status === 'active');
  const pendingApplications = applications.filter(a => a.status === 'pending');
  const openMaintenanceRequests = maintenanceRequests.filter(m => m.status !== 'completed');
  const activeRentalRequests = rentalRequests.filter(r => r.status === 'active' || r.status === 'matched');

  const handleViewRentalRequest = (id: string) => {
    const request = rentalRequests.find(r => r._id === id);
    if (request) {
      setSelectedRentalRequest(request);
      setShowRentalRequestModal(true);
    }
  };

  const handleCancelRentalRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this rental request?')) return;

    try {
      const response = await fetch(`/api/rental-requests/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel rental request');
      }

      toast.success('Rental request cancelled successfully');
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling rental request:', error);
      toast.error('Failed to cancel rental request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your rentals, bookings, and applications</p>
          </div>
          <Button asChild>
            <Link href="/listings">Browse Properties</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRentals.length}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-3 rounded-lg">
                  <Home className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-3 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingApplications.length}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-3 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{openMaintenanceRequests.length}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-3 rounded-lg">
                  <Wrench className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rental Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRentalRequests.length}</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white p-3 rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rentals">My Rentals</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Rentals Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Active Rentals
                  </CardTitle>
                  <CardDescription>Your current rental agreements</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeRentals.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No active rentals</p>
                  ) : (
                    <div className="space-y-3">
                      {activeRentals.slice(0, 3).map((rental) => (
                        <div key={rental._id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{rental.property.title}</h4>
                              <p className="text-sm text-gray-500">{rental.property.address.city}</p>
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                {rental.currency} {rental.amount.toLocaleString()}/{rental.frequency}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Next due: {new Date(rental.nextDue).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRent(rental);
                                setShowRentModal(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                      {activeRentals.length > 3 && (
                        <Button variant="ghost" className="w-full" onClick={() => setActiveTab('rentals')}>
                          View All Rentals
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Bookings Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Bookings
                  </CardTitle>
                  <CardDescription>Your confirmed bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No upcoming bookings</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.slice(0, 3).map((booking) => (
                        <div key={booking._id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{booking.property.title}</h4>
                              <p className="text-sm text-gray-500">{booking.property.address.city}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/bookings/${booking._id}`}>Details</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      {upcomingBookings.length > 3 && (
                        <Button variant="ghost" className="w-full" onClick={() => setActiveTab('bookings')}>
                          View All Bookings
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Status of your rental applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No applications</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app) => (
                        <div key={app._id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{app.property.title}</h4>
                              <p className="text-sm text-gray-500">{app.property.address.city}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getStatusColor(app.status)}>
                                  {app.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {applications.length > 3 && (
                        <Button variant="ghost" className="w-full" onClick={() => setActiveTab('applications')}>
                          View All Applications
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Maintenance Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Maintenance Requests
                  </CardTitle>
                  <CardDescription>Active maintenance requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {openMaintenanceRequests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No open requests</p>
                  ) : (
                    <div className="space-y-3">
                      {openMaintenanceRequests.slice(0, 3).map((request) => (
                        <div key={request._id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{request.title}</h4>
                              <p className="text-sm text-gray-500">{request.property.title}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={getPriorityColor(request.priority)}>
                                  {request.priority}
                                </Badge>
                                <Badge variant={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {openMaintenanceRequests.length > 3 && (
                        <Button variant="ghost" className="w-full" onClick={() => setActiveTab('maintenance')}>
                          View All Requests
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Rental Agreements</CardTitle>
                    <CardDescription>Manage your active and past rentals</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/listings?type=rent">Find Rentals</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rentals.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No rental agreements yet</p>
                    <Button asChild>
                      <Link href="/listings?type=rent">Browse Rentals</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentals.map((rental) => (
                        <TableRow key={rental._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rental.property.title}</div>
                              <div className="text-sm text-gray-500">{rental.property.address.city}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {rental.currency} {rental.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{rental.frequency}</TableCell>
                          <TableCell>{new Date(rental.nextDue).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(rental.status)}>
                              {rental.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRent(rental);
                                  setShowRentModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {rental.status === 'active' && (
                                <Button size="sm">
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  Pay
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

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>Your booking history and upcoming bookings</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/listings?purpose=booking">Book a Property</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No bookings yet</p>
                    <Button asChild>
                      <Link href="/listings?purpose=booking">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.property.title}</div>
                              <div className="text-sm text-gray-500">
                                {booking.property.address.city}, {booking.property.address.district}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(booking.checkInDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(booking.checkOutDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">
                            {booking.currency} {booking.totalPrice.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/bookings/${booking._id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                Details
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track your rental applications</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No applications submitted</p>
                    <Button asChild>
                      <Link href="/listings?type=rent">Apply for Rentals</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div key={app._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{app.property.title}</h3>
                            <p className="text-sm text-gray-500">{app.property.address.city}</p>
                          </div>
                          <Badge variant={getStatusColor(app.status)} className="text-sm">
                            {app.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Applied</p>
                            <p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          {app.moveInDate && (
                            <div>
                              <p className="text-gray-500">Move-in Date</p>
                              <p className="font-medium">{new Date(app.moveInDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/applications/${app._id}`}>View Details</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/listings/${app.property._id}`}>View Property</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Maintenance Requests</CardTitle>
                    <CardDescription>Submit and track maintenance issues</CardDescription>
                  </div>
                  <Button onClick={() => setShowMaintenanceModal(true)}>
                    <Send className="w-4 h-4 mr-2" />
                    New Request
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No maintenance requests</p>
                    <Button onClick={() => setShowMaintenanceModal(true)}>Submit a Request</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maintenanceRequests.map((request) => (
                      <div key={request._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{request.title}</h3>
                            <p className="text-sm text-gray-500">{request.property.title}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </span>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rental Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Rental Requests</CardTitle>
                    <CardDescription>Properties you're looking for</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/request-property">
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rentalRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No rental requests yet</p>
                    <p className="text-sm text-gray-400 mb-6">
                      Create a rental request to find properties that match your criteria
                    </p>
                    <Button asChild>
                      <Link href="/request-property">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Request
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rentalRequests.map((request) => (
                      <RentalRequestCard
                        key={request._id}
                        request={request}
                        onView={handleViewRentalRequest}
                        onCancel={handleCancelRentalRequest}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Saved Properties</CardTitle>
                <CardDescription>Properties you&apos;ve saved for later</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No saved properties</p>
                    <Button asChild>
                      <Link href="/listings">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((property) => (
                      <Card key={property._id} className="overflow-hidden">
                        <div className="relative h-48">
                          <Image
                            src={property.images?.[0] || '/images/property-placeholder.jpg'}
                            alt={property.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1">{property.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {property.address?.city}, {property.address?.district}
                          </p>
                          <p className="text-lg font-bold text-blue-600 mb-3">
                            {property.currency} {property.price?.toLocaleString()}
                            {property.type === 'rent' && `/${property.rentFrequency}`}
                          </p>
                          <Button asChild className="w-full">
                            <Link href={`/listings/${property._id}`}>View Property</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Maintenance Request Modal */}
        <TenantCreateRequestModal
          open={showMaintenanceModal}
          onOpenChange={setShowMaintenanceModal}
          onSuccess={fetchDashboardData}
        />

        {/* Rent Details Modal */}
        {selectedRent && (
          <RentDetailsModal
            rent={selectedRent}
            open={showRentModal}
            onClose={() => {
              setShowRentModal(false);
              setSelectedRent(null);
            }}
            showActions={false}
            userType="tenant"
          />
        )}

        {/* Rental Request Modal */}
        <RentalRequestModal
          request={selectedRentalRequest}
          isOpen={showRentalRequestModal}
          onClose={() => {
            setShowRentalRequestModal(false);
            setSelectedRentalRequest(null);
          }}
          onCancel={handleCancelRentalRequest}
        />
      </div>
    </div>
  );
}
