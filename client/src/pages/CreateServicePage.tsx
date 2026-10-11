import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

// ── The 5 core categories always shown + everything else under "Other"
const CORE_CATEGORY_NAMES = ['Plants & Pet Care', 'Childcare & Education', 'Transportation', 'Item Rental', 'Courier Services'];

// Duration options shown as pills
const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export default function CreateServicePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('group');

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [showOtherCategories, setShowOtherCategories] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category_id: '', subcategory_id: '',
    price_eur: '', duration_minutes: '60',           // default 1 hour
    is_bundle: false, sessions_count: '1', bundle_discount: '10',
    city: '', country: 'Luxembourg', is_product: false, quantity: '1',
    district: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);

  // Service location — defaults to provider's home address
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceAddressSuggestions, setServiceAddressSuggestions] = useState<any[]>([]);
  const [serviceAddressSearching, setServiceAddressSearching] = useState(false);
  const [serviceAddressSet, setServiceAddressSet] = useState(false);
  const [serviceLatLng, setServiceLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocationOverride, setShowLocationOverride] = useState(false);
  const addrDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      const userCity = (user as any).city || '';
      if (userCity && !form.city) {
        const parts = userCity.split(' — ');
        const baseCity = parts[0].trim();
        const district = parts[1]?.trim() || '';
        const inferredCountry = ['Tbilisi','Batumi','Kutaisi','Rustavi','Gori'].some(c => baseCity.includes(c)) ? 'Georgia' : form.country;
        setForm(f => ({ ...f, city: baseCity, district, country: inferredCountry }));
      }
      if ((user as any).latitude) {
        setServiceLatLng({ lat: (user as any).latitude, lng: (user as any).longitude });
        setServiceAddress(userCity || 'Home address');
        setServiceAddressSet(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    if (form.category_id) {
      api.getSubcategories(Number(form.category_id)).then(setSubcategories).catch(() => setSubcategories([]));
      setForm(f => ({ ...f, subcategory_id: '' }));
    } else {
      setSubcategories([]);
    }
  }, [form.category_id]);

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
      `I'm offering ${form.title.toLowerCase()} to anyone in the community. Happy to help — I have experience with ${catName.toLowerCase()} and enjoy sharing what I know.`,
      `Looking for ${form.title.toLowerCase()}? I can help! I have practical experience in ${catName.toLowerCase()}. Let's connect and make it happen.`,
      `${form.title} — available for the community. Reach out if you need help with ${catName.toLowerCase()}, I'd love to assist.`,
    ];
    setForm(f => ({ ...f, description: templates[Math.floor(Math.random() * templates.length)] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);

    const price = form.price_eur ? parseFloat(form.price_eur) : null;
    if (price !== null && price <= 0) {
      setError('Price must be greater than €0 — or leave it blank to arrange via message');
      setLoading(false); return;
    }
    if (price !== null && price > 9999) {
      setError('Price cannot exceed €9,999'); setLoading(false); return;
    }

    try {
      const res = await api.createService({
        ...form,
        category_id: Number(form.category_id),
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        price_eur: price,
        duration_minutes: Number(form.duration_minutes) || 60,
        is_bundle: form.is_bundle,
        sessions_count: Number(form.sessions_count),
        bundle_discount: Number(form.bundle_discount),
        group_id: groupId ? Number(groupId) : null,
        image,
        is_product: form.is_product,
        quantity: Number(form.quantity),
        city: form.district ? `${form.city} — ${form.district}` : form.city,
        service_address: serviceAddress || null,
        service_latitude: serviceLatLng?.lat || null,
        service_longitude: serviceLatLng?.lng || null,
      });
      setCreatedServiceId(res.id);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  // ── Success screen ────────────────────────────────────────────────────────
  if (createdServiceId != null) {
    return (
      <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
        <div className="bg-white dark:bg-[#202c33] p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold dark:text-white mb-2">Service listed!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Now set your availability so buyers can book a time slot.
          </p>
          <div className="space-y-3">
            <button onClick={() => navigate(`/availability?service=${createdServiceId}`)}
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600">
              Set availability →
            </button>
            <button onClick={() => navigate(`/services/${createdServiceId}`)}
              className="w-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              View service
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-gray-400 py-2">
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const coreCategories = categories.filter(c => CORE_CATEGORY_NAMES.includes(c.name));
  const otherCategories = categories.filter(c => !CORE_CATEGORY_NAMES.includes(c.name));
  const selectedCat = categories.find(c => String(c.id) === form.category_id);
  const isGel = form.country === 'Georgia';
  const currencySymbol = isGel ? '₾' : '€';

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      <h2 className="text-2xl font-bold mb-1 dark:text-white">Offer a Service</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {groupId ? 'This will be posted to your community only' : 'Share what you\'re good at'}
      </p>

      {/* Address gate */}
      {!(user as any)?.latitude && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Set your home address first</p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
            Your address is kept private and only used so neighbours can find your services nearby.
          </p>
          <a href="/settings" className="inline-block bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600">
            Go to Settings →
          </a>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#202c33] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">

        {/* ── Service / Item toggle ── */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2a3942] rounded-xl">
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: false }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Service
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            Item / Rental
          </button>
        </div>

        {/* ── Category pill picker ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</label>
          <div className="flex flex-wrap gap-2">
            {coreCategories.map((c: any) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm(f => ({ ...f, category_id: String(c.id), subcategory_id: '' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  form.category_id === String(c.id)
                    ? 'bg-[#1f2937] text-white border-[#1f2937]'
                    : 'bg-white dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
            {/* Other bucket */}
            {showOtherCategories ? (
              <>
                {otherCategories.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, category_id: String(c.id), subcategory_id: '' })); setShowOtherCategories(false); }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      form.category_id === String(c.id)
                        ? 'bg-[#1f2937] text-white border-[#1f2937]'
                        : 'bg-white dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
                <button type="button" onClick={() => setShowOtherCategories(false)}
                  className="px-4 py-2 rounded-full text-sm font-medium border bg-gray-100 dark:bg-[#2a3942] text-gray-500 border-gray-200 dark:border-gray-600">
                  Show less ↑
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setShowOtherCategories(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  form.category_id && !coreCategories.find(c => String(c.id) === form.category_id)
                    ? 'bg-[#1f2937] text-white border-[#1f2937]'
                    : 'bg-white dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}>
                {form.category_id && !coreCategories.find(c => String(c.id) === form.category_id)
                  ? `${selectedCat?.icon} ${selectedCat?.name}`
                  : `+ More categories`}
              </button>
            )}
          </div>

          {/* Subcategory pills — shown when a category is selected */}
          {subcategories.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Specify further (optional)</p>
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((s: any) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, subcategory_id: form.subcategory_id === String(s.id) ? '' : String(s.id) }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.subcategory_id === String(s.id)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Title ── */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input id="title" required value={form.title} onChange={set('title')}
            placeholder="e.g. Dog walking in the park"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        {/* ── Description ── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <button type="button" onClick={generateDescription} className="text-xs text-primary-600 hover:text-primary-700 font-medium">AI Generate</button>
          </div>
          <textarea id="description" required value={form.description} onChange={set('description')} rows={3}
            placeholder="What do you offer? What can people expect?"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
        </div>

        {/* ── Duration ── */}
        {!form.is_product && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Session duration
              <span className="ml-1 text-xs font-normal text-gray-400">— buyers will book in this unit</span>
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {DURATION_OPTIONS.map(d => (
                <button key={d.value} type="button"
                  onClick={() => setForm(f => ({ ...f, duration_minutes: String(d.value) }))}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.duration_minutes === String(d.value)
                      ? 'bg-[#1f2937] text-white border-[#1f2937]'
                      : 'bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>
            {/* Availability link */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-primary-800 dark:text-primary-300">Set your schedule</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">Buyers will see available slots in your service calendar</p>
              </div>
              <a href="/availability" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 whitespace-nowrap shrink-0">
                Set hours ↗
              </a>
            </div>
          </div>
        )}

        {/* ── Image (optional for services, shown always for items) ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Photo <span className="text-gray-400 font-normal text-xs">{form.is_product ? '(required)' : '(optional)'}</span>
          </label>
          {image ? (
            <div className="relative">
              <img src={image} alt="" className="w-full h-40 object-cover rounded-xl" />
              <button type="button" onClick={() => setImage(null)}
                className="absolute top-2 right-2 bg-white/80 rounded-full w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white">✕</button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary-300 transition-colors">
              <svg className="w-6 h-6 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
              <span className="text-gray-400 text-sm">Click to upload a photo</span>
              <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* ── Location ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
          {!showLocationOverride ? (
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <div className="flex-1 min-w-0">
                {serviceLatLng ? (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{serviceAddress || 'Home address'}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✓ Buyers can find you in nearby searches</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No address set</p>
                    <p className="text-xs text-amber-600">Go to Settings to add your address</p>
                  </>
                )}
              </div>
              <button type="button" onClick={() => setShowLocationOverride(true)}
                className="text-xs text-primary-600 dark:text-primary-400 font-medium shrink-0">Change</button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <input
                  value={serviceAddress}
                  autoFocus
                  onChange={e => {
                    setServiceAddress(e.target.value);
                    setServiceAddressSet(false);
                    setServiceLatLng(null);
                    if (addrDebounceRef.current) clearTimeout(addrDebounceRef.current);
                    if (e.target.value.length < 3) { setServiceAddressSuggestions([]); return; }
                    setServiceAddressSearching(true);
                    addrDebounceRef.current = setTimeout(async () => {
                      try {
                        const q = encodeURIComponent(e.target.value);
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5`, { headers: { 'User-Agent': 'Boomerang/1.0' } });
                        setServiceAddressSuggestions(await res.json());
                      } catch {}
                      setServiceAddressSearching(false);
                    }, 500);
                  }}
                  placeholder="Search for a different meeting point..."
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white pr-8"
                />
                {serviceAddressSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-3.5 h-3.5 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
                )}
                {serviceAddressSuggestions.length > 0 && !serviceAddressSet && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-20 overflow-hidden">
                    {serviceAddressSuggestions.map((s: any, i: number) => (
                      <button key={i} type="button"
                        onClick={() => { setServiceAddress(s.display_name); setServiceLatLng({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) }); setServiceAddressSuggestions([]); setServiceAddressSet(true); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#374151] border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <p className="font-medium truncate">{s.display_name.split(',').slice(0, 2).join(',')}</p>
                        <p className="text-xs text-gray-400 truncate">{s.display_name.split(',').slice(2).join(',').trim()}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => {
                if (user && (user as any).latitude) {
                  setServiceLatLng({ lat: (user as any).latitude, lng: (user as any).longitude });
                  setServiceAddress((user as any).city || 'Home address');
                  setServiceAddressSet(true);
                }
                setShowLocationOverride(false);
              }} className="text-xs text-gray-400 hover:text-gray-600 mt-1.5">← Use home address</button>
            </div>
          )}
        </div>

        {/* ── Price ── */}
        <div>
          <label htmlFor="price_eur" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Price <span className="text-gray-400 font-normal text-xs">({isGel ? '₾ GEL' : '€ EUR'}) — optional</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol}</span>
            <input id="price_eur" type="number" min="1" max="99999" step="0.01"
              value={form.price_eur} onChange={set('price_eur')}
              placeholder="Leave blank to arrange via message"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
          </div>
          {form.price_eur && parseFloat(form.price_eur) > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              You'll receive <span className="font-semibold text-green-600">{currencySymbol}{(parseFloat(form.price_eur) * 0.8).toFixed(2)}</span> after the 20% platform fee
            </p>
          )}
        </div>

        {/* ── Quantity — items only ── */}
        {form.is_product && (
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Quantity available</label>
            <input id="quantity" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-primary-500 text-white py-3.5 rounded-xl hover:bg-primary-600 font-semibold disabled:opacity-50 transition-all text-sm">
          {loading ? 'Publishing...' : form.is_product ? 'List Item' : 'Publish Service'}
        </button>
      </form>
    </div>
  );
}
