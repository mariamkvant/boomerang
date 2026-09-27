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
  const [form, setForm] = useState({
    title: '', description: '', category_id: '', subcategory_id: '',
    price_eur: '', duration_minutes: '60',
    is_bundle: false, sessions_count: '1', bundle_discount: '10',
    city: '', country: 'Luxembourg', is_product: false, quantity: '1',
    district: '',
  });
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
      `Looking for ${form.title.toLowerCase()}? I can help! I have practical experience in ${catName.toLowerCase()} and I'm passionate about helping others. Let's connect and make it happen.`,
      `${form.title} — available for the community. I believe in sharing skills and helping each other out. Reach out if you need help with ${catName.toLowerCase()}, I'd love to assist.`,
    ];
    setForm(f => ({ ...f, description: templates[Math.floor(Math.random() * templates.length)] }));
  };

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (form.category_id) {
      api.getSubcategories(Number(form.category_id)).then(setSubcategories).catch(() => setSubcategories([]));
      setForm(f => ({ ...f, subcategory_id: '' }));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    const price = parseFloat(form.price_eur);
    if (!price || price <= 0) {
      setError('Please enter a price greater than €0');
      setLoading(false); return;
    }
    if (price > 9999) {
      setError('Price cannot exceed €9,999');
      setLoading(false); return;
    }

    try {
      const res = await api.createService({
        ...form,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        price_eur: price,
        duration_minutes: Number(form.duration_minutes),
        is_bundle: form.is_bundle,
        sessions_count: Number(form.sessions_count),
        bundle_discount: Number(form.bundle_discount),
        group_id: groupId ? Number(groupId) : null,
        image,
        is_product: form.is_product,
        quantity: Number(form.quantity),
        // Include district in city field if Tbilisi
        city: form.district ? `${form.city} — ${form.district}` : form.city,
      });
      navigate(`/services/${res.id}`);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-2 dark:text-white">Offer a Service</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {groupId ? 'This service will be posted to your community only' : 'Share what you\'re good at — set your own price'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#202c33] p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">

        {/* Service type toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2a3942] rounded-xl">
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: false }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Service
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Item / Product
          </button>
        </div>

        {form.is_product && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
            List a physical item you're offering — homemade goods, plants, books, crafts, etc. Arrange pickup/delivery via messages.
          </div>
        )}

        {/* Quick/Advanced toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">{quickMode ? 'Quick mode' : 'Advanced mode'}</span>
          <button type="button" onClick={() => setQuickMode(!quickMode)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            {quickMode ? 'Show more options' : 'Simplify'}
          </button>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <select id="category" required value={form.category_id} onChange={set('category_id')}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
            <option value="">Select a category</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        {subcategories.length > 0 && (
          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subcategory</label>
            <select id="subcategory" required value={form.subcategory_id} onChange={set('subcategory_id')}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
              <option value="">Select a subcategory</option>
              {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input id="title" required value={form.title} onChange={set('title')} placeholder="e.g. Guitar lessons for beginners"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country</label>
          <select id="country" required value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value, city: '' }))}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
            {['Luxembourg','Georgia','United Kingdom','Germany','France','Netherlands','Belgium','Spain','Portugal','Ireland','Switzerland','Austria','Italy','Sweden','Denmark','Norway','Finland','Poland','Czech Republic','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City / Area</label>
          {form.country === 'Luxembourg' ? (
            <select id="city" required value={form.city} onChange={set('city')}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
              <option value="">Select your commune</option>
              {['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange','Ettelbruck','Diekirch','Wiltz','Echternach','Remich','Grevenmacher','Mersch','Capellen','Steinfort','Mamer','Strassen','Bertrange','Hesperange','Sandweiler','Niederanven','Walferdange','Steinsel','Lorentzweiler','Lintgen','Bettembourg','Schifflange','Kayl','Rumelange','Sanem','Mondercange','Pétange','Bascharage','Clemency','Garnich','Hobscheid','Koerich','Septfontaines','Kehlen','Kopstal','Leudelange','Reckange-sur-Mess','Roeser','Weiler-la-Tour','Contern','Frisange','Mondorf-les-Bains','Dalheim','Lenningen','Stadtbredimus','Waldbredimus','Bous','Betzdorf','Flaxweiler','Junglinster','Manternach','Mertert','Wormeldange','Bech','Beaufort','Consdorf','Larochette','Medernach','Nommern','Reisdorf','Rosport-Mompach','Waldbillig','Berdorf','Bourscheid','Clervaux','Esch-sur-Sûre','Feulen','Grosbous','Hoscheid','Kiischpelt','Lac de la Haute-Sûre','Parc Hosingen','Putscheid','Tandel','Troisvierges','Vianden','Weiswampach','Wincrange','Winseler','Bissen','Colmar-Berg','Ell','Fischbach','Helperknapp','Préizerdaul','Rambrouch','Redange-sur-Attert','Saeul','Useldange','Vichten','Wahl','Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : form.country === 'Georgia' ? (
            <select id="city" required value={form.city} onChange={set('city')}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
              <option value="">Select your city</option>
              {['Tbilisi','Batumi','Kutaisi','Rustavi','Gori','Zugdidi','Poti','Khashuri','Samtredia','Senaki','Zugdidi','Marneuli','Telavi','Akhaltsikhe','Ozurgeti','Kaspi','Chiatura','Tskaltubo','Borjomi','Akhalkalaki','Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input id="city" required value={form.city} onChange={set('city')}
              placeholder={form.country === 'United Kingdom' ? 'e.g. London, Bristol...' : form.country === 'Germany' ? 'e.g. Berlin, Munich...' : form.country === 'France' ? 'e.g. Paris, Lyon...' : 'Your city or area'}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
          )}
        </div>

        {/* Tbilisi district selector */}
        {form.country === 'Georgia' && form.city === 'Tbilisi' && (
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">District / Area in Tbilisi</label>
            <select id="district" value={form.district || ''} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-[#2a3942] dark:text-white">
              <option value="">Select district (optional)</option>
              {['Old Tbilisi (Dzveli Tbilisi)','Vake','Saburtalo','Didube','Gldani','Isani','Samgori','Nadzaladevi','Mtatsminda','Chugureti','Avlabari','Ortachala','Varketili','Dighomi','Temqa','Ponichala','Lilo','Shindisi','Other'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <button type="button" onClick={generateDescription} className="text-xs text-primary-600 hover:text-primary-700 font-medium">AI Generate</button>
          </div>
          <textarea id="description" required value={form.description} onChange={set('description')} rows={4}
            placeholder="Describe what you offer, your experience, and what people can expect..."
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        {/* Image */}
        {(form.is_product || !quickMode) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {form.is_product ? 'Item Photo' : 'Service Image (optional)'}
              {form.is_product && <span className="text-red-500 ml-1">*</span>}
            </label>
            {image ? (
              <div className="relative">
                <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white">✕</button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300">
                <span className="text-gray-400 text-sm">Click to upload an image</span>
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        )}

        {/* Duration */}
        {!quickMode && !form.is_product && (
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (minutes)</label>
            <div className="flex gap-2 mb-2">
              {[30, 60, 90, 120].map(d => (
                <button key={d} type="button" onClick={() => setForm(f => ({ ...f, duration_minutes: String(d) }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.duration_minutes === String(d) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
                  {d} min
                </button>
              ))}
            </div>
            <input id="duration" type="number" min="15" step="15" value={form.duration_minutes} onChange={set('duration_minutes')}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white"
              placeholder="Or enter custom duration" />
          </div>
        )}

        {/* ── EUR Price ── */}
        <div>
          <label htmlFor="price_eur" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your price</label>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-3 text-xs text-blue-700 dark:text-blue-300">
            You keep <span className="font-semibold">90%</span> — Boomerang takes a 10% platform fee when payment is released.
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">€</span>
            <input id="price_eur" type="number" min="1" max="9999" step="0.01" required
              value={form.price_eur} onChange={set('price_eur')}
              placeholder="0.00"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
          </div>
          {form.price_eur && parseFloat(form.price_eur) > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              You'll receive <span className="font-semibold text-green-600">€{(parseFloat(form.price_eur) * 0.9).toFixed(2)}</span> after the 10% platform fee
            </p>
          )}
        </div>

        {/* Quantity — products only */}
        {form.is_product && (
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity available</label>
            <input id="quantity" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
          </div>
        )}

        {/* Bundle — services only in advanced mode */}
        {!quickMode && !form.is_product && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_bundle} onChange={e => setForm(f => ({ ...f, is_bundle: e.target.checked }))} className="rounded" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Offer as a package deal</span>
            </label>
            {form.is_bundle && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label htmlFor="sessions" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Number of sessions</label>
                  <input id="sessions" type="number" min="2" value={form.sessions_count} onChange={e => setForm(f => ({ ...f, sessions_count: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
                </div>
                <div>
                  <label htmlFor="discount" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount %</label>
                  <input id="discount" type="number" min="0" max="50" value={form.bundle_discount} onChange={e => setForm(f => ({ ...f, bundle_discount: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 hover:shadow-md transition-all">
          {loading ? 'Creating...' : form.is_product ? 'List Item' : 'Publish Service'}
        </button>
      </form>
    </div>
  );
}
