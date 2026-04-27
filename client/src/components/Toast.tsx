import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info'; }

const ToastContext = createContext<{ toast: (message: string, type?: 'success' | 'error' | 'info') => void }>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium max-w-xs
            ${t.type === 'success' ? 'bg-green-500 text-white' : t.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '' : ''}{t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
