import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { t } from '../i18n';

export default function HelpWantedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'browse' | 'mine' | 'post'>('browse');
  const [requests, setRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', points_budget: '10' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.getHelpWanted('include_completed=true').then(setRequests).catch(() => {});
    if (user) api.getMyHelpWanted().then(setMyRequests).catch(() => {});
  };
  useEffect(() => { load(); api.getCategories().then(setCategories).catch(() => {}); }, [user]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api.postHelpWanted({ ...form, category_id: Number(form.category_id), points_budget: Number(form.points_budget) });
      setSuccess('Posted! People can now offer to help.'); setForm({ title: '', description: '', category_id: '', points_budget: '10' });
      load(); setTab('browse');
    } catch (err: any) { setError(err.message); }
  };

  const handleOffer = async (id: number) => {
    try { await api.offerHelp(id); setSuccess('Offer sent!'); load(); } catch (err: any) { toast(err.message, 'error'); }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{t('help.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('help.subtitle')}</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">⚠️ {error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm">✓ {success}</div>}

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-[#202c33] p-1 rounded-xl">
        {(['browse', 'mine', 'post'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${tab === tb ? 'bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            {tb === 'browse' ? t('help.browseRequests') : tb === 'mine' ? t('help.myRequests') : t('help.askForHelp')}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="space-y-3">
          {requests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-card">
              <p className="text-gray-400 text-sm mb-4">{t('help.noRequests')}</p>
              <Link to="/browse" className="text-sm text-primary-600 hover:underline">{t('home.browseAll')} →</Link>
            </div>
          )}
          {requests.map((r: any) => (
            <Link key={r.id} to={`/help-wanted/${r.id}`} className="block bg-white dark:bg-[#202c33] p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-400">{r.category_name}</span>
                    <span className="text-xs text-primary-600 font-medium">{r.points_budget} 🪃</span>
                    {r.status !== 'open' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'completed' ? 'bg-green-50 text-green-600' :
                        r.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                        r.status === 'delivered' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{r.status === 'completed' ? 'Completed ✓' : r.status === 'accepted' ? 'In progress' : r.status === 'delivered' ? 'Delivered' : r.status}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm dark:text-white">{r.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {r.requester_name}{r.requester_city ? ` · ${r.requester_city}` : ''}
                    {r.helper_name ? ` · Helper: ${r.helper_name}` : ''}
                  </p>
                  {user && user.id !== r.requester_id && r.status === 'open' && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOffer(r.id); }}
                      className="mt-3 bg-primary-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600">
                      I Can Help
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {myRequests.length === 0 && <p className="text-gray-400 text-sm text-center py-8">You haven't posted any help requests yet.</p>}
          {myRequests.map((r: any) => (
            <div key={r.id} className="bg-white dark:bg-[#202c33] p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm dark:text-white">{r.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-green-50 text-green-600' : r.status === 'accepted' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>{r.status}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.category_icon} {r.category_name} · 🪃 {r.points_budget}</p>
              {r.helper_name && <p className="text-xs text-primary-600 mt-1">Helper: {r.helper_name}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'post' && user && (
        <form onSubmit={handlePost} className="bg-white p-8 rounded-2xl shadow-card space-y-5 max-w-lg">
          <div>
            <label htmlFor="hw-title" className="block text-sm font-medium text-gray-700 mb-1.5">What do you need help with?</label>
            <input id="hw-title" required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Need someone to fix my leaky faucet"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label htmlFor="hw-cat" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select id="hw-cat" required value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select a category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="hw-desc" className="block text-sm font-medium text-gray-700 mb-1.5">Details</label>
            <textarea id="hw-desc" required value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="Describe what you need..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label htmlFor="hw-pts" className="block text-sm font-medium text-gray-700 mb-1.5">Boomerangs you'll pay</label>
            <input id="hw-pts" type="number" min="1" required value={form.points_budget} onChange={e => setForm(f => ({...f, points_budget: e.target.value}))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <button type="submit" className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600">Post Request</button>
        </form>
      )}
    </div>
  );
}
