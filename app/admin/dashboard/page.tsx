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
  Star
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
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    pendingProperties: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeListings: 0,
  });
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      const propertiesResponse = await fetch('/api/admin/properties?status=pending&limit=5');
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        setPendingProperties(propertiesData.properties || []);
      }

      const usersResponse = await fetch('/api/admin/users?limit=5');
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
      }
    } catch (error) {
      console.error(`Failed to ${action} property:`, error);
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
              <p className={`text-sm flex items-center mt-1 ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
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

        {/* Main Content */}
        <Tabs defaultValue="pending-properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending-properties">Pending Properties</TabsTrigger>
            <TabsTrigger value="recent-users">Recent Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}