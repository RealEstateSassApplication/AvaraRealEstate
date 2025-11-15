# Admin Access Setup Guide

## Problem
- Blog Management not visible in Admin Dashboard
- Admin Panel button not showing in navbar when logged in as admin

## Solution

The admin panel visibility is **role-based**. You need to set your user account to have the `admin` role in the database.

### Step 1: Set Admin Role

We've created a simple script to promote your user to admin. Here's how to use it:

#### Option A: Using the Simple Script (Recommended)

1. **Open the script file:**
   ```
   scripts/set-admin-role-simple.js
   ```

2. **Update the EMAIL variable** (around line 13):
   ```javascript
   const EMAIL = 'your-actual-email@example.com';  // Change this!
   ```

3. **Update MONGODB_URI if needed** (around line 14):
   ```javascript
   // If using MongoDB Atlas or different connection string:
   const MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/dbname';
   ```

4. **Run the script:**
   ```bash
   node scripts/set-admin-role-simple.js
   ```

#### Option B: Manual Database Update

If you prefer to update the database manually using MongoDB Compass or mongosh:

1. **Connect to your MongoDB database**

2. **Find your user document:**
   ```javascript
   db.users.findOne({ email: "your-email@example.com" })
   ```

3. **Update the user's role:**
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { 
       $set: { 
         role: "admin",
         roles: ["admin", "user", "host"]
       }
     }
   )
   ```

### Step 2: Verify Access

1. **Logout from your application**
   - Click your profile menu
   - Select "Logout"

2. **Login again** with your credentials

3. **Check for Admin Link**
   - You should now see an "Admin" link in the navigation bar
   - In desktop view: Top right, next to "Host Dashboard"
   - In mobile view: In the menu dropdown

4. **Access Blog Management**
   - Click "Admin" in navbar
   - Then click "Blog Management" 
   - Or go directly to: `http://localhost:3000/admin/blog`

### Step 3: Access Admin Dashboard

The admin dashboard now includes a **Quick Actions** section with:

1. **Blog Management** - Create and manage blog posts
2. **View Analytics** - Platform statistics and insights
3. **Rent Management** - Track and manage rental payments

Direct URLs:
- Admin Dashboard: `http://localhost:3000/admin/dashboard`
- Blog Management: `http://localhost:3000/admin/blog`
- Create Blog Post: `http://localhost:3000/admin/blog/create`

## How Admin Access Works

The application checks for admin access in two ways:

```javascript
// In Header.tsx and other components:
if (user.roles?.includes('admin') || user.role === 'admin') {
  // Show admin features
}
```

So your user document needs **either**:
- `role: 'admin'` (single role field), OR
- `roles: ['admin']` (multi-role array)

The script sets both to ensure compatibility.

## Troubleshooting

### "User not found" Error

If the script says your user is not found:

1. Make sure you're using the **exact email** you registered with
2. Check if email is lowercase in database
3. Run the script without changing EMAIL - it will list all users

### Admin Link Still Not Showing

1. **Clear browser cache and cookies**
   - Press `Ctrl + Shift + Delete` (Windows)
   - Clear "Cookies and other site data"

2. **Check browser console for errors**
   - Press `F12` to open DevTools
   - Check Console tab for any errors

3. **Verify database update**
   ```javascript
   db.users.findOne({ email: "your-email@example.com" })
   ```
   Should show `role: "admin"` and `roles: ["admin"]`

4. **Try hard refresh**
   - `Ctrl + Shift + R` (Windows)
   - `Cmd + Shift + R` (Mac)

### MongoDB Connection Error

If you get "ECONNREFUSED" or connection errors:

1. **Check if MongoDB is running:**
   ```bash
   # For local MongoDB:
   mongod
   
   # Or check if service is running:
   # Windows:
   net start MongoDB
   
   # Linux/Mac:
   brew services start mongodb-community
   ```

2. **Verify connection string** in `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/avara-real-estate
   ```

3. **For MongoDB Atlas:**
   - Check network access (add your IP)
   - Verify credentials
   - Use correct connection string

## Features Unlocked After Admin Access

Once you have admin access, you can:

✅ **Blog Management**
- Create new blog posts
- Edit existing posts
- Delete posts
- View blog statistics (total posts, published, drafts, views)
- Manage categories and tags
- SEO optimization (meta title, description, keywords)

✅ **Admin Dashboard**
- View platform statistics
- Approve/reject properties
- Manage users
- View analytics
- Track rental payments
- Monitor financial overview

✅ **User Management**
- View all registered users
- Manage user roles
- Verify users
- View user activity

## Next Steps

After setting up admin access:

1. **Create your first blog post**
   - Go to Admin > Blog Management > Create Post
   - Fill in title, content, and other details
   - Save as draft or publish immediately

2. **Explore admin features**
   - Review pending properties
   - Check platform analytics
   - Monitor rental payments

3. **Customize your profile**
   - Add profile photo
   - Update contact information
   - Set notification preferences

## Need Help?

If you're still having issues:

1. Check the browser console (F12) for JavaScript errors
2. Check the terminal/console where Next.js is running for server errors
3. Verify your MongoDB connection is working
4. Make sure you're using the correct email address

---

**Important Security Note:** Only give admin access to trusted users. Admin users have full control over the platform including the ability to delete content, manage users, and access sensitive data.
