import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { t } from '../i18n';

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feed, setFeed] = useState<any>({ shoutouts: [], stats: {} });
  const [matches, setMatches] = useState<any[]>([]);
  const [shoutForm, setShoutForm] = useState({ to_user_id: '', message: '' });
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.getCommunityFeed().then(setFeed).catch(() => {});
    if (user) api.getSmartMatches().then(setMatches).catch(() => {});
  }, [user]);

  const handleShoutout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shoutForm.to_user_id || !shoutForm.message) return;
    try {
      await api.postShoutout({ to_user_id: Number(shoutForm.to_user_id), message: shoutForm.message });
      setSuccess('Shoutout posted!'); setShowForm(false);
      setShoutForm({ to_user_id: '', message: '' });
      api.getCommunityFeed().then(setFeed);
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Community</h2>
        {user && <button onClick={() => setShowForm(!showForm)} className="bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600">Give a Shoutout</button>}
      </div>

      {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">✓ {success}</div>}

      {/* Shoutout form */}
      {showForm && (
        <form onSubmit={handleShoutout} className="bg-white p-6 rounded-2xl shadow-card mb-6 space-y-4">
          <h3 className="font-semibold">Thank someone publicly</h3>
          <input type="number" value={shoutForm.to_user_id} onChange={e => setShoutForm(f => ({...f, to_user_id: e.target.value}))}
            placeholder="User ID (from their profile URL)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          <textarea value={shoutForm.message} onChange={e => setShoutForm(f => ({...f, message: e.target.value}))}
            placeholder="What did they help you with? Say thanks!" rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none" />
          <button type="submit" className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Post Shoutout</button>
        </form>
      )}

      {/* Smart matches */}
      {matches.length > 0 && (
        <div className="bg-primary-50 border border-primary-100 p-5 rounded-2xl mb-6">
          <h3 className="font-semibold text-primary-700 mb-3">People need your skills</h3>
          <div className="space-y-2">
            {matches.slice(0, 3).map((m: any) => (
              <Link key={m.id} to="/help-wanted" className="flex items-center justify-between bg-white p-3 rounded-xl hover:shadow-sm">
                <div>
                  <span className="text-sm font-medium">{m.title}</span>
                  <span className="text-xs text-gray-500 ml-2">{m.category_icon} {m.category_name} · 🪃 {m.points_budget} 🪃</span>
                </div>
                <span className="text-xs text-primary-600 font-medium">Help →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-white p-4 rounded-xl shadow-card text-center">
          <div className="text-2xl font-bold text-primary-600">{feed.stats?.total_members || 0}</div>
          <div className="text-xs text-gray-500">Members</div>
        </div>
        <div className="flex-1 bg-white p-4 rounded-xl shadow-card text-center">
          <div className="text-2xl font-bold text-primary-600">{feed.stats?.week_exchanges || 0}</div>
          <div className="text-xs text-gray-500">Exchanges This Week</div>
        </div>
      </div>

      {/* Activity Feed */}
      <h3 className="font-semibold mb-4">Activity Feed</h3>
      {(!feed.feed || feed.feed.length === 0) && (
        <div className="bg-white p-8 rounded-2xl shadow-card text-center">
          <div className="text-3xl mb-3">🪃</div>
          <p className="text-gray-400 text-sm">No activity yet. Start exchanging skills!</p>
        </div>
      )}
      <div className="space-y-3">
        {feed.feed?.map((item: any, i: number) => (
          <div key={`${item.type}-${item.id}-${i}`} className="bg-white p-4 rounded-xl shadow-card">
            {item.type === 'shoutout' && (
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0">
                  <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
                </div>
                <div>
                  <p className="text-sm">
                    <Link to={`/users/${item.from_user_id}`} className="font-semibold text-primary-600 hover:underline">{item.from_username}</Link>
                    {' '}thanked{' '}
                    <Link to={`/users/${item.to_user_id}`} className="font-semibold text-primary-600 hover:underline">{item.to_username}</Link>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">"{item.message}"</p>
                </div>
              </div>
            )}
            {item.type === 'exchange' && (
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                </div>
                <div>
                  <p className="text-sm">
                    <Link to={`/users/${item.provider_id}`} className="font-semibold text-primary-600 hover:underline">{item.provider_name}</Link>
                    {' '}helped{' '}
                    <Link to={`/users/${item.requester_id}`} className="font-semibold text-primary-600 hover:underline">{item.requester_name}</Link>
                    {' '}with{' '}
                    <Link to={`/services/${item.service_id}`} className="text-primary-600 hover:underline">{item.service_title}</Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{item.points_cost} 🪃 exchanged</p>
                </div>
              </div>
            )}
            {item.type === 'new_service' && (
              <div className="flex items-start gap-3">
                <div className="text-xl shrink-0">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <div>
                  <p className="text-sm">
                    <Link to={`/users/${item.provider_id}`} className="font-semibold text-primary-600 hover:underline">{item.provider_name}</Link>
                    {' '}is now offering{' '}
                    <Link to={`/services/${item.id}`} className="text-primary-600 hover:underline">{item.category_icon} {item.title}</Link>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{item.points_cost} 🪃</p>
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-300 mt-2">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
