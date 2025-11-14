/**
 * Script to Set Admin Role for a User
 * 
 * This script updates a user's role to 'admin' so they can access
 * the admin panel and blog management features.
 * 
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Update the MONGODB_URI in your .env.local file
 * 3. Run: npx ts-node scripts/set-admin-role.ts your-email@example.com
 * 
 * Or you can directly modify this script to hardcode the email.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avara-real-estate';

// User Schema (simplified version)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String,
  passwordHash: String,
  role: {
    type: String,
    enum: ['user', 'tenant', 'host', 'admin', 'super-admin'],
    default: 'user'
  },
  roles: {
    type: [String],
    enum: ['guest', 'user', 'tenant', 'host', 'admin', 'super-admin'],
    default: ['user']
  },
  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setAdminRole(email: string) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}).select('name email role roles');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (name: ${u.name}, role: ${u.role}, roles: ${u.roles})`);
      });
      process.exit(1);
    }

    console.log(`\n📧 Found user: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role}`);
    console.log(`   Current roles: ${user.roles}`);

    // Update user to admin
    user.role = 'admin';
    if (!user.roles) {
      user.roles = ['admin'];
    } else if (!user.roles.includes('admin')) {
      user.roles.push('admin');
    }

    await user.save();

    console.log('\n✅ Successfully updated user to admin!');
    console.log(`   New role: ${user.role}`);
    console.log(`   New roles: ${user.roles}`);
    console.log('\n🎉 You can now access the admin panel!');
    console.log('   1. Logout and login again');
    console.log('   2. You should see "Admin" link in the navigation bar');
    console.log('   3. Click Admin > Blog Management to manage blog posts');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/set-admin-role.ts your-email@example.com');
  console.log('\nOr install ts-node first if not available:');
  console.log('  npm install -g ts-node');
  process.exit(1);
}

setAdminRole(email);
