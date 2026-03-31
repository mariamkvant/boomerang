import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function GroupsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'browse' | 'mine' | 'create'>('browse');
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description: '', is_public: true });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.getPublicGroups().then(setPublicGroups).catch(() => {});
    if (user) api.getMyGroups().then(setMyGroups).catch(() => {});
  };
  useEffect(load, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const res = await api.createGroup(form);
      setSuccess('Group created! Invite code: ' + res.invite_code);
      setForm({ name: '', description: '', is_public: true });
      load(); setTab('mine');
    } catch (err: any) { setError(err.message); }
  };

  const handleJoinCode = async () => {
    if (!joinCode.trim()) return;
    try { const res = await api.joinByCode(joinCode.trim()); setSuccess('Joined!'); load(); setJoinCode(''); }
    catch (err: any) { setError(err.message); }
  };

  const handleJoin = async (id: number) => {
    try { await api.joinGroup(id); load(); } catch (err: any) { setError(err.message); }
  };

  const isMember = (gid: number) => myGroups.some(g => g.id === gid);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Communities</h2>
        <div className="flex gap-2">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Invite code" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32" />
          <button onClick={handleJoinCode} className="bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-600">Join</button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">✓ {success}</div>}

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {(['browse', 'mine', 'create'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t === 'browse' ? 'Browse' : t === 'mine' ? 'My Groups' : 'Create'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="grid md:grid-cols-2 gap-4">
          {publicGroups.map((g: any) => (
            <div key={g.id} className="bg-white p-5 rounded-2xl shadow-card">
              <Link to={`/groups/${g.id}`} className="font-semibold text-gray-900 hover:text-primary-600">{g.name}</Link>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{g.member_count} members · by {g.creator_name}</span>
                {user && !isMember(g.id) && <button onClick={() => handleJoin(g.id)} className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600">Join</button>}
                {isMember(g.id) && <span className="text-xs text-primary-500 font-medium">✓ Member</span>}
              </div>
            </div>
          ))}
          {publicGroups.length === 0 && <p className="text-gray-400 text-sm col-span-2 text-center py-8">No public groups yet. Create the first one!</p>}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {myGroups.map((g: any) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="block bg-white p-5 rounded-xl shadow-card hover:shadow-card-hover group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-primary-600">{g.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{g.member_count} members · {g.role}</p>
                </div>
                <span className="text-gray-300 group-hover:text-primary-400">→</span>
              </div>
            </Link>
          ))}
          {myGroups.length === 0 && <p className="text-gray-400 text-sm text-center py-8">You haven't joined any groups yet.</p>}
        </div>
      )}

      {tab === 'create' && user && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-2xl shadow-card space-y-5 max-w-lg">
          <div>
            <label htmlFor="gname" className="block text-sm font-medium text-gray-700 mb-1.5">Group Name</label>
            <input id="gname" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Amsterdam Oud-Zuid"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label htmlFor="gdesc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea id="gdesc" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="What's this group about?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({...f, is_public: e.target.checked}))} className="rounded" />
            Public (anyone can find and join)
          </label>
          <button type="submit" className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600">Create Group</button>
        </form>
      )}
    </div>
  );
}
