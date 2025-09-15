"use client";

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function EditProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const u = json.data || json.user;
          setUser(u || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: user.name, phone: user.phone, profilePhoto: user.profilePhoto }) });
      if (res.ok) {
        const json = await res.json();
        alert('Profile updated');
        setUser(json.data || user);
        window.location.href = '/user/profile';
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Please sign in to edit your profile.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <div className="bg-white border rounded p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Avatar>
            {user.profilePhoto ? <AvatarImage src={user.profilePhoto} alt={user.name} /> : <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>}
          </Avatar>
          <Input placeholder="Profile photo URL" value={user.profilePhoto || ''} onChange={(e) => setUser({ ...user, profilePhoto: e.target.value })} />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <Input value={user.name || ''} onChange={(e) => setUser({ ...user, name: e.target.value })} />
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Phone</p>
          <Input value={user.phone || ''} onChange={(e) => setUser({ ...user, phone: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </div>
    </div>
  );
}
