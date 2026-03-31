import db from './database';

const BADGES = [
  { id: 'first_exchange', name: 'First Exchange', emoji: '🎉', desc: 'Complete your first service exchange', check: async (userId: number) => {
    const r = await db.get("SELECT COUNT(*) as c FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE (s.provider_id = ? OR sr.requester_id = ?) AND sr.status = 'completed'", userId, userId);
    return parseInt(r?.c || '0') >= 1;
  }},
  { id: 'helping_hand', name: 'Helping Hand', emoji: '🤝', desc: 'Complete 5 services as a provider', check: async (userId: number) => {
    const r = await db.get("SELECT COUNT(*) as c FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ? AND sr.status = 'completed'", userId);
    return parseInt(r?.c || '0') >= 5;
  }},
  { id: 'community_pillar', name: 'Community Pillar', emoji: '🏛️', desc: 'Complete 25 services', check: async (userId: number) => {
    const r = await db.get("SELECT COUNT(*) as c FROM service_requests sr JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ? AND sr.status = 'completed'", userId);
    return parseInt(r?.c || '0') >= 25;
  }},
  { id: 'five_star', name: 'Five Star', emoji: '⭐', desc: 'Maintain 5.0 rating with 5+ reviews', check: async (userId: number) => {
    const r = await db.get('SELECT AVG(r.rating) as avg, COUNT(r.id) as c FROM reviews r JOIN service_requests sr ON r.request_id = sr.id JOIN services s ON sr.service_id = s.id WHERE s.provider_id = ?', userId);
    return parseInt(r?.c || '0') >= 5 && parseFloat(r?.avg || '0') >= 4.9;
  }},
  { id: 'versatile', name: 'Versatile', emoji: '🎭', desc: 'Offer services in 3+ categories', check: async (userId: number) => {
    const r = await db.get('SELECT COUNT(DISTINCT category_id) as c FROM services WHERE provider_id = ? AND is_active = 1', userId);
    return parseInt(r?.c || '0') >= 3;
  }},
  { id: 'connector', name: 'Connector', emoji: '🔗', desc: 'Refer 3 friends who sign up', check: async (userId: number) => {
    const r = await db.get('SELECT COUNT(*) as c FROM users WHERE referred_by = ?', userId);
    return parseInt(r?.c || '0') >= 3;
  }},
];

export async function checkAchievements(userId: number): Promise<string[]> {
  const newBadges: string[] = [];
  for (const badge of BADGES) {
    const existing = await db.get('SELECT id FROM user_achievements WHERE user_id = ? AND badge = ?', userId, badge.id);
    if (existing) continue;
    const earned = await badge.check(userId);
    if (earned) {
      await db.run('INSERT INTO user_achievements (user_id, badge) VALUES (?, ?)', userId, badge.id);
      newBadges.push(badge.id);
    }
  }
  return newBadges;
}

export function getBadgeInfo(badgeId: string) {
  return BADGES.find(b => b.id === badgeId);
}

export { BADGES };
