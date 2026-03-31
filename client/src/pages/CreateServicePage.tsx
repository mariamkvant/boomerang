import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CreateServicePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', subcategory_id: '', points_cost: '', duration_minutes: '60', is_bundle: false, sessions_count: '1', bundle_discount: '10' });
  const [suggested, setSuggested] = useState<{ suggested: number; min: number; max: number; multiplier: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (form.category_id) {
      api.getSubcategories(Number(form.category_id)).then(setSubcategories).catch(() => setSubcategories([]));
      setForm(f => ({ ...f, subcategory_id: '' }));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

  // Auto-calculate points when category or duration changes
  useEffect(() => {
    if (form.category_id && form.duration_minutes) {
      api.calculatePoints(Number(form.category_id), Number(form.duration_minutes))
        .then(data => {
          setSuggested(data);
          setForm(f => ({ ...f, points_cost: String(data.suggested) }));
        }).catch(() => {});
    }
  }, [form.category_id, form.duration_minutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    if (suggested && (Number(form.points_cost) < suggested.min || Number(form.points_cost) > suggested.max)) {
      setError(`Points must be between ${suggested.min} and ${suggested.max} for this category and duration`);
      setLoading(false); return;
    }
    try {
      const res = await api.createService({
        ...form, category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        points_cost: Number(form.points_cost), duration_minutes: Number(form.duration_minutes),
        is_bundle: form.is_bundle, sessions_count: Number(form.sessions_count), bundle_discount: Number(form.bundle_discount),
      });
      navigate(`/services/${res.id}`);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  const selectedCat = categories.find((c: any) => String(c.id) === form.category_id);

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Offer a Service</h2>
      <p className="text-gray-500 text-sm mb-6">Share what you're good at with the community</p>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-card space-y-5">
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select id="category" required value={form.category_id} onChange={set('category_id')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
            <option value="">Select a category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name} ({c.multiplier}x)</option>
            ))}
          </select>
          {selectedCat && (
            <p className="text-xs text-gray-400 mt-1.5">
              Multiplier: <span className="font-semibold text-primary-600">{selectedCat.multiplier}x</span> — {selectedCat.multiplier >= 2 ? 'Specialized skill' : selectedCat.multiplier >= 1.5 ? 'Knowledge-based' : selectedCat.multiplier >= 1.2 ? 'Moderate effort' : 'General effort'}
            </p>
          )}
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1.5">Subcategory</label>
            <select id="subcategory" value={form.subcategory_id} onChange={set('subcategory_id')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
              <option value="">Select a subcategory (optional)</option>
              {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Service Title</label>
          <input id="title" required value={form.title} onChange={set('title')} placeholder="e.g. Guitar lessons for beginners"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea id="description" required value={form.description} onChange={set('description')} rows={4}
            placeholder="Describe what you offer, your experience, and what people can expect..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map(d => (
              <button key={d} type="button" onClick={() => setForm(f => ({ ...f, duration_minutes: String(d) }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.duration_minutes === String(d) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                {d} min
              </button>
            ))}
          </div>
          <div className="mt-2">
            <input id="duration" type="number" min="15" step="15" value={form.duration_minutes} onChange={set('duration_minutes')}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Or enter custom duration" />
          </div>
        </div>

        {/* Points — auto-calculated */}
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1.5">Points Cost</label>
          {suggested && (
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700">Suggested: {suggested.suggested} pts</span>
                <span className="text-xs text-primary-500">{selectedCat?.multiplier}x multiplier</span>
              </div>
              <div className="text-xs text-primary-600">
                Formula: {Number(form.duration_minutes)} min ÷ 60 × {selectedCat?.base_rate || 10} base × {selectedCat?.multiplier} = {suggested.suggested} pts
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Allowed range: {suggested.min} – {suggested.max} pts (±20%)
              </div>
            </div>
          )}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm">🪃</span>
            <input id="points" type="number" min={suggested?.min || 1} max={suggested?.max || 999} required
              value={form.points_cost} onChange={set('points_cost')}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
        </div>

        {/* Bundle option */}
        <div className="border-t border-gray-100 pt-5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_bundle} onChange={e => setForm(f => ({...f, is_bundle: e.target.checked}))} className="rounded" />
            <span className="font-medium text-gray-700">📦 Offer as a package deal</span>
          </label>
          {form.is_bundle && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label htmlFor="sessions" className="block text-xs font-medium text-gray-600 mb-1">Number of sessions</label>
                <input id="sessions" type="number" min="2" value={form.sessions_count} onChange={e => setForm(f => ({...f, sessions_count: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label htmlFor="discount" className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                <input id="discount" type="number" min="0" max="50" value={form.bundle_discount} onChange={e => setForm(f => ({...f, bundle_discount: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 hover:shadow-md">
          {loading ? 'Creating...' : 'Publish Service'}
        </button>
      </form>
    </div>
  );
}
