import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { t } from '../i18n';

const NOTIF_PREFS_KEY = 'notif_prefs';
const DEFAULT_PREFS: Record<string, boolean> = {
  new_request: true, request_accepted: true, service_delivered: true, delivery_confirmed: true,
  new_message: true, group_invite: true, join_request: true, community_activity: true,
};

function getNotifPrefs(): Record<string, boolean> {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{}') }; }
  catch { return DEFAULT_PREFS; }
}

function NotificationPreferences() {
  const { user, refreshUser } = useAuth();
  const [prefs, setPrefs] = useState(getNotifPrefs);
  const [saved, setSaved] = useState(false);
  const [emailOn, setEmailOn] = useState(true);
  const [remindersOn, setRemindersOn] = useState(true);

  useEffect(() => {
    if (user) {
      setEmailOn((user as any).notify_email !== false);
      setRemindersOn((user as any).notify_reminders !== false);
    }
  }, [user]);

  const toggle = (key: string) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const toggleServer = async (field: string, value: boolean) => {
    try {
      await api.updateProfile({ [field]: value });
      if (field === 'notify_email') setEmailOn(value);
      if (field === 'notify_reminders') setRemindersOn(value);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const categories = [
    { key: 'new_request', label: 'New service requests', desc: 'When someone requests your service' },
    { key: 'request_accepted', label: 'Request accepted', desc: 'When a provider accepts your request' },
    { key: 'service_delivered', label: 'Service delivered', desc: 'When a service is marked as delivered' },
    { key: 'delivery_confirmed', label: 'Delivery confirmed', desc: 'When points are transferred' },
    { key: 'new_message', label: 'New messages', desc: 'Direct messages and request messages' },
    { key: 'group_invite', label: 'Group invites', desc: 'When you\'re added to a community' },
    { key: 'join_request', label: 'Join requests', desc: 'When someone wants to join your group' },
    { key: 'community_activity', label: 'Community activity', desc: 'Shoutouts, new services, exchanges' },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Notification Preferences</h3>
        {saved && <span className="text-xs text-green-600">✓ Saved</span>}
      </div>
      <p className="text-sm text-gray-500 mb-4">Choose which notifications you want to receive.</p>
      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">{cat.label}</p>
              <p className="text-xs text-gray-400">{cat.desc}</p>
            </div>
            <button onClick={() => toggle(cat.key)} aria-label={`Toggle ${cat.label}`}
              className={`relative w-10 h-6 rounded-full transition-colors ${prefs[cat.key] ? 'bg-primary-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[cat.key] ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
      {/* Server-side toggles */}
      <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-gray-700">Email notifications</p>
            <p className="text-xs text-gray-400">Receive emails for requests, confirmations, and digests</p>
          </div>
          <button onClick={() => toggleServer('notify_email', !emailOn)}
            className={`relative w-10 h-6 rounded-full transition-colors ${emailOn ? 'bg-primary-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-gray-700">Reminders & nudges</p>
            <p className="text-xs text-gray-400">Automatic reminders for pending actions</p>
          </div>
          <button onClick={() => toggleServer('notify_reminders', !remindersOn)}
            className={`relative w-10 h-6 rounded-full transition-colors ${remindersOn ? 'bg-primary-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${remindersOn ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [error, setError] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifySent, setVerifySent] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, error: pushError, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [pushToggling, setPushToggling] = useState(false);

  const handleResendVerify = async () => {
    try { await api.resendVerify(); setVerifySent(true); setTimeout(() => setVerifySent(false), 5000); }
    catch (err: any) { setVerifyError(err.message); }
  };

  const handleVerify = async () => {
    setVerifyError('');
    try { await api.verifyEmail(verifyCode); await refreshUser(); setVerifyCode(''); }
    catch (err: any) { setVerifyError(err.message); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await api.updateProfile({ password: newPassword });
      setPwSaved(true); setPassword(''); setNewPassword('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleDeactivate = async () => {
    try {
      await api.updateProfile({ bio: '[DEACTIVATED]' });
      logout(); navigate('/');
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    try {
      await api.deleteAccount();
      logout(); navigate('/');
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6">{t('account.title')}</h2>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}

      {/* Email verification banner */}
      {user && !user.email_verified && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-6">
          <h3 className="font-semibold text-amber-700 mb-2">📧 Verify your email</h3>
          <p className="text-sm text-amber-600 mb-3">Your email ({user.email}) is not verified yet. Enter the 6-digit code we sent you, or request a new one.</p>
          {verifyError && <p className="text-sm text-red-500 mb-2">{verifyError}</p>}
          <div className="flex gap-2 mb-2">
            <input value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))} maxLength={6}
              placeholder="Enter 6-digit code" className="border border-amber-300 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-bold w-40 focus:ring-2 focus:ring-amber-400 outline-none" />
            <button onClick={handleVerify} disabled={verifyCode.length !== 6}
              className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 disabled:opacity-50">Verify</button>
          </div>
          <button onClick={handleResendVerify} className="text-xs text-amber-600 hover:underline">
            {verifySent ? '✓ Code sent! Check your email.' : 'Resend verification code'}
          </button>
        </div>
      )}

      {user?.email_verified && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl mb-6 flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm text-green-700">Email verified</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
        <h3 className="font-semibold mb-3">{t('account.info')}</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Email: {user?.email} {user?.email_verified ? <span className="text-green-500">✓ Verified</span> : <span className="text-amber-500">Not verified</span>}</p>
          <p>Username: {user?.username}</p>
          <p>Boomerangs: {user?.points}</p>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <Link to="/privacy" className="text-xs text-gray-400 hover:text-primary-600">Privacy Policy</Link>
          <Link to="/terms" className="text-xs text-gray-400 hover:text-primary-600">Terms of Service</Link>
        </div>
      </div>

      {pushSupported && (
        <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
          <h3 className="font-semibold mb-3">🔔 Push Notifications</h3>
          <p className="text-sm text-gray-500 mb-4">Get notified about new messages, service requests, and community activity even when the app is closed.</p>
          {pushError && <p className="text-sm text-red-500 mb-3">⚠️ {pushError}</p>}
          {pushLoading ? (
            <p className="text-sm text-gray-400">Checking...</p>
          ) : pushSubscribed ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-green-600">✓ Push notifications enabled</span>
              <button onClick={async () => { setPushToggling(true); await pushUnsubscribe(); setPushToggling(false); }}
                disabled={pushToggling} className="text-xs text-gray-400 hover:text-red-500 underline">Disable</button>
            </div>
          ) : (
            <button onClick={async () => { setPushToggling(true); await pushSubscribe(); setPushToggling(false); }}
              disabled={pushToggling} className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-50">
              {pushToggling ? 'Enabling...' : 'Enable Push Notifications'}
            </button>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      <NotificationPreferences />

      <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl shadow-card mb-6 space-y-4">
        <h3 className="font-semibold">Change Password</h3>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 characters)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        <div className="flex items-center gap-3">
          <button type="submit" className="bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Update Password</button>
          {pwSaved && <span className="text-sm text-green-600">✓ Updated</span>}
        </div>
      </form>

      <div className="bg-white p-6 rounded-2xl shadow-card mb-6">
        <h3 className="font-semibold text-amber-600 mb-3">⚠️ Deactivate Account</h3>
        <p className="text-sm text-gray-500 mb-3">Your profile will be hidden and services removed. You can reactivate by logging in again.</p>
        {!showDeactivate ? (
          <button onClick={() => setShowDeactivate(true)} className="text-sm text-amber-600 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-50">Deactivate Account</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleDeactivate} className="text-sm bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600">Confirm Deactivate</button>
            <button onClick={() => setShowDeactivate(false)} className="text-sm text-gray-500 px-3 py-2">Cancel</button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card border border-red-100">
        <h3 className="font-semibold text-red-600 mb-3">🗑️ Delete Account</h3>
        <p className="text-sm text-gray-500 mb-3">This permanently deletes your account, services, and all data. This cannot be undone.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50">Delete Account</button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">Type <span className="font-mono font-bold">DELETE</span> to confirm:</p>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type DELETE"
              className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 outline-none" />
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={confirmText !== 'DELETE'} className="text-sm bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50">Permanently Delete</button>
              <button onClick={() => { setShowDelete(false); setConfirmText(''); }} className="text-sm text-gray-500 px-3 py-2">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
