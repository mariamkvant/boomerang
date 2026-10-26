import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { useToast } from '../components/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_HEIGHTS: Record<string, string> = {
  collapsed: '32px',
  peek:      '220px',
  half:      '50vh',
  full:      '85vh',
};

type PanelState = 'collapsed' | 'peek' | 'half' | 'full';

const CYCLE_UP: Record<PanelState, PanelState>   = { collapsed: 'peek', peek: 'half', half: 'full', full: 'full' };
const CYCLE_DOWN: Record<PanelState, PanelState> = { full: 'half', half: 'peek', peek: 'collapsed', collapsed: 'collapsed' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBudget(r: any): string {
  if (r.budget_eur != null && parseFloat(r.budget_eur) > 0) return `€${Math.round(parseFloat(r.budget_eur))}`;
  return 'Open budget';
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Post Request Form ────────────────────────────────────────────────────────

function PostRequestSheet({ onClose, onPosted, categories }: {
  onClose: () => void;
  onPosted: () => void;
  categories: any[];
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !categoryId) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.postRequest({
        title: title.trim(),
        description: description.trim(),
        category_id: parseInt(categoryId),
        budget_eur: budget ? parseFloat(budget) : null,
      });
      toast('Request posted! Providers can now see it.', 'success');
      onPosted();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to post request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: '92vh', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1c1c1c] z-10 flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Post a Request</h2>
            <p className="text-xs text-gray-400 mt-0.5">Let providers know what you need</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
          {/* Category — first */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white"
              required
            >
              <option value="">Select a category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">What do you need? <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Need help moving furniture"
              maxLength={120}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Details <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you need, when, any specifics..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white resize-none"
              required
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Budget (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">€</span>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="0"
                min="0"
                step="1"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-[#2a3942] dark:text-white"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Leave blank if you're flexible</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1f2937] hover:bg-[#111827] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60 mt-2"
          >
            {submitting ? 'Posting...' : 'Post Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RequestsPageProps {
  postMode?: boolean;
}

export default function RequestsPage({ postMode = false }: RequestsPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Data
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [radiusKm, setRadiusKm] = useState(0);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [availableCities, setAvailableCities] = useState<{ city: string; count: number }[]>([]);

  // Location
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // View / panel
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [panelState, setPanelState] = useState<PanelState>('peek');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Post sheet
  const [showPostSheet, setShowPostSheet] = useState(postMode || searchParams.get('post') === '1');

  // "I can help" sheet
  const [helpTarget, setHelpTarget] = useState<any | null>(null);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);

  // Refs
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dragStartY = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Acquire location ────────────────────────────────────────────────────

  const acquireLocation = useCallback(() => {
    // Priority 1: profile home address
    if (user && (user as any).latitude) {
      setUserCoords({ lat: (user as any).latitude, lng: (user as any).longitude });
      setRadiusKm(prev => prev === 0 ? 0.5 : prev);
      return;
    }
    // Priority 2: device GPS
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setRadiusKm(0.5); setLocating(false); },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [user]);

  // Auto-locate once when user identity is known — prefer profile coords, fall back to GPS
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user !== undefined) acquireLocation(); }, [user?.id]);

  // ── Debounce search ─────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Load categories ─────────────────────────────────────────────────────

  useEffect(() => {
    api.getCategories().then((cats: any[]) => setCategories(cats)).catch(() => {});
  }, []);

  // ── Load requests ───────────────────────────────────────────────────────

  const loadRequests = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (cityFilter) params.set('city', cityFilter);
    if (userCoords && radiusKm > 0) {
      params.set('lat', String(userCoords.lat));
      params.set('lng', String(userCoords.lng));
      params.set('radius', String(radiusKm));
    }
    api.getRequests(params.toString())
      .then((res: any) => { setRequests(Array.isArray(res) ? res : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedSearch, cityFilter, userCoords, radiusKm]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  // ── Compute cities from loaded requests ─────────────────────────────────

  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const r of requests) {
      const c = r.city || r.requester_city;
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
    setAvailableCities(Object.entries(counts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count));
  }, [requests]);

  // ── Panel drag ──────────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    if (dy > 40) setPanelState(s => CYCLE_UP[s]);
    else if (dy < -40) setPanelState(s => CYCLE_DOWN[s]);
    dragStartY.current = null;
  };

  // ── City fly-to ─────────────────────────────────────────────────────────

  const selectCity = async (city: string) => {
    setCityFilter(city);
    setShowCityPicker(false);
    setCitySearch('');
    setRadiusKm(0);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Boomerang/1.0 (boomerang.fyi)' },
      });
      const data = await res.json();
      if (data[0]) setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } catch {}
  };

  // ── "I can help" ────────────────────────────────────────────────────────

  const handleOfferHelp = async () => {
    if (!helpTarget) return;
    setHelpSubmitting(true);
    try {
      await api.offerHelp(helpTarget.id);
      toast('Offer sent! The requester will be notified.', 'success');
      setHelpTarget(null);
      setHelpMessage('');
      loadRequests();
    } catch (err: any) {
      toast(err.message || 'Failed to send offer', 'error');
    } finally {
      setHelpSubmitting(false);
    }
  };

  // Mappable requests (have location)
  const mappable = requests.filter((r: any) => r.latitude || r.requester_latitude);
  const filteredCities = availableCities.filter(c => !citySearch || c.city.toLowerCase().includes(citySearch.toLowerCase()));

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col" style={{ top: '64px', bottom: '60px' }}>

      {/* MAP */}
      <div className="absolute inset-0 z-0">
        {viewMode === 'map' ? (
          <MapView
            services={mappable.map((r: any) => ({
              ...r,
              provider_id: r.requester_id,
              provider_name: r.requester_name,
              provider_latitude: r.latitude || r.requester_latitude,
              provider_longitude: r.longitude || r.requester_longitude,
              service_latitude: r.latitude,
              service_longitude: r.longitude,
              price_eur: r.budget_eur,
              currency: 'eur',
              category_icon: r.category_icon || '📋',
            }))}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            radiusKm={radiusKm}
            height="100%"
            flyToCenter={mapCenter}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 dark:bg-[#111]" />
        )}
      </div>

      {/* FLOATING CONTROLS */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">

        {/* Search row */}
        <div className="pointer-events-auto flex gap-2 items-center">
          {/* Back to Explore pill */}
          <Link to="/browse"
            className="flex items-center gap-1 bg-white dark:bg-[#1c1c1c] shadow-md rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800 shrink-0 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
            Services
          </Link>

          {/* Search input */}
          <div className="relative flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md">Requests</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-[80px] pr-9 py-2.5 bg-white dark:bg-[#1c1c1c] rounded-xl text-sm shadow-md border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-amber-500 outline-none dark:text-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* View toggle */}
          <button onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
            className="bg-white dark:bg-[#1c1c1c] shadow-md rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 whitespace-nowrap">
            {viewMode === 'map' ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>List</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>Map</>
            )}
          </button>
        </div>

        {/* Radius + City + Locate row */}
        <div className="pointer-events-auto flex gap-1.5 items-center flex-wrap">
          <button
            onClick={() => setRadiusKm(r => r === 0.5 ? 1 : r === 1 ? 5 : r === 5 ? 0 : 0.5)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-[#1f2937] text-white border-[#1f2937]">
            {radiusKm === 0 ? 'All' : radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm}km`}
            <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button onClick={() => setShowCityPicker(p => !p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border flex items-center gap-1 transition-all ${cityFilter ? 'bg-[#1f2937] text-white border-[#1f2937]' : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            {cityFilter || 'City'}
            {cityFilter && <span onClick={e => { e.stopPropagation(); setCityFilter(''); setRadiusKm(0); }} className="ml-0.5 opacity-70 hover:opacity-100">✕</span>}
          </button>
          {!userCoords && (
            <button onClick={acquireLocation} disabled={locating}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-primary-500 text-white border-primary-500 flex items-center gap-1">
              {locating ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📍'}
              Locate me
            </button>
          )}
          {/* Post a Request CTA */}
          {user && (
            <button
              onClick={() => setShowPostSheet(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-amber-500 text-white border-amber-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Post Request
            </button>
          )}
        </div>

        {/* City picker */}
        {showCityPicker && (
          <div className="pointer-events-auto bg-white dark:bg-[#1c1c1c] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden" style={{ maxHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Cities with requests</p>
              <button onClick={() => { setShowCityPicker(false); setCitySearch(''); }} className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-3 py-2 shrink-0">
              <input type="text" placeholder="Search city..." value={citySearch} onChange={e => setCitySearch(e.target.value)} autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg outline-none dark:bg-[#2a3942] dark:text-white focus:ring-1 focus:ring-amber-500" />
            </div>
            <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-1">
              {cityFilter && (
                <button onClick={() => { setCityFilter(''); setShowCityPicker(false); setRadiusKm(0); }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                  ✕ Clear filter
                </button>
              )}
              {filteredCities.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No requests in other cities yet</p>
              ) : filteredCities.map(({ city, count }) => (
                <button key={city} onClick={() => selectCity(city)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${cityFilter === city ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <span>{city}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cityFilter === city ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Missing address banner */}
      {user && !(user as any).city && (
        <div className="absolute top-[108px] left-3 right-3 z-10 pointer-events-auto bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">Set your city to see nearby requests</p>
          <Link to="/settings" className="text-xs font-medium text-amber-600 shrink-0">Set address →</Link>
        </div>
      )}

      {/* BOTTOM PANEL */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#1c1c1c] rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out"
        style={{ height: PANEL_HEIGHTS[panelState] }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center py-2 cursor-pointer select-none"
          onClick={() => setPanelState(s => CYCLE_UP[s] === s ? CYCLE_DOWN[s] : CYCLE_UP[s])}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Panel header */}
        {panelState !== 'collapsed' && (
          <div className="flex-shrink-0 px-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanelState('collapsed')}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <span className="text-sm font-semibold dark:text-white">
                {loading ? 'Loading...' : `${requests.length} request${requests.length !== 1 ? 's' : ''}`}
              </span>
              {userCoords && radiusKm > 0 && (
                <span className="text-xs text-gray-400">within {radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm}km`}</span>
              )}
            </div>
            {user && (
              <button onClick={() => setShowPostSheet(true)} className="text-xs font-semibold text-amber-500 hover:text-amber-600">
                + Post a request
              </button>
            )}
          </div>
        )}

        {/* Peek state — horizontal card strip */}
        {panelState === 'peek' && (
          <div className="flex-1 overflow-hidden px-4 pb-3">
            {loading ? (
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {[1,2,3].map(i => <div key={i} className="flex-shrink-0 w-48 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">No requests yet — be the first!</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {requests.slice(0, 8).map((r: any) => (
                  <button key={r.id} onClick={() => { setHelpTarget(r); setHelpMessage(''); setPanelState('half'); }}
                    className="flex-shrink-0 w-48 bg-white dark:bg-[#242424] border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-left hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-base shrink-0">
                        {r.category_icon || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.requester_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{fmtBudget(r)}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Half / Full — list view */}
        {(panelState === 'half' || panelState === 'full') && (
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="space-y-3 pt-1">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No requests yet</p>
                <p className="text-xs text-gray-400 mb-4">Be the first to post what you need</p>
                {user && (
                  <button onClick={() => setShowPostSheet(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
                    Post a Request
                  </button>
                )}
              </div>
            ) : requests.map((r: any) => (
              <div key={r.id}
                className="flex gap-3 rounded-xl p-3 border bg-white dark:bg-[#242424] border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-xl shrink-0">
                  {r.category_icon || '📋'}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</p>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">{fmtBudget(r)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                      {r.requester_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.requester_name}</span>
                    {(r.city || r.requester_city) && (
                      <span className="text-xs text-gray-400">· {r.city || r.requester_city}</span>
                    )}
                    <span className="text-[10px] text-gray-400 ml-auto shrink-0">{timeAgo(r.created_at)}</span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-1.5">{r.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-300 dark:text-gray-600">{r.category_name}</span>
                    {user && r.requester_id !== user.id && (
                      <button
                        onClick={() => { setHelpTarget(r); setHelpMessage(''); }}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 border border-amber-200 dark:border-amber-800 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-all"
                      >
                        I can help →
                      </button>
                    )}
                    {r.requester_id === user?.id && (
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Your request</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating "View List" button */}
      {viewMode === 'map' && panelState !== 'half' && panelState !== 'full' && (
        <div className="absolute z-20 pointer-events-auto"
          style={{ bottom: `calc(${PANEL_HEIGHTS[panelState]} + 12px)`, left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={() => setPanelState('half')}
            className="bg-white dark:bg-[#1c1c1c] shadow-lg rounded-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            View {requests.length} request{requests.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* "I can help" confirmation sheet */}
      {helpTarget && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={() => setHelpTarget(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl shadow-2xl px-4 pt-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', maxHeight: '70vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4" />
            {/* Request summary */}
            <div className="flex gap-3 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-lg shrink-0">
                {helpTarget.category_icon || '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{helpTarget.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">by {helpTarget.requester_name} · {fmtBudget(helpTarget)}</p>
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{helpTarget.description}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Offering to help will notify <span className="font-semibold text-gray-700 dark:text-gray-300">{helpTarget.requester_name}</span> and create a booking for both of you to manage.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setHelpTarget(null)}
                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleOfferHelp}
                disabled={helpSubmitting}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {helpSubmitting ? 'Sending...' : '✋ I can help!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post request sheet */}
      {showPostSheet && (
        <PostRequestSheet
          categories={categories}
          onClose={() => setShowPostSheet(false)}
          onPosted={loadRequests}
        />
      )}
    </div>
  );
}
