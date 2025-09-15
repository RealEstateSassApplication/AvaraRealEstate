"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UserShape {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  roles?: string[];
  listingsCount?: number;
}

export default function ListPropertyButton({ className, size, variant, children }: { className?: string; size?: any; variant?: any; children?: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const hasHostRole = (u: UserShape | null) => {
    if (!u) return false;
    if (u.roles && Array.isArray(u.roles)) return u.roles.includes('host');
    if (u.role === 'host') return true;
    if (typeof u.listingsCount === 'number' && u.listingsCount > 0) return true;
    return false;
  };

  const handleClick = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        // Not authenticated
        router.push('/auth/login');
        return;
      }
      const json = await res.json().catch(() => ({}));
      const u: UserShape | null = json.data || json.user || null;
      if (!u) {
        router.push('/auth/login');
        return;
      }

      if (hasHostRole(u)) {
        router.push('/host/listings/create');
        return;
      }

      // Authenticated but not a host — show confirmation and optional toast
      const apply = confirm('You need a host account to list properties. Apply to become a host now?');
      if (apply) {
        router.push('/host/apply');
      } else {
        try {
          toast({ title: 'Host account required', description: 'You can apply to become a host from your profile.' });
        } catch (err) {
          // toast may not be available in some contexts — swallow
        }
      }
    } catch (err) {
      console.error('ListProperty check failed', err);
      router.push('/auth/login');
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      {children || 'List Property'}
    </Button>
  );
}
