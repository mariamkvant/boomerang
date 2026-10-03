import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';

export default function EditServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', subcategory_id: '',
    price_eur: '', duration_minutes: '',
    is_product: false, city: '', country: 'Luxembourg',
  });
  const [image, setImage] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getService(Number(id)), api.getCategories()]).then(([svc, cats]) => {
      setCategories(cats);
      setForm({
        title: svc.title,
        description: svc.description,
        category_id: String(svc.category_id),
        subcategory_id: svc.subcategory_id ? String(svc.subcategory_id) : '',
        price_eur: svc.price_eur ? String(svc.price_eur) : svc.points_cost ? String((svc.points_cost / 10).toFixed(2)) : '',
        duration_minutes: String(svc.duration_minutes || 60),
        is_product: !!svc.is_product,
        city: svc.city || '',
        country: svc.country || 'Luxembourg',
      });
      setExistingImage(svc.image || null);
      if (svc.category_id) api.getSubcategories(svc.category_id).then(setSubcategories).catch(() => {});
      setLoading(false);
    }).catch(() => { setError('Service not found'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (form.category_id) api.getSubcategories(Number(form.category_id)).then(setSubcategories).catch(() => setSubcategories([]));
  }, [form.category_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Image must be under 2MB', 'error');
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    const price = parseFloat(form.price_eur);
    if (!price || price <= 0) { setError('Please enter a valid price'); setSaving(false); return; }
    try {
      const body: any = {
        title: form.title,
        description: form.description,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        price_eur: price,
        duration_minutes: Number(form.duration_minutes),
        is_product: form.is_product,
        city: (form as any).district ? `${form.city} — ${(form as any).district}` : form.city,
        country: form.country,
      };
      if (image !== null) body.image = image; // new image uploaded
      await api.updateService(Number(id), body);
      navigate(`/services/${id}`);
    } catch (err: any) { setError(err.message); setSaving(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const displayImage = image || existingImage;

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Edit Listing</h2>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#1c1c1c] p-4 sm:p-8 rounded-2xl shadow-card space-y-5">

        {/* Service / Item toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#242424] rounded-xl">
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: false }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!form.is_product ? 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Service
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.is_product ? 'bg-white dark:bg-[#1c1c1c] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Item / Product
          </button>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input id="title" required value={form.title} onChange={set('title')}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#242424] dark:text-white" />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <select id="category" required value={form.category_id} onChange={set('category_id')}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">Select</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label htmlFor="sub" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subcategory</label>
            <select id="sub" value={form.subcategory_id} onChange={set('subcategory_id')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">None</option>
              {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
          <textarea id="desc" required value={form.description} onChange={set('description')} rows={4}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#242424] dark:text-white" />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
          <select id="country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value, city: '' }))}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
            {['Georgia','Luxembourg','United Kingdom','Germany','France','Netherlands','Belgium','Spain','Portugal','Ireland','Switzerland','Austria','Italy','Sweden','Denmark','Norway','Finland','Poland','Czech Republic','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City / Area</label>
          {form.country === 'Luxembourg' ? (
            <select id="city" value={form.city} onChange={set('city')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select commune</option>
              {['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange','Ettelbruck','Diekirch','Wiltz','Echternach','Remich','Grevenmacher','Mersch','Mamer','Strassen','Bertrange','Hesperange','Walferdange','Bettembourg','Schifflange','Kayl','Sanem','Pétange','Bascharage','Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : form.country === 'Georgia' ? (
            <select id="city" value={form.city} onChange={set('city')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select your city</option>
              {['Tbilisi','Batumi','Kutaisi','Rustavi','Gori','Zugdidi','Poti','Khashuri','Samtredia','Senaki','Marneuli','Telavi','Akhaltsikhe','Ozurgeti','Kaspi','Chiatura','Tskaltubo','Borjomi','Akhalkalaki','Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input id="city" value={form.city} onChange={set('city')} placeholder="Your city or area"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#242424] dark:text-white" />
          )}
        </div>

        {/* Tbilisi district selector */}
        {form.country === 'Georgia' && form.city === 'Tbilisi' && (
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">District / Area in Tbilisi</label>
            <select id="district" value={(form as any).district || ''} onChange={e => setForm(f => ({ ...f, district: e.target.value } as any))}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#242424] dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Select district (optional)</option>
              {['Old Tbilisi (Dzveli Tbilisi)','Vake','Saburtalo','Didube','Gldani','Isani','Samgori','Nadzaladevi','Mtatsminda','Chugureti','Avlabari','Ortachala','Varketili','Dighomi','Temqa','Ponichala','Lilo','Shindisi','Other'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Price — symbol changes based on country */}
        {(() => {
          const isGel = form.country === 'Georgia';
          const sym = isGel ? '₾' : '€';
          return (
            <div>
              <label htmlFor="price_eur" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Price {isGel ? '(Georgian Lari ₾)' : '(Euro €)'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">{sym}</span>
                <input id="price_eur" type="number" min="1" max="99999" step="0.01" required
                  value={form.price_eur} onChange={set('price_eur')}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#242424] dark:text-white" />
              </div>
              {form.price_eur && parseFloat(form.price_eur) > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  You receive <span className="font-semibold text-green-600">{sym}{(parseFloat(form.price_eur) * 0.8).toFixed(2)}</span> after 20% platform fee
                </p>
              )}
            </div>
          );
        })()}

        {/* Duration */}
        {!form.is_product && (
          <div>
            <label htmlFor="dur" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (min)</label>
            <input id="dur" type="number" min="15" value={form.duration_minutes} onChange={set('duration_minutes')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#242424] dark:text-white" />
          </div>
        )}

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {form.is_product ? 'Item Photo' : 'Service Image (optional)'}
          </label>
          {displayImage ? (
            <div className="relative">
              <img src={displayImage} alt="" className="w-full h-40 object-cover rounded-xl" />
              <button type="button" onClick={() => { setImage(null); setExistingImage(null); }}
                className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white">✕</button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300">
              <span className="text-gray-400 text-sm">Click to upload an image</span>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex-1 bg-[#1f2937] text-white py-3 rounded-xl font-semibold hover:bg-[#111827] disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-[#242424]">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
