const client = {
  async create(payload: any) {
    const res = await fetch('/api/rents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    // API may return { ok: true, data: rent } or { ok: true, rents: [...] }
    return json.data || json.rent || json.rents || null;
  },
  async listForHost(hostId?: string) {
    // If hostId not provided, try to resolve current user via /api/auth/me
    let resolvedHostId = hostId;
    if (!resolvedHostId) {
      try {
        const me = await fetch('/api/auth/me', { cache: 'no-store' });
        if (me.ok) {
          const j = await me.json().catch(() => ({}));
          resolvedHostId = j.user?._id || j.data?._id || j._id || j.id;
        }
      } catch (err) {
        // ignore - we'll call rents endpoint without hostId as fallback
      }
    }

    const url = resolvedHostId ? `/api/rents?type=host&hostId=${resolvedHostId}` : '/api/rents?type=host';
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    // Normalize shapes: { rents: [...] } or { ok: true, rents: [...] } or { data: ... }
    return json.rents || json.data || [];
  },
  async listForUser(userId?: string) {
    const url = userId ? `/api/rents?userId=${userId}` : '/api/rents';
    const res = await fetch(url);
    const json = await res.json();
    return json.rents || json.data || [];
  },
  async markPaid(rentId: string) {
    const res = await fetch('/api/rents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'markPaid', rentId }) });
    const json = await res.json();
    return json.data;
  },
  async triggerReminders(daysBefore = 3) {
    const res = await fetch('/api/rents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'triggerReminders', daysBefore }) });
    const json = await res.json();
    return json.data;
  }
};

export default client;
