/**
 * Check User Role Script
 * 
 * This script checks your current user role and shows what access you have.
 * 
 * Usage:
 * 1. Update the EMAIL variable below
 * 2. Run: node scripts/check-user-role.js
 */

const mongoose = require('mongoose');

// ⚠️ UPDATE THIS VALUE ⚠️
const EMAIL = 'your-email@example.com';  // <-- Change this to your email
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avara-real-estate';

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  role: String,
  roles: [String],
  verified: Boolean,
  emailVerified: Boolean
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUserRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: EMAIL.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${EMAIL}" not found\n`);
      console.log('💡 Available users:');
      const allUsers = await User.find({}).select('name email role roles').limit(10);
      if (allUsers.length === 0) {
        console.log('   No users found in database.');
      } else {
        console.log('');
        allUsers.forEach(u => {
          console.log(`📧 ${u.email}`);
          console.log(`   Name: ${u.name}`);
          console.log(`   Role: ${u.role || 'not set'}`);
          console.log(`   Roles: ${u.roles?.join(', ') || 'not set'}`);
          console.log('');
        });
      }
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════');
    console.log('           USER ACCOUNT INFORMATION');
    console.log('═══════════════════════════════════════════════\n');

    console.log(`👤 Name:            ${user.name}`);
    console.log(`📧 Email:           ${user.email}`);
    console.log(`🎭 Role:            ${user.role || 'not set'}`);
    console.log(`🎭 Roles Array:     ${user.roles?.join(', ') || 'not set'}`);
    console.log(`✅ Verified:        ${user.verified ? 'Yes' : 'No'}`);
    console.log(`📧 Email Verified:  ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`📅 Created:         ${new Date(user.createdAt).toLocaleDateString()}\n`);

    console.log('═══════════════════════════════════════════════');
    console.log('              ACCESS PERMISSIONS');
    console.log('═══════════════════════════════════════════════\n');

    // Check admin access
    const hasAdmin = user.roles?.includes('admin') || user.role === 'admin';
    const hasHost = user.roles?.includes('host') || user.role === 'host';
    const hasTenant = user.roles?.includes('tenant') || user.role === 'tenant';

    if (hasAdmin) {
      console.log('✅ ADMIN ACCESS - GRANTED');
      console.log('   You can access:');
      console.log('   - Admin Dashboard (/admin/dashboard)');
      console.log('   - Blog Management (/admin/blog)');
      console.log('   - User Management (/admin/users)');
      console.log('   - Property Management (/admin/properties)');
      console.log('   - Platform Analytics\n');
    } else {
      console.log('❌ ADMIN ACCESS - NOT GRANTED');
      console.log('   To get admin access, run:');
      console.log('   node scripts/set-admin-role-simple.js\n');
    }

    if (hasHost) {
      console.log('✅ HOST ACCESS - GRANTED');
      console.log('   You can:');
      console.log('   - List properties');
      console.log('   - Manage rentals');
      console.log('   - View bookings\n');
    } else {
      console.log('ℹ️  HOST ACCESS - NOT GRANTED');
      console.log('   Apply to become a host at /host/apply\n');
    }

    if (hasTenant) {
      console.log('✅ TENANT ACCESS - GRANTED');
      console.log('   You can:');
      console.log('   - Book properties');
      console.log('   - Submit maintenance requests');
      console.log('   - View rental history\n');
    }

    console.log('═══════════════════════════════════════════════\n');

    if (!hasAdmin) {
      console.log('💡 TIP: To enable admin access and see Blog Management:');
      console.log('   1. Edit scripts/set-admin-role-simple.js');
      console.log('   2. Set EMAIL to: ' + user.email);
      console.log('   3. Run: node scripts/set-admin-role-simple.js');
      console.log('   4. Logout and login again\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

if (EMAIL === 'your-email@example.com') {
  console.error('❌ Please update the EMAIL variable in the script first!');
  console.log('\nOpen scripts/check-user-role.js and change:');
  console.log('   const EMAIL = \'your-email@example.com\';');
  console.log('to your actual registered email address.');
  console.log('\nOr run without changing to see all users in database.');
  process.exit(1);
}

checkUserRole();
