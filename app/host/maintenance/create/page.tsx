'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateMaintenancePage() {
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingProperties, setFetchingProperties] = useState(true);

    const [formData, setFormData] = useState({
        propertyId: '',
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        tenantId: ''
    });

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/host/properties');
            if (res.ok) {
                const json = await res.json();
                setProperties(json.data || []);
            }
        } catch (err) {
            console.error('Failed to load properties', err);
            toast.error('Failed to load properties');
        } finally {
            setFetchingProperties(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.propertyId || !formData.title || !formData.description || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            // Note: tenantId is currently optional in UI but required by schema. 
            // The API falls back to host ID if tenantId is missing to satisfy schema.
            const res = await fetch('/api/host/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create request');
            }

            toast.success('Maintenance request created');
            router.push('/host/maintenance');
        } catch (err: any) {
            console.error('Submission error:', err);
            toast.error(err.message || 'Failed to create request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent">
                    <Link href="/host/maintenance" className="flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Maintenance
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Wrench className="w-6 h-6 text-orange-600" />
                            </div>
                            <CardTitle className="text-2xl">Log Maintenance Issue</CardTitle>
                        </div>
                        <CardDescription>
                            Create a new maintenance record for your property
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-2">
                                <Label htmlFor="property">Property</Label>
                                <Select
                                    value={formData.propertyId}
                                    onValueChange={(val) => setFormData(p => ({ ...p, propertyId: val }))}
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
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Issue Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Leaking faucet in kitchen"
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="plumbing">Plumbing</SelectItem>
                                            <SelectItem value="electrical">Electrical</SelectItem>
                                            <SelectItem value="heating">Heating</SelectItem>
                                            <SelectItem value="cooling">Cooling</SelectItem>
                                            <SelectItem value="appliances">Appliances</SelectItem>
                                            <SelectItem value="structural">Structural</SelectItem>
                                            <SelectItem value="pest-control">Pest Control</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(val) => setFormData(p => ({ ...p, priority: val }))}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the issue in detail..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button variant="outline" type="button" asChild>
                                    <Link href="/host/maintenance">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={loading || fetchingProperties}>
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Request
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
