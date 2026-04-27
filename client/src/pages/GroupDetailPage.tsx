import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { t } from '../i18n';

function UserSearchInvite({ groupId, onInvited }: { groupId: number; onInvited: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { const people = await api.searchPeople(query.trim()); setResults(people.slice(0, 6)); }
      catch { setResults([]); }
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const invite = async (username: string) => {
    try {
      await api.inviteToGroup(groupId, username);
      setMsg(`${username} invited!`);
      setQuery(''); setResults([]);
      onInvited();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) { setMsg(err.message); setTimeout(() => setMsg(''), 3000); }
  };

  return (
    <div className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('groups.invite') + '...'}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-[#202c33] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
      </div>
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#202c33] rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 z-20 max-h-60 overflow-y-auto">
          {results.map((u: any) => (
            <button key={u.id} onClick={() => invite(u.username)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] text-left border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                style={{ background: `linear-gradient(135deg, #f97316, #ea580c)` }}>
                {u.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{u.username}</p>
                <p className="text-xs text-gray-400 truncate">{u.city || ''}{u.languages_spoken ? ` · ${u.languages_spoken}` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="text-xs text-gray-400 mt-1.5">Searching...</p>}
      {msg && <p className="text-xs text-primary-600 mt-1.5 font-medium">{msg}</p>}
    </div>
  );
}

function GroupActivityFeed({ groupId }: { groupId: number }) {
  const [activity, setActivity] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getGroupActivity(groupId).then(a => { setActivity(a); setLoaded(true); }).catch(() => setLoaded(true));
  }, [groupId]);

  if (!loaded || activity.length === 0) return null;

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('groups.activity')}</h3>
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm divide-y divide-gray-50 dark:divide-gray-700">
        {activity.map((item: any, i: number) => (
          <div key={i} className="px-4 py-3.5 flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              item.type === 'new_service' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' :
              item.type === 'new_member' ? 'bg-green-50 dark:bg-green-900/30 text-green-600' :
              'bg-purple-50 dark:bg-purple-900/30 text-purple-600'
            }`}>
              {item.type === 'new_service' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              ) : item.type === 'new_member' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {item.type === 'new_service' && (
                <p className="text-sm dark:text-gray-200"><Link to={`/users/${item.user_id}`} className="font-medium hover:text-primary-600">{item.username}</Link> added <Link to={`/services/${item.id}`} className="font-medium text-primary-600 hover:underline">{item.title}</Link></p>
              )}
              {item.type === 'new_member' && (
                <p className="text-sm dark:text-gray-200"><Link to={`/users/${item.user_id}`} className="font-medium hover:text-primary-600">{item.username}</Link> joined{item.city ? ` from ${item.city}` : ''}</p>
              )}
              {item.type === 'exchange' && (
                <p className="text-sm dark:text-gray-200"><Link to={`/users/${item.provider_id}`} className="font-medium hover:text-primary-600">{item.provider_name}</Link> helped <Link to={`/users/${item.requester_id}`} className="font-medium hover:text-primary-600">{item.requester_name}</Link> with {item.title}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(item.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [group, setGroup] = useState<any>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [attachedService, setAttachedService] = useState<any>(null);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [isEvent, setIsEvent] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});

  const reload = () => {
    api.getGroup(Number(id)).then(g => {
      setGroup(g);
      if (g.members?.some((m: any) => m.id === user?.id && m.role === 'admin')) {
        api.getJoinRequests(Number(id)).then(setJoinRequests).catch(() => {});
      }
    }).catch(() => {});
    api.getGroupAnnouncements(Number(id)).then(setAnnouncements).catch(() => {});
    if (user) api.getServices(`provider=${user.id}`).then((res: any) => {
      const svcs = Array.isArray(res) ? res : res.services || [];
      setMyServices(svcs.filter((s: any) => s.is_active !== 0));
    }).catch(() => {});
  };
  useEffect(() => { reload(); }, [id]);

  if (!group) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isMember = group.members?.some((m: any) => m.id === user?.id);
  const isAdmin = group.members?.some((m: any) => m.id === user?.id && m.role === 'admin');
  const shareUrl = group.invite_code ? `${window.location.origin}/register?group=${group.invite_code}` : '';

  const handleJoin = async () => { try { await api.joinGroup(Number(id)); toast('Request sent!', 'success'); reload(); } catch {} };

  const loadComments = async (annId: number) => {
    const data = await api.getAnnouncementComments(Number(id), annId);
    setComments(prev => ({ ...prev, [annId]: data }));
  };

  const toggleComments = async (annId: number) => {
    const next = new Set(expandedComments);
    if (next.has(annId)) { next.delete(annId); } else { next.add(annId); await loadComments(annId); }
    setExpandedComments(next);
  };

  const submitComment = async (annId: number) => {
    const content = newComment[annId]?.trim();
    if (!content) return;
    try {
      await api.postAnnouncementComment(Number(id), annId, content);
      setNewComment(prev => ({ ...prev, [annId]: '' }));
      await loadComments(annId);
      setAnnouncements(prev => prev.map(a => a.id === annId ? { ...a, comment_count: (a.comment_count || 0) + 1 } : a));
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleRsvp = async (annId: number, iRsvped: boolean) => {
    try {
      if (iRsvped) { await api.cancelRsvp(Number(id), annId); }
      else { await api.rsvpAnnouncement(Number(id), annId); }
      setAnnouncements(prev => prev.map(a => a.id === annId ? {
        ...a,
        i_rsvped: !iRsvped,
        rsvp_count: (a.rsvp_count || 0) + (iRsvped ? -1 : 1)
      } : a));
    } catch (err: any) { toast(err.message, 'error'); }
  };
  const handleLeave = async () => {
    const ok = await confirm({ title: t('groups.leave'), message: 'Are you sure you want to leave this community?', confirmText: 'Leave', danger: true });
    if (ok) { try { await api.leaveGroup(Number(id)); reload(); } catch {} }
  };
  const handleRemove = async (userId: number) => {
    const ok = await confirm({ title: 'Remove member', message: 'Are you sure you want to remove this member?', confirmText: 'Remove', danger: true });
    if (!ok) return;
    try { await api.removeMember(Number(id), userId); reload(); } catch (err: any) { toast(err.message, 'error'); }
  };
  const handleDelete = async () => {
    const ok = await confirm({ title: t('groups.delete'), message: 'This will permanently delete this community and all its data. This cannot be undone.', confirmText: 'Delete', danger: true });
    if (ok) { try { await api.deleteGroup(Number(id)); navigate('/groups'); } catch (err: any) { toast(err.message, 'error'); } }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    toast('Link copied!', 'success');
    setTimeout(() => setShareCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Join ${group.name} on Boomerang`, text: `Join our community "${group.name}" on Boomerang — exchange skills, no money needed.`, url: shareUrl }); }
      catch {}
    } else { copyShareLink(); }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-4 pb-24 md:pb-8">
      {/* Header card */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* Cover photo or gradient */}
        <div className="h-32 sm:h-40 relative overflow-hidden">
          {group.cover_image ? (
            <img src={group.cover_image} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-500 to-orange-400" />
          )}
          {isAdmin && (
            <label className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-lg cursor-pointer backdrop-blur transition-colors">
              {group.cover_image ? 'Change cover' : 'Add cover'}
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => { try { await api.updateGroupCover(Number(id), reader.result as string); reload(); } catch {} };
                reader.readAsDataURL(file);
              }} />
            </label>
          )}
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#202c33] shadow-lg flex items-center justify-center text-2xl font-bold text-primary-600">
              {group.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold dark:text-white truncate">{group.name}</h1>
              {group.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">{group.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                  {group.member_count} {t('groups.members')}
                </span>
                <span>·</span>
                <span>by {group.creator_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-4">
              {user && !isMember && (
                <button onClick={handleJoin} className="bg-primary-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
                  {t('groups.join')}
                </button>
              )}
              {user && isMember && !isAdmin && (
                <button onClick={handleLeave} className="text-xs text-gray-400 hover:text-red-500 transition-colors">{t('groups.leave')}</button>
              )}
              {isAdmin && (
                <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 transition-colors">{t('groups.delete')}</button>
              )}
            </div>
          </div>

          {/* Share section */}
          {isMember && shareUrl && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                <button onClick={nativeShare}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-[#2a3942] hover:bg-gray-100 dark:hover:bg-[#3a4a54] px-4 py-2 rounded-xl text-sm font-medium transition-colors dark:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                  {shareCopied ? 'Copied!' : 'Share invite link'}
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Join "${group.name}" on Boomerang: ${shareUrl}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Private content gate */}
      {group.is_private_content ? (
        <div className="text-center py-16 bg-white dark:bg-[#202c33] rounded-2xl shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#2a3942] flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
          </div>
          <h3 className="text-lg font-semibold dark:text-white mb-1">{t('groups.membersOnly')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs mx-auto">{t('groups.membersOnlyDesc')}</p>
          {user && !isMember && <button onClick={handleJoin} className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">{t('groups.join')}</button>}
          {!user && <Link to="/login" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors inline-block">{t('login')}</Link>}
        </div>
      ) : (
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Admin: pending join requests */}
          {isAdmin && joinRequests.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl">
              <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                {t('groups.pendingRequests')} ({joinRequests.length})
              </h4>
              <div className="space-y-2">
                {joinRequests.map((jr: any) => (
                  <div key={jr.id} className="flex items-center justify-between bg-white dark:bg-[#202c33] rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        {jr.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium dark:text-white">{jr.username}</span>
                        {jr.city && <span className="text-xs text-gray-400 ml-2">{jr.city}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => { await api.approveJoinRequest(Number(id), jr.id); reload(); }}
                        className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors font-medium">{t('groups.approve')}</button>
                      <button onClick={async () => { await api.denyJoinRequest(Number(id), jr.id); reload(); }}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t('groups.deny')}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('groups.services')}</h3>
              {isMember && (
                <div className="flex gap-3">
                  <Link to={`/services/new?group=${id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">{t('groups.addService')}</Link>
                  <Link to={`/help-wanted?group=${id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">{t('groups.askForHelp')}</Link>
                </div>
              )}
            </div>
            {group.services?.length > 0 ? (
              <div className="space-y-2">
                {group.services.map((s: any) => (
                  <Link key={s.id} to={`/services/${s.id}`} className="block bg-white dark:bg-[#202c33] p-4 rounded-xl shadow-sm hover:shadow-md group transition-all">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm dark:text-white group-hover:text-primary-600 transition-colors truncate">{s.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{s.category_name} · {s.points_cost} boomerangs · {t('service.by')} {s.provider_name}</p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors shrink-0 ml-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-[#202c33] rounded-2xl shadow-sm">
                <svg className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                <p className="text-gray-400 text-sm">{t('groups.noServices')}</p>
              </div>
            )}
          </div>

          {/* Announcements */}
          {isMember && (
            <div className="mb-6">
              {/* Post form */}
              <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-4 mb-3">
                {/* Post type toggle */}
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setIsEvent(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${!isEvent ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#2a3942] text-gray-500 dark:text-gray-400'}`}>
                    Post
                  </button>
                  <button onClick={() => setIsEvent(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${isEvent ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#2a3942] text-gray-500 dark:text-gray-400'}`}>
                    Event
                  </button>
                </div>

                {/* Event fields */}
                {isEvent && (
                  <div className="space-y-2 mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Date</label>
                        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                          className="w-full mt-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#202c33] dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Time</label>
                        <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                          className="w-full mt-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#202c33] dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Location</label>
                      <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="e.g. Parc Merl, Luxembourg City"
                        className="w-full mt-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#202c33] dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Max attendees (optional)</label>
                      <input type="number" min="1" value={maxAttendees} onChange={e => setMaxAttendees(e.target.value)} placeholder="Leave empty for unlimited"
                        className="w-full mt-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#202c33] dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                  </div>
                )}

                <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                  placeholder={isEvent ? "Describe the event..." : "Share something with the community..."}
                  className="w-full border-0 bg-transparent text-sm resize-none outline-none dark:text-white placeholder:text-gray-400 min-h-[60px]" />
                {postImage && (
                  <div className="relative mt-2">
                    <img src={postImage} alt="" className="w-full h-32 object-cover rounded-lg" />
                    <button onClick={() => setPostImage(null)} className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center">✕</button>
                  </div>
                )}
                {/* Attached service preview */}
                {attachedService && (
                  <div className="mt-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-primary-500 font-medium">Attached service</p>
                      <p className="text-sm font-medium dark:text-white truncate">{attachedService.title}</p>
                      <p className="text-xs text-gray-400">{attachedService.points_cost} 🪃 · {attachedService.category_name}</p>
                    </div>
                    <button onClick={() => setAttachedService(null)} className="text-gray-400 hover:text-red-500 ml-2 shrink-0">✕</button>
                  </div>
                )}
                {/* Service picker dropdown */}
                {showServicePicker && (
                  <div className="mt-2 bg-white dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {myServices.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3 text-center">No services yet. <Link to="/services/new" className="text-primary-500">Create one →</Link></p>
                    ) : myServices.map((s: any) => (
                      <button key={s.id} onClick={() => { setAttachedService(s); setShowServicePicker(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-[#374151] border-b border-gray-50 dark:border-gray-700 last:border-0">
                        <p className="text-sm font-medium dark:text-white truncate">{s.title}</p>
                        <p className="text-xs text-gray-400">{s.points_cost} 🪃 · {s.category_name}</p>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-3">
                    <label className="text-xs text-gray-400 hover:text-primary-500 cursor-pointer flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 0 0 2.25-2.25V5.25a2.25 2.25 0 0 0-2.25-2.25H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                      Photo
                      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setPostImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                    <button onClick={() => setShowServicePicker(!showServicePicker)}
                      className={`text-xs flex items-center gap-1 ${attachedService ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      {attachedService ? 'Service attached' : 'Attach service'}
                    </button>
                  </div>
                  <button onClick={async () => {
                    if (!newPost.trim()) return;
                    try {
                      await api.postAnnouncement(Number(id), {
                        content: newPost, image: postImage, service_id: attachedService?.id || null,
                        event_date: isEvent && eventDate ? eventDate : null,
                        event_time: isEvent && eventTime ? eventTime : null,
                        event_location: isEvent && eventLocation ? eventLocation : null,
                        max_attendees: isEvent && maxAttendees ? Number(maxAttendees) : null,
                      });
                      setNewPost(''); setPostImage(null); setAttachedService(null); setShowServicePicker(false);
                      setIsEvent(false); setEventDate(''); setEventTime(''); setEventLocation(''); setMaxAttendees('');
                      reload(); toast('Posted!', 'success');
                    } catch (err: any) { toast(err.message, 'error'); }
                  }} disabled={!newPost.trim()}
                    className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors">
                    {isEvent ? 'Create Event' : 'Post'}
                  </button>
                </div>
              </div>

              {/* Announcement list */}
              {announcements.length > 0 && (
                <div className="space-y-3">
                  {announcements.map((a: any) => (
                    <div key={a.id} className={`bg-white dark:bg-[#202c33] rounded-2xl shadow-sm p-4 ${a.pinned ? 'border border-primary-200 dark:border-primary-800' : ''}`}>
                      {a.pinned && <span className="text-[10px] text-primary-500 font-medium uppercase tracking-wider">Pinned</span>}
                      <div className="flex items-start gap-3 mt-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                          {a.author_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium dark:text-white">{a.author_name}</span>
                            <span className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{a.content}</p>
                          {a.image && <img src={a.image} alt="" loading="lazy" className="mt-2 rounded-lg max-h-64 object-cover" />}

                          {/* Event details card */}
                          {a.event_date && (
                            <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">
                  <svg className="w-5 h-5 text-primary-600 inline" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                </span>
                                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                                  {new Date(a.event_date + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}
                                  {a.event_time && ` at ${a.event_time}`}
                                </span>
                              </div>
                              {a.event_location && (
                                <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
                                  <span>{a.event_location}</span>
                                </div>
                              )}
                              {a.max_attendees && (
                                <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 mt-1">
                                  <span>{a.rsvp_count || 0} / {a.max_attendees} spots taken</span>
                                </div>
                              )}
                              {/* RSVP button */}
                              {user && isMember && (
                                <button onClick={() => handleRsvp(a.id, a.i_rsvped)}
                                  className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${a.i_rsvped ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#202c33] border border-primary-300 text-primary-600 hover:bg-primary-50'}`}>
                                  {a.i_rsvped ? `✓ Going (${a.rsvp_count || 0})` : `I'm Going · ${a.rsvp_count || 0} attending`}
                                </button>
                              )}
                              {!user && (
                                <div className="mt-2 text-xs text-primary-600 dark:text-primary-400">{a.rsvp_count || 0} attending</div>
                              )}
                            </div>
                          )}

                          {/* Attached service card */}
                          {a.service_id && (
                            <Link to={`/services/${a.service_id}`} className="mt-3 flex items-center gap-3 bg-gray-50 dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl p-3 hover:border-primary-300 transition-colors block">
                              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-lg shrink-0">
                                {a.service_category_icon || ''}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium dark:text-white truncate">{a.service_title}</p>
                                <p className="text-xs text-gray-400">{a.service_points} 🪃 · {a.service_category} · by {a.service_provider}</p>
                              </div>
                              <span className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-lg shrink-0 font-medium">Request</span>
                            </Link>
                          )}

                          {/* Actions row */}
                          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50 dark:border-gray-700">
                            <button onClick={() => toggleComments(a.id)}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                              {a.comment_count > 0 ? `${a.comment_count} comment${a.comment_count !== 1 ? 's' : ''}` : 'Comment'}
                            </button>
                            {(a.author_id === user?.id || isAdmin) && (
                              <>
                                {isAdmin && (
                                  <button onClick={async () => { await api.togglePinAnnouncement(Number(id), a.id); reload(); }}
                                    className="text-xs text-gray-400 hover:text-primary-500">{a.pinned ? 'Unpin' : 'Pin'}</button>
                                )}
                                <button onClick={async () => { await api.deleteAnnouncement(Number(id), a.id); reload(); }}
                                  className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                              </>
                            )}
                          </div>

                          {/* Comments section */}
                          {expandedComments.has(a.id) && (
                            <div className="mt-3 space-y-2">
                              {(comments[a.id] || []).map((c: any) => (
                                <div key={c.id} className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-medium shrink-0 mt-0.5">
                                    {c.author_name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 bg-gray-50 dark:bg-[#2a3942] rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium dark:text-white">{c.author_name}</span>
                                      {(c.author_id === user?.id || isAdmin) && (
                                        <button onClick={async () => { await api.deleteAnnouncementComment(Number(id), a.id, c.id); await loadComments(a.id); setAnnouncements(prev => prev.map(ann => ann.id === a.id ? { ...ann, comment_count: Math.max(0, (ann.comment_count || 0) - 1) } : ann)); }}
                                          className="text-[9px] text-gray-400 hover:text-red-500">✕</button>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                              {user && isMember && (
                                <div className="flex gap-2 mt-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-medium shrink-0 mt-1">
                                    {user.username?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 flex gap-2">
                                    <input value={newComment[a.id] || ''} onChange={e => setNewComment(prev => ({ ...prev, [a.id]: e.target.value }))}
                                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(a.id); } }}
                                      placeholder="Write a comment..." className="flex-1 bg-gray-50 dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary-500 dark:text-white" />
                                    <button onClick={() => submitComment(a.id)} disabled={!newComment[a.id]?.trim()}
                                      className="bg-primary-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary-600 disabled:opacity-40">Post</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Feed */}
          <GroupActivityFeed groupId={Number(id)} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Invite search */}
          {isMember && (
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('groups.invite')}</h3>
              <UserSearchInvite groupId={Number(id)} onInvited={reload} />
            </div>
          )}

          {/* Members list */}
          <div className="bg-white dark:bg-[#202c33] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('groups.members')} ({group.members?.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {group.members?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors">
                  <Link to={`/users/${m.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                      style={{ background: `linear-gradient(135deg, #f97316, #ea580c)` }}>
                      {m.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium dark:text-white truncate">{m.username}</p>
                      <p className="text-[11px] text-gray-400">
                        {m.role === 'admin' && <span className="text-primary-600 font-medium">Admin</span>}
                        {m.role === 'admin' && m.city && ' · '}
                        {m.city || ''}
                      </p>
                    </div>
                  </Link>
                  {isAdmin && m.id !== user?.id && (
                    <button onClick={() => handleRemove(m.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2 shrink-0">{t('groups.removeMember')}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
