'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Home, Calendar } from 'lucide-react';
import Header from '@/components/ui/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

interface AnalyticsData {
  totalEarnings: number;
  monthlyEarnings: number;
  totalBookings: number;
  activeBookings: number;
  totalProperties: number;
  occupancyRate: number;
  averageRating: number;
  earningsHistory: Array<{ month: string; earnings: number }>;
  bookingsByProperty: Array<{ property: string; bookings: number }>;
  propertyPerformance: Array<{ property: string; occupancy: number; rating: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/host/analytics?days=${timeRange}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics || generateMockData());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
      setAnalytics(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => ({
    totalEarnings: 1250000,
    monthlyEarnings: 425000,
    totalBookings: 45,
    activeBookings: 8,
    totalProperties: 5,
    occupancyRate: 68,
    averageRating: 4.7,
    earningsHistory: [
      { month: 'Jan', earnings: 350000 },
      { month: 'Feb', earnings: 420000 },
      { month: 'Mar', earnings: 380000 },
      { month: 'Apr', earnings: 490000 },
      { month: 'May', earnings: 425000 },
      { month: 'Jun', earnings: 520000 },
    ],
    bookingsByProperty: [
      { property: 'Colombo Luxury Villa', bookings: 12 },
      { property: 'Galle Beach House', bookings: 10 },
      { property: 'Kandy Cottage', bookings: 8 },
      { property: 'Negombo Apartment', bookings: 9 },
      { property: 'Nuwara Eliya Home', bookings: 6 },
    ],
    propertyPerformance: [
      { property: 'Colombo Luxury Villa', occupancy: 85, rating: 4.9 },
      { property: 'Galle Beach House', occupancy: 72, rating: 4.6 },
      { property: 'Kandy Cottage', occupancy: 65, rating: 4.3 },
      { property: 'Negombo Apartment', occupancy: 68, rating: 4.8 },
      { property: 'Nuwara Eliya Home', occupancy: 55, rating: 4.2 },
    ],
  });

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

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Track your property performance and earnings</p>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90', '365'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                onClick={() => setTimeRange(range)}
              >
                {range === '7' ? '7D' : range === '30' ? '30D' : range === '90' ? '90D' : '1Y'}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">LKR {(analytics.totalEarnings / 100000).toFixed(1)}L</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">LKR {(analytics.monthlyEarnings / 100000).toFixed(0)}L</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Now</p>
                  <p className="text-2xl font-bold">{analytics.activeBookings}</p>
                </div>
                <Users className="w-10 h-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold">{analytics.occupancyRate}%</p>
                </div>
                <Home className="w-10 h-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold">{analytics.averageRating}★</p>
                </div>
                <TrendingUp className="w-10 h-10 text-pink-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Earnings Trend</CardTitle>
              <CardDescription>Monthly earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.earningsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `LKR ${(value as number / 1000).toFixed(0)}K`}
                  />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bookings by Property */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings by Property</CardTitle>
              <CardDescription>Distribution of bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.bookingsByProperty}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="property" width={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Property Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Detailed metrics for each property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.propertyPerformance.map((property, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold">{property.property}</h4>
                    <div className="text-sm text-gray-600">
                      {property.rating}★ • {property.occupancy}% occupancy
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${property.occupancy}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{property.occupancy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline">
            Download Report (PDF)
          </Button>
          <Button variant="outline">
            Export Data (CSV)
          </Button>
        </div>
      </div>
    </div>
  );
}
