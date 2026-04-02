import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const [tab, setTab] = useState<'topup' | 'history'>('topup');

  useEffect(() => {
    api.getPackages().then((res: any) => { setPackages(res.packages || []); setEnabled(res.enabled); }).catch(() => {});
    api.getTransactionHistory().then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    const topup = searchParams.get('topup');
    const amount = searchParams.get('amount');
    if (topup === 'success' && amount) {
      api.confirmTopUp(Number(amount)).then(() => { toast(`+${amount} boomerangs added!`); refreshUser(); }).catch(() => {});
    }
  }, []);

  const handleBuy = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await api.createCheckout(packageId);
      if (res.url) window.location.href = res.url;
    } catch (err: any) { toast(err.message, 'error'); }
    setLoading(null);
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-[#202c33] dark:to-[#111b21] text-white rounded-2xl p-6 mb-6">
        <p className="text-sm text-gray-400 mb-1">Your balance</p>
        <div className="text-4xl font-bold mb-1">{user?.points || 0}</div>
        <p className="text-sm text-gray-400">boomerangs</p>
        <p className="text-xs text-gray-500 mt-4 italic leading-relaxed">
          "What you give is yours, what you don't is lost"
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl">
        <button onClick={() => setTab('topup')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === 'topup' ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
          Top Up
        </button>
        <button onClick={() => setTab('history')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
          History
        </button>
      </div>

      {tab === 'topup' && (
        <div className="space-y-3">
          {packages.map((pkg: any) => (
            <button key={pkg.id} onClick={() => handleBuy(pkg.id)} disabled={!enabled || loading === pkg.id}
              className="w-full bg-white dark:bg-[#202c33] p-5 rounded-2xl border border-gray-100 dark:border-[#2a3942] hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center justify-between disabled:opacity-50 group">
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{pkg.boomerangs} boomerangs</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {pkg.boomerangs === 25 && 'A small gesture goes a long way'}
                  {pkg.boomerangs === 50 && 'Fresh start — same as new accounts'}
                  {pkg.boomerangs === 100 && 'Most popular'}
                  {pkg.boomerangs === 250 && 'For the generous spirit'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600">{pkg.priceLabel}</div>
                {loading === pkg.id && <div className="text-xs text-gray-400 mt-1">...</div>}
              </div>
            </button>
          ))}
          {!enabled && (
            <p className="text-center text-sm text-gray-400 mt-4">Payments coming soon. Earn boomerangs by helping others!</p>
          )}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#2a3942]">
            <p className="text-xs text-gray-400 text-center">Boomerangs have no cash value and cannot be withdrawn. Secure payments by Stripe.</p>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No transactions yet</p>
              <p className="text-gray-300 text-xs mt-1">Start exchanging services to see your history</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((tx: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-[#2a3942] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{tx.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tx.other_user} · {tx.date ? new Date(tx.date).toLocaleDateString() : ''}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ml-3 ${tx.type === 'earned' ? 'text-green-600' : 'text-gray-900 dark:text-gray-300'}`}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.amount}
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
