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
  verifyEmail: (code: string) => request('/users/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),
  resendVerify: () => request('/users/resend-verify', { method: 'POST' }),
  forgotPassword: (email: string) => request('/users/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request('/users/reset-password', { method: 'POST', body: JSON.stringify(body) }),
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
  deliverRequest: (id: number) => request(`/requests/${id}/deliver`, { method: 'PUT' }),
  confirmRequest: (id: number) => request(`/requests/${id}/confirm`, { method: 'PUT' }),
  disputeRequest: (id: number) => request(`/requests/${id}/dispute`, { method: 'PUT' }),
  cancelRequest: (id: number) => request(`/requests/${id}/cancel`, { method: 'PUT' }),
  reviewRequest: (id: number, body: any) => request(`/requests/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),

  // Messages
  getMessages: (requestId: number) => request(`/requests/${requestId}/messages`),
  sendMessage: (requestId: number, body: string) => request(`/requests/${requestId}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),

  // Availability
  getMyAvailability: () => request('/availability/me'),
  setMyAvailability: (slots: any[]) => request('/availability/me', { method: 'PUT', body: JSON.stringify({ slots }) }),
  getUserAvailability: (userId: number) => request(`/availability/user/${userId}`),
  getAvailableSlots: (serviceId: number, date: string) => request(`/availability/slots?service_id=${serviceId}&date=${date}`),
  bookSlot: (body: any) => request('/availability/book', { method: 'POST', body: JSON.stringify(body) }),
  getBooking: (requestId: number) => request(`/availability/booking/${requestId}`),

  // Trust & Safety
  getTrustScore: (userId: number) => request(`/trust/score/${userId}`),
  reportUser: (body: any) => request('/trust/report', { method: 'POST', body: JSON.stringify(body) }),
  blockUser: (blockedId: number) => request('/trust/block', { method: 'POST', body: JSON.stringify({ blocked_id: blockedId }) }),
  unblockUser: (userId: number) => request(`/trust/block/${userId}`, { method: 'DELETE' }),
  getBlockedUsers: () => request('/trust/blocked'),
  isBlocked: (userId: number) => request(`/trust/blocked/${userId}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  getUnreadCount: () => request('/notifications/unread'),
  markRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};
