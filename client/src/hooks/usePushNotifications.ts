import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(ok);
    if (!ok) { setLoading(false); return; }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
        setLoading(false);
      });
    }).catch(() => setLoading(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Notification permission denied. Please allow notifications in your browser settings.');
        return false;
      }

      let publicKey: string;
      try {
        const res = await api.getVapidKey();
        publicKey = res.publicKey;
      } catch {
        setError('Push notifications are not configured on the server yet.');
        return false;
      }
      if (!publicKey) {
        setError('Push notifications are not configured on the server yet.');
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await api.subscribePush(sub.toJSON());
      setSubscribed(true);
      return true;
    } catch (err: any) {
      console.error('[Push] Subscribe failed:', err);
      setError(err?.message || 'Failed to enable push notifications. Please try again.');
      return false;
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } catch (err: any) {
      console.error('[Push] Unsubscribe failed:', err);
      setError(err?.message || 'Failed to disable push notifications.');
      return false;
    }
  }, []);

  return { supported, subscribed, loading, error, subscribe, unsubscribe };
}
