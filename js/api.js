/* ===== API HELPER ===== */
// ⚠️ IMPORTANT: Change this to your live backend URL when deploying to Hostinger
// For local testing:  'http://localhost:3000/api'
// For Hostinger/live: 'https://your-backend-domain.com/api'
const API_BASE = 'https://bantayanferry.onrender.com//api';

const api = {
  getToken: () => localStorage.getItem('bf_token'),
  getUser: () => JSON.parse(localStorage.getItem('bf_user') || 'null'),
  getAdmin: () => JSON.parse(localStorage.getItem('bf_admin') || 'null'),
  isLoggedIn: () => !!localStorage.getItem('bf_token'),
  isAdmin: () => !!localStorage.getItem('bf_admin_token'),

  headers: (isAdmin = false) => {
    const token = isAdmin ? localStorage.getItem('bf_admin_token') : localStorage.getItem('bf_token');
    return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
  },

  async request(method, endpoint, body = null, isAdmin = false) {
    try {
      const opts = { method, headers: api.headers(isAdmin) };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${API_BASE}${endpoint}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  get: (endpoint, isAdmin = false) => api.request('GET', endpoint, null, isAdmin),
  post: (endpoint, body, isAdmin = false) => api.request('POST', endpoint, body, isAdmin),
  put: (endpoint, body, isAdmin = false) => api.request('PUT', endpoint, body, isAdmin),
  patch: (endpoint, body, isAdmin = false) => api.request('PATCH', endpoint, body, isAdmin),
  delete: (endpoint, isAdmin = false) => api.request('DELETE', endpoint, null, isAdmin),
};
