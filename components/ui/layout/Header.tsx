'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ListPropertyButton from '@/components/ui/ListPropertyButton';
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

function hasHostRole(user: User | null) {
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.includes('host')) return true;
  if (user.role === 'host') return true;
  return typeof user.listingsCount === 'number' && user.listingsCount > 0;
}

function isAdmin(user: User | null) {
  if (!user) return false;
  if (Array.isArray(user.roles) && (user.roles.includes('admin') || user.roles.includes('super-admin'))) return true;
  return user.role === 'admin' || user.role === 'super-admin';
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;
        const json = await response.json();
        const data = json.data || json.user;
        if (!data) return;
        setUser({
          _id: data.id || data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          roles: data.roles,
          profilePhoto: data.profilePhoto,
          listingsCount: data.listingsCount,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    void checkAuth();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="avara-header sticky top-0 z-50 border-b border-[#e5e1d7] backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-[4vw]">
        <div className="flex min-h-[76px] items-center justify-between gap-3">
          <Link href="/" aria-label="Avara home" className="avara-wordmark text-[2.55rem] leading-none text-[#243b31]">avara<span className="text-[#a68650]">.</span></Link>

          <nav className="hidden items-center gap-6 xl:flex">
            <Link href="/explore" className="text-sm font-medium text-[#4b584c] hover:text-slate-950">Explore</Link>
            <Link href="/listings?purpose=rent" className="text-sm font-medium text-[#4b584c] transition-colors hover:text-slate-950">Rent</Link>
            <Link href="/listings?purpose=sale" className="text-sm font-medium text-[#4b584c] transition-colors hover:text-slate-950">Buy</Link>
            <Link href="/listings?purpose=booking" className="text-sm font-medium text-[#4b584c] transition-colors hover:text-slate-950">Stays</Link>
            <Link href="/tools" className="text-sm font-medium text-[#4b584c] hover:text-slate-950">Tools</Link>
            <Link href="/blog" className="text-sm font-medium text-[#4b584c] transition-colors hover:text-slate-950">Insights</Link>
            {user && (
              <>
                {hasHostRole(user) && (
                  <Link href="/owner" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
                    Owner OS
                  </Link>
                )}
                {isAdmin(user) && (
                  <Link href="/admin/dashboard" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <>
                  {hasHostRole(user) && <ListPropertyButton className="hidden 2xl:inline-flex" size="sm" variant="outline" />}
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/favorites" aria-label="Favorites"><Heart className="h-4 w-4" /></Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 rounded-full p-0" aria-label="Account menu">
                        <Avatar className="h-9 w-9">
                          {user.profilePhoto && <AvatarImage src={user.profilePhoto} alt={user.name} />}
                          <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-60" align="end">
                      <div className="border-b p-3">
                        <p className="font-medium text-slate-950">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild><Link href="/user/profile">Profile</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/user/dashboard">My dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link href="/request-property">Request property</Link></DropdownMenuItem>
                      {hasHostRole(user) && (
                        <>
                          <DropdownMenuItem asChild><Link href="/owner">Owner OS</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href="/host/dashboard">Legacy host operations</Link></DropdownMenuItem>
                        </>
                      )}
                      {isAdmin(user) && <><DropdownMenuItem asChild><Link href="/admin/dashboard">Admin panel</Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/admin/discovery">Discovery CMS</Link></DropdownMenuItem></>}
                      <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm"><Link href="/auth/login">Login</Link></Button>
                  <Button asChild size="sm" className="rounded-full bg-[#243b31] px-4 text-white hover:bg-[#385345]"><Link href="/auth/register">Join Avara</Link></Button>
                </>
              )
            )}

            <Button variant="ghost" size="sm" className="xl:hidden" onClick={() => setIsMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={isMenuOpen}>
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="space-y-1 border-t py-4 xl:hidden">
            <Link href="/explore" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Explore</Link>
            <Link href="/listings?purpose=rent" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Rent</Link>
            <Link href="/listings?purpose=sale" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Buy</Link>
            <Link href="/listings?purpose=booking" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Stays</Link>
            <Link href="/tools" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Tools</Link>
            <Link href="/blog" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Insights</Link>
            {user && (
              <>
                <Link href="/user/dashboard" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>Dashboard</Link>
                {hasHostRole(user) && (
                  <>
                    <Link href="/owner" className="block rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white" onClick={closeMenu}>Owner OS</Link>
                    <Link href="/host/listings/create" className="block rounded-lg px-3 py-2 text-sm font-medium text-[#4b584c]" onClick={closeMenu}>List property</Link>
                  </>
                )}
                {isAdmin(user) && <Link href="/admin/dashboard" className="block rounded-lg px-3 py-2 text-sm font-semibold text-blue-700" onClick={closeMenu}>Admin panel</Link>}
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#4b584c]" onClick={logout}>Logout</button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
