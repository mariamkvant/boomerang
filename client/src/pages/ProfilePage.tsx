import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    api.getUser(Number(id)).then(setProfile).catch(() => {});
    api.getTrustScore(Number(id)).then(setTrust).catch(() => {});
    api.getUserAchievements(Number(id)).then(setAchievements).catch(() => {});
    if (user) api.isBlocked(Number(id)).then(r => setIsBlocked(r.blocked)).catch(() => {});
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
      <div className="bg-white p-8 rounded-2xl shadow-card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {trust && <span className="text-sm" title={`Trust: ${trust.score}/100`}>{trust.emoji} {trust.level}</span>}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                {profile.city && <span>📍 {profile.city}</span>}
                {profile.languages_spoken && <span>🗣️ {profile.languages_spoken}</span>}
                {trust && <span>⭐ {trust.avg_rating ? Number(trust.avg_rating).toFixed(1) : 'New'} ({trust.review_count} reviews)</span>}
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          {user && !isMe && (
            <div className="flex gap-2">
              <button onClick={() => setShowReport(true)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1">Report</button>
              <button onClick={handleBlock} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1">{isBlocked ? 'Unblock' : 'Block'}</button>
            </div>
          )}
        </div>
        {profile.bio && <p className="text-gray-600 text-sm leading-relaxed mb-4">{profile.bio}</p>}
        {trust && (
          <div className="flex gap-4">
            <div className="bg-primary-50 px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-bold text-primary-600">{profile.points}</div>
              <div className="text-xs text-primary-500">Points</div>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-bold text-gray-700">{trust.completed}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-bold text-gray-700">{trust.score}</div>
              <div className="text-xs text-gray-500">Trust Score</div>
            </div>
          </div>
        )}
      </div>

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
                <p className="text-xs text-gray-500 mt-1">{s.category_icon} {s.category_name} · 🪃 {s.points_cost} pts</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
