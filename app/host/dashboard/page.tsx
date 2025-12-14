'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  Home,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import ApplicationModal from '@/components/host/ApplicationModal';
import CreateMaintenanceModal from '@/components/host/CreateMaintenanceModal';
import NotificationPanel from '@/components/host/NotificationPanel';
import PropertyCard from '@/components/property/PropertyCard';
import RentDetailsModal from '@/components/rent/RentDetailsModal';
import CreateRentModal from '@/components/rent/CreateRentModal';
import { toast } from 'sonner';

// Minimal shape returned from API
interface HostPropertyApi {
  _id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  purpose?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  amenities?: string[];
  featured?: boolean;
  verified?: boolean;
  owner?: { name?: string; profilePhoto?: string; verified?: boolean };
  address?: { city?: string; district?: string };
  ratings?: { average?: number; count?: number };
  description?: string;
  rentFrequency?: string;
  status?: string;
}

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingRents: number;
  occupancyRate: number;
}

interface RentData {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: { city: string };
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  currency: string;
  frequency: string;
  nextDue: string;
  status: string;
}

interface BookingData {
  _id: string;
  property: {
    _id: string;
    title: string;
    images: string[];
  };
  user: {
    name: string;
    email: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  currency: string;
}
interface PropertyCardReady {
  _id: string;
  title: string;
  description: string;
  type: string;
  purpose: 'rent' | 'sale' | 'booking';
  price: number;
  currency: string;
  rentFrequency?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  images: string[];
  address: { city: string; district: string };
  amenities: string[];
  ratings: { average: number; count: number };
  featured: boolean;
  verified: boolean;
  owner: { name: string; profilePhoto?: string; verified: boolean };
}

export default function HostDashboard() {
  const [properties, setProperties] = useState<PropertyCardReady[]>([]);
  const [rawProperties, setRawProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingRents: 0,
    occupancyRate: 0
  });
  const [rents, setRents] = useState<RentData[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'bookings' | 'rents' | 'applications' | 'notifications'>('overview');
  const [selectedRent, setSelectedRent] = useState<RentData | null>(null);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showCreateRentModal, setShowCreateRentModal] = useState(false);
  const [rentPrefilledData, setRentPrefilledData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);



  // initial data load moved below after helper function declarations

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/host/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const fetchRents = useCallback(async (userId?: string) => {
    try {
      const hostId = userId || currentUserId;
      if (!hostId) return;
      const url = `/api/rents?type=host&hostId=${hostId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setRents(data.rents || data.data || []);
      }
    } catch (err) {
      console.error('Failed to load rents', err);
    }
  }, [currentUserId]);

  const fetchMaintenanceRequests = useCallback(async (userId?: string) => {
    try {
      const hostId = userId || currentUserId;
      if (!hostId) return;
      const res = await fetch(`/api/maintenance?type=host&hostId=${hostId}`);
      if (res.ok) {
        const json = await res.json();
        setMaintenanceRequests(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance requests', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    const fetchDashboardData = async (silent = false) => {
      if (!silent) setLoading(true);
      setRefreshing(true);
      try {
        // First, fetch current user
        let userId = '';
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const json = await res.json();
            userId = json.user?._id || json._id || '';
            setCurrentUserId(userId);
          }
        } catch (err) {
          console.error('Failed to fetch current user', err);
        }

        // Then fetch other data
        await Promise.all([
          fetchProperties(),
          fetchBookings(),
          fetchApplications(),
          userId ? fetchRents(userId) : Promise.resolve(),
          userId ? fetchMaintenanceRequests(userId) : Promise.resolve(),
          fetchStats()
        ]);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRents, fetchMaintenanceRequests]);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications?host=true');
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/host/properties');
      if (res.ok) {
        const json = await res.json();
        const raw = (json.data as HostPropertyApi[]) || [];
        setRawProperties(raw);
        const mapped: PropertyCardReady[] = raw.map(p => ({
          _id: p._id,
          title: p.title,
          description: p.description || p.title,
          type: (p.type as string) || 'apartment',
          purpose: (p.purpose === 'short-term' ? 'booking' : p.purpose as 'rent' | 'sale' | 'booking') || 'rent',
          price: p.price,
          currency: p.currency || 'LKR',
          rentFrequency: p.rentFrequency,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          areaSqft: p.areaSqft,
          images: p.images && p.images.length ? p.images : ['/images/property-placeholder.jpg'],
          address: { city: p.address?.city || 'Unknown', district: p.address?.district || 'Unknown' },
          amenities: p.amenities || [],
          ratings: { average: p.ratings?.average || 0, count: p.ratings?.count || 0 },
          featured: !!p.featured,
          verified: !!p.verified,
          owner: { name: p.owner?.name || 'You', profilePhoto: p.owner?.profilePhoto, verified: !!p.owner?.verified }
        }));
        setProperties(mapped);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || `Failed to load (status ${res.status})`);
      }
    } catch (err) {
      console.error('Failed to load host properties', err);
      setError('Network error while loading properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings?type=host');
      if (res.ok) {
        const json = await res.json();
        setBookings(json.bookings || json.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <p className={`text-sm flex items-center mt-1 ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {change}
              </p>
            )}
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white p-3 rounded-lg">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleDelete = async (id: string) => {
    const ok = confirm('Are you sure you want to delete this listing? This action cannot be undone.');
    if (!ok) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || 'Failed to delete listing');
        return;
      }
      setProperties((prev) => prev.filter((p) => p._id !== id));
      setRawProperties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete listing');
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: !current } : p)));
      setRawProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: !current } : p)));
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !current })
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: current } : p)));
        setRawProperties((prev) => prev.map((p) => (p._id === id ? { ...p, featured: current } : p)));
        alert(json.error || 'Failed to update listing');
      }
    } catch (err) {
      console.error('Toggle featured failed', err);
      alert('Failed to update listing');
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'decline' | 'cancel') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // Show success message
        toast.success(`Booking ${action}d successfully!`);
        fetchBookings(); // Refresh booking data
      } else {
        const error = await response.json();
        toast.error(`Failed to ${action} booking: ${error.error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
      toast.error(`Network error: Failed to ${action} booking`);
    }
  };

  const handleRentAction = async (rentId: string, action: 'mark_paid' | 'send_reminder') => {
    try {
      const response = await fetch(`/api/rents/${rentId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        const actionLabel = action === 'mark_paid' ? 'marked as paid' : 'reminder sent';
        toast.success(`Rent ${actionLabel} successfully!`);
        fetchRents(); // Refresh rent data
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} rent:`, error);
      toast.error(`Network error: Failed to ${action.replace('_', ' ')}`);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    const ok = confirm('Are you sure you want to delete this application? This action cannot be undone.');
    if (!ok) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'Failed to delete application');
        return;
      }
      // Remove from local state
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
      toast.success('Application deleted successfully!');
    } catch (err) {
      console.error('Delete application failed', err);
      toast.error('Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Property Owner Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your properties, tenants and rental income</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 hidden md:inline">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button asChild>
              <Link href="/host/listings/create">Add Property</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/host/settings">Settings</Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="rents">Rent Management</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Properties"
                value={stats.totalProperties}
                icon={Home}
                change="+2 this month"
                changeType="positive"
              />
              <StatCard
                title="Active Listings"
                value={stats.activeListings}
                icon={CheckCircle}
                change={`${Math.round((stats.activeListings / stats.totalProperties) * 100)}% of total`}
                changeType="positive"
              />
              <StatCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon={Users}
                change="+15% this month"
                changeType="positive"
              />
              <StatCard
                title="Revenue"
                value={`LKR ${stats.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                change="+8% this month"
                changeType="positive"
              />
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Approvals */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Approvals</CardTitle>
                      <CardDescription>Booking requests requiring your attention</CardDescription>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      {bookings.filter(b => b.status === 'pending').length} Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {bookings.filter(b => b.status === 'pending').slice(0, 3).map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between py-4 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <img
                          src={booking.property.images[0] || '/images/property-placeholder.jpg'}
                          alt={booking.property.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">{booking.property.title}</p>
                          <p className="text-sm text-gray-600">{booking.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                          onClick={() => handleBookingAction(booking._id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                          onClick={() => handleBookingAction(booking._id, 'decline')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'pending').length === 0 && (
                    <div className="text-center py-6">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-600">All caught up! No pending approvals.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Rents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Rent Due Soon
                  </CardTitle>
                  <CardDescription>Rents due in the next 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {rents
                    .filter(rent => {
                      const dueDate = new Date(rent.nextDue);
                      const now = new Date();
                      const diffTime = dueDate.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 7 && diffDays >= 0;
                    })
                    .slice(0, 5)
                    .map((rent) => (
                      <div key={rent._id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{rent.property.title}</p>
                          <p className="text-sm text-gray-600">{rent.tenant.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {rent.currency} {rent.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due {new Date(rent.nextDue).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  {rents.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No upcoming rents</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Rental Applications</CardTitle>
                    <CardDescription>Applications submitted by prospective tenants</CardDescription>
                  </div>
                  <div>
                    <Button size="sm" asChild>
                      <a href="/host/applications/create">New Application</a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">No applications yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.property?.title || app.property}</p>
                              <p className="text-sm text-gray-600">{app.property?._id || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.user?.name || app.user}</p>
                              <p className="text-sm text-gray-600">{app.user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(app.submittedAt || app.createdAt).toLocaleString()}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{app.monthlyRent ? `${app.currency || 'LKR'} ${app.monthlyRent}` : '—'}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">{app.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ApplicationModal application={app} onActionCompleted={() => { fetchApplications(); fetchRents(); fetchMaintenanceRequests(); }} />
                              <Button
                                size="sm"
                                className="bg-black text-white hover:bg-gray-800"
                                onClick={() => {
                                  const propertyData = properties.find(p => p._id === app.property?._id || p._id === app.property);
                                  setRentPrefilledData({
                                    propertyId: app.property?._id || app.property,
                                    tenantEmail: app.user?.email || '',
                                    tenantName: app.user?.name || '',
                                    amount: app.monthlyRent || propertyData?.price || '',
                                    currency: app.currency || 'LKR',
                                    applicationId: app._id,
                                  });
                                  setShowCreateRentModal(true);
                                }}
                              >
                                Create Rent
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteApplication(app._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Your Properties</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first property listing</p>
                    <Button asChild>
                      <Link href="/host/listings/create">Add Property</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(property => (
                      <div key={property._id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <PropertyCard property={property} />
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={property.verified ? 'default' : 'secondary'}
                              className={property.verified ? 'bg-green-100 text-green-800' : ''}
                            >
                              {property.verified ? 'Active' : rawProperties.find(p => p._id === property._id)?.status || 'Pending'}
                            </Badge>
                            <Badge variant={property.featured ? 'default' : 'outline'}>
                              {property.featured ? 'Featured' : 'Standard'}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/listings/${property._id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/host/listings/${property._id}/edit`}>
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleFeatured(property._id, property.featured)}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(property._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>Manage property bookings and reservations</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                    <p className="text-gray-600">Bookings will appear here once guests make reservations</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Guest</TableHead>
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
                                src={booking.property.images[0] || '/images/property-placeholder.jpg'}
                                alt={booking.property.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium">{booking.property.title}</p>
                                <p className="text-sm text-gray-600">{booking.property._id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.user.name}</p>
                              <p className="text-sm text-gray-600">{booking.user.email}</p>
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
                            <Badge
                              variant={
                                booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {booking.currency} {booking.totalAmount.toLocaleString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleBookingAction(booking._id, 'approve')}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleBookingAction(booking._id, 'decline')}
                                  >
                                    Decline
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBookingAction(booking._id, 'cancel')}
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                Contact Guest
                              </Button>
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

          {/* Rents Tab */}
          <TabsContent value="rents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rent Management</CardTitle>
                    <CardDescription>Track and manage rental payments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreateMaintenanceModal properties={rawProperties} onCreated={() => fetchMaintenanceRequests()} />
                    <Button onClick={() => setShowCreateRentModal(true)}>
                      Create Rent Agreement
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rents.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rents to Manage</h3>
                    <p className="text-gray-600">Rent tracking will appear here once you have tenants</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rents.map((rent) => (
                        <TableRow key={rent._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rent.property.title}</p>
                              <p className="text-sm text-gray-600">{rent.property.address.city}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rent.tenant.name}</p>
                              <p className="text-sm text-gray-600">{rent.tenant.email}</p>
                              <p className="text-sm text-gray-600">{rent.tenant.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {rent.currency} {rent.amount.toLocaleString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {rent.frequency}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {new Date(rent.nextDue).toLocaleDateString()}
                              </p>
                              {(() => {
                                const dueDate = new Date(rent.nextDue);
                                const now = new Date();
                                const diffTime = dueDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (diffDays < 0) {
                                  return <p className="text-sm text-red-600">Overdue by {Math.abs(diffDays)} days</p>;
                                } else if (diffDays <= 7) {
                                  return <p className="text-sm text-orange-600">Due in {diffDays} days</p>;
                                } else {
                                  return <p className="text-sm text-gray-600">Due in {diffDays} days</p>;
                                }
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={rent.status === 'active' ? 'default' : 'secondary'}>
                              {rent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRent(rent);
                                  setShowRentModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleRentAction(rent._id, 'mark_paid')}
                              >
                                Mark Paid
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRentAction(rent._id, 'send_reminder')}
                              >
                                Send Reminder
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Requests Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Maintenance Requests</CardTitle>
                <CardDescription>Manage maintenance requests from tenants</CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No maintenance requests</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests.map((req) => (
                        <TableRow key={req._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.property?.title || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{req.property?.address?.city}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.tenant?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600">{req.tenant?.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.title}</p>
                              <p className="text-sm text-gray-600">{req.description?.substring(0, 50)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {req.category?.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={req.priority === 'urgent' ? 'destructive' : req.priority === 'high' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {req.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={req.status === 'completed' ? 'default' : req.status === 'in-progress' ? 'secondary' : 'outline'}
                              className="capitalize"
                            >
                              {req.status?.replace('-', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(req.createdAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Format maintenance request to match rent structure
                                  const maintenanceRent = {
                                    _id: req._id,
                                    property: req.property,
                                    tenant: req.tenant,
                                    amount: 0,
                                    currency: 'LKR',
                                    frequency: 'N/A',
                                    nextDue: req.createdAt,
                                    status: req.status,
                                    notes: `${req.title}\n${req.description}\nCategory: ${req.category}\nPriority: ${req.priority}`
                                  };
                                  setSelectedRent(maintenanceRent as any);
                                  setShowRentModal(true);
                                }}
                              >
                                View
                              </Button>
                              {req.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/maintenance/${req._id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'completed' })
                                      });
                                      if (res.ok) {
                                        fetchMaintenanceRequests();
                                      }
                                    } catch (err) {
                                      console.error('Failed to update maintenance request', err);
                                    }
                                  }}
                                >
                                  Mark Complete
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

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {currentUserId ? (
              <NotificationPanel userId={currentUserId} />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-gray-500">Loading notifications...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Rent Details Modal */}
        {selectedRent && (
          <RentDetailsModal
            rent={selectedRent}
            open={showRentModal}
            onClose={() => {
              setShowRentModal(false);
              setSelectedRent(null);
            }}
            onMarkPaid={async (rentId: string) => {
              await handleRentAction(rentId, 'mark_paid');
              setShowRentModal(false);
              setSelectedRent(null);
            }}
            showActions={true}
            userType="host"
          />
        )}

        {/* Create Rent Modal */}
        <CreateRentModal
          open={showCreateRentModal}
          onClose={() => {
            setShowCreateRentModal(false);
            setRentPrefilledData(null);
          }}
          onSuccess={() => {
            setShowCreateRentModal(false);
            setRentPrefilledData(null);
            fetchRents();
            fetchApplications(); // Refresh applications list (the application gets deleted when rent is created)
          }}
          prefilledData={rentPrefilledData}
        />
      </div>
    </div>
  );
}
