import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

function fmtEur(v: number | string | null | undefined, currency = 'eur'): string {
  const n = parseFloat(String(v ?? 0));
  const sym = currency === 'gel' ? '₾' : '€';
  return `${sym}${n.toFixed(2)}`;
}

function TxRow({ tx }: { tx: any }) {
  const isPositive = tx.type === 'earned' || tx.type === 'gift_received';
  const isEur = tx.amount_eur != null;
  const amountLabel = isEur
    ? (isPositive ? `+${fmtEur(tx.amount_eur)}` : `−${fmtEur(tx.amount_eur)}`)
    : (isPositive ? `+${tx.amount} pts` : `−${tx.amount} pts`);

  const typeLabel =
    tx.type === 'earned' ? 'Service payment received' :
    tx.type === 'spent' ? 'Service payment sent' :
    tx.type === 'gift_received' ? `Gift from ${tx.other_user}` :
    tx.type === 'gift_sent' ? `Gift to ${tx.other_user}` : tx.type;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
        isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
      }`}>
        {isPositive ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {typeLabel} · {tx.date ? new Date(tx.date).toLocaleDateString() : ''}
        </p>
      </div>
      <span className={`text-sm font-semibold shrink-0 ml-3 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {amountLabel}
      </span>
    </div>
  );
}

export default function EarningsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectStatus, setConnectStatus] = useState<any>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [tab, setTab] = useState<'earnings' | 'history'>('earnings');

  useEffect(() => {
    api.getTransactionHistory().then(h => { setHistory(h); setLoading(false); }).catch(() => setLoading(false));
    if ((user as any)?.stripe_account_id) {
      api.stripeConnectStatus().then(setConnectStatus).catch(() => {});
    } else {
      setConnectStatus({ status: 'none' });
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('connect') === 'success') {
      toast('Payout account connected! ✓');
      api.stripeConnectStatus().then(setConnectStatus).catch(() => {});
    }
  }, []);

  const eurEarned = history.filter(h => h.type === 'earned' && h.amount_eur != null).reduce((s, h) => s + parseFloat(h.amount_eur), 0);
  const eurSpent  = history.filter(h => h.type === 'spent'  && h.amount_eur != null).reduce((s, h) => s + parseFloat(h.amount_eur), 0);
  const pendingCount = history.filter(h => h.type === 'earned' && h.payment_status === 'authorized').length;

  return (
    <div className="max-w-lg mx-auto animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-1 dark:text-white">Earnings & Payouts</h2>
      <p className="text-sm text-gray-400 mb-6">Your payment history and payout settings</p>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] p-4">
          <p className="text-xs text-gray-400 mb-1">Total earned</p>
          <p className="text-2xl font-bold text-green-600">{fmtEur(eurEarned)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{history.filter(h => h.type === 'earned').length} services</p>
        </div>
        <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] p-4">
          <p className="text-xs text-gray-400 mb-1">Total spent</p>
          <p className="text-2xl font-bold text-red-500">{fmtEur(eurSpent)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{history.filter(h => h.type === 'spent').length} requests</p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{pendingCount} payment{pendingCount > 1 ? 's' : ''} pending</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Held in escrow — released after delivery confirmed</p>
          </div>
          <Link to="/dashboard" className="text-xs text-blue-600 font-medium">View →</Link>
        </div>
      )}

      {/* ── Payout account ── */}
      <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payout account</h3>

        {!connectStatus ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : connectStatus.status === 'active' ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                Bank connected · payments enabled
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Stripe pays out to your bank automatically after each confirmed delivery (2–7 business days).</p>
            <button disabled={connectLoading} onClick={async () => {
              setConnectLoading(true);
              try { const r: any = await api.stripeConnectDashboard(); window.open(r.url, '_blank'); }
              catch (err: any) { toast(err.message, 'error'); }
              setConnectLoading(false);
            }} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a3942] disabled:opacity-50">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
              {connectLoading ? 'Opening…' : 'View payout dashboard'}
            </button>
          </div>
        ) : connectStatus.status === 'pending' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Verification in progress
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Stripe is verifying your details. Usually takes a few minutes to a few hours.</p>
            <button onClick={async () => {
              try { const r: any = await api.stripeConnectOnboard(); window.location.href = r.url; } catch (e: any) { toast(e.message, 'error'); }
            }} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">Complete setup →</button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Connect your bank account via Stripe to receive payments when you deliver a service.</p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2.5 mb-3 text-xs text-blue-700 dark:text-blue-300">
              Payment is held securely when a buyer requests your service. After they confirm delivery, Stripe sends 80% directly to your bank account.
            </div>
            <button disabled={connectLoading} onClick={async () => {
              setConnectLoading(true);
              try { const r: any = await api.stripeConnectOnboard(); window.location.href = r.url; }
              catch (err: any) { toast(err.message, 'error'); setConnectLoading(false); }
            }} className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-gray-800 transition-colors">
              {connectLoading
                ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
              }
              Connect bank account
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl">
        {(['earnings', 'history'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === tb ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
            {tb === 'earnings' ? 'Earnings' : 'All Transactions'}
          </button>
        ))}
      </div>

      {tab === 'earnings' && (
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : history.filter(h => h.type === 'earned').length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942]">
              <p className="text-gray-400 text-sm mb-1">No earnings yet</p>
              <p className="text-xs text-gray-300">Offer a service and get your first payment</p>
              <Link to="/services/new" className="inline-block mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">+ Offer a service</Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] divide-y divide-gray-50 dark:divide-[#2a3942]">
              {history.filter(h => h.type === 'earned').map((tx, i) => <TxRow key={i} tx={tx} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942]">
              <p className="text-gray-400 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-[#2a3942] divide-y divide-gray-50 dark:divide-[#2a3942]">
              {history.map((tx, i) => <TxRow key={i} tx={tx} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
