const client = {
  async listMyProperties() {
    const res = await fetch('/api/host/properties');
    const json = await res.json();
    return json.data || [];
  }
};

export default client;
