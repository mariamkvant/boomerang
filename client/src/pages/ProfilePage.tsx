import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => { api.getUser(Number(id)).then(setProfile).catch(() => {}); }, [id]);

  if (!profile) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {profile.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              {profile.avg_rating && <span>⭐ {Number(profile.avg_rating).toFixed(1)} ({profile.review_count} reviews)</span>}
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {profile.bio && <p className="text-gray-600 text-sm leading-relaxed mb-4">{profile.bio}</p>}
        <div className="flex gap-6">
          <div className="bg-primary-50 px-4 py-3 rounded-xl text-center">
            <div className="text-xl font-bold text-primary-600">{profile.points}</div>
            <div className="text-xs text-primary-500">Points</div>
          </div>
          <div className="bg-gray-50 px-4 py-3 rounded-xl text-center">
            <div className="text-xl font-bold text-gray-700">{profile.services?.length || 0}</div>
            <div className="text-xs text-gray-500">Services</div>
          </div>
        </div>
      </div>

      {profile.services?.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-4">Services offered</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {profile.services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="bg-white p-5 rounded-xl shadow-card hover:shadow-card-hover group">
                <h4 className="font-semibold text-sm group-hover:text-primary-600">{s.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{s.category_icon} {s.category_name} · 🪃 {s.points_cost} pts · ⏱️ {s.duration_minutes} min</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
