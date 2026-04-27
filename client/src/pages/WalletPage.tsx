import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { isIOS } from '../utils/platform';

export default function WalletPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactionHistory().then(h => { setHistory(h); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalEarned = history.filter(h => h.type === 'earned').reduce((s, h) => s + h.amount, 0);
  const totalSpent = history.filter(h => h.type === 'spent').reduce((s, h) => s + h.amount, 0);

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-24 md:pb-8">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-primary-100 text-sm mb-1">Your balance</p>
        <div className="text-4xl font-bold mb-4">{user?.points} <span className="text-lg font-normal text-primary-200">boomerangs</span></div>
        {!isIOS && <Link to="/buy" className="inline-block bg-white text-primary-600 px-6 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all">+ Buy more</Link>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-[#2a3942]">
          <div className="text-xl font-bold text-green-600">+{totalEarned}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total earned</div>
        </div>
        <div className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-[#2a3942]">
          <div className="text-xl font-bold text-primary-600">-{totalSpent}</div>
          <div className="text-xs text-gray-400 mt-0.5">Total spent</div>
        </div>
      </div>

      {/* Transaction history */}
      <h3 className="font-semibold mb-3">Transaction history</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942]">
          <p className="text-gray-400 text-sm mb-2">No transactions yet</p>
          <p className="text-xs text-gray-300">Complete your first exchange to see it here</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] divide-y divide-gray-50 dark:divide-[#2a3942]">
          {history.map((tx, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tx.type === 'earned' ? 'From' : 'To'} {tx.other_user} · {tx.date ? new Date(tx.date).toLocaleDateString() : ''}</p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ml-3 ${tx.type === 'earned' ? 'text-green-600' : 'text-primary-600'}`}>
                {tx.type === 'earned' ? '+' : '-'}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
