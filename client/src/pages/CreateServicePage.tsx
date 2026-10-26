import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
// ── The 5 core service categories always shown + everything else under "Other"
const CORE_CATEGORY_NAMES = ['Plants & Pet Care', 'Childcare & Education', 'Transportation', 'Courier Services'];

// ── Item categories — separate from service categories
const ITEM_CATEGORIES = [
  { icon: '📱', name: 'Electronics', desc: 'Phones, laptops, cameras, gadgets' },
  { icon: '🪑', name: 'Furniture', desc: 'Tables, chairs, shelves, sofas' },
  { icon: '👕', name: 'Clothes & Accessories', desc: 'Clothing, shoes, bags, jewellery' },
  { icon: '📚', name: 'Books & Media', desc: 'Books, magazines, DVDs, games' },
  { icon: '🌱', name: 'Plants & Garden', desc: 'Potted plants, seeds, tools' },
  { icon: '🍎', name: 'Food & Drinks', desc: 'Homemade goods, produce, snacks' },
  { icon: '👶', name: 'Baby & Kids', desc: 'Toys, strollers, clothes, gear' },
  { icon: '🔧', name: 'Tools & Equipment', desc: 'Power tools, hand tools, equipment' },
  { icon: '🎨', name: 'Arts & Crafts', desc: 'Art supplies, handmade items, decor' },
  { icon: '🏠', name: 'Home & Kitchen', desc: 'Appliances, cookware, decor' },
  { icon: '🚲', name: 'Sports & Outdoors', desc: 'Bikes, camping gear, sports equipment' },
  { icon: '🔑', name: 'Item Rental', desc: 'Lend your item for a daily/weekly fee' },
  { icon: '✨', name: 'Other Items', desc: 'Anything else you want to give or sell' },
];

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

  // Top-level mode: posting an offer (service/item) or a request
  const [postType, setPostType] = useState<'offer' | 'request'>('offer');
  // Request-specific fields
  const [reqTitle, setReqTitle] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqCategoryId, setReqCategoryId] = useState('');
  const [reqBudget, setReqBudget] = useState('');
  const [reqCity, setReqCity] = useState('');
  const [reqLatLng, setReqLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [reqAddressLabel, setReqAddressLabel] = useState('');
  const [reqAddressSuggestions, setReqAddressSuggestions] = useState<any[]>([]);
  const [reqAddressSearching, setReqAddressSearching] = useState(false);
  const reqAddrDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqDone, setReqDone] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [showOtherCategories, setShowOtherCategories] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category_id: '', subcategory_id: '',
    price_eur: '', duration_minutes: '60',
    is_bundle: false, sessions_count: '1', bundle_discount: '10',
    city: '', country: 'Luxembourg', is_product: false, quantity: '1',
    district: '',
  });
  const [isGiveaway, setIsGiveaway] = useState(false);
  const [isRental, setIsRental] = useState(false);
  const [itemCategory, setItemCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);

  // Service location — defaults to provider's home address
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceSlots, setServiceSlots] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([]);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
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
        // Pre-fill request location from profile too
        setReqLatLng({ lat: (user as any).latitude, lng: (user as any).longitude });
        setReqAddressLabel(userCity || 'Home address');
        setReqCity(userCity.split(' — ')[0].trim());
      } else if (userCity) {
        setReqCity(userCity.split(' — ')[0].trim());
        setReqAddressLabel(userCity);
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
    if (price !== null && price < 0) {
      setError('Price cannot be negative');
      setLoading(false); return;
    }
    // price = 0 is valid (free/giveaway)
    // price = null means "contact provider"
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
      // Save service-specific availability if any slots were set
      if (serviceSlots.length > 0) {
        await api.setServiceAvailability(res.id, serviceSlots).catch(() => {});
      }
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
            <button onClick={() => navigate('/browse')}
              className="w-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              View on Explore Offers map
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

  // ── Request success screen ───────────────────────────────────────────────
  if (reqDone) {
    return (
      <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
        <div className="bg-white dark:bg-[#202c33] p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-3xl">📋</div>
          <h2 className="text-xl font-bold dark:text-white mb-2">Request posted!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Providers will see your request and can offer to help.</p>
          <div className="space-y-3">
            <button onClick={() => navigate('/requests')}
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600">
              View all requests →
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-gray-400 py-2">Go to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Request form (when postType === 'request') ───────────────────────────
  if (postType === 'request') {
    const handleReqAddressChange = (val: string) => {
      setReqAddressLabel(val);
      setReqLatLng(null);
      if (reqAddrDebounceRef.current) clearTimeout(reqAddrDebounceRef.current);
      if (val.length < 3) { setReqAddressSuggestions([]); return; }
      setReqAddressSearching(true);
      reqAddrDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'Boomerang/1.0 (boomerang.fyi)' } });
          const data = await res.json();
          setReqAddressSuggestions(data);
        } catch { setReqAddressSuggestions([]); }
        setReqAddressSearching(false);
      }, 400);
    };

    const handleReqSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!reqTitle.trim() || !reqDescription.trim() || !reqCategoryId) {
        toast('Please fill in all required fields', 'error'); return;
      }
      setReqSubmitting(true);
      try {
        await api.postRequest({
          title: reqTitle.trim(),
          description: reqDescription.trim(),
          category_id: parseInt(reqCategoryId),
          budget_eur: reqBudget ? parseFloat(reqBudget) : null,
          city: reqCity || null,
          latitude: reqLatLng?.lat || null,
          longitude: reqLatLng?.lng || null,
        });
        setReqDone(true);
      } catch (err: any) {
        toast(err.message || 'Failed to post request', 'error');
      } finally {
        setReqSubmitting(false);
      }
    };

    return (
      <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
        {/* Offer / Request toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2a3942] rounded-xl mb-6">
          <button type="button" onClick={() => setPostType('offer')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800">
            🛠 Offer
          </button>
          <button type="button" onClick={() => setPostType('request')}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm">
            📋 Request
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-1 dark:text-white">Post a Request</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Let providers know what you need done</p>

        {/* Address gate — same as offer form */}
        {!(user as any)?.latitude && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Set your home address first</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">Your address helps providers nearby find your request.</p>
            <a href="/settings" className="inline-block bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600">Go to Settings →</a>
          </div>
        )}

        <form onSubmit={handleReqSubmit} className="bg-white dark:bg-[#202c33] p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">
          {/* Category — first, matches offer form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={reqCategoryId} onChange={e => setReqCategoryId(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:bg-[#2a3942] dark:text-white"
              required>
              <option value="">Select a category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">What do you need? <span className="text-red-500">*</span></label>
            <input type="text" value={reqTitle} onChange={e => setReqTitle(e.target.value)}
              placeholder="e.g. Need help moving furniture this weekend"
              maxLength={120}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:bg-[#2a3942] dark:text-white"
              required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Details <span className="text-red-500">*</span></label>
            <textarea value={reqDescription} onChange={e => setReqDescription(e.target.value)}
              placeholder="Describe what you need, when, any specifics..."
              rows={4}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:bg-[#2a3942] dark:text-white resize-none"
              required />
          </div>

          {/* Location — defaults to profile address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Location
              {reqLatLng && <span className="ml-2 text-[11px] text-green-600 font-normal">📍 GPS set</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                value={reqAddressLabel}
                onChange={e => handleReqAddressChange(e.target.value)}
                placeholder="Where do you need this done?"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:bg-[#2a3942] dark:text-white"
              />
              {reqAddressSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {reqAddressSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1c1c1c] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-30">
                  {reqAddressSuggestions.map((s: any, i: number) => (
                    <button key={i} type="button"
                      onPointerDown={() => {
                        setReqAddressLabel(s.display_name);
                        setReqLatLng({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                        setReqCity(s.address?.city || s.address?.town || s.address?.village || s.address?.county || '');
                        setReqAddressSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#242424] border-b border-gray-50 dark:border-gray-800 last:border-0">
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Pre-filled from your profile — change if the task is elsewhere</p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Budget <span className="text-gray-400 font-normal text-xs">— optional</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
              <input type="number" value={reqBudget} onChange={e => setReqBudget(e.target.value)}
                placeholder="Leave blank if flexible"
                min="0" step="1"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none dark:bg-[#2a3942] dark:text-white" />
            </div>
          </div>

          <button type="submit" disabled={reqSubmitting}
            className="w-full bg-amber-500 text-white py-3.5 rounded-xl hover:bg-amber-600 font-semibold disabled:opacity-50 transition-all text-sm">
            {reqSubmitting ? 'Posting...' : '📋 Post Request'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      {/* Offer / Request top toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2a3942] rounded-xl mb-6">
        <button type="button" onClick={() => setPostType('offer')}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm">
          🛠 Offer
        </button>
        <button type="button" onClick={() => setPostType('request')}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800">
          📋 Request
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-1 dark:text-white">{form.is_product ? 'List an Item' : 'Offer a Service'}</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {form.is_product
          ? (groupId ? 'List an item in your community' : 'Give away or sell something to your neighbours')
          : (groupId ? 'This will be posted to your community only' : 'Share what you\'re good at')}
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
          <button type="button" onClick={() => { setForm(f => ({ ...f, is_product: false })); setItemCategory(''); setIsGiveaway(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            🛠 Service
          </button>
          <button type="button" onClick={() => setForm(f => ({ ...f, is_product: true }))}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.is_product ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
            📦 Item
          </button>
        </div>

        {/* ── Category — different sets for service vs item ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {form.is_product ? 'Item type' : 'Category'}
          </label>

          {form.is_product ? (
            /* ── Item categories ── */
            <div className="flex flex-wrap gap-2">
              {ITEM_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setItemCategory(cat.name);
                    // Also sync form.category_id from the DB categories list by matching name
                    const matched = categories.find((c: any) => c.name === cat.name);
                    if (matched) setForm(f => ({ ...f, category_id: String(matched.id) }));
                  }}
                  title={cat.desc}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    itemCategory === cat.name
                      ? 'bg-[#1f2937] text-white border-[#1f2937]'
                      : 'bg-white dark:bg-[#2a3942] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          ) : (
            /* ── Service categories ── */
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
          )}

          {/* Subcategory pills — service mode only */}
          {!form.is_product && subcategories.length > 0 && (
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

        {/* ── Giveaway toggle — item mode only ── */}
        {form.is_product && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Listing type</label>
            <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-[#2a3942] rounded-xl">
              <button type="button" onClick={() => { setIsGiveaway(false); setIsRental(false); setForm(f => ({ ...f, price_eur: '' })); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors ${!isGiveaway && !isRental ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                💰 For sale
              </button>
              <button type="button" onClick={() => { setIsGiveaway(false); setIsRental(true); setForm(f => ({ ...f, price_eur: '' })); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isRental ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                🔑 Rental
              </button>
              <button type="button" onClick={() => { setIsGiveaway(true); setIsRental(false); setForm(f => ({ ...f, price_eur: '0' })); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-colors ${isGiveaway ? 'bg-green-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                🎁 Free
              </button>
            </div>
            {isGiveaway && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                This item is free — the requester just arranges pickup/delivery with you.
              </p>
            )}
            {isRental && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Set a rental price (daily or weekly) — you keep ownership, item is returned after use.
              </p>
            )}
          </div>
        )}

        {/* ── Title ── */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {form.is_product ? 'Item name' : 'Title'}
          </label>
          <input id="title" required value={form.title} onChange={set('title')}
            placeholder={form.is_product ? 'e.g. IKEA bookshelf, iPhone 12, homemade jam...' : 'e.g. Dog walking in the park'}
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
            {/* Inline availability slot picker */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSlotPicker(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#2a3942] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#374151] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                  <span>Set available hours</span>
                  {serviceSlots.length > 0 && (
                    <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">{serviceSlots.length} slot{serviceSlots.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showSlotPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {showSlotPicker && (
                <div className="px-4 py-3 space-y-4 bg-white dark:bg-[#202c33]">
                  <p className="text-xs text-gray-400">Add multiple time slots per day — buyers can book any available slot.</p>

                  {/* Day-grouped slot picker */}
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((dayName, dayIdx) => {
                    const daySlots = serviceSlots.map((s, i) => ({ ...s, idx: i })).filter(s => s.day_of_week === dayIdx);
                    const TIMES_LIST = Array.from({ length: 28 }, (_, k) => { const h = Math.floor(k/2)+7; const m = k%2===0?'00':'30'; return `${String(h).padStart(2,'0')}:${m}`; });
                    return (
                      <div key={dayIdx} className={`rounded-xl border transition-all ${daySlots.length > 0 ? 'border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-700'}`}>
                        {/* Day header */}
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <span className={`text-sm font-semibold ${daySlots.length > 0 ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {dayName}
                            {daySlots.length > 0 && <span className="ml-2 text-xs font-normal text-primary-500">{daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => setServiceSlots(s => [...s, { day_of_week: dayIdx, start_time: '09:00', end_time: '10:00' }])}
                            className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Add slot
                          </button>
                        </div>

                        {/* Slots for this day */}
                        {daySlots.length > 0 && (
                          <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                            {daySlots.map(slot => (
                              <div key={slot.idx} className="flex items-center gap-2 flex-wrap">
                                <select
                                  value={slot.start_time}
                                  onChange={e => setServiceSlots(s => s.map((x, j) => j === slot.idx ? { ...x, start_time: e.target.value } : x))}
                                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs outline-none dark:bg-[#2a3942] dark:text-white focus:ring-1 focus:ring-primary-500"
                                  aria-label="Start time"
                                >
                                  {TIMES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <span className="text-xs text-gray-400">→</span>
                                <select
                                  value={slot.end_time}
                                  onChange={e => setServiceSlots(s => s.map((x, j) => j === slot.idx ? { ...x, end_time: e.target.value } : x))}
                                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs outline-none dark:bg-[#2a3942] dark:text-white focus:ring-1 focus:ring-primary-500"
                                  aria-label="End time"
                                >
                                  {TIMES_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setServiceSlots(s => s.filter((_, j) => j !== slot.idx))}
                                  className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                                  aria-label="Remove slot"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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

        {/* ── Price — hidden for giveaway items ── */}
        {!isGiveaway && (
        <div>
          <label htmlFor="price_eur" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Price <span className="text-gray-400 font-normal text-xs">({isGel ? '₾ GEL' : '€ EUR'}){!form.is_product ? ' — optional' : ''}</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol}</span>
            <input id="price_eur" type="number" min="1" max="99999" step="0.01"
              value={form.price_eur} onChange={set('price_eur')}
              placeholder={form.is_product ? (isRental ? 'Daily or weekly rental price' : 'How much are you asking?') : 'Leave blank to arrange via message'}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-[#2a3942] dark:text-white" />
          </div>
          {form.price_eur && parseFloat(form.price_eur) > 0 && !form.is_product && (
            <p className="text-xs text-gray-400 mt-1.5">
              You'll receive <span className="font-semibold text-green-600">{currencySymbol}{(parseFloat(form.price_eur) * 0.8).toFixed(2)}</span> after the 20% platform fee
            </p>
          )}
        </div>
        )}

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
          {loading ? 'Publishing...' : form.is_product
            ? (isGiveaway ? '🎁 List as free giveaway' : isRental ? '🔑 List for rental' : '💰 List item for sale')
            : 'Publish Service'}
        </button>
      </form>
    </div>
  );
}
