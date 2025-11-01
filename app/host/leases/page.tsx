'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, DollarSign, Home, AlertCircle, Filter, Download } from 'lucide-react';
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

interface Lease {
  _id: string;
  property: {
    _id: string;
    title: string;
    address: {
      city: string;
    };
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
  startDate?: Date;
  endDate?: Date;
  status: string;
  nextDue: Date;
  securityDeposit?: number;
  notes?: string;
  createdAt: Date;
}

interface DashboardStats {
  activeLeases: number;
  totalMonthlyRevenue: number;
  upcomingPayments: number;
  overduePayments: number;
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filteredLeases, setFilteredLeases] = useState<Lease[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeLeases: 0,
    totalMonthlyRevenue: 0,
    upcomingPayments: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchLeases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, leases]);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/host/rents?includeStats=true', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leases');
      }

      const data = await response.json();
      setLeases(data.rents || []);

      // Calculate stats
      if (data.stats) {
        setStats(data.stats);
      } else {
        calculateStats(data.rents || []);
      }
    } catch (error) {
      console.error('Error fetching leases:', error);
      toast.error('Failed to load leases');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leaseList: Lease[]) => {
    const now = new Date();
    const activeLeases = leaseList.filter(l => l.status === 'active').length;
    const totalMonthlyRevenue = leaseList
      .filter(l => l.status === 'active' && l.frequency === 'monthly')
      .reduce((sum, l) => sum + l.amount, 0);
    
    const upcomingPayments = leaseList.filter(l => {
      const daysUntilDue = Math.ceil((new Date(l.nextDue).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 7;
    }).length;

    const overduePayments = leaseList.filter(l => {
      return new Date(l.nextDue) < now && l.status === 'active';
    }).length;

    setStats({
      activeLeases,
      totalMonthlyRevenue,
      upcomingPayments,
      overduePayments,
    });
  };

  const applyFilters = () => {
    let filtered = leases;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.property.title.toLowerCase().includes(term) ||
        l.tenant.name.toLowerCase().includes(term) ||
        l.property.address.city.toLowerCase().includes(term)
      );
    }

    setFilteredLeases(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDueStatus = (nextDue: Date, status: string) => {
    if (status !== 'active') return 'inactive';
    const now = new Date();
    const daysUntilDue = Math.ceil((new Date(nextDue).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'due-soon';
    return 'on-track';
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

  const downloadLeaseAgreement = (lease: Lease) => {
    // TODO: Implement lease agreement PDF download
    toast.info('Lease agreement download coming soon');
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
          <h1 className="text-4xl font-bold text-gray-900">Lease Management</h1>
          <p className="text-gray-600 mt-2">Manage all your active and inactive leases</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Leases</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeLeases}</p>
                </div>
                <Home className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalMonthlyRevenue, 'LKR').split(' ')[0]}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due Soon</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingPayments}</p>
                </div>
                <Calendar className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.overduePayments}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by property name, tenant, or city..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-lg shadow-sm">
          <TabsList className="border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Leases</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4">
            <div className="space-y-6">
              {/* Upcoming Payments Section */}
              {stats.overduePayments > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Overdue Payments
                    </CardTitle>
                    <CardDescription className="text-red-800">
                      {stats.overduePayments} lease payment(s) are overdue
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              {/* Recent Activity / All Leases */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Leases</h3>
                {filteredLeases.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No leases found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Tenant</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Next Due</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeases.map((lease) => (
                          <TableRow key={lease._id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{lease.property.title}</p>
                                <p className="text-sm text-gray-500">{lease.property.address.city}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{lease.tenant.name}</p>
                                <p className="text-sm text-gray-500">{lease.tenant.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(lease.amount, lease.currency)} / {lease.frequency}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(lease.status)}>
                                {lease.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{formatDate(lease.nextDue)}</span>
                                {getDueStatus(new Date(lease.nextDue), lease.status) === 'overdue' && (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <Link href={`/host/leases/${lease._id}`}>View</Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => downloadLeaseAgreement(lease)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Other tabs content */}
          {['active', 'paused', 'cancelled'].map((tab) => (
            <TabsContent key={tab} value={tab} className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeases
                      .filter(l => l.status === tab)
                      .map((lease) => (
                        <TableRow key={lease._id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{lease.property.title}</p>
                              <p className="text-sm text-gray-500">{lease.property.address.city}</p>
                            </div>
                          </TableCell>
                          <TableCell>{lease.tenant.name}</TableCell>
                          <TableCell>
                            {formatCurrency(lease.amount, lease.currency)} / {lease.frequency}
                          </TableCell>
                          <TableCell>{formatDate(lease.nextDue)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link href={`/host/leases/${lease._id}`}>View Details</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLeases.filter(l => l.status === tab).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No {tab} leases found</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
