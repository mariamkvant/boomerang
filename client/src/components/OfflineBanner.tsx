import React, { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOffline(true); setWasOffline(true); };
    const goOnline = () => {
      setOffline(false);
      // Show "back online" briefly then hide
      setTimeout(() => setWasOffline(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline && !wasOffline) return null;

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 text-center py-2 text-sm font-medium animate-slide-up ${
      offline ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`}>
      {offline ? 'You\'re offline — some features may not work' : 'Back online ✓'}
    </div>
  );
}
