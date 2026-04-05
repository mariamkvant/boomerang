import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', subcategory_id: '', points_cost: '', duration_minutes: '60', is_bundle: false, sessions_count: '1', bundle_discount: '10', city: '' });
  const [suggested, setSuggested] = useState<{ suggested: number; min: number; max: number; multiplier: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Image must be under 2MB', 'error');
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateDescription = () => {
    if (!form.title) return;
    const cat = categories.find((c: any) => String(c.id) === form.category_id);
    const catName = cat?.name || 'this';
    const templates = [
      `I'm offering ${form.title.toLowerCase()} to anyone in the community. Whether you're a beginner or just need a hand, I'm happy to help. I have experience with ${catName.toLowerCase()} and enjoy sharing what I know.`,
      `Looking for ${form.title.toLowerCase()}? I can help! I have practical experience in ${catName.toLowerCase()} and I'm passionate about helping others learn and grow. Let's connect and make it happen.`,
      `${form.title} — available for the community. I believe in sharing skills and helping each other out. Reach out if you need help with ${catName.toLowerCase()}, I'd love to assist.`,
    ];
    setForm(f => ({ ...f, description: templates[Math.floor(Math.random() * templates.length)] }));
  };

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

  // Auto-calculate boomerangs when category or duration changes
  useEffect(() => {
    if (form.category_id && form.duration_minutes) {
      api.calculateBoomerangs(Number(form.category_id), Number(form.duration_minutes))
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
      setError(`Boomerangs must be between ${suggested.min} and ${suggested.max} for this category and duration`);
      setLoading(false); return;
    }
    try {
      const res = await api.createService({
        ...form, category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        points_cost: Number(form.points_cost), duration_minutes: Number(form.duration_minutes),
        is_bundle: form.is_bundle, sessions_count: Number(form.sessions_count), bundle_discount: Number(form.bundle_discount),
        group_id: groupId ? Number(groupId) : null, image,
      });
      navigate(`/services/${res.id}`);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  const selectedCat = categories.find((c: any) => String(c.id) === form.category_id);

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">Offer a Service</h2>
      <p className="text-gray-500 text-sm mb-6">
        {groupId ? '📌 This service will be posted to your community only' : 'Share what you\'re good at with the community'}
      </p>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#202c33] p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">
        {/* Quick/Advanced toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">{quickMode ? 'Quick mode' : 'Advanced mode'}</span>
          <button type="button" onClick={() => setQuickMode(!quickMode)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            {quickMode ? 'Show more options' : 'Simplify'}
          </button>
        </div>
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select id="category" required value={form.category_id} onChange={set('category_id')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
            <option value="">Select a category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name} ({c.multiplier}x)</option>
            ))}
          </select>
          {selectedCat && (
            <p className="text-xs text-gray-400 mt-1.5">
              Multiplier: <span className="font-semibold text-primary-600">{selectedCat.multiplier}x</span>
            </p>
          )}
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1.5">Subcategory</label>
            <select id="subcategory" required value={form.subcategory_id} onChange={set('subcategory_id')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
              <option value="">Select a subcategory</option>
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

        {/* Location / Commune */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">Location (Commune)</label>
          <select id="city" required value={form.city} onChange={set('city')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white">
            <option value="">Select your commune</option>
            {['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange','Ettelbruck','Diekirch','Wiltz','Echternach','Remich','Grevenmacher','Mersch','Capellen','Steinfort','Mamer','Strassen','Bertrange','Hesperange','Sandweiler','Niederanven','Walferdange','Steinsel','Lorentzweiler','Lintgen','Bettembourg','Schifflange','Kayl','Rumelange','Sanem','Mondercange','Pétange','Bascharage','Clemency','Garnich','Hobscheid','Koerich','Septfontaines','Kehlen','Kopstal','Leudelange','Reckange-sur-Mess','Roeser','Weiler-la-Tour','Contern','Frisange','Mondorf-les-Bains','Dalheim','Lenningen','Stadtbredimus','Waldbredimus','Bous','Betzdorf','Flaxweiler','Junglinster','Manternach','Mertert','Wormeldange','Bech','Beaufort','Consdorf','Larochette','Medernach','Nommern','Reisdorf','Rosport-Mompach','Waldbillig','Berdorf','Bourscheid','Clervaux','Esch-sur-Sûre','Feulen','Grosbous','Hoscheid','Kiischpelt','Lac de la Haute-Sûre','Parc Hosingen','Putscheid','Tandel','Troisvierges','Vianden','Weiswampach','Wincrange','Winseler','Bissen','Colmar-Berg','Ell','Fischbach','Helperknapp','Préizerdaul','Rambrouch','Redange-sur-Attert','Saeul','Useldange','Vichten','Wahl','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <button type="button" onClick={generateDescription} className="text-xs text-primary-600 hover:text-primary-700 font-medium">AI Generate</button>
          </div>
          <textarea id="description" required value={form.description} onChange={set('description')} rows={4}
            placeholder="Describe what you offer, your experience, and what people can expect..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
        </div>

        {/* Image */}
        {!quickMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Image (optional)</label>
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
              <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white">✕</button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300">
              <span className="text-gray-400 text-sm">Click to upload an image</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>
        )}

        {/* Duration */}
        {!quickMode && (
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
        )}

        {/* Boomerangs — auto-calculated */}
        <div>
          <label htmlFor="boomerangs" className="block text-sm font-medium text-gray-700 mb-1.5">Boomerangs Cost</label>
          {suggested && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Suggested: <span className="font-semibold">{suggested.suggested}</span> boomerangs</span>
                <span className="text-xs text-gray-400">{selectedCat?.multiplier}x</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Range: {suggested.min} – {suggested.max}
              </div>
            </div>
          )}
          <div className="relative">
            <input id="boomerangs" type="number" min={suggested?.min || 1} max={suggested?.max || 999} required
              value={form.points_cost} onChange={set('points_cost')}
              className="w-full border border-gray-200 rounded-xl px-4 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
          </div>
        </div>

        {/* Bundle option */}
        {!quickMode && (
        <div className="border-t border-gray-100 pt-5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_bundle} onChange={e => setForm(f => ({...f, is_bundle: e.target.checked}))} className="rounded" />
            <span className="font-medium text-gray-700">Offer as a package deal</span>
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
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 hover:shadow-md">
          {loading ? 'Creating...' : 'Publish Service'}
        </button>
      </form>
    </div>
  );
}
