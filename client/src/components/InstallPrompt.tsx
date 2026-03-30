import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <img src="/logo.svg" alt="" className="w-10 h-10 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900">Install Boomerang</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for quick access</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600">Install</button>
            <button onClick={() => setShow(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Not now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
