'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Home,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Star,
  FileText,
  BarChart,
  Trash2,
  Wrench,
  Search,
  Filter,
  Building
} from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalProperties: number;
  pendingProperties: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeListings: number;
}

interface Property {
  _id: string;
  title: string;
  owner: {
    name: string;
    email: string;
  };
  price: number;
  currency: string;
  status: string;
  purpose: string;
  type: string;
  createdAt: string;
  images: string[];
  featured?: boolean;
  verified?: boolean;
  address?: {
    city?: string;
    district?: string;
  };
}

interface Rent {
  _id: string;
  property: {
    _id: string;
    title: string;
    images: string[];
    address?: { city?: string; district?: string };
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
  };
  host: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface MaintenanceRequest {
  _id: string;
  property: {
    _id: string;
    title: string;
    images: string[];
    address?: { city?: string; district?: string };
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
  };
  host: {
    _id: string;
    name: string;
  };
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  verified: boolean;
  createdAt: string;
  listings: string[];
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    pendingProperties: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeListings: 0,
  });
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [rents, setRents] = useState<Rent[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [rentFilter, setRentFilter] = useState('all');
  const [maintenanceFilter, setMaintenanceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch pending properties
      const propertiesResponse = await fetch('/api/admin/properties?status=pending&limit=10');
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        setPendingProperties(propertiesData.properties || []);
      }

      // Fetch all properties
      const allPropertiesResponse = await fetch('/api/admin/properties?limit=50');
      if (allPropertiesResponse.ok) {
        const allPropertiesData = await allPropertiesResponse.json();
        setAllProperties(allPropertiesData.properties || []);
      }

      // Fetch rents
      const rentsResponse = await fetch('/api/admin/rents?limit=50');
      if (rentsResponse.ok) {
        const rentsData = await rentsResponse.json();
        setRents(rentsData.rents || []);
      }

      // Fetch maintenance requests
      const maintenanceResponse = await fetch('/api/admin/maintenance?limit=50');
      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        setMaintenanceRequests(maintenanceData.requests || []);
      }

      // Fetch users
      const usersResponse = await fetch('/api/admin/users?limit=10');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setRecentUsers(usersData.users || []);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyAction = async (propertyId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
        setStats(prev => ({
          ...prev,
          pendingProperties: prev.pendingProperties - 1,
          activeListings: action === 'approve' ? prev.activeListings + 1 : prev.activeListings,
        }));
        toast({
          title: action === 'approve' ? 'Property Approved' : 'Property Rejected',
          description: `The property has been ${action}ed successfully.`,
        });
      }
    } catch (error) {
      console.error(`Failed to ${action} property:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} property.`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAllProperties(prev => prev.filter(p => p._id !== propertyId));
        setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
        setStats(prev => ({
          ...prev,
          totalProperties: prev.totalProperties - 1,
        }));
        toast({
          title: 'Property Deleted',
          description: 'The property has been removed from the platform.',
        });
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete property.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (propertyId: string, newFeaturedStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: newFeaturedStatus }),
      });

      if (response.ok) {
        setAllProperties(prev =>
          prev.map(p => p._id === propertyId ? { ...p, featured: newFeaturedStatus } : p)
        );
        toast({
          title: newFeaturedStatus ? 'Property Featured' : 'Featured Tag Removed',
          description: newFeaturedStatus
            ? 'The property is now featured on the homepage.'
            : 'The property is no longer featured.',
        });
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      toast({
        title: 'Error',
        description: 'Failed to update featured status.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleVerified = async (propertyId: string, newVerifiedStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newVerifiedStatus }),
      });

      if (response.ok) {
        setAllProperties(prev =>
          prev.map(p => p._id === propertyId ? { ...p, verified: newVerifiedStatus } : p)
        );
        toast({
          title: newVerifiedStatus ? 'Property Verified' : 'Verification Removed',
          description: newVerifiedStatus
            ? 'The property has been verified.'
            : 'The property verification has been removed.',
        });
      }
    } catch (error) {
      console.error('Failed to toggle verified:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
    }
  };

  // Filter functions
  const filteredProperties = allProperties.filter(property => {
    const matchesFilter = propertyFilter === 'all' || property.status === propertyFilter;
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredRents = rents.filter(rent => {
    return rentFilter === 'all' || rent.status === rentFilter;
  });

  const filteredMaintenance = maintenanceRequests.filter(request => {
    return maintenanceFilter === 'all' || request.status === maintenanceFilter;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage properties, users, and platform operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Properties"
            value={stats.totalProperties.toLocaleString()}
            icon={Home}
            change="+12% from last month"
            changeType="positive"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.pendingProperties.toLocaleString()}
            icon={Clock}
            change={stats.pendingProperties > 10 ? "High priority" : "Normal"}
            changeType={stats.pendingProperties > 10 ? "negative" : "positive"}
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            change="+8% from last month"
            changeType="positive"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings.toLocaleString()}
            icon={DollarSign}
            change="+15% from last month"
            changeType="positive"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/blog">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Blog Management</h3>
                      <p className="text-sm text-gray-600">Create and manage blog posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/dashboard?tab=analytics">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-4 rounded-lg">
                      <BarChart className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">View Analytics</h3>
                      <p className="text-sm text-gray-600">Platform statistics and insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/dashboard?tab=rent-management">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-4 rounded-lg">
                      <DollarSign className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Rent Management</h3>
                      <p className="text-sm text-gray-600">Track and manage rental payments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending-properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="pending-properties">Pending</TabsTrigger>
            <TabsTrigger value="all-properties">All Properties</TabsTrigger>
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="recent-users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="financial-overview">Financial</TabsTrigger>
          </TabsList>

          {/* Pending Properties */}
          <TabsContent value="pending-properties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  Properties Pending Review
                </CardTitle>
                <CardDescription>
                  Review and approve or reject property listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      All Caught Up!
                    </h3>
                    <p className="text-gray-600">
                      No properties pending review at the moment.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProperties.map((property) => (
                        <TableRow key={property._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={property.images[0] || '/images/property-placeholder.jpg'}
                                alt={property.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">
                                  {property.title}
                                </p>
                                <Badge variant="secondary" className="capitalize mt-1">
                                  {property.purpose}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{property.owner.name}</p>
                              <p className="text-sm text-gray-600">{property.owner.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{property.type}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('en-LK', {
                              style: 'currency',
                              currency: property.currency,
                              minimumFractionDigits: 0,
                            }).format(property.price)}
                          </TableCell>
                          <TableCell>
                            {new Date(property.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/listings/${property._id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handlePropertyAction(property._id, 'approve')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handlePropertyAction(property._id, 'reject')}
                              >
                                <XCircle className="w-4 h-4" />
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

          {/* All Properties */}
          <TabsContent value="all-properties">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-500" />
                    All Properties
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search properties..."
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage all properties on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Properties Found
                    </h3>
                    <p className="text-gray-600">
                      No properties match your current filters.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.map((property) => (
                        <TableRow key={property._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <img
                                src={property.images[0] || '/images/property-placeholder.jpg'}
                                alt={property.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">
                                  {property.title}
                                </p>
                                <p className="text-sm text-gray-500">{property.address?.city || 'N/A'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{property.owner?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{property.owner?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {property.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                property.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                              }
                            >
                              {property.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFeatured(property._id, !property.featured)}
                              className={property.featured ? 'text-yellow-500' : 'text-gray-400'}
                            >
                              <Star className={`w-5 h-5 ${property.featured ? 'fill-yellow-500' : ''}`} />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVerified(property._id, !property.verified)}
                              className={property.verified ? 'text-green-500' : 'text-gray-400'}
                            >
                              <CheckCircle className={`w-5 h-5 ${property.verified ? 'fill-green-100' : ''}`} />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/listings/${property._id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete &quot;{property.title}&quot;? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProperty(property._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

          {/* Rentals */}
          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    All Rentals
                  </div>
                  <Select value={rentFilter} onValueChange={setRentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
                <CardDescription>
                  View all rental payments across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRents.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Rentals Found
                    </h3>
                    <p className="text-gray-600">
                      No rental payments match your current filters.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRents.map((rent) => (
                        <TableRow key={rent._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{rent.property?.title || 'Unknown Property'}</p>
                              <p className="text-sm text-gray-500">{rent.property?.address?.city || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rent.tenant?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{rent.tenant?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rent.host?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{rent.host?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">
                              {new Intl.NumberFormat('en-LK', {
                                style: 'currency',
                                currency: rent.currency || 'LKR',
                                minimumFractionDigits: 0,
                              }).format(rent.amount)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                rent.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  rent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                              }
                            >
                              {rent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(rent.dueDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Requests */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2 text-orange-500" />
                    Maintenance Requests
                  </div>
                  <div className="flex gap-2">
                    <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
                <CardDescription>
                  View all maintenance requests across properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredMaintenance.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Maintenance Requests
                    </h3>
                    <p className="text-gray-600">
                      No maintenance requests match your current filters.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaintenance.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{request.property?.title || 'Unknown Property'}</p>
                              <p className="text-sm text-gray-500">{request.property?.address?.city || 'N/A'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.tenant?.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{request.tenant?.email || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{request.title}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{request.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                request.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                              }
                            >
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                request.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                  request.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Users */}
          <TabsContent value="recent-users">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                  Newly registered users on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-600">{user.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {user.verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.listings.length} properties
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                  <CardDescription>
                    Key metrics and growth indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Properties</span>
                      <span className="font-semibold">{stats.activeListings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-semibold">
                        LKR {stats.totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-semibold">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Rating</span>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold">4.8</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild>
                      <Link href="/admin/properties">
                        <span className="w-full flex items-center justify-start">
                          <Home className="w-4 h-4 mr-2" />
                          Manage All Properties
                        </span>
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/admin/users">
                        <span className="w-full flex items-center justify-start">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Users
                        </span>
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/admin/bookings">
                        <span className="w-full flex items-center justify-start">
                          <DollarSign className="w-4 h-4 mr-2" />
                          View Bookings
                        </span>
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/admin/reports">
                        <span className="w-full flex items-center justify-start">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analytics Reports
                        </span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rent Management Tab */}
          <TabsContent value="rent-management">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                  Platform Rent Management
                </CardTitle>
                <CardDescription>
                  Monitor and manage all rental activities across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Active Rents</p>
                        <p className="text-2xl font-bold text-blue-900">247</p>
                      </div>
                      <Home className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Overdue Payments</p>
                        <p className="text-2xl font-bold text-orange-900">23</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600">Monthly Rent Collection</p>
                        <p className="text-2xl font-bold text-green-900">LKR 2.4M</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Recent Rent Activities</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Export Report
                      </Button>
                      <Button size="sm">
                        Send Bulk Reminders
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <p className="font-medium">Modern Apartment Colombo</p>
                            <p className="text-sm text-gray-600">Colombo 03</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">John Silva</p>
                            <p className="text-sm text-gray-600">john@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Mary Fernando</p>
                            <p className="text-sm text-gray-600">mary@example.com</p>
                          </div>
                        </TableCell>
                        <TableCell>LKR 85,000</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">Nov 15, 2024</p>
                            <p className="text-sm text-red-600">3 days overdue</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">Overdue</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              Remind
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Mark Paid
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Add more sample rows as needed */}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Overview Tab */}
          <TabsContent value="financial-overview">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Platform Financial Overview
                  </CardTitle>
                  <CardDescription>
                    Complete financial metrics and revenue tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                          <p className="text-2xl font-bold">LKR 12.5M</p>
                          <p className="text-blue-100 text-sm mt-1">+15% from last month</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Commission Earned</p>
                          <p className="text-2xl font-bold">LKR 625K</p>
                          <p className="text-green-100 text-sm mt-1">5% platform fee</p>
                        </div>
                        <Star className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Pending Payments</p>
                          <p className="text-2xl font-bold">LKR 1.2M</p>
                          <p className="text-purple-100 text-sm mt-1">247 transactions</p>
                        </div>
                        <Clock className="w-8 h-8 text-purple-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium">Active Hosts</p>
                          <p className="text-2xl font-bold">156</p>
                          <p className="text-orange-100 text-sm mt-1">+8 this month</p>
                        </div>
                        <Users className="w-8 h-8 text-orange-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                    <CardDescription>Revenue sources and distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium text-blue-900">Rental Income</span>
                        <span className="font-bold text-blue-900">LKR 8.5M (68%)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium text-green-900">Bookings</span>
                        <span className="font-bold text-green-900">LKR 2.8M (22%)</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-medium text-purple-900">Property Sales</span>
                        <span className="font-bold text-purple-900">LKR 1.2M (10%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Cities</CardTitle>
                    <CardDescription>Revenue by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Colombo</p>
                          <p className="text-sm text-gray-600">89 properties</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">LKR 4.2M</p>
                          <p className="text-sm text-green-600">+12%</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Kandy</p>
                          <p className="text-sm text-gray-600">45 properties</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">LKR 2.1M</p>
                          <p className="text-sm text-green-600">+8%</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Galle</p>
                          <p className="text-sm text-gray-600">32 properties</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">LKR 1.8M</p>
                          <p className="text-sm text-green-600">+15%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">94%</div>
                      <div className="text-sm text-gray-600">Payment Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">4.7</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">72%</div>
                      <div className="text-sm text-gray-600">Occupancy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">2.3</div>
                      <div className="text-sm text-gray-600">Days Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}