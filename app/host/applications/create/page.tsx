'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateApplicationPage() {
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingProperties, setFetchingProperties] = useState(true);

    const [formData, setFormData] = useState({
        propertyId: '',
        applicantEmail: '',
        startDate: '',
        durationMonths: '12',
        monthlyRent: '',
        currency: 'LKR'
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/host/properties');
            if (res.ok) {
                const json = await res.json();
                const data = json.data || [];
                setProperties(data);
            }
        } catch (err) {
            console.error('Failed to load properties', err);
            toast.error('Failed to load properties');
        } finally {
            setFetchingProperties(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-fill rent if property changes
        if (field === 'propertyId') {
            const property = properties.find(p => p._id === value);
            if (property) {
                setFormData(prev => ({
                    ...prev,
                    propertyId: value,
                    monthlyRent: property.price ? String(property.price) : '',
                    currency: property.currency || 'LKR'
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.propertyId || !formData.applicantEmail || !formData.startDate || !formData.monthlyRent) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create application');
            }

            toast.success('Application created successfully');
            router.push('/host/dashboard'); // Go back to dashboard (applications tab usually default or persistent)
        } catch (err: any) {
            console.error('Submission error:', err);
            toast.error(err.message || 'Failed to create application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white py-8">
            <div className="max-w-2xl mx-auto px-4">
                <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent">
                    <Link href="/host/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </Link>
                </Button>

                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Create Rental Application</CardTitle>
                        <CardDescription>
                            Manually create a rental application for a tenant. The tenant must have an account with the provided email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Property Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="property">Property</Label>
                                <Select
                                    value={formData.propertyId}
                                    onValueChange={(val) => handleChange('propertyId', val)}
                                >
                                    <SelectTrigger id="property">
                                        <SelectValue placeholder={fetchingProperties ? "Loading..." : "Select a property"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {properties.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                        {properties.length === 0 && !fetchingProperties && (
                                            <div className="p-2 text-sm text-gray-500 text-center">No properties found</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Applicant Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Applicant/Tenant Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tenant@example.com"
                                    value={formData.applicantEmail}
                                    onChange={(e) => handleChange('applicantEmail', e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    The user must already be registered in the system.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Lease Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (Months)</Label>
                                    <Input
                                        id="duration"
                                        type="number"
                                        min="1"
                                        value={formData.durationMonths}
                                        onChange={(e) => handleChange('durationMonths', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Monthly Rent */}
                            <div className="space-y-2">
                                <Label htmlFor="rent">Monthly Rent ({formData.currency})</Label>
                                <Input
                                    id="rent"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthlyRent}
                                    onChange={(e) => handleChange('monthlyRent', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" type="button" asChild>
                                    <Link href="/host/dashboard">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={loading || fetchingProperties}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Application
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
