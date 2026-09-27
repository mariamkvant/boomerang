import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function fmtEur(v: number | string | null | undefined): string {
  const n = parseFloat(String(v ?? 0));
  return `€${n.toFixed(2)}`;
}

function TxIcon({ type }: { type: string }) {
  if (type === 'earned')        return <span className="text-green-500">↓</span>;
  if (type === 'spent')         return <span className="text-red-400">↑</span>;
  if (type === 'gift_received') return <span className="text-primary-500">🎁</span>;
  if (type === 'gift_sent')     return <span className="text-gray-400">🎁</span>;
  return <span className="text-gray-400">·</span>;
}

export default function WalletPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactionHistory().then(h => { setHistory(h); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Separate EUR and boomerang transactions
  const eurEarned  = history.filter(h => h.type === 'earned'  && h.amount_eur != null).reduce((s, h) => s + parseFloat(h.amount_eur), 0);
  const eurSpent   = history.filter(h => h.type === 'spent'   && h.amount_eur != null).reduce((s, h) => s + parseFloat(h.amount_eur), 0);
  const hasEurTx   = history.some(h => h.amount_eur != null);
  const boomEarned = history.filter(h => h.type === 'earned'  && h.amount_eur == null).reduce((s, h) => s + Number(h.amount), 0);
  const boomSpent  = history.filter(h => h.type === 'spent'   && h.amount_eur == null).reduce((s, h) => s + Number(h.amount), 0);

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-24 md:pb-8">

      {/* ── Balance card ── */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-6 text-white">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Your earnings</p>
        {hasEurTx ? (
          <>
            <div className="text-4xl font-bold mb-1">{fmtEur(eurEarned)}</div>
            <p className="text-gray-400 text-sm">total earned via paid services</p>
          </>
        ) : (
          <>
            <div className="text-4xl font-bold mb-1">{user?.points ?? 0} <span className="text-lg font-normal text-gray-400">🪃</span></div>
            <p className="text-gray-400 text-sm">boomerangs balance</p>
          </>
        )}
        <div className="flex gap-3 mt-4">
          <Link to="/services/new"
            className="inline-block bg-white text-gray-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg transition-all">
            + Offer a service
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-[#2a3942]">
          <div className="text-xl font-bold text-green-600">
            {hasEurTx ? fmtEur(eurEarned) : `+${boomEarned}`}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Total earned</div>
        </div>
        <div className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-[#2a3942]">
          <div className="text-xl font-bold text-red-500">
            {hasEurTx ? fmtEur(eurSpent) : `-${boomSpent}`}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Total spent</div>
        </div>
      </div>

      {/* ── Transaction history ── */}
      <h3 className="font-semibold mb-3 dark:text-white">Transaction history</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942]">
          <p className="text-gray-400 text-sm mb-2">No transactions yet</p>
          <p className="text-xs text-gray-300">Complete your first exchange to see it here</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] divide-y divide-gray-50 dark:divide-[#2a3942]">
          {history.map((tx, i) => {
            const isEur = tx.amount_eur != null;
            const isPositive = tx.type === 'earned' || tx.type === 'gift_received';
            const amountLabel = isEur
              ? (isPositive ? `+${fmtEur(tx.amount_eur)}` : `−${fmtEur(tx.amount_eur)}`)
              : (isPositive ? `+${tx.amount} 🪃` : `−${tx.amount} 🪃`);

            return (
              <div key={i} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#2a3942] flex items-center justify-center text-sm shrink-0">
                    <TxIcon type={tx.type} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.type === 'earned' ? 'From' : tx.type === 'spent' ? 'To' : tx.type === 'gift_received' ? 'Gift from' : 'Gift to'} {tx.other_user}
                      {tx.date ? ` · ${new Date(tx.date).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-3 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                  {amountLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
