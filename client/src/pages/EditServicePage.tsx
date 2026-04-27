import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function EditServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', subcategory_id: '', points_cost: '', duration_minutes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getService(Number(id)), api.getCategories()]).then(([svc, cats]) => {
      setCategories(cats);
      setForm({ title: svc.title, description: svc.description, category_id: String(svc.category_id), subcategory_id: svc.subcategory_id ? String(svc.subcategory_id) : '', points_cost: String(svc.points_cost), duration_minutes: String(svc.duration_minutes) });
      if (svc.category_id) api.getSubcategories(svc.category_id).then(setSubcategories).catch(() => {});
      setLoading(false);
    }).catch(() => { setError('Service not found'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (form.category_id) api.getSubcategories(Number(form.category_id)).then(setSubcategories).catch(() => setSubcategories([]));
  }, [form.category_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.updateService(Number(id), {
        title: form.title, description: form.description,
        category_id: Number(form.category_id), subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        points_cost: Number(form.points_cost), duration_minutes: Number(form.duration_minutes),
      });
      navigate(`/services/${id}`);
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }));

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-6">Edit Service</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSave} className="bg-white p-4 sm:p-8 rounded-2xl shadow-card space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input id="title" required value={form.title} onChange={set('title')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select id="category" required value={form.category_id} onChange={set('category_id')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">Select</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        {subcategories.length > 0 && (
          <div>
            <label htmlFor="sub" className="block text-sm font-medium text-gray-700 mb-1.5">Subcategory</label>
            <select id="sub" value={form.subcategory_id} onChange={set('subcategory_id')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">None</option>
              {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea id="desc" required value={form.description} onChange={set('description')} rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pts" className="block text-sm font-medium text-gray-700 mb-1.5">Boomerangs</label>
            <input id="pts" type="number" min="1" required value={form.points_cost} onChange={set('points_cost')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label htmlFor="dur" className="block text-sm font-medium text-gray-700 mb-1.5">Duration (min)</label>
            <input id="dur" type="number" min="15" required value={form.duration_minutes} onChange={set('duration_minutes')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  );
}
