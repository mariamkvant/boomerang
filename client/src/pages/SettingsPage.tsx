import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { getLang, setLang, LANGUAGES, t } from '../i18n';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [languagesSpoken, setLanguagesSpoken] = useState(user?.languages_spoken || '');
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert('Image must be under 2MB');
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try { await api.updateProfile({ avatar: reader.result as string }); await refreshUser(); } catch (err: any) { alert(err.message); }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try { await api.updateProfile({ bio, city, languages_spoken: languagesSpoken }); await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { alert(err.message); }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
          setCity(detectedCity);
          await api.updateProfile({ city: detectedCity, latitude, longitude }); await refreshUser();
        } catch {}
        setLocating(false);
      },
      () => { setLocating(false); }
    );
  };

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>

      <div className="bg-white p-6 rounded-2xl shadow-card space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm">
              <span className="text-xs">📷</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-xs text-gray-400">{avatarUploading ? '...' : t('settings.changePhoto')}</p>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1.5">{t('settings.bio')}</label>
          <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t('settings.bioPlaceholder')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">📍 {t('settings.location')}</label>
          <div className="flex gap-2">
            <input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder={t('settings.locationPlaceholder')}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            <button onClick={detectLocation} disabled={locating} type="button"
              className="bg-gray-100 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 shrink-0">
              {locating ? '...' : '📍'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('settings.locationHelp')}</p>
        </div>

        <div>
          <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1.5">🗣️ {t('settings.languages')}</label>
          <input id="languages" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} placeholder={t('settings.languagesPlaceholder')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          <p className="text-xs text-gray-400 mt-1">{t('settings.languagesHelp')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 hover:shadow-md">{t('settings.save')}</button>
          {saved && <span className="text-sm text-green-600">✓</span>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card mt-6">
        <h3 className="font-semibold mb-3">🌍 {t('settings.appLanguage')}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} title={l.name}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${getLang() === l.code ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {l.flag}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card mt-6">
        <h3 className="font-semibold mb-3">📅 {t('settings.availability')}</h3>
        <p className="text-sm text-gray-500 mb-3">{t('settings.availabilityDesc')}</p>
        <Link to="/availability" className="inline-block bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">{t('settings.manageSchedule')} →</Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card mt-6">
        <h3 className="font-semibold mb-3">🪃 {t('settings.invite')}</h3>
        <p className="text-sm text-gray-500 mb-3">{t('settings.inviteDesc')}</p>
        <div className="flex gap-2">
          <input readOnly value={`${window.location.origin}/register?ref=${user?.id}`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600" />
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.id}`); }}
            className="bg-primary-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 shrink-0">{t('settings.copy')}</button>
        </div>
      </div>
    </div>
  );
}
