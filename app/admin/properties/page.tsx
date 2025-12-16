'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ExternalLink, ShieldCheck, Mail, MapPin, Search, MoreVertical, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminPropertiesPage() {
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingProperty, setDeletingProperty] = useState<any>(null);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Fetch more than default limit
            const res = await fetch('/api/admin/properties?limit=100');
            if (res.ok) {
                const data = await res.json();
                setProperties(data.properties || []);
            }
        } catch (err) {
            console.error('Failed to load properties', err);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/admin/properties/${propertyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active', verified: true })
            });
            if (!res.ok) throw new Error('Failed to verify property');
            const data = await res.json();
            setProperties(properties.map(p => p._id === propertyId ? data.property : p));
            toast.success('Property verified and published');
        } catch (error) {
            console.error(error);
            toast.error('Failed to verify property');
        }
    };

    const handleReject = async (propertyId: string) => {
        try {
            const res = await fetch(`/api/admin/properties/${propertyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (!res.ok) throw new Error('Failed to reject property');
            const data = await res.json();
            setProperties(properties.map(p => p._id === propertyId ? data.property : p));
            toast.success('Property rejected');
        } catch (error) {
            console.error(error);
            toast.error('Failed to reject property');
        }
    };

    const handleDeleteClick = (property: any) => {
        setDeletingProperty(property);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingProperty) return;
        try {
            const res = await fetch(`/api/admin/properties/${deletingProperty._id}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete property');
            }
            setProperties(properties.filter(p => p._id !== deletingProperty._id));
            toast.success('Property deleted successfully');
            setIsDeleteOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete property');
        }
    };

    const filteredProperties = properties.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.owner?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
            case 'published':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'pending':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Properties Management</h1>
                        <p className="text-gray-600">View and manage all properties on the platform</p>
                    </div>
                    <Button asChild>
                        <Link href="/host/listings/create" target="_blank">
                            Admin: Create Listing
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Properties List</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search properties..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : filteredProperties.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No properties found.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Property</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProperties.map((property) => (
                                        <TableRow key={property._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                                        <Home className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium line-clamp-1">{property.title}</p>
                                                        <p className="text-xs text-gray-500">{property.type}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {property.address?.city || 'Unknown'}, {property.address?.district}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p className="font-medium">{property.owner?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{property.owner?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {property.currency} {property.price?.toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusBadgeVariant(property.status)}>
                                                        {property.status}
                                                    </Badge>
                                                    {property.verified && (
                                                        <span title="Verified">
                                                            <ShieldCheck className="w-4 h-4 text-green-600" />
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/listings/${property._id}`} target="_blank">
                                                                <ExternalLink className="mr-2 h-4 w-4" /> View Listing
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {property.status !== 'active' && !property.verified && (
                                                            <DropdownMenuItem onClick={() => handleVerify(property._id)} className="text-green-600 focus:text-green-600">
                                                                <CheckCircle className="mr-2 h-4 w-4" /> Verify & Publish
                                                            </DropdownMenuItem>
                                                        )}
                                                        {property.status !== 'rejected' && (
                                                            <DropdownMenuItem onClick={() => handleReject(property._id)} className="text-orange-600 focus:text-orange-600">
                                                                <XCircle className="mr-2 h-4 w-4" /> Reject
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(property)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Property
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Warning Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Property</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{deletingProperty?.title}</strong>? This action cannot be undone and will remove all associated data.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete Property</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

