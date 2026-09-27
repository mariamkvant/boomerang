import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useToast } from '../components/Toast';
import { getLang, setLang, LANGUAGES, t } from '../i18n';
import { useDarkMode } from '../hooks/useDarkMode';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
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

  // Stripe Connect / payouts state
  const [connectStatus, setConnectStatus] = useState<{status: string; charges_enabled?: boolean; payouts_enabled?: boolean} | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => {
    // Check if returning from Stripe onboarding
    const connect = searchParams.get('connect');
    if (connect === 'success' || connect === 'refresh') {
      toast(connect === 'success' ? 'Payout account connected! ✓' : 'Please complete your payout setup.', connect === 'success' ? 'success' : 'error');
    }
    // Load connect status if user has started onboarding
    if ((user as any)?.stripe_account_id) {
      api.stripeConnectStatus().then(setConnectStatus).catch(() => {});
    } else {
      setConnectStatus({ status: 'none' });
    }
  }, [user]);

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
          <button onClick={handleSave} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100">{t('settings.save')}</button>
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
            className={`relative w-11 h-6 rounded-full transition-colors ${autoAccept ? 'bg-gray-900' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoAccept ? 'translate-x-5' : ''}`} />
          </button>
        </label>
        <button onClick={async () => { await api.updateProfile({ auto_accept: autoAccept }); await refreshUser(); toast('Saved'); }}
          className="mt-3 text-xs bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium">Save preference</button>
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

      {/* ── Payouts (Stripe Connect) ── */}
      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payouts</h3>

        {connectStatus === null ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : connectStatus.status === 'none' || connectStatus.status === 'incomplete' ? (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200 mb-1 font-medium">Set up your payout account</p>
            <p className="text-xs text-gray-400 mb-3">
              Connect your bank account via Stripe to receive payments when you deliver a service.
              Takes ~2 minutes. Powered by Stripe — your bank details are never stored on Boomerang.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-3 text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">How it works:</span> When a requester pays for your service, the money is held securely (like Vinted). Once they confirm delivery — or after 5 days automatically — you receive 90% directly to your bank account.
            </div>
            <button disabled={connectLoading} onClick={async () => {
              setConnectLoading(true);
              try {
                const r: any = await api.stripeConnectOnboard();
                window.location.href = r.url;
              } catch (err: any) { toast(err.message, 'error'); setConnectLoading(false); }
            }} className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition-colors">
              {connectLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
              )}
              Connect bank account
            </button>
          </div>
        ) : connectStatus.status === 'pending' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Verification in progress
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Stripe is verifying your details. This usually takes a few minutes to a few hours.</p>
            <button disabled={connectLoading} onClick={async () => {
              setConnectLoading(true);
              try {
                const r: any = await api.stripeConnectOnboard();
                window.location.href = r.url;
              } catch (err: any) { toast(err.message, 'error'); }
              setConnectLoading(false);
            }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Complete setup →
            </button>
          </div>
        ) : connectStatus.status === 'active' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                Active — payments enabled
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Your bank account is connected. Payments are released automatically after delivery confirmation.</p>
            <button disabled={connectLoading} onClick={async () => {
              setConnectLoading(true);
              try {
                const r: any = await api.stripeConnectDashboard();
                window.open(r.url, '_blank');
              } catch (err: any) { toast(err.message, 'error'); }
              setConnectLoading(false);
            }} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors disabled:opacity-50">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
              {connectLoading ? 'Opening…' : 'View payout dashboard'}
            </button>
          </div>
        ) : (
          <div>
            <span className="text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">Restricted</span>
            <p className="text-xs text-gray-400 mt-2 mb-3">Your account has restrictions. Please complete additional verification.</p>
            <button onClick={async () => {
              try { const r: any = await api.stripeConnectOnboard(); window.location.href = r.url; } catch {}
            }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">Fix account issues →</button>
          </div>
        )}
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
