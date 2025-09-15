'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, User, Heart, Plus, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ListPropertyButton from '@/components/ui/ListPropertyButton';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  profilePhoto?: string;
  listingsCount?: number;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const hasHostRole = (u: User | null) => {
    if (!u) return false;
    if (u.roles && Array.isArray(u.roles)) return u.roles.includes('host');
    if (u.role === 'host') return true;
    // fallback: if user has listings, treat them as a host
    if (typeof u.listingsCount === 'number' && u.listingsCount > 0) return true;
    return false;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      if (response.ok) {
        const json = await response.json();
        const u = json.data || json.user;
        if (u) {
          setUser({ _id: u.id || u._id, name: u.name, email: u.email, role: u.role, roles: u.roles, profilePhoto: u.profilePhoto, listingsCount: u.listingsCount });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
  <header className="bg-card sticky top-0 z-50 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-black text-white p-2 rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-on-surface">Avara</h1>
              <p className="text-xs muted">Sri Lanka</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/listings?purpose=rent"
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Rent
            </Link>
            <Link
              href="/listings?purpose=sale"
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Buy
            </Link>
            <Link
              href="/listings?purpose=short-term"
              className="text-gray-700 hover:text-teal-600 font-medium transition-colors"
            >
              Stay
            </Link>
            {user && (
              <>
                {/* User personal dashboard */}
                <Link href="/user/dashboard" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">My Dashboard</Link>
                {/* Host dashboard only if host role */}
                {hasHostRole(user) && (
                  <Link href="/host/dashboard" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">Host Dashboard</Link>
                )}
                {/* Admin dashboard */}
                {(user.roles?.includes('admin') || user.role === 'admin') && (
                  <Link href="/admin/dashboard" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">Admin</Link>
                )}
                {/* 'Become a Host' link removed - hosts detected by listings or role */}
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-3">
                    {hasHostRole(user) && <ListPropertyButton />}

                    <Link href="/favorites">
                      <Button variant="ghost" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </Link>

          <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Link href="/user/profile" className="hidden sm:inline-block">
                              <Avatar>
                                {user.profilePhoto ? (
                                  <AvatarImage src={user.profilePhoto} alt={user.name} />
                                ) : (
                                  <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                                )}
                              </Avatar>
                            </Link>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                          <div className="flex items-center justify-start gap-2 p-2">
                            <div className="flex flex-col space-y-1 leading-none">
                              <p className="font-medium">{user.name}</p>
                              <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="border-t">
                            <DropdownMenuItem asChild>
                              <Link href="/user/profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/bookings">My Bookings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/user/dashboard">My Dashboard</Link>
                            </DropdownMenuItem>
                            {hasHostRole(user) && (
                              <DropdownMenuItem asChild>
                                <Link href="/host/dashboard">Host Dashboard</Link>
                              </DropdownMenuItem>
                            )}
                            {(user.roles?.includes('admin') || user.role === 'admin') && (
                              <DropdownMenuItem asChild>
                                <Link href="/admin/dashboard">Admin Panel</Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Visible logout button next to avatar for quick access */}
                      <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm">Login</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/listings?purpose=rent"
                className="text-gray-700 hover:text-teal-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Rent
              </Link>
              <Link
                href="/listings?purpose=sale"
                className="text-gray-700 hover:text-teal-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Buy
              </Link>
              <Link
                href="/listings?purpose=short-term"
                className="text-gray-700 hover:text-teal-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Stay
              </Link>

              {user && (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-teal-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {user && (
                <>
                  <Link
                    href="/user/profile"
                    className="text-gray-700 hover:text-teal-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {hasHostRole(user) && (
                    <Link
                      href="/host/listings/create"
                      className="text-gray-700 hover:text-teal-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      List Property
                    </Link>
                  )}
                  {hasHostRole(user) && (
                    <Link
                      href="/host/dashboard"
                      className="text-gray-700 hover:text-teal-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Host Dashboard
                    </Link>
                  )}
                  {(user.roles?.includes('admin') || user.role === 'admin') && (
                    <Link
                      href="/admin/dashboard"
                      className="text-gray-700 hover:text-teal-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <a
                    className="text-gray-700 hover:text-teal-600 font-medium"
                    onClick={async (e) => {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/';
                      } catch (err) {
                        console.error('Logout failed', err);
                      }
                    }}
                  >
                    Logout
                  </a>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}