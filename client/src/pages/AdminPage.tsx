import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState<'stats'|'users'|'reports'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkAdmin().then(r => setIsAdmin(r.is_admin)).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'stats') api.getAdminStats().then(setStats).catch(() => {});
    if (tab === 'users') api.getAdminUsers(userSearch ? `search=${encodeURIComponent(userSearch)}` : '').then(r => setUsers(r.users)).catch(() => {});
    if (tab === 'reports') api.getAdminReports().then(setReports).catch(() => {});
  }, [tab, isAdmin]);

  const searchUsers = () => {
    api.getAdminUsers(userSearch ? `search=${encodeURIComponent(userSearch)}` : '').then(r => setUsers(r.users)).catch(() => {});
  };

  if (isAdmin === null) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!isAdmin) return <div className="text-center py-20"><p className="text-xl mb-2">🔒</p><p className="text-gray-500">Admin access required</p></div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <div className="flex gap-2 mb-6">
        {(['stats','users','reports'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t === 'stats' ? '📊 Dashboard' : t === 'users' ? '👥 Users' : '🚩 Reports'}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ['👥', 'Users', stats.total_users],
            ['🆕', 'New this week', stats.new_users_week],
            ['🛠️', 'Services', stats.total_services],
            ['📋', 'Requests', stats.total_requests],
            ['✅', 'Completed', stats.total_completed],
            ['🚩', 'Pending Reports', stats.pending_reports],
            ['👥', 'Groups', stats.total_groups],
            ['💬', 'Messages', stats.total_messages],
          ].map(([icon, label, val], i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-card text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-gray-900">{val}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
              placeholder="Search users..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            <button onClick={searchUsers} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium">Search</button>
          </div>
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Points</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium">{u.username}</span>
                      {u.is_admin && <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">admin</span>}
                      {u.points === -1 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">banned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-center">{u.points}</td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <button onClick={async () => { await api.banUser(u.id, u.points !== -1); searchUsers(); }}
                        className={`text-xs px-2 py-1 rounded ${u.points === -1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.points === -1 ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={async () => { await api.setAdmin(u.id, !u.is_admin); searchUsers(); }}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <p className="text-center text-gray-400 py-8">No reports</p>}
          {reports.map((r: any) => (
            <div key={r.id} className={`bg-white p-4 rounded-2xl shadow-card ${r.status === 'pending' ? 'border-l-4 border-amber-400' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm"><span className="font-medium">{r.reporter_name}</span> reported <span className="font-medium">{r.reported_name}</span></p>
                  <p className="text-sm text-gray-600 mt-1">Reason: {r.reason}</p>
                  {r.details && <p className="text-xs text-gray-400 mt-1">{r.details}</p>}
                  <p className="text-xs text-gray-300 mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  {r.status === 'pending' ? (
                    <>
                      <button onClick={async () => { await api.resolveReport(r.id, 'resolved'); api.getAdminReports().then(setReports); }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Resolve</button>
                      <button onClick={async () => { await api.resolveReport(r.id, 'dismissed'); api.getAdminReports().then(setReports); }}
                        className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Dismiss</button>
                    </>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded ${r.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>{r.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
