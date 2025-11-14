/**
 * Simple Script to Set Admin Role for a User
 * 
 * This script updates a user's role to 'admin' so they can access
 * the admin panel and blog management features.
 * 
 * Usage:
 * 1. Update the EMAIL variable below with your email
 * 2. Update the MONGODB_URI if needed
 * 3. Run: node scripts/set-admin-role-simple.js
 */

const mongoose = require('mongoose');

// ⚠️ UPDATE THESE VALUES ⚠️
const EMAIL = 'your-email@example.com';  // <-- Change this to your email
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/avara-real-estate';

// User Schema
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
  }
}, {
  timestamps: true
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function setAdminRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: EMAIL.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${EMAIL}" not found`);
      console.log('\n💡 Available users:');
      const allUsers = await User.find({}).select('name email role roles');
      if (allUsers.length === 0) {
        console.log('   No users found in database. Please register first.');
      } else {
        allUsers.forEach(u => {
          console.log(`   - ${u.email} (name: ${u.name}, role: ${u.role})`);
        });
        console.log('\n⚠️  Update the EMAIL constant in this script with one of the emails above');
      }
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
    console.log('   1. Logout and login again to refresh your session');
    console.log('   2. You should see "Admin" link in the navigation bar');
    console.log('   3. Click Admin > Blog Management to manage blog posts');
    console.log('   4. Or go directly to: http://localhost:3000/admin/blog');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure MongoDB is running:');
      console.log('   - If using local MongoDB: mongod');
      console.log('   - If using MongoDB Atlas: check your connection string');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Check if email was updated
if (EMAIL === 'your-email@example.com') {
  console.error('❌ Please update the EMAIL variable in the script first!');
  console.log('\nOpen scripts/set-admin-role-simple.js and change:');
  console.log('   const EMAIL = \'your-email@example.com\';');
  console.log('to your actual registered email address.');
  process.exit(1);
}

setAdminRole();
