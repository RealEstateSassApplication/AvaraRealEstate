const client = {
  async create(payload: any) {
    const res = await fetch('/api/rents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    return json.data;
  },
  async listForHost() {
    // hostId will be inferred server-side from session in a real app; client calls without params
    const res = await fetch('/api/rents');
    const json = await res.json();
    return json.data;
  },
  async listForUser(userId?: string) {
    const url = userId ? `/api/rents?userId=${userId}` : '/api/rents';
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
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
