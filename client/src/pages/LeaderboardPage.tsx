import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'weekly' | 'alltime' | 'communities'>('weekly');
  const [weekly, setWeekly] = useState<any[]>([]);
  const [alltime, setAlltime] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'weekly') api.getWeeklyLeaders().then(setWeekly).catch(() => {});
    if (tab === 'alltime') api.getAllTimeLeaders().then(setAlltime).catch(() => {});
    if (tab === 'communities') api.getTopCommunities().then(setCommunities).catch(() => {});
  }, [tab]);

  const medals = ['1st', '2nd', '3rd'];

  const renderUser = (u: any, i: number) => (
    <Link to={`/users/${u.id}`} key={u.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover">
      <span className="text-2xl w-8 text-center">{medals[i] || `#${i + 1}`}</span>
      {u.avatar ? (
        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">{u.username?.charAt(0).toUpperCase()}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{u.username}</p>
        {u.city && <p className="text-xs text-gray-400">{u.city}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary-600">{u.completed_count} done</p>
        <p className="text-xs text-gray-400">{u.points_earned} 🪃</p>
      </div>
    </Link>
  );

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
      <p className="text-gray-500 text-sm mb-6">Top helpers in the community</p>

      {/* Your rank */}
      {user && (() => {
        const list = tab === 'weekly' ? weekly : tab === 'alltime' ? alltime : [];
        const idx = list.findIndex((u: any) => u.id === user.id);
        if (idx === -1) return null;
        return (
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <span className="text-lg">{medals[idx] || `#${idx + 1}`}</span>
            <span className="text-sm font-semibold text-primary-700">You're #{idx + 1}</span>
            <span className="text-xs text-primary-500">— {list[idx].completed_count} exchanges completed</span>
          </div>
        );
      })()}

      <div className="flex gap-2 mb-6">
        {([['weekly', 'This Week'], ['alltime', 'All Time'], ['communities', 'Communities']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === key ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'weekly' && (
        <div className="space-y-3">
          {weekly.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <p className="text-3xl mb-2">🪃</p>
              <p className="text-gray-400 text-sm">No completed exchanges this week yet. Be the first!</p>
            </div>
          ) : weekly.map(renderUser)}
        </div>
      )}

      {tab === 'alltime' && (
        <div className="space-y-3">
          {alltime.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <p className="text-gray-400 text-sm">No data yet</p>
            </div>
          ) : alltime.map((u: any, i: number) => (
            <Link to={`/users/${u.id}`} key={u.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover">
              <span className="text-2xl w-8 text-center">{medals[i] || `#${i + 1}`}</span>
              {u.avatar ? (
                <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">{u.username?.charAt(0).toUpperCase()}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.username}</p>
                {u.avg_rating && <p className="text-xs text-gray-400">★ {Number(u.avg_rating).toFixed(1)}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary-600">{u.completed_count} done</p>
                <p className="text-xs text-gray-400">{u.points_earned} 🪃</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'communities' && (
        <div className="space-y-3">
          {communities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <p className="text-gray-400 text-sm">No communities yet</p>
            </div>
          ) : communities.map((g: any, i: number) => (
            <Link to={`/groups/${g.id}`} key={g.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-card hover:shadow-card-hover">
              <span className="text-2xl w-8 text-center">{medals[i] || `#${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{g.name}</p>
                <p className="text-xs text-gray-400 truncate">{g.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary-600">{g.member_count} members</p>
                <p className="text-xs text-gray-400">{g.service_count} services</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
