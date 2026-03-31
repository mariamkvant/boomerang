import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleSave = async () => {
    try { await api.updateProfile({ bio, city }); await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { alert(err.message); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
          setCity(detectedCity);
          await api.updateProfile({ city: detectedCity, latitude, longitude });
          await refreshUser();
        } catch {}
        setLocating(false);
      },
      () => { alert('Could not detect location'); setLocating(false); }
    );
  };

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="bg-white p-6 rounded-2xl shadow-card space-y-5">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
          <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell people about yourself..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">📍 Location</label>
          <div className="flex gap-2">
            <input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Your city or neighborhood"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            <button onClick={detectLocation} disabled={locating} type="button"
              className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 shrink-0">
              {locating ? '...' : '📍 Detect'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">This helps people find services near them</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 hover:shadow-md">Save Settings</button>
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card mt-6">
        <h3 className="font-semibold mb-3">Account Info</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Email: {user?.email} {user?.email_verified ? <span className="text-green-500">✓ Verified</span> : <span className="text-amber-500">Not verified</span>}</p>
          <p>Points: {user?.points}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card mt-6">
        <h3 className="font-semibold mb-3">🪃 Invite Friends</h3>
        <p className="text-sm text-gray-500 mb-3">Share your referral link. You both get 25 bonus points when they sign up.</p>
        <div className="flex gap-2">
          <input readOnly value={`${window.location.origin}/register?ref=${user?.id}`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600" />
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.id}`); }}
            className="bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 shrink-0">Copy</button>
        </div>
      </div>
    </div>
  );
}
