'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    LineChart,
    PieChart,
    Activity,
    TrendingUp,
    Users,
    DollarSign,
    Home
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Since we don't have a charts library installed (like recharts) in the context, 
// I will create simple CSS-based bar visualizations or just display data cards.
// If user asks for real charts, I'd need to install a library.
// For now, I will build custom simple visualizations using CSS bars.

export default function AdminReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/reports');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Failed to load reports', err);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500">Failed to load data.</div>;
    }

    // Helper to normalize months for chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Analytics Reports</h1>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <h3 className="text-2xl font-bold mt-1">LKR {data.totalRevenue?.toLocaleString()}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">User Growth (6mo)</p>
                                <h3 className="text-2xl font-bold mt-1">
                                    +{data.userGrowth?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Properties</p>
                                <h3 className="text-2xl font-bold mt-1">
                                    {data.propertyDistribution?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
                                </h3>
                            </div>
                            <div className="p-3 bg-indigo-100 rounded-full">
                                <Home className="w-6 h-6 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart (Simple CSS Bar) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Revenue</CardTitle>
                            <CardDescription>Revenue trend for the last 6 months</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-end justify-between gap-2 pt-4">
                                {data.monthlyRevenue?.map((item: any, i: number) => {
                                    const max = Math.max(...data.monthlyRevenue.map((r: any) => r.total));
                                    const height = (item.total / max) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1">
                                            <div
                                                className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-all"
                                                style={{ height: `${height}%` }}
                                            ></div>
                                            <span className="text-xs text-gray-500 mt-2">{months[item._id - 1]}</span>
                                        </div>
                                    );
                                })}
                                {(!data.monthlyRevenue || data.monthlyRevenue.length === 0) && (
                                    <div className="w-full text-center text-gray-400 self-center">No revenue data available</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Types</CardTitle>
                            <CardDescription>Distribution of property types</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.propertyDistribution?.map((item: any) => {
                                    const total = data.propertyDistribution.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                    const percentage = Math.round((item.count / total) * 100);
                                    return (
                                        <div key={item._id} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize">{item._id}</span>
                                                <span className="font-medium">{item.count} ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!data.propertyDistribution || data.propertyDistribution.length === 0) && (
                                    <div className="w-full text-center text-gray-400 py-8">No property data available</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Platform Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recentActivity?.map((activity: any) => (
                                <div key={activity._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-full">
                                            <Activity className="w-4 h-4 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                New booking by {activity.user?.name || 'User'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {activity.property?.title || 'Unknown Property'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold">LKR {activity.totalAmount?.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(activity.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!data.recentActivity || data.recentActivity.length === 0) && (
                                <div className="w-full text-center text-gray-400 py-4">No recent activity</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
