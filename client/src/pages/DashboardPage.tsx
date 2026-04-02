import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { t } from '../i18n';

function MessageThread({ requestId, userId }: { requestId: number; userId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const loadMessages = () => { api.getMessages(requestId).then(setMessages).catch(() => {}); };
  useEffect(() => { loadMessages(); const i = setInterval(loadMessages, 10000); return () => clearInterval(i); }, [requestId]);

  const send = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try { await api.sendMessage(requestId, newMsg); setNewMsg(''); loadMessages(); }
    catch (err: any) { toast(err.message, 'error'); }
    setSending(false);
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h4 className="text-xs font-semibold text-gray-500 mb-3">💬 {t('messages.title')}</h4>
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 && <p className="text-xs text-gray-400 text-center py-2">{t('dashboard.noMessages')}</p>}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.sender_id === userId ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name}</div>
              {m.body}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={t('dashboard.typeMessage')} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        <button onClick={send} disabled={sending || !newMsg.trim()}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50">{t('messages.send')}</button>
      </div>
    </div>
  );
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7; const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

function ScheduleTab({ loaded, slots, setSlots, onLoad }: { loaded: boolean; slots: any[]; setSlots: (s: any[]) => void; onLoad: () => void }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loaded) { api.getMyAvailability().then(s => { setSlots(s); onLoad(); }).catch(() => onLoad()); }
  }, [loaded]);

  const addSlot = (day: number) => { setSlots([...slots, { day_of_week: day, start_time: '09:00', end_time: '10:00' }]); setSaved(false); };
  const removeSlot = (idx: number) => { setSlots(slots.filter((_, i) => i !== idx)); setSaved(false); };
  const updateSlot = (idx: number, field: string, value: string) => { setSlots(slots.map((s, i) => i === idx ? { ...s, [field]: value } : s)); setSaved(false); };

  const save = async () => {
    try { await api.setMyAvailability(slots); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { /* handled silently */ }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{t('dashboard.scheduleDesc')}</p>
      <div className="space-y-3">
        {DAYS.map((dayName, dayIdx) => {
          const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter(s => s.day_of_week === dayIdx);
          return (
            <div key={dayIdx} className="bg-white p-4 rounded-xl shadow-card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{dayName}</h4>
                <button onClick={() => addSlot(dayIdx)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add</button>
              </div>
              {daySlots.length === 0 && <p className="text-xs text-gray-400">{t('dashboard.notAvailable')}</p>}
              {daySlots.map(s => (
                <div key={s.idx} className="flex items-center gap-2 mt-1">
                  <select value={s.start_time} onChange={e => updateSlot(s.idx, 'start_time', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" aria-label="Start time">
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-gray-400 text-xs">to</span>
                  <select value={s.end_time} onChange={e => updateSlot(s.idx, 'end_time', e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm" aria-label="End time">
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => removeSlot(s.idx)} className="text-red-400 hover:text-red-600 text-xs" aria-label="Remove">✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-600 text-sm">{t('dashboard.saveSchedule')}</button>
        {saved && <span className="text-sm text-green-600">✓ {t('dashboard.saved')}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing' | 'services' | 'schedule'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [myHelpWanted, setMyHelpWanted] = useState<any[]>([]);
  const [myHelping, setMyHelping] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState<{ id: number; rating: number; comment: string } | null>(null);
  const [expandedChat, setExpandedChat] = useState<number | null>(null);
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [dailyMatch, setDailyMatch] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const load = async () => {
    try {
      const [inc, out, svcRes] = await Promise.all([api.getIncoming(), api.getOutgoing(), api.getServices(`provider=${user?.id}`)]);
      const svc = Array.isArray(svcRes) ? svcRes : svcRes.services || [];
      setIncoming(inc); setOutgoing(out); setMyServices(svc);
      api.getMyHelpWanted().then(setMyHelpWanted).catch(() => {});
      api.getMyHelping().then(setMyHelping).catch(() => {});
      api.getDailyMatch().then(setDailyMatch).catch(() => {});
      if (user) api.getTrustScore(user.id).then(setTrust).catch(() => {});
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: (id: number) => Promise<any>, id: number) => {
    try { await action(id); await load(); await refreshUser(); } catch (err: any) { toast(err.message, 'error'); }
  };

  const submitReview = async () => {
    if (!reviewForm) return;
    try { await api.reviewRequest(reviewForm.id, { rating: reviewForm.rating, comment: reviewForm.comment }); setReviewForm(null); toast('Review submitted!'); await load(); }
    catch (err: any) { toast(err.message, 'error'); }
  };

  const badge = (s: string) => {
    const m: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-600 border-amber-200',
      accepted: 'bg-blue-50 text-blue-600 border-blue-200',
      delivered: 'bg-purple-50 text-purple-600 border-purple-200',
      completed: 'bg-green-50 text-green-600 border-green-200',
      cancelled: 'bg-gray-50 text-gray-400 border-gray-200',
      disputed: 'bg-red-50 text-red-600 border-red-200',
    };
    return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${m[s] || ''}`}>{s}</span>;
  };

  const progressSteps = ['pending', 'accepted', 'delivered', 'completed'];
  const stepLabels: Record<string, string> = { pending: 'Requested', accepted: 'Accepted', delivered: 'Delivered', completed: 'Done' };
  const RequestProgress = ({ status }: { status: string }) => {
    if (status === 'cancelled' || status === 'disputed') return null;
    const currentIdx = progressSteps.indexOf(status);
    return (
      <div className="flex items-center gap-0.5 mt-3">
        {progressSteps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${
                i < currentIdx ? 'bg-primary-500 text-white' :
                i === currentIdx ? 'bg-primary-500 text-white ring-2 ring-primary-200' :
                'bg-gray-200 text-gray-400'
              }`}>{i < currentIdx ? '✓' : i + 1}</div>
              <span className={`text-[9px] mt-0.5 ${i <= currentIdx ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{stepLabels[step]}</span>
            </div>
            {i < progressSteps.length - 1 && <div className={`flex-1 h-0.5 mt-[-10px] mx-0.5 ${i < currentIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const tabs = [
    { key: 'incoming' as const, label: t('dashboard.incoming'), count: incoming.filter(r => ['pending','accepted','delivered','disputed'].includes(r.status)).length },
    { key: 'outgoing' as const, label: t('dashboard.myRequests'), count: outgoing.filter(r => !['completed','cancelled'].includes(r.status)).length + myHelpWanted.filter(h => !['completed','closed'].includes(h.status)).length },
    { key: 'services' as const, label: t('dashboard.myServices'), count: myServices.length },
    { key: 'schedule' as const, label: t('dashboard.schedule'), count: 0 },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/settings" className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl hover:shadow-lg transition-all">{user?.username.charAt(0).toUpperCase()}</Link>
            <div>
              <h2 className="text-xl font-bold">{user?.username}</h2>
              <Link to="/settings" className="text-sm text-gray-400 hover:text-primary-500">{t('dashboard.editProfile')}</Link>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{user?.points}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">{t('dashboard.boomerangs')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{myServices.length}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">{t('dashboard.services')}</div>
            </div>
            {trust && trust.avg_rating && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{Number(trust.avg_rating).toFixed(1)}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wide">{trust.review_count} reviews</div>
              </div>
            )}
            {trust && (
              <div className="text-center">
                <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  trust.level === 'Platinum' ? 'bg-violet-100 text-violet-700' :
                  trust.level === 'Gold' ? 'bg-amber-100 text-amber-700' :
                  trust.level === 'Silver' ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-50 text-orange-600'
                }`}>{trust.level}</div>
                <div className="text-[11px] text-gray-400 mt-1">{trust.score}/100</div>
              </div>
            )}
          </div>
        </div>
        {user && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Link to={`/users/${user.id}`} className="text-xs text-gray-400 hover:text-primary-500">View public profile →</Link>
            {trust && <span className="text-xs text-gray-400">{trust.completed} exchanges completed</span>}
          </div>
        )}
      </div>

      {/* Monthly stats */}
      {(incoming.length > 0 || outgoing.length > 0) && (() => {
        const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
        const monthCompleted = outgoing.filter(r => r.status === 'completed' && new Date(r.completed_at) >= thisMonth).length
          + incoming.filter(r => r.status === 'completed' && new Date(r.completed_at) >= thisMonth).length;
        const monthEarned = incoming.filter(r => r.status === 'completed' && new Date(r.completed_at) >= thisMonth)
          .reduce((sum: number, r: any) => sum + (r.points_cost || 0), 0);
        const monthSpent = outgoing.filter(r => r.status === 'completed' && new Date(r.completed_at) >= thisMonth)
          .reduce((sum: number, r: any) => sum + (r.points_cost || 0), 0);
        if (monthCompleted === 0 && monthEarned === 0 && monthSpent === 0) return null;
        return (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-card text-center">
              <div className="text-xl font-bold text-gray-900">{monthCompleted}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Exchanges this month</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-card text-center">
              <div className="text-xl font-bold text-green-600">+{monthEarned}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Boomerangs earned</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-card text-center">
              <div className="text-xl font-bold text-primary-600">-{monthSpent}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Boomerangs spent</div>
            </div>
          </div>
        );
      })()}

      {/* Profile completion + 7-day challenge */}
      {user && (() => {
        const steps = [
          { done: !!user.bio, label: 'Add bio' },
          { done: !!user.city, label: 'Set location' },
          { done: user.email_verified, label: 'Verify email' },
          { done: myServices.length > 0, label: 'Create a service' },
          { done: outgoing.some(r => r.status === 'completed'), label: 'Complete first exchange' },
        ];
        const done = steps.filter(s => s.done).length;
        const total = steps.length;
        if (done >= total) return null;
        return (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-primary-700">🚀 Get Started Challenge</h3>
              <span className="text-sm font-bold text-primary-600">{done}/{total}</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2 mb-3">
              <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${(done/total)*100}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((s, i) => {
                const links: Record<string, string> = { 'Add bio': '/settings', 'Set location': '/settings', 'Verify email': '/account', 'Create a service': '/services/new', 'Complete first exchange': '/browse' };
                const el = (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-full ${s.done ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-300 cursor-pointer'}`}>
                    {s.done ? '✓' : '○'} {s.label}
                  </span>
                );
                return s.done ? el : <Link key={i} to={links[s.label] || '/settings'}>{el}</Link>;
              })}
            </div>
            <p className="text-xs text-primary-600 mt-3">Complete all steps within 7 days to earn 25 bonus boomerangs! 🪃</p>
          </div>
        );
      })()}

      {/* Daily Match */}
      {dailyMatch && (
        <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-sm text-primary-700 mb-1">🎯 Daily Match — Someone needs your skills!</h3>
              <p className="font-medium text-sm">{dailyMatch.title}</p>
              <p className="text-xs text-gray-500 mt-1">{dailyMatch.category_icon} {dailyMatch.category_name} · 🪃 {dailyMatch.points_budget} · {dailyMatch.requester_name}{dailyMatch.requester_city ? ` · ${dailyMatch.requester_city}` : ''}</p>
            </div>
            <Link to="/help-wanted" className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600 shrink-0">Help →</Link>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === tb.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tb.label}
            {tb.count > 0 && <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${tab === tb.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>{tb.count}</span>}
          </button>
        ))}
      </div>

      {/* Incoming */}
      {tab === 'incoming' && (
        <div className="space-y-3">
          {incoming.filter(r => !['completed','cancelled'].includes(r.status)).length === 0 && incoming.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <p className="text-gray-500 text-sm">{t('dashboard.noIncoming')}</p>
            </div>
          )}
          {/* Disputed items — shown first with warning styling */}
          {incoming.filter(r => r.status === 'disputed').length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-2">
              <h4 className="text-sm font-semibold text-red-700 mb-3">Disputes ({incoming.filter(r => r.status === 'disputed').length})</h4>
              <div className="space-y-3">
                {incoming.filter(r => r.status === 'disputed').map((r: any) => (
                  <div key={r.id} className="bg-white p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600">{r.service_title}</Link>
                          {badge(r.status)}
                        </div>
                        <p className="text-xs text-gray-500">From <Link to={`/users/${r.requester_id}`} className="text-primary-600 hover:underline">{r.requester_name}</Link> · {r.points_cost} 🪃</p>
                        <p className="text-xs text-red-500 mt-1">Resolve this dispute via messages with the requester.</p>
                      </div>
                      <Link to={`/messages?to=${r.requester_id}`} className="text-xs bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 font-medium shrink-0">Message</Link>
                    </div>
                    {['accepted','delivered','completed','disputed'].includes(r.status) && (
                      <div>
                        <button onClick={() => setExpandedChat(expandedChat === r.id ? null : r.id)}
                          className="text-xs text-primary-600 mt-3 hover:underline">
                          {expandedChat === r.id ? t('dashboard.hideMessages') : t('dashboard.showMessages')}
                        </button>
                        {expandedChat === r.id && user && <MessageThread requestId={r.id} userId={user.id} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Regular incoming (non-disputed, non-completed, non-cancelled) */}
          {incoming.filter(r => !['completed','cancelled','disputed'].includes(r.status)).map((r: any) => (
            <div key={r.id} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600">{r.service_title}</Link>
                    {badge(r.status)}
                  </div>
                  <p className="text-xs text-gray-500">From <Link to={`/users/${r.requester_id}`} className="text-primary-600 hover:underline">{r.requester_name}</Link> · {r.points_cost} 🪃</p>
                  {r.message && <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg italic">"{r.message}"</p>}
                  <RequestProgress status={r.status} />
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(api.acceptRequest, r.id)} className="text-xs bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium">{t('dashboard.accept')}</button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">{t('dashboard.decline')}</button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <button onClick={() => handleAction(api.deliverRequest, r.id)} className="text-xs bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 font-medium">{t('dashboard.delivered')}</button>
                  )}
                  {r.status === 'delivered' && (
                    <span className="text-xs text-purple-500 font-medium">{t('dashboard.waiting')}</span>
                  )}
                  {r.status === 'disputed' && (
                    <span className="text-xs text-red-500 font-medium">{t('dashboard.disputedMsg')}</span>
                  )}
                </div>
              </div>
              {/* Chat toggle for accepted/delivered/disputed */}
              {['accepted','delivered','completed','disputed'].includes(r.status) && (
                <div>
                  <button onClick={() => setExpandedChat(expandedChat === r.id ? null : r.id)}
                    className="text-xs text-primary-600 mt-3 hover:underline">
                    {expandedChat === r.id ? t('dashboard.hideMessages') : t('dashboard.showMessages')}
                  </button>
                  {expandedChat === r.id && user && <MessageThread requestId={r.id} userId={user.id} />}
                </div>
              )}
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
                    <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600">{r.service_title}</Link>
                    {badge(r.status)}
                  </div>
                  <p className="text-xs text-gray-500">From <Link to={`/users/${r.provider_id}`} className="text-primary-600 hover:underline">{r.provider_name}</Link> · {r.points_cost} 🪃</p>
                  <RequestProgress status={r.status} />
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                  )}
                  {r.status === 'accepted' && (
                    <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                  )}
                  {r.status === 'delivered' && (
                    <>
                      <button onClick={() => handleAction(api.confirmRequest, r.id)} className="text-xs bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium">Confirm ✓</button>
                      <button onClick={() => handleAction(api.disputeRequest, r.id)} className="text-xs bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 font-medium">Dispute</button>
                    </>
                  )}
                  {r.status === 'completed' && Number(r.has_reviewed) === 0 && (
                    <button onClick={() => setReviewForm({ id: r.id, rating: 5, comment: '' })} className="text-xs bg-accent-400 text-white px-4 py-2 rounded-lg hover:bg-accent-500 font-medium">Leave Review ⭐</button>
                  )}
                </div>
              </div>
              {/* Chat toggle */}
              {['accepted','delivered','completed','disputed'].includes(r.status) && (
                <div>
                  <button onClick={() => setExpandedChat(expandedChat === r.id ? null : r.id)}
                    className="text-xs text-primary-600 mt-3 hover:underline">
                    {expandedChat === r.id ? t('dashboard.hideMessages') : t('dashboard.showMessages')}
                  </button>
                  {expandedChat === r.id && user && <MessageThread requestId={r.id} userId={user.id} />}
                </div>
              )}
              {/* Review form */}
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

          {/* Help wanted requests */}
          {myHelpWanted.length > 0 && <h4 className="text-xs font-semibold text-gray-400 mt-6">Help Requests</h4>}
          <Link to="/help-wanted" className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
            <span>+</span> Ask for help
          </Link>
          {myHelpWanted.map((h: any) => (
            <div key={'hw-'+h.id} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{h.title}</span>
                    {badge(h.status)}
                  </div>
                  <p className="text-xs text-gray-500">{h.category_icon} {h.category_name} · {h.points_budget} 🪃</p>
                  {h.helper_name && <p className="text-xs text-primary-600 mt-1">Helper: {h.helper_name}</p>}
                </div>
                <div className="flex gap-2">
                  {h.status === 'delivered' && (
                    <button onClick={() => handleAction(api.confirmHelp, h.id)} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600">Confirm ✓</button>
                  )}
                  {h.status === 'open' && (
                    <button onClick={() => handleAction(api.closeHelpWanted, h.id)} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1">Close</button>
                  )}
                  {['open', 'closed'].includes(h.status) && (
                    <button onClick={async () => { const ok = await confirm({ title: 'Delete request', message: 'Are you sure you want to delete this help request?', confirmText: 'Delete', danger: true }); if (ok) { await api.deleteHelpWanted(h.id); load(); } }} className="text-xs text-gray-400 hover:text-red-500">🗑️</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Items I'm helping with */}
          {myHelping.length > 0 && <h4 className="text-xs font-semibold text-gray-400 mt-6">I'm Helping With</h4>}
          {myHelping.map((h: any) => (
            <div key={'helping-'+h.id} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{h.title}</span>
                    {badge(h.status)}
                  </div>
                  <p className="text-xs text-gray-500">{h.category_icon} {h.category_name} · {h.points_budget} 🪃</p>
                  <p className="text-xs text-gray-400 mt-1">Requested by {h.requester_name}</p>
                </div>
                <div className="flex gap-2">
                  {h.status === 'accepted' && (
                    <button onClick={() => handleAction(api.deliverHelp, h.id)} className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600">Mark Delivered ✓</button>
                  )}
                  {h.status === 'delivered' && (
                    <span className="text-xs text-purple-500">Waiting for confirmation...</span>
                  )}
                </div>
              </div>
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
            <div key={s.id} className="bg-white p-5 rounded-xl shadow-card flex items-center justify-between">
              <Link to={`/services/${s.id}`} className="flex-1 group">
                <h3 className="font-semibold text-sm group-hover:text-primary-600 cursor-pointer">{s.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{s.category_icon} {s.category_name} · {s.points_cost} 🪃</p>
              </Link>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <Link to={`/services/${s.id}/edit`} className="text-xs text-primary-500 hover:text-primary-600">✏️</Link>
                <Link to={`/services/${s.id}`} className="text-xs text-gray-400 hover:text-primary-600">View</Link>
                <button onClick={async () => { const ok = await confirm({ title: 'Delete service', message: 'Are you sure you want to delete this service? This cannot be undone.', confirmText: 'Delete', danger: true }); if (ok) { await api.deleteService(s.id); load(); } }} className="text-xs text-gray-400 hover:text-red-500">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && <ScheduleTab loaded={scheduleLoaded} slots={availSlots} setSlots={setAvailSlots} onLoad={() => setScheduleLoaded(true)} />}
    </div>
  );
}
