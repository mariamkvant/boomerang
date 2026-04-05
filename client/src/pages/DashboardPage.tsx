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
  const [shoutoutPrompt, setShoutoutPrompt] = useState<{ userId: number; name: string } | null>(null);
  const [shoutoutMsg, setShoutoutMsg] = useState('');
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
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
      api.getUpcomingBookings().then(setUpcomingBookings).catch(() => {});
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
          <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
            <div className="text-center shrink-0">
              <div className="text-2xl font-bold text-gray-900">{user?.points}</div>
              <Link to="/buy" className="text-[11px] text-primary-500 hover:underline uppercase tracking-wide">+ {t('dashboard.boomerangs')}</Link>
            </div>
            <div className="text-center shrink-0">
              <div className="text-2xl font-bold text-gray-900">{myServices.length}</div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide">{t('dashboard.services')}</div>
            </div>
            {trust && trust.avg_rating && (
              <div className="text-center shrink-0">
                <div className="text-2xl font-bold text-gray-900">{Number(trust.avg_rating).toFixed(1)}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wide">{trust.review_count} reviews</div>
              </div>
            )}
            {trust && (
              <div className="text-center shrink-0">
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

      {/* Referral banner — prominent */}
      {user && (
        <div className="bg-gradient-to-r from-primary-500 to-orange-400 rounded-2xl p-4 sm:p-5 mb-6 text-white">
          <h3 className="font-bold text-base sm:text-lg">Invite a friend, get 25 🪃</h3>
          <p className="text-white/80 text-xs sm:text-sm mt-1">They get 25 too. Share and grow the community.</p>
          <div className="flex gap-2 mt-3">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Join me on Boomerang — exchange skills without money! ${window.location.origin}/register?ref=${user.id}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                Share
              </a>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.id}`); toast('Link copied!'); }}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>
                Copy
              </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        <Link to="/browse" className="bg-white dark:bg-[#202c33] rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all group">
          <svg className="w-6 h-6 mx-auto text-primary-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">{t('nav.browse2')}</span>
        </Link>
        <Link to="/services/new" className="bg-white dark:bg-[#202c33] rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all group">
          <svg className="w-6 h-6 mx-auto text-green-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">{t('nav.offer2')}</span>
        </Link>
        <Link to="/help-wanted" className="bg-white dark:bg-[#202c33] rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all group">
          <svg className="w-6 h-6 mx-auto text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.653-4.657m5.014-2.024a3.004 3.004 0 0 0-.862-4.228 3.005 3.005 0 0 0-4.228.862M11.42 15.17l-1.43-1.43" /></svg>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">{t('help.askForHelp')}</span>
        </Link>
        <Link to="/groups" className="bg-white dark:bg-[#202c33] rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all group">
          <svg className="w-6 h-6 mx-auto text-purple-500 mb-1.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
          <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">{t('groups.title')}</span>
        </Link>
      </div>

      {/* Upcoming bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Next up</h3>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((b: any) => {
              const isProvider = b.provider_id === user?.id;
              const otherName = isProvider ? b.requester_name : b.provider_name;
              const rawDate = b.booked_date?.split?.('T')?.[0] || b.booked_date;
              const dateObj = new Date(rawDate + 'T12:00:00');
              const isValidDate = !isNaN(dateObj.getTime());
              const dateStr = isValidDate ? dateObj.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : rawDate;
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
                    <div className="w-10 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] text-primary-500 font-medium">{dayName}</span>
                      <span className="text-sm font-bold text-primary-700 dark:text-primary-400">{dayNum}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{b.service_title}</p>
                      <p className="text-xs text-gray-400">{b.start_time} – {b.end_time} · with {otherName}</p>
                    </div>
                  </div>
                  <a href={gcalUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-primary-500 hover:text-primary-600 shrink-0">+ Calendar</a>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* First exchange nudge — shown when user has no completed exchanges */}
      {user && outgoing.filter(r => r.status === 'completed').length === 0 && incoming.filter(r => r.status === 'completed').length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6 border border-primary-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Complete your first exchange</h3>
              <p className="text-xs text-gray-500 mt-1">Browse services nearby and request one. Your first exchange earns you a Superhelper badge.</p>
              <Link to="/browse" className="inline-block mt-3 bg-primary-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors">Browse services</Link>
            </div>
          </div>
        </div>
      )}

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
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex-1 min-w-0 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === tb.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-500 font-medium">{t('dashboard.waiting')}</span>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                    </div>
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
                    <>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                    </>
                  )}
                  {r.status === 'accepted' && (
                    <>
                      <button onClick={async () => { try { await api.nudgeRequest(r.id); toast('Nudge sent!'); } catch (err: any) { toast(err.message, 'error'); } }}
                        className="text-xs bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 font-medium">Nudge</button>
                      <button onClick={() => handleAction(api.cancelRequest, r.id)} className="text-xs bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
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
                        const reason = prompt('Why are you disputing? (optional)');
                        try { await api.disputeRequest(r.id, reason || undefined); toast('Dispute opened'); load(); } catch (err: any) { toast(err.message, 'error'); }
                      }} className="text-xs bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 font-medium">Dispute</button>
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
