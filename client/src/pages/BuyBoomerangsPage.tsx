import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function BuyBoomerangsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  // Detect iOS native app (Capacitor) — hide Stripe to comply with Apple guidelines
  const isIOSApp = /iPhone|iPad|iPod/.test(navigator.userAgent) && (
    (window as any).Capacitor !== undefined || 
    (window as any).webkit?.messageHandlers?.bridge !== undefined ||
    navigator.userAgent.includes('Boomerang')
  );
  // Also hide on any iOS device in standalone mode (installed PWA)
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  const hideStripe = isIOSApp || (isIOS && isStandalone) || isIOS;
  const [tab, setTab] = useState<'topup' | 'gift' | 'history'>(hideStripe ? 'gift' : 'topup');
  const [giftTo, setGiftTo] = useState('');
  const [giftAmount, setGiftAmount] = useState('10');
  const [giftSearch, setGiftSearch] = useState<any[]>([]);
  const [giftUserId, setGiftUserId] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    api.getPackages().then((r: any) => { setPackages(r.packages || []); setEnabled(r.enabled); }).catch(() => {});
    api.getTransactionHistory().then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get('topup') === 'success' && searchParams.get('amount')) {
      api.confirmTopUp(Number(searchParams.get('amount'))).then(() => { toast(`+${searchParams.get('amount')} boomerangs added!`); refreshUser(); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!giftTo.trim() || giftTo.length < 2) { setGiftSearch([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.searchPeople(giftTo).then(r => setGiftSearch(r.filter((u: any) => u.id !== user?.id).slice(0, 5))).catch(() => {});
    }, 300);
  }, [giftTo]);

  const handleBuy = async (id: string) => {
    setLoading(id);
    try { const r = await api.createCheckout(id); if (r.url) window.location.href = r.url; }
    catch (err: any) { toast(err.message, 'error'); }
    setLoading(null);
  };

  const handleGift = async () => {
    if (!giftUserId || !giftAmount) return;
    try {
      const res = await api.giftBoomerangs(giftUserId, Number(giftAmount));
      toast(res.message); refreshUser();
      setGiftTo(''); setGiftUserId(null); setGiftAmount('10');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-24 md:pb-8">
      <div className="bg-white dark:bg-[#202c33] rounded-2xl p-6 mb-6 border border-gray-100 dark:border-[#2a3942]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Balance</p>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user?.points || 0}</div>
            <p className="text-xs text-gray-400 mt-0.5">boomerangs</p>
          </div>
          <div className="w-14 h-14 bg-gray-50 dark:bg-[#2a3942] rounded-full flex items-center justify-center text-2xl">🪃</div>
        </div>
        <p className="text-[11px] text-gray-400 mt-4 italic">"What you give is yours, what you don't is lost" — Shota Rustaveli</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl">
        {(['topup', 'gift', 'history'] as const).filter(tb => !(tb === 'topup' && hideStripe)).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium ${tab === tb ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
            {tb === 'topup' ? 'Top Up' : tb === 'gift' ? 'Gift' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'topup' && (
        <div className="space-y-2">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => handleBuy(pkg.id)} disabled={!enabled || loading === pkg.id}
              className="w-full bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-[#2a3942] hover:border-gray-200 dark:hover:border-gray-600 transition-all flex items-center justify-between disabled:opacity-50">
              <div className="text-left">
                <span className="font-medium text-gray-900 dark:text-gray-100">{pkg.boomerangs}</span>
                <span className="text-sm text-gray-400 ml-1">boomerangs</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">{pkg.priceLabel}</span>
            </button>
          ))}
          {!enabled && <p className="text-center text-xs text-gray-400 mt-3">Payments coming soon</p>}
          {!hideStripe && <p className="text-[10px] text-gray-400 text-center mt-4">No cash value. Cannot be withdrawn. Powered by Stripe.</p>}
        </div>
      )}

      {tab === 'gift' && (
        <div className="bg-white dark:bg-[#202c33] p-5 rounded-xl border border-gray-100 dark:border-[#2a3942]">
          <p className="text-sm text-gray-500 mb-4">Send boomerangs to someone as a thank-you.</p>
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Recipient</label>
              <input value={giftTo} onChange={e => { setGiftTo(e.target.value); setGiftUserId(null); }}
                placeholder="Search by username..." className="w-full border border-gray-200 dark:border-[#374151] dark:bg-[#2a3942] dark:text-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary-500" />
              {giftSearch.length > 0 && !giftUserId && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#2a3942] rounded-xl shadow-lg border border-gray-100 dark:border-[#374151] z-10 overflow-hidden">
                  {giftSearch.map((u: any) => (
                    <button key={u.id} onClick={() => { setGiftUserId(u.id); setGiftTo(u.username); setGiftSearch([]); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#374151] text-left">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">{u.username?.charAt(0).toUpperCase()}</div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount</label>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map(n => (
                  <button key={n} onClick={() => setGiftAmount(String(n))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border ${giftAmount === String(n) ? 'bg-gray-900 dark:bg-primary-600 text-white border-gray-900 dark:border-primary-600' : 'bg-white dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#374151]'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleGift} disabled={!giftUserId || !giftAmount}
              className="w-full bg-gray-900 dark:bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-primary-700 disabled:opacity-40 text-sm">
              Send {giftAmount} boomerangs
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-300 mt-1">Start exchanging to see your history</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-xl border border-gray-100 dark:border-[#2a3942] divide-y divide-gray-50 dark:divide-[#2a3942]">
              {history.map((tx: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {tx.type === 'gift_sent' ? `Gift to ${tx.other_user}` : tx.type === 'gift_received' ? `Gift from ${tx.other_user}` : tx.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {tx.type === 'gift_sent' || tx.type === 'gift_received' ? 'Boomerang gift' : tx.other_user} · {tx.date ? new Date(tx.date).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-3 ${tx.type === 'earned' || tx.type === 'gift_received' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'earned' || tx.type === 'gift_received' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
