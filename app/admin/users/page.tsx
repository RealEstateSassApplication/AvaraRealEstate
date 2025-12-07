'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Shield, CheckCircle, XCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ role: '', verified: false });

    // Delete State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users?limit=100');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (err) {
            console.error('Failed to load users', err);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: any) => {
        setEditingUser(user);
        setEditForm({ role: user.role, verified: user.verified });
        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        try {
            const res = await fetch(`/api/admin/users/${editingUser._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (!res.ok) throw new Error('Failed to update user');

            const data = await res.json();
            setUsers(users.map(u => u._id === editingUser._id ? data.user : u));
            toast.success('User updated successfully');
            setIsEditOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update user');
        }
    };

    const handleDeleteClick = (user: any) => {
        setDeletingUser(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingUser) return;
        try {
            const res = await fetch(`/api/admin/users/${deletingUser._id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete user');
            }

            setUsers(users.filter(u => u._id !== deletingUser._id));
            toast.success('User deleted successfully');
            setIsDeleteOpen(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">View and manage platform users</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Registered Users</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
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
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No users found.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>
                                                <div className="font-medium">{user.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-1">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Phone className="w-3 h-3" /> {user.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.verified ? (
                                                    <div className="flex items-center text-green-600 text-sm">
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Verified
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-gray-500 text-sm">
                                                        <XCircle className="w-4 h-4 mr-1" /> Unverified
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
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
                                                        <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteClick(user)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
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

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Update user role and verification status.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    Role
                                </Label>
                                <div className="col-span-3">
                                    <Select
                                        value={editForm.role}
                                        onValueChange={(val) => setEditForm({ ...editForm, role: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="tenant">Tenant</SelectItem>
                                            <SelectItem value="host">Host</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="verified" className="text-right">
                                    Verified
                                </Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Switch
                                        id="verified"
                                        checked={editForm.verified}
                                        onCheckedChange={(checked) => setEditForm({ ...editForm, verified: checked })}
                                    />
                                    <Label htmlFor="verified">
                                        {editForm.verified ? 'Verified User' : 'Unverified'}
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Warning Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
