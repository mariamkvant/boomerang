import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    api.getPackages().then((res: any) => {
      setPackages(res.packages || []);
      setEnabled(res.enabled);
    }).catch(() => {});
  }, []);

  // Handle success redirect
  useEffect(() => {
    const topup = searchParams.get('topup');
    const amount = searchParams.get('amount');
    if (topup === 'success' && amount) {
      api.confirmTopUp(Number(amount)).then(() => {
        toast(`${amount} boomerangs added to your account!`);
        refreshUser();
      }).catch(() => {});
    }
  }, []);

  const handleBuy = async (packageId: string) => {
    setLoading(packageId);
    try {
      const res = await api.createCheckout(packageId);
      if (res.url) window.location.href = res.url;
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(null);
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Buy Boomerangs</h1>
        <p className="text-gray-500 text-sm">Top up your account to request more services</p>
        {user && (
          <div className="mt-4 inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-500/10 px-4 py-2 rounded-full">
            <span className="text-lg font-bold text-primary-600">{user.points}</span>
            <span className="text-sm text-primary-500">boomerangs</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {packages.map((pkg: any) => (
          <button key={pkg.id} onClick={() => handleBuy(pkg.id)} disabled={!enabled || loading === pkg.id}
            className="w-full bg-white dark:bg-[#202c33] p-5 rounded-2xl border border-gray-100 dark:border-[#2a3942] hover:border-primary-200 hover:shadow-lg transition-all flex items-center justify-between disabled:opacity-50">
            <div className="text-left">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{pkg.boomerangs} boomerangs</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {pkg.boomerangs === 25 && 'Enough for 1-2 quick services'}
                {pkg.boomerangs === 50 && 'Same as a new account starts with'}
                {pkg.boomerangs === 100 && 'Most popular — great value'}
                {pkg.boomerangs === 250 && 'Power user pack'}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-primary-600">{pkg.priceLabel}</div>
              {loading === pkg.id && <div className="text-xs text-gray-400 mt-1">Redirecting...</div>}
            </div>
          </button>
        ))}
      </div>

      {!enabled && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">Payments coming soon. For now, earn boomerangs by helping others!</p>
        </div>
      )}

      <div className="mt-8 bg-gray-50 dark:bg-[#202c33] p-5 rounded-2xl">
        <h3 className="font-semibold text-sm mb-3">How boomerangs work</h3>
        <ul className="text-xs text-gray-500 space-y-2">
          <li>• You earn boomerangs by providing services to others</li>
          <li>• You spend boomerangs to request services from others</li>
          <li>• Buying boomerangs helps you get started faster</li>
          <li>• Boomerangs have no cash value and cannot be withdrawn</li>
        </ul>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">Secure payments powered by Stripe. All prices in EUR.</p>
    </div>
  );
}
