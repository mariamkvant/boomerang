import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { isIOS, haptic } from '../utils/platform';
import { useConfirm } from '../components/ConfirmModal';
import { t } from '../i18n';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { SkeletonList } from '../components/Skeleton';

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
      <h4 className="text-xs font-semibold text-gray-500 mb-3">{t('messages.title')}</h4>
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 && <p className="text-xs text-gray-400 text-center py-2">{t('dashboard.noMessages')}</p>}
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.sender_id === userId ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
              <div className="text-xs opacity-70 mb-0.5">{m.sender_name}</div>
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
            <div key={dayIdx} className="bg-white p-4 rounded-xl shadow-sm">
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
  const [reviewForm, setReviewForm] = useState<{ id: number; rating: number; comment: string; image: string | null; reviewId?: number; isEdit?: boolean } | null>(null);
  const [expandedChat, setExpandedChat] = useState<number | null>(null);
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [dailyMatch, setDailyMatch] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [shoutoutPrompt, setShoutoutPrompt] = useState<{ userId: number; name: string } | null>(null);
  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [deliverNote, setDeliverNote] = useState<{ id: number; note: string } | null>(null);
  const [deliverPhoto, setDeliverPhoto] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<{ id: number; title: string; date: string; time: string; note: string } | null>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [showTxHistory, setShowTxHistory] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();
  usePullToRefresh(async () => { setRefreshing(true); await load(); setRefreshing(false); });

  const load = async () => {
    try {
      const [inc, out, svcRes] = await Promise.all([api.getIncoming(), api.getOutgoing(), api.getServices(`provider=${user?.id}`)]);
      const svc = Array.isArray(svcRes) ? svcRes : svcRes.services || [];
      setIncoming(inc); setOutgoing(out); setMyServices(svc);
      api.getMyHelpWanted().then(setMyHelpWanted).catch(() => {});
      api.getMyHelping().then(setMyHelping).catch(() => {});
      api.getDailyMatch().then(setDailyMatch).catch(() => {});
      if (user) api.getTrustScore(user.id).then(setTrust).catch(() => {});
      api.getUpcomingBookings().then(setUpcomingBookings).catch(() => {});
      api.getTransactionHistory().then(setTxHistory).catch(() => {});
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (action: (id: number) => Promise<any>, id: number) => {
    haptic('light');
    try {
      await action(id);
      setActionSuccess(id);
      setTimeout(() => setActionSuccess(null), 1500);
      await load(); await refreshUser();
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const submitReview = async () => {
    if (!reviewForm) return;
    try {
      if (reviewForm.isEdit && reviewForm.reviewId) {
        await api.editReview(reviewForm.reviewId, { rating: reviewForm.rating, comment: reviewForm.comment, image: reviewForm.image });
        toast('Review updated!');
      } else {
        await api.reviewRequest(reviewForm.id, { rating: reviewForm.rating, comment: reviewForm.comment, image: reviewForm.image });
        toast('Review submitted!');
      }
      setReviewForm(null); await load();
    }
    catch (err: any) { toast(err.message, 'error'); }
  };

  const badge = (s: string) => {
    const m: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
      accepted: 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800',
      delivered: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
      completed: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      cancelled: 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700',
      disputed: 'bg-red-50 text-red-500 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'Pending', accepted: 'In progress', delivered: 'Delivered',
      completed: 'Done', cancelled: 'Cancelled', disputed: 'Disputed',
    };
    return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${m[s] || ''}`}>{labels[s] || s}</span>;
  };

  const progressSteps = ['pending', 'accepted', 'delivered', 'completed'];
  const stepLabels: Record<string, string> = { pending: 'Requested', accepted: 'Accepted', delivered: 'Delivered', completed: 'Done' };
  const RequestProgress = ({ status, createdAt, deliveredAt, completedAt }: { status: string; createdAt?: string; deliveredAt?: string; completedAt?: string }) => {
    if (status === 'cancelled' || status === 'disputed') return null;
    const currentIdx = progressSteps.indexOf(status);
    return (
      <div className="flex items-center mt-3 mb-1">
        {progressSteps.map((step, i) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < currentIdx ? 'bg-primary-500 text-white' :
                i === currentIdx ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
                'bg-gray-100 text-gray-400'
              }`}>{i < currentIdx ? '✓' : i + 1}</div>
              <span className={`text-[9px] mt-1 font-medium ${i <= currentIdx ? 'text-primary-600' : 'text-gray-400'}`}>{stepLabels[step]}</span>
              {step === 'pending' && createdAt && i <= currentIdx && <span className="text-[8px] text-gray-400">{new Date(createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
              {step === 'delivered' && deliveredAt && i <= currentIdx && <span className="text-[8px] text-gray-400">{new Date(deliveredAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
              {step === 'completed' && completedAt && i <= currentIdx && <span className="text-[8px] text-gray-400">{new Date(completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>}
            </div>
            {i < progressSteps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-3 ${i < currentIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Auto-confirm countdown (72h from delivered_at)
  const AutoConfirmCountdown = ({ deliveredAt }: { deliveredAt: string }) => {
    if (!deliveredAt) return null;
    const deadline = new Date(deliveredAt).getTime() + 72 * 60 * 60 * 1000;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return <span className="text-xs text-amber-500">Auto-confirming soon...</span>;
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return <span className="text-xs text-amber-500">Auto-confirms in {hours > 0 ? `${hours}h` : `${mins}m`}</span>;
  };

  const tabs = [
    { key: 'incoming' as const, label: t('dashboard.incoming'), count: incoming.filter(r => ['pending','accepted','delivered','disputed'].includes(r.status)).length },
    { key: 'outgoing' as const, label: t('dashboard.myRequests'), count: outgoing.filter(r => !['completed','cancelled'].includes(r.status)).length + myHelpWanted.filter(h => !['completed','closed'].includes(h.status)).length },
    { key: 'services' as const, label: t('dashboard.myServices'), count: myServices.length },
    { key: 'schedule' as const, label: t('dashboard.schedule'), count: 0 },
  ];

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      {refreshing && <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}
      {/* Compact header */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-base">{user?.username.charAt(0).toUpperCase()}</div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-bold dark:text-white truncate">{user?.username}</h2>
              {trust && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${trust.level === 'Platinum' ? 'bg-violet-100 text-violet-700' : trust.level === 'Gold' ? 'bg-amber-100 text-amber-700' : trust.level === 'Silver' ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>{trust.level}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
              {trust?.avg_rating && <span>★ {Number(trust.avg_rating).toFixed(1)}</span>}
              {trust?.completed > 0 && <span>{trust.completed} exchanges</span>}
              {myServices.length > 0 && <span>{myServices.length} services</span>}
            </div>
          </div>
          {isIOS ? (
            <div className="shrink-0 text-right ml-auto">
              <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{user?.points}</div>
              <div className="text-xs text-gray-400 mt-0.5">🪃</div>
            </div>
          ) : (
            <Link to="/buy" className="shrink-0 text-right ml-auto hover:opacity-80 transition-opacity">
              <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{user?.points}</div>
              <div className="text-xs text-primary-500 mt-0.5">🪃 gift / top up</div>
            </Link>
          )}
        </div>

        {/* Transaction history */}
        {showTxHistory && txHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent activity</p>
            {txHistory.slice(0, 5).map((tx: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{tx.description || tx.type}</span>
                <span className={`font-semibold shrink-0 ml-2 ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} 🪃
                </span>
              </div>
            ))}
            <Link to="/buy" className="text-xs text-primary-500 hover:text-primary-600 font-medium block mt-1">View all →</Link>
          </div>
        )}
        {(() => {
          const pendingCount = incoming.filter(r => r.status === 'pending').length;
          const unconfirmed = outgoing.filter(r => r.status === 'delivered').length;
          if (pendingCount === 0 && unconfirmed === 0) return null;
          const actions = [];
          if (pendingCount > 0) actions.push(`${pendingCount} pending`);
          if (unconfirmed > 0) actions.push(`${unconfirmed} to confirm`);
          return (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">You have {actions.join(' and ')} →</p>
            </div>
          );
        })()}
      </div>

      {/* Confirm delivery banner */}
      {outgoing.filter(r => r.status === 'delivered').length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              {outgoing.filter(r => r.status === 'delivered').length} exchange{outgoing.filter(r => r.status === 'delivered').length > 1 ? 's' : ''} waiting for your confirmation
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Confirm to release boomerangs to the provider</p>
          </div>
          <button onClick={() => setTab('outgoing')} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 font-medium shrink-0">Review</button>
        </div>
      )}

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Next up</h3>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 2).map((b: any) => {
              const isProvider = b.provider_id === user?.id;
              const otherName = isProvider ? b.requester_name : b.provider_name;
              const rawDate = b.booked_date?.split?.('T')?.[0] || b.booked_date;
              const dateObj = new Date(rawDate + 'T12:00:00');
              const isValidDate = !isNaN(dateObj.getTime());
              const dayName = isValidDate ? dateObj.toLocaleDateString('en', { weekday: 'short' }) : '';
              const dayNum = isValidDate ? String(dateObj.getDate()) : '';
              const calTitle = encodeURIComponent(b.service_title || '');
              const calDate = rawDate?.replace(/-/g, '') || '';
              const calStart = (b.start_time || '').replace(':', '') + '00';
              const calEnd = (b.end_time || '').replace(':', '') + '00';
              const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calDate}T${calStart}/${calDate}T${calEnd}&details=${encodeURIComponent(`Boomerang exchange with ${otherName}`)}`;
              return (
                <div key={b.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] text-primary-500 font-medium">{dayName}</span>
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-400 leading-none">{dayNum}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{b.service_title}</p>
                      <p className="text-xs text-gray-400">{b.start_time} – {b.end_time} · {otherName}</p>
                    </div>
                  </div>
                  <a href={gcalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 shrink-0">+ Cal</a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile completeness — new users only */}
      {user && outgoing.filter(r => r.status === 'completed').length === 0 && incoming.filter(r => r.status === 'completed').length === 0 && (() => {
        const steps = [
          { label: 'Add a photo', done: !!user.avatar, link: '/settings' },
          { label: 'Write a bio', done: !!user.bio, link: '/settings' },
          { label: 'Set location', done: !!user.city, link: '/settings' },
          { label: 'Post a service', done: myServices.length > 0, link: '/services/new' },
        ];
        const done = steps.filter(s => s.done).length;
        if (done === steps.length) return null;
        const pct = Math.round((done / steps.length) * 100);
        return (
          <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-4 mb-4 border border-primary-100 dark:border-primary-800/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Profile {pct}% complete</p>
              <span className="text-xs text-gray-400">{done}/{steps.length}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mb-3">
              <div className="bg-primary-500 h-1 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.filter(s => !s.done).map((s, i) => (
                <Link key={i} to={s.link} className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2.5 py-1 rounded-lg hover:bg-primary-100 transition-colors">+ {s.label}</Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Daily Match — compact single line */}
      {dailyMatch && (
        <div className="bg-white dark:bg-[#202c33] border border-primary-100 dark:border-primary-800/50 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-primary-600 font-medium mb-0.5">Match for you</p>
            <p className="text-sm font-medium dark:text-white truncate">{dailyMatch.title}</p>
            <p className="text-xs text-gray-400">{dailyMatch.requester_name} · {dailyMatch.points_budget} 🪃</p>
          </div>
          <Link to="/help-wanted" className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600 shrink-0">Help →</Link>
        </div>
      )}

      {/* Tabs — 2x2 grid on mobile for better fit */}
      <div className="grid grid-cols-2 gap-1 mb-4 bg-gray-100 dark:bg-[#2a3942] p-1 rounded-xl sm:flex">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap text-center ${tab === tb.key ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
            {tb.label}
            {tb.count > 0 && <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === tb.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>{tb.count}</span>}
          </button>
        ))}
      </div>

      {/* Incoming */}
      {tab === 'incoming' && (
        <div className="space-y-3">
          {loading ? <SkeletonList count={3} /> : <>
          {incoming.filter(r => !['completed','cancelled'].includes(r.status)).length === 0 && incoming.length === 0 && (
            <>
              {/* Profile completion challenge — shown when no incoming requests */}
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
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-2xl p-5 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-primary-700">Get Started Challenge</h3>
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
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-500 text-sm">{t('dashboard.noIncoming')}</p>
              </div>
            </>
          )}
          {/* Disputed items — shown first with warning styling */}
          {/* Disputes — with resolution actions */}
          {[...incoming.filter(r => r.status === 'disputed'), ...outgoing.filter(r => r.status === 'disputed')].length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                Open Disputes ({[...incoming.filter(r => r.status === 'disputed'), ...outgoing.filter(r => r.status === 'disputed')].length})
              </h4>
              <div className="space-y-3">
                {[...incoming.filter(r => r.status === 'disputed').map((r: any) => ({...r, _role: 'provider'})),
                  ...outgoing.filter(r => r.status === 'disputed').map((r: any) => ({...r, _role: 'requester'}))
                ].map((r: any) => (
                  <div key={r.id} className="bg-white dark:bg-[#202c33] p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600 dark:text-white truncate">{r.service_title}</Link>
                          {badge(r.status)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {r._role === 'provider' ? 'Disputed by' : 'You disputed'}{' '}
                          <Link to={`/users/${r._role === 'provider' ? r.requester_id : r.provider_id}`} className="text-primary-600 hover:underline">
                            {r._role === 'provider' ? r.requester_name : r.provider_name}
                          </Link> · {r.points_cost} 🪃
                        </p>
                        {r.dispute_reason && <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">"{r.dispute_reason}"</p>}
                      </div>
                    </div>
                    {/* Resolution actions — different per role */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {r._role === 'requester' ? (
                        <>
                          {/* Requester disputed — they can accept it was done, or cancel */}
                          <button onClick={async () => {
                            const ok = await confirm({ title: 'Accept service was completed', message: `This will transfer ${r.points_cost} boomerangs to the provider. Only do this if the issue is resolved.`, confirmText: 'Yes, complete' });
                            if (ok) { try { await api.resolveDispute(r.id, 'complete'); toast('Resolved — points transferred'); load(); refreshUser(); } catch (err: any) { toast(err.message, 'error'); } }
                          }} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 font-medium">
                            Accept as completed
                          </button>
                          <button onClick={async () => {
                            const ok = await confirm({ title: 'Cancel exchange', message: 'No boomerangs will be transferred. Both parties walk away.', confirmText: 'Cancel exchange', danger: true });
                            if (ok) { try { await api.resolveDispute(r.id, 'cancel'); toast('Cancelled — no points transferred'); load(); } catch (err: any) { toast(err.message, 'error'); } }
                          }} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                            Cancel exchange
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Provider — can agree to cancel, or message to discuss */}
                          <button onClick={async () => {
                            const ok = await confirm({ title: 'Agree to cancel', message: 'No boomerangs will be transferred. The exchange will be cancelled.', confirmText: 'Agree to cancel', danger: true });
                            if (ok) { try { await api.resolveDispute(r.id, 'cancel'); toast('Cancelled — no points transferred'); load(); } catch (err: any) { toast(err.message, 'error'); } }
                          }} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">
                            Agree to cancel
                          </button>
                        </>
                      )}
                      <Link to={`/messages?to=${r._role === 'provider' ? r.requester_id : r.provider_id}`}
                        className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 font-medium">
                        Message to discuss
                      </Link>
                    </div>
                    {/* Chat thread */}
                    <button onClick={() => setExpandedChat(expandedChat === r.id ? null : r.id)}
                      className="text-xs text-gray-400 mt-2 hover:text-primary-600">
                      {expandedChat === r.id ? t('dashboard.hideMessages') : t('dashboard.showMessages')}
                    </button>
                    {expandedChat === r.id && user && <MessageThread requestId={r.id} userId={user.id} />}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Regular incoming (non-disputed, non-completed, non-cancelled) */}
          {incoming.filter(r => !['completed','cancelled','disputed'].includes(r.status)).map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-[#202c33] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600 dark:text-white">{r.service_title}</Link>
                    {badge(r.status)}
                    {r.is_product && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">Item</span>}
                  </div>
                  <p className="text-xs text-gray-500">From <Link to={`/users/${r.requester_id}`} className="text-primary-600 hover:underline">{r.requester_name}</Link> · {r.points_cost} 🪃</p>
                  {r.created_at && <p className="text-xs text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                  {r.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-[#2a3942] p-2.5 rounded-lg italic">"{r.message}"</p>}
                  {r.pickup_details && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">Pickup: {r.pickup_details}</p>}
                  <RequestProgress status={r.status} createdAt={r.created_at} deliveredAt={r.delivered_at} completedAt={r.completed_at} />
                  {/* Pending: explain messaging not available yet */}
                  {r.status === 'pending' && (
                    <p className="text-xs text-gray-400 mt-1">Accept to unlock messaging with {r.requester_name}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(api.acceptRequest, r.id)}
                        className={`w-full sm:w-auto text-xs px-4 py-2 rounded-lg font-medium transition-all ${actionSuccess === r.id ? 'bg-green-500 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'}`}>
                        {actionSuccess === r.id ? '✓ Accepted' : t('dashboard.accept')}
                      </button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="w-full sm:w-auto text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">{t('dashboard.decline')}</button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <>
                      <button onClick={() => setDeliverNote({ id: r.id, note: '' })} className="text-xs bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 font-medium">Mark delivered</button>
                      <button onClick={() => setRescheduleForm({ id: r.id, title: r.service_title, date: '', time: '', note: '' })} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium">Reschedule</button>
                    </>
                  )}
                  {r.status === 'delivered' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-500 font-medium">{t('dashboard.waiting')}</span>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-2.5 py-1 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                    </div>
                  )}
                </div>
              </div>
              {/* Delivery note shown to provider after delivering */}
              {r.status === 'delivered' && r.delivery_note && (
                <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">Your delivery note:</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">{r.delivery_note}</p>
                </div>
              )}
              {/* Chat toggle for accepted/delivered */}
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
          </>}
        </div>
      )}

      {/* Outgoing */}
      {tab === 'outgoing' && (
        <div className="space-y-3">
          {/* Prominent review prompts */}
          {outgoing.filter(r => r.status === 'completed' && Number(r.has_reviewed) === 0).slice(0, 2).map((r: any) => (
            <div key={'review-'+r.id} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">How was your exchange with {r.provider_name}?</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">{r.service_title}</p>
              </div>
              <button onClick={() => setReviewForm({ id: r.id, rating: 5, comment: '', image: null })}
                className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 font-medium shrink-0">Review</button>
            </div>
          ))}
          {outgoing.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-3">🪃</div>
              <p className="text-gray-500 text-sm">You haven't requested any services yet</p>
              <Link to="/browse" className="inline-block mt-3 text-sm font-medium text-primary-600 hover:underline">Browse services →</Link>
            </div>
          )}
          {outgoing.map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-[#202c33] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link to={`/services/${r.service_id}`} className="font-semibold text-sm hover:text-primary-600 dark:text-white">{r.service_title}</Link>
                    {badge(r.status)}
                    {r.is_product && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">Item</span>}
                  </div>
                  <p className="text-xs text-gray-500">From <Link to={`/users/${r.provider_id}`} className="text-primary-600 hover:underline">{r.provider_name}</Link> · {r.points_cost} 🪃</p>
                  {r.created_at && <p className="text-xs text-gray-400 mt-0.5">{new Date(r.created_at).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
                  {r.pickup_details && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">Pickup: {r.pickup_details}</p>}
                  <RequestProgress status={r.status} createdAt={r.created_at} deliveredAt={r.delivered_at} completedAt={r.completed_at} />
                  {/* Delivery note from provider */}
                  {r.status === 'delivered' && r.delivery_note && (
                    <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">Provider note:</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">{r.delivery_note}</p>
                    </div>
                  )}
                  {/* Auto-confirm countdown */}
                  {r.status === 'delivered' && r.delivered_at && (
                    <div className="mt-1.5"><AutoConfirmCountdown deliveredAt={r.delivered_at} /></div>
                  )}
                  {/* Pending: explain dispute option */}
                  {r.status === 'delivered' && (
                    <p className="text-xs text-gray-400 mt-1">Confirm if done, or tap "Something went wrong" to pause the transfer.</p>
                  )}
                  {/* Reschedule proposal */}
                  {r.reschedule_date && r.reschedule_by !== user?.id && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Reschedule proposed: {r.reschedule_date}{r.reschedule_time ? ` at ${r.reschedule_time}` : ''}</p>
                      {r.reschedule_note && <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">"{r.reschedule_note}"</p>}
                      <button onClick={async () => { try { await api.acceptReschedule(r.id); toast('Reschedule accepted!'); load(); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 font-medium">Accept</button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                      <button onClick={() => setRescheduleForm({ id: r.id, title: r.service_title, date: '', time: '', note: '' })}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium">Reschedule</button>
                      {r.booked_date && (
                        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(r.service_title)}&dates=${r.booked_date?.split('T')[0]?.replace(/-/g, '')}T090000/${r.booked_date?.split('T')[0]?.replace(/-/g, '')}T100000&details=${encodeURIComponent('Boomerang exchange with ' + r.provider_name)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:text-primary-600 font-medium">+ Calendar</a>
                      )}
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                    </>
                  )}
                  {r.status === 'delivered' && (
                    <>
                      <button onClick={async () => {
                        await handleAction(api.confirmRequest, r.id);
                        setShoutoutPrompt({ userId: r.provider_id, name: r.provider_name });
                        setShoutoutMsg('');
                      }} className="text-xs bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 font-medium">Confirm ✓</button>
                      <button onClick={async () => {
                        const reason = prompt('What went wrong? (optional)');
                        try { await api.disputeRequest(r.id, reason || undefined); toast('Issue raised — exchange paused'); load(); } catch (err: any) { toast(err.message, 'error'); }
                      }} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-2 rounded-lg hover:bg-red-100 font-medium">Something went wrong</button>
                    </>
                  )}
                  {r.status === 'completed' && Number(r.has_reviewed) === 0 && (
                    <button onClick={() => setReviewForm({ id: r.id, rating: 5, comment: '', image: null })} className="text-xs bg-accent-400 text-white px-4 py-2 rounded-lg hover:bg-accent-500 font-medium">Leave Review</button>
                  )}
                  {r.status === 'completed' && (
                    <div className="text-xs text-gray-400 mb-1">
                      Exchanged with {r.provider_name} for {r.points_cost} 🪃
                    </div>
                  )}
                  {r.status === 'completed' && Number(r.has_reviewed) > 0 && r.review_id && (
                    <button onClick={() => setReviewForm({ id: r.id, rating: r.review_rating || 5, comment: r.review_comment || '', image: null, reviewId: r.review_id, isEdit: true })}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium">Edit Review</button>
                  )}
                  {r.status === 'completed' && (
                    <Link to={`/services/${r.service_id}`} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 font-medium">Request again</Link>
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
                    placeholder="Share your experience..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm h-20 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none mb-2" aria-label="Review comment" />
                  {reviewForm?.image && (
                    <div className="relative mb-2">
                      <img src={reviewForm.image} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button onClick={() => setReviewForm(f => f ? {...f, image: null} : f)} className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2 items-center mb-3">
                    <label className="text-xs text-gray-400 hover:text-primary-500 cursor-pointer flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                      Add photo
                      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setReviewForm(f => f ? {...f, image: reader.result as string} : f);
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={submitReview} className="text-sm bg-primary-500 text-white px-5 py-2 rounded-lg hover:bg-primary-600 font-medium">{reviewForm?.isEdit ? 'Update Review' : 'Submit Review'}</button>
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
            <div key={'hw-'+h.id} className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{h.title}</span>
                    {badge(h.status)}
                  </div>
                  <p className="text-xs text-gray-500">{h.category_name} · {h.points_budget} 🪃</p>
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
                    <button onClick={async () => { const ok = await confirm({ title: 'Delete request', message: 'Are you sure you want to delete this help request?', confirmText: 'Delete', danger: true }); if (ok) { await api.deleteHelpWanted(h.id); load(); } }} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Items I'm helping with */}
          {myHelping.length > 0 && <h4 className="text-xs font-semibold text-gray-400 mt-6">I'm Helping With</h4>}
          {myHelping.map((h: any) => (
            <div key={'helping-'+h.id} className="bg-white p-5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{h.title}</span>
                    {badge(h.status)}
                  </div>
                  <p className="text-xs text-gray-500">{h.category_name} · {h.points_budget} 🪃</p>
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
            <div key={s.id} className="bg-white dark:bg-[#202c33] p-5 rounded-xl shadow-sm flex items-center justify-between">
              <Link to={`/services/${s.id}`} className="flex-1 group">
                <h3 className="font-semibold text-sm group-hover:text-primary-600 dark:text-white cursor-pointer">{s.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{s.category_name} · {s.points_cost} 🪃</p>
              </Link>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <Link to={`/services/${s.id}/edit`} className="text-xs text-primary-500 hover:text-primary-600">Edit</Link>
                <Link to={`/services/${s.id}`} className="text-xs text-gray-400 hover:text-primary-600">View</Link>
                <button onClick={async () => { const ok = await confirm({ title: 'Delete service', message: 'Are you sure you want to delete this service? This cannot be undone.', confirmText: 'Delete', danger: true }); if (ok) { await api.deleteService(s.id); load(); } }} className="text-xs text-gray-400 hover:text-red-500">Delete</button>
              </div>
            </div>
          ))}

          {/* Service history — all requests for my services */}
          {incoming.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Service History</h4>
              <div className="space-y-2">
                {incoming.map((r: any) => (
                  <div key={r.id} className="bg-white dark:bg-[#202c33] px-4 py-3 rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium dark:text-white truncate">{r.service_title}</span>
                        {badge(r.status)}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.requester_name} · {r.points_cost} 🪃
                        {r.created_at && ` · ${new Date(r.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <Link to={`/messages?to=${r.requester_id}`} className="text-xs text-primary-500 hover:text-primary-600 shrink-0 ml-2">Message</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && <ScheduleTab loaded={scheduleLoaded} slots={availSlots} setSlots={setAvailSlots} onLoad={() => setScheduleLoaded(true)} />}

      {/* Deliver note modal */}
      {deliverNote && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setDeliverNote(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-lg dark:text-white mb-2">Mark as delivered</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add an optional note for the requester — what did you deliver, any handover details?</p>
            {deliverPhoto ? (
              <div className="relative mb-3">
                <img src={deliverPhoto} alt="" className="w-full h-32 object-cover rounded-xl" />
                <button onClick={() => setDeliverPhoto(null)} className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">✕</button>
              </div>
            ) : (
              <label className="block mb-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-3 text-center cursor-pointer hover:border-primary-300">
                <span className="text-xs text-gray-400">Add delivery photo (optional)</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setDeliverPhoto(reader.result as string);
                  reader.readAsDataURL(file);
                }} />
              </label>
            )}
            <textarea value={deliverNote.note} onChange={e => setDeliverNote(d => d ? { ...d, note: e.target.value } : d)}
              placeholder="e.g. Dropped off at your door, left with neighbour, completed the task as discussed..."
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none h-24 focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setDeliverNote(null)} className="flex-1 border border-gray-200 dark:border-gray-600 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={async () => {
                try {
                  await api.deliverRequest(deliverNote.id, deliverNote.note || undefined);
                  toast('Marked as delivered!'); setDeliverNote(null); load();
                } catch (err: any) { toast(err.message, 'error'); }
              }} className="flex-1 bg-purple-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-purple-600">Mark delivered</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setRescheduleForm(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-bold text-lg dark:text-white mb-1">Propose reschedule</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{rescheduleForm.title}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">New date</label>
                <input type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm(f => f ? { ...f, date: e.target.value } : f)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">New time (optional)</label>
                <input type="time" value={rescheduleForm.time} onChange={e => setRescheduleForm(f => f ? { ...f, time: e.target.value } : f)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white" />
              </div>
            </div>
            <input type="text" value={rescheduleForm.note} onChange={e => setRescheduleForm(f => f ? { ...f, note: e.target.value } : f)}
              placeholder="Reason (optional)"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRescheduleForm(null)} className="flex-1 border border-gray-200 dark:border-gray-600 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300">Cancel</button>
              <button onClick={async () => {
                if (!rescheduleForm.date) { toast('Please pick a date', 'error'); return; }
                try {
                  await api.rescheduleRequest(rescheduleForm.id, { new_date: rescheduleForm.date, new_time: rescheduleForm.time, note: rescheduleForm.note });
                  toast('Reschedule proposed!'); setRescheduleForm(null); load();
                } catch (err: any) { toast(err.message, 'error'); }
              }} className="flex-1 bg-primary-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-600">Send proposal</button>
            </div>
          </div>
        </div>
      )}

      {/* Thank you / Shoutout prompt */}
      {shoutoutPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShoutoutPrompt(null)}>
          <div className="bg-white dark:bg-[#202c33] rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <h3 className="font-semibold dark:text-white">Exchange completed!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Say thanks to {shoutoutPrompt.name}?</p>
            </div>
            <textarea value={shoutoutMsg} onChange={e => setShoutoutMsg(e.target.value)}
              placeholder={`Thanks ${shoutoutPrompt.name}! Great job...`}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm resize-none h-20 bg-white dark:bg-[#2a3942] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none mb-3" />
            <div className="flex gap-2">
              <button onClick={async () => {
                if (shoutoutMsg.trim()) {
                  try { await api.postShoutout({ to_user_id: shoutoutPrompt.userId, message: shoutoutMsg }); toast('Shoutout posted!'); } catch {}
                }
                setShoutoutPrompt(null);
              }} className="flex-1 bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
                {shoutoutMsg.trim() ? 'Send thanks' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
