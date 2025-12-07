import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Only admins can update users
        await requireRole(request, ['admin', 'super-admin']);

        const body = await request.json();
        const { role, verified } = body;

        await dbConnect();

        // Validate inputs if necessary
        const updateData: any = {};
        if (role) {
            // Validate role against enum manually or trust schema
            if (['user', 'tenant', 'host', 'admin', 'super-admin'].includes(role)) {
                updateData.role = role;
                // Keep single 'role' and 'roles' array in sync if needed, 
                // but for now we update the main role field usually used for logic
                // If the schema uses 'roles' array as primary, we should update that too.
                // Based on User.ts, 'role' is single string, 'roles' is array.
                // Let's safe update both if we are changing main role? 
                // Or just update 'role' as the UI likely only picks one.
                updateData.role = role;
            }
        }

        if (typeof verified === 'boolean') {
            updateData.verified = verified;
        }

        const updatedUser = await User.findByIdAndUpdate(
            params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await requireRole(request, ['admin', 'super-admin']);

        // Prevent self-deletion
        if (currentUser._id.toString() === params.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        await dbConnect();

        const deletedUser = await User.findByIdAndDelete(params.id);

        if (!deletedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
