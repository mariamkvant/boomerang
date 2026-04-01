import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

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
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people to invite..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-20 max-h-60 overflow-y-auto">
          {results.map((u: any) => (
            <button key={u.id} onClick={() => invite(u.username)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                {u.username?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.username}</p>
                <p className="text-xs text-gray-400 truncate">{u.city || ''}{u.languages_spoken ? ` · ${u.languages_spoken}` : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
      {msg && <p className="text-xs text-primary-600 mt-1">{msg}</p>}
    </div>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  const reload = () => {
    api.getGroup(Number(id)).then(g => {
      setGroup(g);
      if (g.members?.some((m: any) => m.id === user?.id && m.role === 'admin')) {
        api.getJoinRequests(Number(id)).then(setJoinRequests).catch(() => {});
      }
    }).catch(() => {});
  };
  useEffect(() => { reload(); }, [id]);

  if (!group) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const isMember = group.members?.some((m: any) => m.id === user?.id);
  const isAdmin = group.members?.some((m: any) => m.id === user?.id && m.role === 'admin');
  const shareUrl = group.invite_code ? `${window.location.origin}/register?group=${group.invite_code}` : '';

  const handleJoin = async () => { try { await api.joinGroup(Number(id)); reload(); } catch {} };
  const handleLeave = async () => { try { await api.leaveGroup(Number(id)); reload(); } catch {} };
  const handleRemove = async (userId: number) => {
    if (!confirm('Remove this member?')) return;
    try { await api.removeMember(Number(id), userId); reload(); } catch (err: any) { alert(err.message); }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Join ${group.name} on Boomerang`, text: `Join our community "${group.name}" on Boomerang — exchange skills, no money needed.`, url: shareUrl }); }
      catch {}
    } else { copyShareLink(); }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-500 text-sm mb-3">{group.description}</p>
            <div className="text-xs text-gray-400">{group.member_count} members · Created by {group.creator_name}</div>
          </div>
          <div>
            {user && !isMember && <button onClick={handleJoin} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600">Request to Join</button>}
            {user && isMember && !isAdmin && <button onClick={handleLeave} className="text-xs text-gray-400 hover:text-red-500 px-3 py-2">Leave Group</button>}
            {isAdmin && (
              <button onClick={async () => { if (confirm('Delete this community? This cannot be undone.')) { try { await api.deleteGroup(Number(id)); navigate('/groups'); } catch (err: any) { alert(err.message); } } }}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-2 ml-2">Delete</button>
            )}
          </div>
        </div>

        {/* Share & invite code section */}
        {isMember && group.invite_code && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1.5">Invite code</p>
                <div className="flex gap-2">
                  <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-mono flex-1">{group.invite_code}</code>
                  <button onClick={() => { navigator.clipboard.writeText(group.invite_code); }} className="text-xs text-primary-600 hover:underline shrink-0">Copy</button>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1.5">Share link</p>
                <div className="flex gap-2">
                  <button onClick={nativeShare}
                    className="flex-1 bg-primary-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-600">
                    {shareCopied ? '✓ Copied!' : 'Share invite link'}
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Join "${group.name}" on Boomerang: ${shareUrl}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-600 shrink-0">WhatsApp</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {group.is_private_content ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Members Only</h3>
          <p className="text-gray-500 text-sm mb-6">Join this community to see members, services, and discussions.</p>
          {user && !isMember && <button onClick={handleJoin} className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Request to Join</button>}
          {!user && <Link to="/login" className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Log in to Join</Link>}
        </div>
      ) : (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Services</h3>
            <div className="flex gap-3">
              {isMember && <Link to={`/services/new?group=${id}`} className="text-xs text-primary-600 hover:underline">+ Add service</Link>}
              {isMember && <Link to={`/help-wanted?group=${id}`} className="text-xs text-primary-600 hover:underline">+ Ask for help</Link>}
            </div>
          </div>
          {group.services?.length > 0 ? (
            <div className="space-y-3">
              {group.services.map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`} className="block bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary-600">{s.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{s.category_name} · {s.points_cost} boomerangs · by {s.provider_name}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-primary-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8 bg-white rounded-xl shadow-card">No services in this group yet.</p>
          )}
        </div>

        <div>
          <h3 className="font-bold mb-4">Members ({group.members?.length})</h3>
          {isMember && (
            <div className="bg-white p-4 rounded-xl shadow-card mb-3">
              <UserSearchInvite groupId={Number(id)} onInvited={reload} />
            </div>
          )}
          {isAdmin && joinRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-3">
              <h4 className="text-sm font-semibold text-amber-700 mb-2">Pending Join Requests ({joinRequests.length})</h4>
              {joinRequests.map((jr: any) => (
                <div key={jr.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs">{jr.username?.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="text-sm font-medium">{jr.username}</span>
                      {jr.city && <span className="text-xs text-gray-400 ml-1">{jr.city}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={async () => { await api.approveJoinRequest(Number(id), jr.id); reload(); }} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">Approve</button>
                    <button onClick={async () => { await api.denyJoinRequest(Number(id), jr.id); reload(); }} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300">Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-xl shadow-card divide-y divide-gray-50">
            {group.members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <Link to={`/users/${m.id}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-medium">{m.username?.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-medium">{m.username}</p>
                    <p className="text-[10px] text-gray-400">{m.role}{m.city ? ` · ${m.city}` : ''}</p>
                  </div>
                </Link>
                {isAdmin && m.id !== user?.id && (
                  <button onClick={() => handleRemove(m.id)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
