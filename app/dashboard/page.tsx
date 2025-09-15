'use client';

import { useEffect, useState } from 'react';
import HostDashboard from '@/app/host/dashboard/page';
import UserDashboard from '@/app/user/dashboard/page';

export default function DashboardPage() {
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        setMe(json.data || null);
      } catch (err) {
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!me) return <div className="p-6">Please log in to view your dashboard.</div>;

  const isHost = Array.isArray(me.roles) ? me.roles.includes('host') : (me.role === 'host');

  return (
    <div>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div>
        <UserDashboard />
        {isHost && (
          <div className="mt-8">
            <HostDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
