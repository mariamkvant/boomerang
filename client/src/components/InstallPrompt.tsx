import React, { useState, useEffect, createContext, useContext } from 'react';

// Global install prompt context
let globalDeferredPrompt: any = null;
const InstallContext = createContext<{ canInstall: boolean; install: () => Promise<void> }>({ canInstall: false, install: async () => {} });
export const useInstall = () => useContext(InstallContext);

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); globalDeferredPrompt = e; };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    const prompt = deferredPrompt || globalDeferredPrompt;
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
    setDismissed(true);
  };

  const canInstall = !!(deferredPrompt || globalDeferredPrompt) && !dismissed;

  return (
    <InstallContext.Provider value={{ canInstall, install }}>
      {children}
      {/* Auto popup — shows once on first visit */}
      {canInstall && !dismissed && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3">
            <img src="/logo.svg" alt="" className="w-10 h-10 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">Install Boomerang</p>
              <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for the best experience</p>
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="bg-primary-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600">Install app</button>
                <button onClick={() => setDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Not now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InstallContext.Provider>
  );
}

// Keep backward compat
export default function InstallPrompt() { return null; }
