import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import QRCode from '../components/QRCode';
import { nativeShare, haptic } from '../utils/platform';

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [superhelper, setSuperhelper] = useState<any>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [similarUsers, setSimilarUsers] = useState<any[]>([]);

  useEffect(() => {
    api.getUser(Number(id)).then(p => {
      setProfile(p);
      if (p.services?.length > 0) {
        const catId = p.services[0]?.category_id;
        if (catId) {
          api.getServices(`category=${catId}`).then((res: any) => {
            const svcs = Array.isArray(res) ? res : res.services || [];
            const seen = new Set<number>();
            const unique = svcs.filter((s: any) => {
              if (s.provider_id === Number(id) || seen.has(s.provider_id)) return false;
              seen.add(s.provider_id); return true;
            }).slice(0, 3);
            setSimilarUsers(unique);
          }).catch(() => {});
        }
      }
    }).catch(() => {});
    api.getTrustScore(Number(id)).then(setTrust).catch(() => {});
    api.getUserAchievements(Number(id)).then(setAchievements).catch(() => {});
    api.getSuperhelperStatus(Number(id)).then(setSuperhelper).catch(() => {});
    if (user) api.isBlocked(Number(id)).then(r => setIsBlocked(r.blocked)).catch(() => {});
    api.trackView('profile', Number(id));
  }, [id, user]);

  const handleBlock = async () => {
    if (isBlocked) { await api.unblockUser(Number(id)); setIsBlocked(false); }
    else { await api.blockUser(Number(id)); setIsBlocked(true); }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    await api.reportUser({ reported_id: Number(id), reason: reportReason, details: reportDetails });
    setReportSent(true); setShowReport(false);
  };

  if (!profile) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  const isMe = user?.id === Number(id);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24 md:pb-8">
      <div className="bg-white dark:bg-[#202c33] p-8 rounded-2xl shadow-card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {trust && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    trust.level === 'Platinum' ? 'bg-violet-100 text-violet-700' :
                    trust.level === 'Gold' ? 'bg-amber-100 text-amber-700' :
                    trust.level === 'Silver' ? 'bg-gray-100 text-gray-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>{trust.level}</span>
                )}
                {superhelper?.is_superhelper && <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full font-medium">Superhelper</span>}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1.5">
                {profile.city && <span>📍 {profile.city}</span>}
                {trust && trust.avg_rating && <span>★ {Number(trust.avg_rating).toFixed(1)} ({trust.review_count})</span>}
              </div>
            </div>
          </div>
          {user && !isMe && (
            <div className="flex items-center gap-2 shrink-0">
              <Link to={`/messages?to=${id}`} className="text-sm bg-gray-900 dark:bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-gray-800 font-medium">Message</Link>
              <div className="relative">
                <button onClick={() => setShowOverflow(!showOverflow)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2a3942]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                {showOverflow && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg z-20 min-w-[140px] overflow-hidden" onClick={() => setShowOverflow(false)}>
                    {'share' in navigator && (
                      <button onClick={() => { haptic('light'); nativeShare({ title: `${profile.username} on Boomerang`, text: `Check out ${profile.username}'s profile`, url: window.location.href }); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3942]">Share profile</button>
                    )}
                    <button onClick={() => setShowQR(q => !q)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3942]">Show QR code</button>
                    <div className="border-t border-gray-100 dark:border-gray-700" />
                    <button onClick={() => setShowReport(true)}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">Report</button>
                    <button onClick={handleBlock}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">{isBlocked ? 'Unblock' : 'Block'}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {profile.bio && <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{profile.bio}</p>}
        {!profile.bio && isMe && (
          <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-500 mb-4 transition-colors">
            <span>+</span> Add a bio to build trust with the community
          </Link>
        )}
        {/* Languages + member since */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
          {profile.languages_spoken && <span>🗣 {profile.languages_spoken}</span>}
          {profile.created_at && <span>Member since {new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>}
          {trust?.avg_hours && Number(trust.avg_hours) > 0 && (
            <span>⚡ ~{Number(trust.avg_hours) < 24 ? Math.round(Number(trust.avg_hours)) + 'h' : Math.round(Number(trust.avg_hours) / 24) + 'd'} avg response</span>
          )}
        </div>
        {trust && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.points}</div>
              <div className="text-xs text-gray-400">Boomerangs</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{trust.completed}</div>
              <div className="text-xs text-gray-400">Exchanges</div>
            </div>
            {trust.avg_rating && (
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">★ {Number(trust.avg_rating).toFixed(1)}</div>
                <div className="text-xs text-gray-400">{trust.review_count} reviews</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="mb-6 flex justify-center">
          <QRCode url={window.location.href} />
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
          <h3 className="font-semibold mb-3">Report {profile.username}</h3>
          <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 bg-white" aria-label="Report reason">
            <option value="">Select a reason</option>
            <option value="no-show">No-show / didn't deliver</option>
            <option value="inappropriate">Inappropriate behavior</option>
            <option value="fraud">Fraud / scam</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
          <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Additional details (optional)..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none mb-3" aria-label="Report details" />
          <div className="flex gap-2">
            <button onClick={handleReport} disabled={!reportReason} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">Submit Report</button>
            <button onClick={() => setShowReport(false)} className="text-sm text-gray-500 px-3 py-2">Cancel</button>
          </div>
        </div>
      )}
      {reportSent && <div className="bg-green-50 border border-green-100 text-green-600 p-3 rounded-xl mb-6 text-sm">✓ Report submitted. We'll review it.</div>}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
          <h3 className="font-bold text-lg mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a: any) => (
              <div key={a.id} className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-xl" title={a.desc}>
                <span className="text-xl">{a.emoji}</span>
                <span className="text-sm font-medium text-primary-700">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.services?.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">Services offered</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {profile.services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="bg-white dark:bg-[#202c33] p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 group transition-all">
                <h4 className="font-semibold text-sm group-hover:text-primary-600 dark:text-white">{s.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.category_name} · {s.points_cost} boomerangs</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar providers */}
      {similarUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Others offering similar services</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {similarUsers.map((s: any) => (
              <Link key={s.provider_id} to={`/users/${s.provider_id}`}
                className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 group transition-all">
                <div className="flex items-center gap-2 mb-2">
                  {s.provider_avatar ? (
                    <img src={s.provider_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {s.provider_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium dark:text-white group-hover:text-primary-600 transition-colors">{s.provider_name}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{s.title}</p>
                <p className="text-xs text-primary-600 font-medium mt-1">{s.points_cost} 🪃</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
