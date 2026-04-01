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
  getReferralInfo: () => request('/users/referral'),
  verifyEmail: (code: string) => request('/users/verify-email', { method: 'POST', body: JSON.stringify({ code }) }),
  resendVerify: () => request('/users/resend-verify', { method: 'POST' }),
  forgotPassword: (email: string) => request('/users/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request('/users/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/users/me'),
  updateProfile: (body: any) => request('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: () => request('/users/me', { method: 'DELETE' }),
  getUser: (id: number) => request(`/users/${id}`),
  searchPeople: (q: string) => request(`/users/search/people?q=${encodeURIComponent(q)}`),

  // Categories & Subcategories
  getCategories: () => request('/services/categories'),
  getSubcategories: (categoryId: number) => request(`/services/categories/${categoryId}/subcategories`),
  getAllSubcategories: () => request('/services/subcategories'),
  calculateBoomerangs: (categoryId: number, durationMinutes: number) => request(`/services/calculate-points?category_id=${categoryId}&duration_minutes=${durationMinutes}`),

  // Services
  getServices: (params?: string) => request(`/services${params ? `?${params}` : ''}`),
  getService: (id: number) => request(`/services/${id}`),
  createService: (body: any) => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id: number, body: any) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id: number) => request(`/services/${id}`, { method: 'DELETE' }),
  favoriteService: (id: number) => request(`/services/${id}/favorite`, { method: 'POST' }),
  unfavoriteService: (id: number) => request(`/services/${id}/favorite`, { method: 'DELETE' }),
  getMyFavorites: () => request('/services/user/favorites'),
  isFavorited: (id: number) => request(`/services/${id}/favorited`),
  getPopularServices: () => request('/services/trending/popular'),
  getNearbyServices: (lat: number, lng: number, radius?: number) => request(`/services/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}`),
  getStats: () => request('/services/stats'),

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

  // Groups
  createGroup: (body: any) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
  getPublicGroups: (search?: string) => request(`/groups${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getMyGroups: () => request('/groups/mine'),
  getGroup: (id: number) => request(`/groups/${id}`),
  getGroupByInviteCode: (code: string) => request(`/groups/invite/${code}`),
  joinGroup: (id: number, invite_code?: string) => request(`/groups/${id}/join`, { method: 'POST', body: JSON.stringify({ invite_code }) }),
  getJoinRequests: (groupId: number) => request(`/groups/${groupId}/requests`),
  approveJoinRequest: (groupId: number, requestId: number) => request(`/groups/${groupId}/requests/${requestId}/approve`, { method: 'PUT' }),
  denyJoinRequest: (groupId: number, requestId: number) => request(`/groups/${groupId}/requests/${requestId}/deny`, { method: 'PUT' }),
  joinByCode: (code: string) => request(`/groups/join/${code}`, { method: 'POST' }),
  leaveGroup: (id: number) => request(`/groups/${id}/leave`, { method: 'DELETE' }),
  inviteToGroup: (id: number, username: string) => request(`/groups/${id}/invite`, { method: 'POST', body: JSON.stringify({ username }) }),
  removeMember: (groupId: number, userId: number) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),

  // Help Wanted
  postHelpWanted: (body: any) => request('/help-wanted', { method: 'POST', body: JSON.stringify(body) }),
  getHelpWanted: (params?: string) => request(`/help-wanted${params ? `?${params}` : ''}`),
  getHelpWantedDetail: (id: number) => request(`/help-wanted/${id}`),
  offerHelp: (id: number) => request(`/help-wanted/${id}/offer`, { method: 'PUT' }),
  deliverHelp: (id: number) => request(`/help-wanted/${id}/deliver`, { method: 'PUT' }),
  confirmHelp: (id: number) => request(`/help-wanted/${id}/confirm`, { method: 'PUT' }),
  closeHelpWanted: (id: number) => request(`/help-wanted/${id}/close`, { method: 'PUT' }),
  deleteHelpWanted: (id: number) => request(`/help-wanted/${id}`, { method: 'DELETE' }),
  getMyHelpWanted: () => request('/help-wanted/user/mine'),
  getMyHelping: () => request('/help-wanted/user/helping'),

  // Achievements
  getMyAchievements: () => request('/users/achievements'),
  getUserAchievements: (id: number) => request(`/users/${id}/achievements`),

  // Direct Messages
  getConversations: () => request('/dm/conversations'),
  getDMs: (userId: number) => request(`/dm/${userId}`),
  sendDM: (userId: number, body: string, image?: string) => request(`/dm/${userId}`, { method: 'POST', body: JSON.stringify({ body, image }) }),
  sendTyping: (userId: number) => request(`/dm/${userId}/typing`, { method: 'POST' }),
  getUnreadDMCount: () => request('/dm/unread/count'),

  // Social
  postShoutout: (body: any) => request('/social/shoutouts', { method: 'POST', body: JSON.stringify(body) }),
  getShoutouts: () => request('/social/shoutouts'),
  getUserShoutouts: (id: number) => request(`/social/shoutouts/user/${id}`),
  getSuperhelperStatus: (id: number) => request(`/social/superhelper/${id}`),
  getSmartMatches: () => request('/social/matches'),
  getCommunityFeed: () => request('/social/feed'),
  getDailyMatch: () => request('/social/daily-match'),

  // Push Notifications
  getVapidKey: () => request('/push/vapid-key'),
  subscribePush: (subscription: any) => request('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
  unsubscribePush: (endpoint: string) => request('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),

  // Admin
  checkAdmin: () => request('/admin/check'),
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: (params?: string) => request(`/admin/users${params ? `?${params}` : ''}`),
  banUser: (id: number, banned: boolean) => request(`/admin/users/${id}/ban`, { method: 'PUT', body: JSON.stringify({ banned }) }),
  setAdmin: (id: number, is_admin: boolean) => request(`/admin/users/${id}/admin`, { method: 'PUT', body: JSON.stringify({ is_admin }) }),
  getAdminReports: () => request('/admin/reports'),
  resolveReport: (id: number, status: string) => request(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminDeleteService: (id: number) => request(`/admin/services/${id}`, { method: 'DELETE' }),

  // Leaderboard
  getWeeklyLeaders: () => request('/leaderboard/weekly'),
  getAllTimeLeaders: () => request('/leaderboard/alltime'),
  getTopCommunities: () => request('/leaderboard/communities'),

  // Review management
  hideReview: (reviewId: number, hidden: boolean) => request(`/requests/reviews/${reviewId}/hide`, { method: 'PUT', body: JSON.stringify({ hidden }) }),

  // Group management
  deleteGroup: (id: number) => request(`/groups/${id}`, { method: 'DELETE' }),
  getGroupActivity: (id: number) => request(`/groups/${id}/activity`),
};
