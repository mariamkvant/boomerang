import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  const reload = () => api.getGroup(Number(id)).then(setGroup).catch(() => {});
  useEffect(() => { reload(); }, [id]);

  if (!group) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const isMember = group.members?.some((m: any) => m.id === user?.id);
  const isAdmin = group.members?.some((m: any) => m.id === user?.id && m.role === 'admin');

  const handleJoin = async () => { try { await api.joinGroup(Number(id)); reload(); } catch {} };
  const handleLeave = async () => { try { await api.leaveGroup(Number(id)); reload(); } catch {} };
  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    try { await api.inviteToGroup(Number(id), inviteUsername.trim()); setInviteMsg('Invited!'); setInviteUsername(''); reload(); setTimeout(() => setInviteMsg(''), 3000); }
    catch (err: any) { setInviteMsg(err.message); }
  };
  const handleRemove = async (userId: number) => {
    if (!confirm('Remove this member?')) return;
    try { await api.removeMember(Number(id), userId); reload(); } catch (err: any) { alert(err.message); }
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
            {user && !isMember && <button onClick={handleJoin} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600">Join</button>}
            {user && isMember && <button onClick={handleLeave} className="text-xs text-gray-400 hover:text-red-500 px-3 py-2">Leave Group</button>}
          </div>
        </div>
        {isMember && group.invite_code && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Invite code:</p>
            <div className="flex gap-2">
              <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-mono">{group.invite_code}</code>
              <button onClick={() => navigator.clipboard.writeText(group.invite_code)} className="text-xs text-primary-600 hover:underline">Copy</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Services in this group */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Services</h3>
            {isMember && <Link to={`/services/new?group=${id}`} className="text-xs text-primary-600 hover:underline">+ Add service</Link>}
            {isMember && <Link to={`/help-wanted?group=${id}`} className="text-xs text-primary-600 hover:underline ml-3">+ Ask for help</Link>}
          </div>
          {group.services?.length > 0 ? (
            <div className="space-y-3">
              {group.services.map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`} className="block bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-primary-600">{s.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{s.category_icon} {s.category_name} · 🪃 {s.points_cost} pts · by {s.provider_name}</p>
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

        {/* Members */}
        <div>
          <h3 className="font-bold mb-4">Members ({group.members?.length})</h3>
          {/* Invite form */}
          {isMember && (
            <div className="bg-white p-4 rounded-xl shadow-card mb-3">
              <div className="flex gap-2">
                <input value={inviteUsername} onChange={e => setInviteUsername(e.target.value)} placeholder="Username to invite"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                <button onClick={handleInvite} className="bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-600">Invite</button>
              </div>
              {inviteMsg && <p className="text-xs text-primary-600 mt-1">{inviteMsg}</p>}
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
    </div>
  );
}
