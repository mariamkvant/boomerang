import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing' | 'services'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState<{ id: number; rating: number; comment: string } | null>(null);

  const load = async () => {
    try {
      const [inc, out, svc] = await Promise.all([api.getIncoming(), api.getOutgoing(), api.getServices(`provider=${user?.id}`)]);
      setIncoming(inc); setOutgoing(out); setMyServices(svc);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: (id: number) => Promise<any>, id: number) => {
    try { await action(id); await load(); await refreshUser(); } catch (err: any) { alert(err.message); }
  };

  const submitReview = async () => {
    if (!reviewForm) return;
    try { await api.reviewRequest(reviewForm.id, { rating: reviewForm.rating, comment: reviewForm.comment }); setReviewForm(null); await load(); }
    catch (err: any) { alert(err.message); }
  };

  const badge = (s: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-50 text-amber-600 border-amber-200', accepted: 'bg-blue-50 text-blue-600 border-blue-200', completed: 'bg-green-50 text-green-600 border-green-200', cancelled: 'bg-gray-50 text-gray-400 border-gray-200' };
    return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${m[s] || ''}`}>{s}</span>;
  };

  const tabs = [
    { key: 'incoming' as const, label: 'Incoming', count: incoming.filter(r => r.status === 'pending').length },
    { key: 'outgoing' as const, label: 'My Requests', count: outgoing.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length },
    { key: 'services' as const, label: 'My Services', count: myServices.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header with stats */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <p className="text-sm text-gray-500">Member since {user ? new Date().toLocaleDateString() : ''}</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{user?.points}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{myServices.length}</div>
              <div className="text-xs text-gray-500">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{outgoing.filter(r => r.status === 'completed').length}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
            {t.count > 0 && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Incoming */}
      {tab === 'incoming' && (
        <div className="space-y-3">
          {incoming.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-gray-500 text-sm">No incoming requests yet</p>
              <p className="text-gray-400 text-xs mt-1">When someone requests your service, it'll show up here</p>
            </div>
          )}
          {incoming.map((r: any) => (
            <div key={r.id} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.service_title}</span>
                    {badge(r.status)}
                  </div>
                  <p className="text-xs text-gray-500">From {r.requester_name} · {r.points_cost} pts</p>
                  {r.message && <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg italic">"{r.message}"</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(api.acceptRequest, r.id)} className="text-xs bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium">Accept</button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Decline</button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <button onClick={() => handleAction(api.completeRequest, r.id)} className="text-xs bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium">Mark Complete ✓</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Outgoing */}
      {tab === 'outgoing' && (
        <div className="space-y-3">
          {outgoing.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <div className="text-4xl mb-3">🪃</div>
              <p className="text-gray-500 text-sm">You haven't requested any services yet</p>
              <Link to="/browse" className="inline-block mt-3 text-sm font-medium text-primary-600 hover:underline">Browse services →</Link>
            </div>
          )}
          {outgoing.map((r: any) => (
            <div key={r.id} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.service_title}</span>
                    {badge(r.status)}
                  </div>
                  <p className="text-xs text-gray-500">From {r.provider_name} · {r.points_cost} pts</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                  )}
                  {r.status === 'completed' && !r.has_reviewed && (
                    <button onClick={() => setReviewForm({ id: r.id, rating: 5, comment: '' })} className="text-xs bg-accent-400 text-white px-4 py-2 rounded-lg hover:bg-accent-500 font-medium">Leave Review ⭐</button>
                  )}
                </div>
              </div>
              {/* Inline review form */}
              {reviewForm?.id === r.id && reviewForm && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => f ? {...f, rating: n} : f)}
                        className={`text-2xl transition-transform hover:scale-110 ${n <= (reviewForm?.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}`} aria-label={`Rate ${n} stars`}>★</button>
                    ))}
                  </div>
                  <textarea value={reviewForm?.comment ?? ''} onChange={e => setReviewForm(f => f ? {...f, comment: e.target.value} : f)}
                    placeholder="Share your experience..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-3" aria-label="Review comment" />
                  <div className="flex gap-2">
                    <button onClick={submitReview} className="text-sm bg-primary-500 text-white px-5 py-2 rounded-lg hover:bg-primary-600 font-medium">Submit Review</button>
                    <button onClick={() => setReviewForm(null)} className="text-sm text-gray-500 px-3 py-2 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My Services */}
      {tab === 'services' && (
        <div className="space-y-3">
          <Link to="/services/new" className="flex items-center justify-center gap-2 bg-white p-5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
            <span className="text-lg">+</span> Offer a new service
          </Link>
          {myServices.map((s: any) => (
            <Link key={s.id} to={`/services/${s.id}`} className="block bg-white p-5 rounded-xl shadow-card hover:shadow-card-hover group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-primary-600">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{s.category_icon} {s.category_name} · {s.points_cost} pts · {s.duration_minutes} min</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
