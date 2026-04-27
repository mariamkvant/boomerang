import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { getLang, setLang, LANGUAGES, t } from '../i18n';
import { useDarkMode } from '../hooks/useDarkMode';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [bio, setBio] = useState(user?.bio || '');
  const [username, setUsername] = useState(user?.username || '');
  const [city, setCity] = useState(user?.city || '');
  const [languagesSpoken, setLanguagesSpoken] = useState(user?.languages_spoken || '');
  const [autoAccept, setAutoAccept] = useState((user as any)?.auto_accept || false);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Image must be under 2MB', 'error');
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try { await api.updateProfile({ avatar: reader.result as string }); await refreshUser(); } catch (err: any) { toast(err.message, 'error'); }
      setAvatarUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try { await api.updateProfile({ bio, username, city, languages_spoken: languagesSpoken, auto_accept: autoAccept }); await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { toast(err.message, 'error'); }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported on this device.', 'error');
      return;
    }
    setLocating(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000 });
      });
      const { latitude, longitude } = pos.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
      const data = await res.json();
      const detectedCity = data.address?.city || data.address?.town || data.address?.village || '';
      setCity(detectedCity);
      await api.updateProfile({ city: detectedCity, latitude, longitude }); await refreshUser();
    } catch (err: any) {
      if (err?.code === 1) toast('Location access denied. Please enable it in your device settings.', 'error');
      else toast('Could not detect location. Please enter your city manually.', 'error');
    }
    setLocating(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-6">{t('settings.title')}</h2>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-lg font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm">
              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-medium text-sm dark:text-white">{user?.username}</p>
            <p className="text-xs text-gray-400">{avatarUploading ? 'Uploading...' : t('settings.changePhoto')}</p>
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('settings.username')}</label>
          <input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder={t('settings.usernamePlaceholder')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('settings.bio')}</label>
          <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder={t('settings.bioPlaceholder')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        <div>
          <label htmlFor="city" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('settings.location')}</label>
          <div className="flex gap-2">
            <input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder={t('settings.locationPlaceholder')}
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
            <button onClick={detectLocation} disabled={locating} type="button"
              className="border border-gray-200 dark:border-gray-600 text-gray-500 px-3 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#2a3942] disabled:opacity-50 shrink-0">
              {locating ? '...' : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">{t('settings.locationHelp')}</p>
        </div>

        <div>
          <label htmlFor="languages" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('settings.languages')}</label>
          <input id="languages" value={languagesSpoken} onChange={e => setLanguagesSpoken(e.target.value)} placeholder={t('settings.languagesPlaceholder')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
          <p className="text-xs text-gray-400 mt-1">{t('settings.languagesHelp')}</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleSave} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">{t('settings.save')}</button>
          {saved && <span className="text-xs text-green-600">Saved</span>}
        </div>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Request preferences</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium dark:text-white">Auto-accept requests</p>
            <p className="text-xs text-gray-400 mt-0.5">New requests go straight to "In progress" without manual approval</p>
          </div>
          <button onClick={() => setAutoAccept(!autoAccept)}
            className={`relative w-11 h-6 rounded-full transition-colors ${autoAccept ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoAccept ? 'translate-x-5' : ''}`} />
          </button>
        </label>
        <button onClick={async () => { await api.updateProfile({ auto_accept: autoAccept }); await refreshUser(); toast('Saved'); }}
          className="mt-3 text-xs bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 font-medium">Save preference</button>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium dark:text-white">Dark mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Switch between light and dark theme</p>
          </div>
          <button onClick={toggleDark}
            className={`relative w-11 h-6 rounded-full transition-colors ${dark ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('settings.appLanguage')}</h3>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} title={l.name}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${getLang() === l.code ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'}`}>
              {l.flag}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('settings.availability')}</h3>
        <p className="text-xs text-gray-400 mb-3">{t('settings.availabilityDesc')}</p>
        <Link to="/availability" className="text-sm text-primary-600 hover:text-primary-700 font-medium">{t('settings.manageSchedule')} →</Link>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.invite')}</h3>
        <p className="text-xs text-gray-400 mb-3">{t('settings.inviteDesc')}</p>
        <button onClick={async () => {
          const url = `${window.location.origin}/register?ref=${user?.id}`;
          if ('share' in navigator) { try { await (navigator as any).share({ title: 'Join Boomerang', url }); return; } catch {} }
          navigator.clipboard.writeText(url);
        }} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
          Share invite link
        </button>
      </div>
    </div>
  );
}
