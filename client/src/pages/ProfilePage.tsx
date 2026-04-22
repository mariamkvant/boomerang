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

  useEffect(() => {
    api.getUser(Number(id)).then(setProfile).catch(() => {});
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
    <div className="max-w-3xl mx-auto animate-fade-in">
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
                {profile.city && <span>{profile.city}</span>}
                {profile.languages_spoken && <span>{profile.languages_spoken}</span>}
                {trust && trust.avg_rating && <span>{Number(trust.avg_rating).toFixed(1)} rating ({trust.review_count})</span>}
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {user && !isMe && (
            <div className="flex gap-2">
              <Link to={`/messages?to=${id}`} className="text-xs bg-gray-900 dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-gray-800">Message</Link>
              <button onClick={() => setShowQR(q => !q)} className="text-xs bg-gray-100 dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200">QR</button>
              {'share' in navigator && <button onClick={() => { haptic('light'); nativeShare({ title: `${profile.username} on Boomerang`, text: `Check out ${profile.username}'s profile on Boomerang`, url: window.location.href }); }} className="text-xs bg-gray-100 dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200">Share</button>}
              <button onClick={() => setShowReport(true)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-2">Report</button>
              <button onClick={handleBlock} className="text-xs text-gray-400 hover:text-red-500 px-2 py-2">{isBlocked ? 'Unblock' : 'Block'}</button>
            </div>
          )}
        </div>
        {profile.bio && <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">{profile.bio}</p>}
        {!profile.bio && isMe && (
          <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-500 mb-4 transition-colors">
            <span>+</span> Add a bio to build trust with the community
          </Link>
        )}
        {trust && (
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { val: profile.points, label: 'Boomerangs' },
              { val: trust.completed, label: 'Completed' },
              trust.completion_rate > 0 ? { val: `${trust.completion_rate}%`, label: 'Completion' } : null,
              trust.avg_hours && Number(trust.avg_hours) > 0 ? { val: Number(trust.avg_hours) < 24 ? `${Math.round(Number(trust.avg_hours))}h` : `${Math.round(Number(trust.avg_hours) / 24)}d`, label: 'Avg response' } : null,
              { val: `${trust.review_count || 0}`, label: 'Trusted by' },
            ].filter(Boolean).map((s: any, i) => (
              <div key={i} className="bg-gray-50 dark:bg-[#2a3942] px-4 py-3 rounded-xl text-center min-w-[70px]">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.val}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            ))}
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
              <Link key={s.id} to={`/services/${s.id}`} className="bg-white p-5 rounded-xl shadow-card hover:shadow-card-hover group">
                <h4 className="font-semibold text-sm group-hover:text-primary-600">{s.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.category_name} · {s.points_cost} boomerangs</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
