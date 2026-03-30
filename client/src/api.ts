const BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body: any) => request('/users/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/users/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/users/me'),
  updateProfile: (body: any) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  getUser: (id: number) => request(`/users/${id}`),

  // Categories & Subcategories
  getCategories: () => request('/services/categories'),
  getSubcategories: (categoryId: number) => request(`/services/categories/${categoryId}/subcategories`),
  getAllSubcategories: () => request('/services/subcategories'),
  calculatePoints: (categoryId: number, durationMinutes: number) => request(`/services/calculate-points?category_id=${categoryId}&duration_minutes=${durationMinutes}`),

  // Services
  getServices: (params?: string) => request(`/services${params ? `?${params}` : ''}`),
  getService: (id: number) => request(`/services/${id}`),
  createService: (body: any) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: number, body: any) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id: number) => request(`/services/${id}`, { method: 'DELETE' }),

  // Requests
  createRequest: (body: any) => request('/requests', { method: 'POST', body: JSON.stringify(body) }),
  getIncoming: () => request('/requests/incoming'),
  getOutgoing: () => request('/requests/outgoing'),
  acceptRequest: (id: number) => request(`/requests/${id}/accept`, { method: 'PUT' }),
  completeRequest: (id: number) => request(`/requests/${id}/complete`, { method: 'PUT' }),
  cancelRequest: (id: number) => request(`/requests/${id}/cancel`, { method: 'PUT' }),
  reviewRequest: (id: number, body: any) => request(`/requests/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
};
