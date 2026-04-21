import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState<'stats'|'analytics'|'users'|'reports'|'support'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkAdmin().then(r => setIsAdmin(r.is_admin)).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'stats') api.getAdminStats().then(setStats).catch(() => {});
    if (tab === 'analytics') api.getAdminAnalytics().then(setAnalytics).catch(() => {});
    if (tab === 'users') api.getAdminUsers(userSearch ? `search=${encodeURIComponent(userSearch)}` : '').then(r => setUsers(r.users)).catch(() => {});
    if (tab === 'reports') api.getAdminReports().then(setReports).catch(() => {});
    if (tab === 'support') api.getSupportTickets().then(setTickets).catch(() => {});
  }, [tab, isAdmin]);

  const searchUsers = () => {
    api.getAdminUsers(userSearch ? `search=${encodeURIComponent(userSearch)}` : '').then(r => setUsers(r.users)).catch(() => {});
  };

  if (isAdmin === null) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!isAdmin) return <div className="text-center py-20"><p className="text-xl mb-2">🔒</p><p className="text-gray-500">Admin access required</p></div>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['stats','analytics','users','reports','support'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === tb ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tb === 'stats' ? 'Dashboard' : tb === 'analytics' ? 'Analytics' : tb === 'users' ? 'Users' : tb === 'reports' ? 'Reports' : 'Support'}
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

      {tab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* View counts */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold dark:text-white">{analytics.today_views}</div>
              <div className="text-xs text-gray-400 mt-1">Views today</div>
            </div>
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold dark:text-white">{analytics.week_views}</div>
              <div className="text-xs text-gray-400 mt-1">Views this week</div>
            </div>
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold dark:text-white">{analytics.total_views}</div>
              <div className="text-xs text-gray-400 mt-1">Total views</div>
            </div>
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.today_visitors || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Visitors today</div>
            </div>
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.week_visitors || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Visitors this week</div>
            </div>
            <div className="bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.total_visitors || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Total visitors</div>
            </div>
          </div>

          {/* Daily views chart (simple bar) */}
          {analytics.daily_views?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Page Views (14 days)</h3>
              <div className="flex items-end gap-1 h-32">
                {analytics.daily_views.map((d: any, i: number) => {
                  const max = Math.max(...analytics.daily_views.map((x: any) => parseInt(x.views)));
                  const h = max > 0 ? (parseInt(d.views) / max) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-400">{d.views}</span>
                      <div className="w-full bg-primary-500 rounded-t" style={{ height: `${Math.max(h, 4)}%` }} />
                      <span className="text-[8px] text-gray-400">{new Date(d.day).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily signups */}
          {analytics.daily_signups?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Signups (14 days)</h3>
              <div className="flex items-end gap-1 h-24">
                {analytics.daily_signups.map((d: any, i: number) => {
                  const max = Math.max(...analytics.daily_signups.map((x: any) => parseInt(x.signups)), 1);
                  const h = (parseInt(d.signups) / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-400">{d.signups}</span>
                      <div className="w-full bg-green-500 rounded-t" style={{ height: `${Math.max(h, 4)}%` }} />
                      <span className="text-[8px] text-gray-400">{new Date(d.day).toLocaleDateString('en', { day: 'numeric' })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top pages */}
          <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Pages (30 days)</h3>
            <div className="space-y-2">
              {analytics.top_pages?.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{p.page}</span>
                  <span className="font-medium dark:text-white">{p.views}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most viewed profiles */}
          {analytics.top_profiles?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Most Viewed Profiles</h3>
              <div className="space-y-2">
                {analytics.top_profiles.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{p.username}</span>
                    <span className="text-gray-400">{p.views} views · {p.unique_viewers} unique</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most viewed services */}
          {analytics.top_services?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Most Viewed Services</h3>
              <div className="space-y-2">
                {analytics.top_services.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-600 dark:text-gray-300 truncate block">{s.title}</span>
                      <span className="text-xs text-gray-400">by {s.provider}</span>
                    </div>
                    <span className="text-gray-400 shrink-0 ml-2">{s.views} views · {s.unique_viewers} unique</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traffic Sources */}
          {analytics.traffic_sources?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📊 Traffic Sources (30 days)</h3>
              <div className="space-y-2">
                {analytics.traffic_sources.filter((s: any) => s.source !== 'Internal').map((s: any, i: number) => {
                  const max = Math.max(...analytics.traffic_sources.map((x: any) => parseInt(x.views)));
                  const pct = max > 0 ? (parseInt(s.views) / max) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{s.source}</span>
                        <span className="text-gray-400">{s.views} views · {s.unique_visitors} visitors</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Referrer Domains */}
          {analytics.referrer_domains?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🔗 Top Referrer Domains (30 days)</h3>
              <div className="space-y-2">
                {analytics.referrer_domains.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 truncate">{r.domain || 'Direct'}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{r.views} views · {r.unique_visitors} visitors</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Devices & Browsers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.device_types?.length > 0 && (
              <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📱 Devices (30 days)</h3>
                <div className="space-y-2">
                  {analytics.device_types.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{d.device}</span>
                      <span className="text-gray-400">{d.views} · {d.unique_visitors} unique</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analytics.browsers?.length > 0 && (
              <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🌐 Browsers (30 days)</h3>
                <div className="space-y-2">
                  {analytics.browsers.map((b: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{b.browser}</span>
                      <span className="text-gray-400">{b.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Countries */}
          {analytics.top_countries?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🌍 Top Countries (30 days)</h3>
              <div className="space-y-2">
                {analytics.top_countries.map((c: any, i: number) => {
                  const max = Math.max(...analytics.top_countries.map((x: any) => parseInt(x.views)));
                  const pct = max > 0 ? (parseInt(c.views) / max) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{c.country}</span>
                        <span className="text-gray-400">{c.views} views · {c.unique_visitors} visitors</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily views by source */}
          {analytics.daily_by_source?.length > 0 && (
            <div className="bg-white dark:bg-[#202c33] p-5 rounded-2xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">📈 Daily Views by Source (14 days)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Source</th>
                      <th className="text-right py-2">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.daily_by_source.map((r: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-1.5 pr-4 text-gray-500">{new Date(r.day).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</td>
                        <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300">{r.source}</td>
                        <td className="py-1.5 text-right font-medium dark:text-white">{r.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                      {!u.email_verified && (
                        <button onClick={async () => { await api.verifyUser(u.id); searchUsers(); }}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">Verify</button>
                      )}
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

      {/* Support tickets */}
      {tab === 'support' && (
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-center text-gray-400 py-8">No support tickets</p>}
          {tickets.map((tk: any) => (
            <div key={tk.id} className={`bg-white dark:bg-[#202c33] p-4 rounded-2xl shadow-sm ${tk.status === 'open' ? 'border-l-4 border-amber-400' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm dark:text-white">{tk.subject}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${tk.status === 'open' ? 'bg-amber-100 text-amber-700' : tk.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{tk.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{tk.username || tk.email} · {new Date(tk.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{tk.message}</p>
                  {tk.admin_reply && (
                    <div className="mt-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                      <p className="text-xs text-primary-600 font-medium mb-1">Admin reply:</p>
                      <p className="text-sm text-primary-700 dark:text-primary-300">{tk.admin_reply}</p>
                    </div>
                  )}
                </div>
                {tk.status === 'open' && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={async () => {
                      const reply = prompt('Reply to this ticket:');
                      if (reply) { await api.replySupportTicket(tk.id, { admin_reply: reply, status: 'resolved' }); api.getSupportTickets().then(setTickets); }
                    }} className="text-xs bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600">Reply</button>
                    <button onClick={async () => { await api.replySupportTicket(tk.id, { status: 'closed' }); api.getSupportTickets().then(setTickets); }}
                      className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-200">Close</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
