import React, { useState, useEffect } from 'react';
import { api } from '../api';

function BarChart({ data, valueKey, labelKey, color = 'bg-primary-500', height = 'h-40' }: { data: any[]; valueKey: string; labelKey: string; color?: string; height?: string }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => parseInt(d[valueKey]) || 0), 1);
  return (
    <div className={`flex items-end gap-1 ${height}`}>
      {data.map((d, i) => {
        const h = ((parseInt(d[valueKey]) || 0) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{d[valueKey]}</div>
            <div className={`w-full ${color} rounded-t`} style={{ height: `${Math.max(h, 2)}%` }} />
            <span className="text-[8px] text-gray-400 truncate w-full text-center">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function countryFlag(name: string): string {
  const flags: Record<string, string> = {
    'Luxembourg': '🇱🇺', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
    'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Netherlands': '🇳🇱',
    'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
    'Denmark': '🇩🇰', 'Finland': '🇫🇮', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  };
  return flags[name] || '';
}

export default function AdminPage() {
  const [tab, setTab] = useState<'stats'|'analytics'|'users'|'reports'|'support'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => { api.checkAdmin().then(r => setIsAdmin(r.is_admin)).catch(() => setIsAdmin(false)); }, []);

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
  if (!isAdmin) return <div className="text-center py-20"><p className="text-gray-500">Admin access required</p></div>;

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      <h2 className="text-xl font-bold mb-5 dark:text-white">Admin Panel</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['stats','analytics','users','reports','support'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === tb ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
            {tb === 'stats' ? 'Dashboard' : tb === 'analytics' ? 'Analytics' : tb === 'users' ? 'Users' : tb === 'reports' ? 'Reports' : 'Support'}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Users', stats.total_users, 'text-gray-900'],
            ['New this week', stats.new_users_week, 'text-primary-600'],
            ['Services', stats.total_services, 'text-gray-900'],
            ['Requests', stats.total_requests, 'text-gray-900'],
            ['Completed', stats.total_completed, 'text-green-600'],
            ['Pending Reports', stats.pending_reports, 'text-red-500'],
            ['Groups', stats.total_groups, 'text-gray-900'],
            ['Messages', stats.total_messages, 'text-gray-900'],
          ].map(([label, val, color], i) => (
            <div key={i} className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
              <div className={`text-2xl font-bold ${color} dark:text-white`}>{val}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && analytics && (
        <div className="space-y-4">
          {/* Hero metric */}
          <div className="bg-white dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">{analytics.week_visitors || 0}</span>
              <span className="text-sm text-gray-400 mb-1">visitors this week</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{analytics.week_views} views</span>
              <span>{analytics.today_visitors || 0} today</span>
              <span>{analytics.total_visitors || 0} all time</span>
            </div>
          </div>

          <Section title="Daily Views (14 days)" defaultOpen={true}>
            <div className="pt-2">
              <BarChart data={(analytics.daily_views || []).map((d: any) => ({ ...d, label: new Date(String(d.day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' }) }))} valueKey="views" labelKey="label" height="h-48" />
            </div>
          </Section>

          {/* Combined: Daily views by traffic source + country */}
          {(analytics.daily_by_source?.length > 0 || analytics.daily_by_country?.length > 0) && (
            <Section title="Daily Breakdown (14 days)" defaultOpen={true}>
              {(() => {
                const [breakdownTab, setBreakdownTab] = React.useState<'source'|'country'>('source');

                const sourceColors: Record<string, string> = {
                  'Direct': 'bg-gray-400', 'Google': 'bg-blue-500', 'LinkedIn': 'bg-blue-700',
                  'Facebook': 'bg-indigo-500', 'Instagram': 'bg-pink-500', 'Twitter/X': 'bg-sky-400',
                  'Reddit': 'bg-orange-500', 'Other': 'bg-gray-300', 'Internal': 'bg-gray-200',
                };
                const countryColors = ['bg-primary-500','bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500','bg-pink-500','bg-sky-400','bg-indigo-400'];

                const sourceData = (analytics.daily_by_source || []).filter((r: any) => r.source !== 'Internal');
                const countryData = analytics.daily_by_country || [];

                const allSources = [...new Set(sourceData.map((r: any) => r.source))] as string[];
                const allCountries = [...new Set(countryData.map((r: any) => r.country))].slice(0, 8) as string[];
                const days = [...new Set([...sourceData, ...countryData].map((r: any) => r.day))].sort() as string[];

                const activeGroups = breakdownTab === 'source' ? allSources : allCountries;
                const activeData = breakdownTab === 'source' ? sourceData : countryData;
                const activeKey = breakdownTab === 'source' ? 'source' : 'country';
                const activeColors = breakdownTab === 'source' ? sourceColors : Object.fromEntries(allCountries.map((c, i) => [c, countryColors[i % countryColors.length]]));

                const maxTotal = Math.max(...days.map(d =>
                  activeData.filter((r: any) => r.day === d).reduce((s: number, r: any) => s + parseInt(r.views), 0)
                ), 1);

                return (
                  <div className="pt-2">
                    {/* Sub-tabs */}
                    <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-[#242424] p-1 rounded-lg w-fit">
                      {(['source', 'country'] as const).map(t => (
                        <button key={t} onClick={() => setBreakdownTab(t)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${breakdownTab === t ? 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                          {t === 'source' ? 'Traffic Source' : 'Country'}
                        </button>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-3 flex-wrap mb-4">
                      {activeGroups.map((g, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <div className={`w-2.5 h-2.5 rounded-sm ${activeColors[g] || 'bg-gray-400'}`} />
                          {breakdownTab === 'country' ? `${countryFlag(g)} ` : ''}{g}
                        </div>
                      ))}
                    </div>

                    {/* Stacked bar chart */}
                    <div className="flex items-end gap-1 h-48 mb-4">
                      {days.map((day, di) => {
                        const dayData = activeData.filter((r: any) => r.day === day);
                        const total = dayData.reduce((s: number, r: any) => s + parseInt(r.views), 0);
                        const heightPct = (total / maxTotal) * 100;
                        return (
                          <div key={di} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {total} views
                            </div>
                            <div className="w-full flex flex-col-reverse rounded-t overflow-hidden"
                              style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '3px' }}>
                              {activeGroups.map((g, gi) => {
                                const entry = dayData.find((r: any) => r[activeKey] === g);
                                const v = entry ? parseInt(entry.views) : 0;
                                const pct = total > 0 ? (v / total) * 100 : 0;
                                return pct > 0 ? (
                                  <div key={gi} className={`w-full ${activeColors[g] || 'bg-gray-400'}`}
                                    style={{ height: `${pct}%` }} title={`${g}: ${v}`} />
                                ) : null;
                              })}
                            </div>
                            <span className="text-[8px] text-gray-400 truncate w-full text-center">
                              {new Date(String(day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* 7-day breakdown table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700">
                            <th className="text-left py-1.5 text-gray-400 font-medium">Date</th>
                            {activeGroups.map(g => (
                              <th key={g} className="text-right py-1.5 text-gray-400 font-medium px-2 whitespace-nowrap">
                                {breakdownTab === 'country' ? `${countryFlag(g)} ${g}` : g}
                              </th>
                            ))}
                            <th className="text-right py-1.5 text-gray-400 font-medium px-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {days.slice(-7).map((day, di) => {
                            const dayData = activeData.filter((r: any) => r.day === day);
                            const total = dayData.reduce((s: number, r: any) => s + parseInt(r.views), 0);
                            return (
                              <tr key={di} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#242424]">
                                <td className="py-1.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  {new Date(String(day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </td>
                                {activeGroups.map(g => {
                                  const entry = dayData.find((r: any) => r[activeKey] === g);
                                  return <td key={g} className="text-right py-1.5 px-2 text-gray-500">{entry ? entry.views : '—'}</td>;
                                })}
                                <td className="text-right py-1.5 px-2 font-semibold text-gray-700 dark:text-gray-300">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </Section>
          )}

          <Section title="Daily Signups (14 days)">
            <div className="pt-2">
              <BarChart data={(analytics.daily_signups || []).map((d: any) => ({ ...d, label: new Date(String(d.day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' }) }))} valueKey="signups" labelKey="label" color="bg-green-500" height="h-40" />
            </div>
          </Section>

          {/* New vs Returning visitors */}
          {analytics.new_vs_returning?.length > 0 && (
            <Section title="New vs Returning Visitors (14 days)" defaultOpen={true}>
              {(() => {
                const data = analytics.new_vs_returning || [];
                const days = [...new Set(data.map((r: any) => r.day))].sort() as string[];
                const maxTotal = Math.max(...days.map(d =>
                  data.filter((r: any) => r.day === d).reduce((s: number, r: any) => s + parseInt(r.visitors), 0)
                ), 1);

                // Summary totals
                const totalNew = data.filter((r: any) => r.visitor_type === 'new').reduce((s: number, r: any) => s + parseInt(r.visitors), 0);
                const totalReturning = data.filter((r: any) => r.visitor_type === 'returning').reduce((s: number, r: any) => s + parseInt(r.visitors), 0);
                const grandTotal = totalNew + totalReturning;
                const newPct = grandTotal > 0 ? Math.round((totalNew / grandTotal) * 100) : 0;

                return (
                  <div className="pt-2">
                    {/* Summary pills */}
                    <div className="flex gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">New: <span className="font-semibold text-gray-900 dark:text-white">{totalNew}</span></span>
                        <span className="text-xs text-gray-400">({newPct}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Returning: <span className="font-semibold text-gray-900 dark:text-white">{totalReturning}</span></span>
                        <span className="text-xs text-gray-400">({100 - newPct}%)</span>
                      </div>
                    </div>

                    {/* Stacked bar chart */}
                    <div className="flex items-end gap-1 h-40 mb-4">
                      {days.map((day, di) => {
                        const dayData = data.filter((r: any) => r.day === day);
                        const newV = parseInt(dayData.find((r: any) => r.visitor_type === 'new')?.visitors || '0');
                        const retV = parseInt(dayData.find((r: any) => r.visitor_type === 'returning')?.visitors || '0');
                        const total = newV + retV;
                        const heightPct = (total / maxTotal) * 100;
                        const newPctBar = total > 0 ? (newV / total) * 100 : 0;
                        const retPctBar = total > 0 ? (retV / total) * 100 : 0;
                        return (
                          <div key={di} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {newV} new · {retV} returning
                            </div>
                            <div className="w-full flex flex-col-reverse rounded-t overflow-hidden"
                              style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '3px' }}>
                              {retPctBar > 0 && <div className="w-full bg-blue-400" style={{ height: `${retPctBar}%` }} />}
                              {newPctBar > 0 && <div className="w-full bg-primary-500" style={{ height: `${newPctBar}%` }} />}
                            </div>
                            <span className="text-[8px] text-gray-400 truncate w-full text-center">
                              {new Date(String(day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700">
                            <th className="text-left py-1.5 text-gray-400 font-medium">Date</th>
                            <th className="text-right py-1.5 px-2 text-gray-400 font-medium">🟠 New</th>
                            <th className="text-right py-1.5 px-2 text-gray-400 font-medium">🔵 Returning</th>
                            <th className="text-right py-1.5 px-2 text-gray-400 font-medium">Total</th>
                            <th className="text-right py-1.5 px-2 text-gray-400 font-medium">% New</th>
                          </tr>
                        </thead>
                        <tbody>
                          {days.slice(-7).map((day, di) => {
                            const dayData = data.filter((r: any) => r.day === day);
                            const newV = parseInt(dayData.find((r: any) => r.visitor_type === 'new')?.visitors || '0');
                            const retV = parseInt(dayData.find((r: any) => r.visitor_type === 'returning')?.visitors || '0');
                            const total = newV + retV;
                            const pct = total > 0 ? Math.round((newV / total) * 100) : 0;
                            return (
                              <tr key={di} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#242424]">
                                <td className="py-1.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                  {new Date(String(day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </td>
                                <td className="text-right py-1.5 px-2 text-primary-600 font-medium">{newV}</td>
                                <td className="text-right py-1.5 px-2 text-blue-500 font-medium">{retV}</td>
                                <td className="text-right py-1.5 px-2 font-semibold text-gray-700 dark:text-gray-300">{total}</td>
                                <td className="text-right py-1.5 px-2 text-gray-400">{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </Section>
          )}

          <Section title="Traffic Sources (30 days)">
            {(() => {
              const sources = (analytics.traffic_sources || []).filter((s: any) => s.source !== 'Internal');
              const total = sources.reduce((sum: number, s: any) => sum + parseInt(s.views), 0);
              return (
                <div className="space-y-3 pt-1">
                  {sources.map((s: any, i: number) => {
                    const pct = total > 0 ? Math.round((parseInt(s.views) / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">{s.source}</span>
                          <span className="text-gray-400">{pct}% · {s.views} views</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </Section>

          <Section title="Top Countries (30 days)">
            <div className="space-y-2 pt-1">
              {(analytics.top_countries || []).map((c: any, i: number) => {
                const max = Math.max(...(analytics.top_countries || []).map((x: any) => parseInt(x.views)), 1);
                const pct = Math.round((parseInt(c.views) / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{countryFlag(c.country)} {c.country}</span>
                      <span className="text-gray-400">{c.views} views · {c.unique_visitors} visitors</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {analytics.daily_by_country?.length > 0 && (
            <Section title="Daily Views by Country (14 days)">
              {(() => {
                const countries = [...new Set((analytics.daily_by_country || []).map((r: any) => r.country))] as string[];
                const days = [...new Set((analytics.daily_by_country || []).map((r: any) => r.day))].sort() as string[];
                const colors = ['bg-blue-500', 'bg-primary-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500'];
                return (
                  <div className="pt-2">
                    <div className="flex gap-3 flex-wrap mb-3">
                      {countries.slice(0, 5).map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[i]}`} />
                          {countryFlag(c)} {c}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end gap-1 h-40">
                      {days.map((day, di) => {
                        const dayData = (analytics.daily_by_country || []).filter((r: any) => r.day === day);
                        const total = dayData.reduce((sum: number, r: any) => sum + parseInt(r.views), 0);
                        const maxTotal = Math.max(...days.map(d => (analytics.daily_by_country || []).filter((r: any) => r.day === d).reduce((s: number, r: any) => s + parseInt(r.views), 0)), 1);
                        const heightPct = (total / maxTotal) * 100;
                        return (
                          <div key={di} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: '4px' }}>
                              {countries.slice(0, 5).map((c, ci) => {
                                const entry = dayData.find((r: any) => r.country === c);
                                const v = entry ? parseInt(entry.views) : 0;
                                const pct = total > 0 ? (v / total) * 100 : 0;
                                return pct > 0 ? <div key={ci} className={`w-full ${colors[ci]}`} style={{ height: `${pct}%` }} /> : null;
                              })}
                            </div>
                            <span className="text-[8px] text-gray-400">{new Date(String(day).substring(0, 10) + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </Section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Section title="Devices (30 days)">
              <div className="space-y-2 pt-1">
                {(analytics.device_types || []).map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{d.device}</span>
                    <span className="text-gray-400">{d.views} · {d.unique_visitors} unique</span>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Browsers (30 days)">
              <div className="space-y-2 pt-1">
                {(analytics.browsers || []).map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{b.browser}</span>
                    <span className="text-gray-400">{b.views}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title="Top Pages (30 days)">
            <div className="space-y-2 pt-1">
              {(analytics.top_pages || []).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{p.page}</span>
                  <span className="font-medium dark:text-white">{p.views}</span>
                </div>
              ))}
            </div>
          </Section>

          {analytics.top_services?.length > 0 && (
            <Section title="Most Viewed Services">
              <div className="space-y-2 pt-1">
                {analytics.top_services.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="text-gray-600 dark:text-gray-300 truncate block">{s.title}</span>
                      <span className="text-xs text-gray-400">by {s.provider}</span>
                    </div>
                    <span className="text-gray-400 shrink-0 ml-2">{s.views} views</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()}
              placeholder="Search users..." className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#202c33] dark:text-white" />
            <button onClick={searchUsers} className="bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium">Search</button>
          </div>
          <div className="bg-white dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#2a3942]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Points</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a3942]">
                    <td className="px-4 py-3">
                      <span className="font-medium dark:text-white">{u.username}</span>
                      {u.is_admin && <span className="ml-1 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">admin</span>}
                      {u.points === -1 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">banned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-center dark:text-white">{u.points}</td>
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
            <div key={r.id} className={`bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700 ${r.status === 'pending' ? 'border-l-4 border-amber-400' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm dark:text-white"><span className="font-medium">{r.reporter_name}</span> reported <span className="font-medium">{r.reported_name}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reason: {r.reason}</p>
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

      {tab === 'support' && (
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-center text-gray-400 py-8">No support tickets</p>}
          {tickets.map((tk: any) => (
            <div key={tk.id} className={`bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700 ${tk.status === 'open' ? 'border-l-4 border-amber-400' : ''}`}>
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
