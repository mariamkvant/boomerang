import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { useToast } from '../components/Toast';
import { translateCat } from '../i18n';

// ─── Constants ───────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [
  { label: '500 m', value: 0.5 },
  { label: '1 km',  value: 1   },
  { label: '5 km',  value: 5   },
  { label: '10 km', value: 10  },
];

const PINNED_NAMES = ['Pet Care', 'Childcare & Education', 'Transportation', 'Item Rental', 'Courier Services'];
const RECENTLY_VIEWED_KEY = 'bm_recently_viewed';
const MAX_RECENT = 5;

// Panel height per state
const PANEL_HEIGHTS: Record<string, string> = {
  collapsed: '32px',
  peek:      '160px',
  half:      '50vh',
  full:      '85vh',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtPrice(s: any): string {
  const p = s.price_eur != null ? parseFloat(s.price_eur) : null;
  if (p != null && p > 0) {
    const sym = s.currency === 'gel' ? '₾' : '€';
    return `${sym}${Math.round(p)}`;
  }
  return '';
}

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function saveRecentlyViewed(service: any) {
  try {
    const existing: any[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const updated = [service, ...existing.filter((s: any) => s.id !== service.id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

function getRecentlyViewed(): any[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'); } catch { return []; }
}

// ─── Component ───────────────────────────────────────────────────────────────

type PanelState = 'collapsed' | 'peek' | 'half' | 'full';

export default function BrowsePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'services' | 'people'>('services');
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [showAllCats, setShowAllCats] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0.5);
  const [cityFilter, setCityFilter] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');

  // Location
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Panel — 4 states: collapsed | peek | half | full
  const [panelState, setPanelState] = useState<PanelState>('peek');

  // Selected pin — syncs map highlight ↔ list scroll
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);

  // Seller profile sheet — shown when a map pin is tapped
  const [sellerSheet, setSellerSheet] = useState<{ providerId: number } | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  // Request sheet
  const [requestConfirm, setRequestConfirm] = useState<{ service: any } | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dragStartY = useRef<number | null>(null);

  // ── On mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
    api.getCategories().then(setCategories).catch(() => {});
    acquireLocation();
  }, []);

  // ── Location ─────────────────────────────────────────────────────────────

  const acquireLocation = useCallback(() => {
    if (user && (user as any).latitude) {
      setUserCoords({ lat: (user as any).latitude, lng: (user as any).longitude });
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocating(false); setLocationDenied(true); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [user]);

  // ── Debounce search ──────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Fetch services ───────────────────────────────────────────────────────

  useEffect(() => {
    if (searchMode === 'people') return; // handled separately
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat) params.set('category', selectedCat);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (cityFilter) params.set('city', cityFilter);
    if (countryFilter) params.set('country', countryFilter);
    if (userCoords) {
      params.set('lat', String(userCoords.lat));
      params.set('lng', String(userCoords.lng));
      params.set('radius', String(radiusKm));
    }
    api.getServices(params.toString()).then((res: any) => {
      setServices(Array.isArray(res) ? res : res.services || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userCoords, radiusKm, selectedCat, debouncedSearch, cityFilter, countryFilter, searchMode]);

  // ── People search ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (searchMode !== 'people') return;
    setLoading(true);
    api.searchPeople(debouncedSearch).then((res: any) => {
      setPeopleResults(Array.isArray(res) ? res : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [searchMode, debouncedSearch]);

  // ── Pin tap → scroll to card ──────────────────────────────────────────────

  const handleMarkerClick = useCallback((providerId: number) => {
    setSelectedProviderId(providerId);
    // Open seller profile sheet
    setSellerSheet({ providerId });
    setSellerProfile(null);
    setSellerLoading(true);
    api.getUser(providerId).then((p: any) => {
      setSellerProfile(p);
      setSellerLoading(false);
    }).catch(() => setSellerLoading(false));
    // Also expand panel to half and scroll to card
    setPanelState(s => (s === 'collapsed' ? 'half' : s === 'peek' ? 'half' : s));
    setTimeout(() => {
      const el = cardRefs.current.get(providerId);
      if (el && listRef.current) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 320);
  }, []);

  // ── Category ─────────────────────────────────────────────────────────────

  const handleCatClick = (id: string) => {
    const val = selectedCat === id ? '' : id;
    setSelectedCat(val);
    if (val) setSearchParams({ category: val }); else setSearchParams({});
  };

  // ── Request ──────────────────────────────────────────────────────────────

  const confirmRequest = async (serviceId: number) => {
    try {
      await api.createRequest({ service_id: serviceId, message: requestMessage.trim() || '' });
      toast('Request sent! Check your dashboard.');
      setRequestConfirm(null);
    } catch (err: any) { toast(err.message, 'error'); setRequestConfirm(null); }
  };

  // ── Panel drag ───────────────────────────────────────────────────────────

  const CYCLE_UP: Record<PanelState, PanelState> = { collapsed: 'peek', peek: 'half', half: 'full', full: 'full' };
  const CYCLE_DOWN: Record<PanelState, PanelState> = { full: 'half', half: 'peek', peek: 'collapsed', collapsed: 'collapsed' };

  const onTouchStart = (e: React.TouchEvent) => { dragStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    if (dy > 40) setPanelState(s => CYCLE_UP[s]);
    else if (dy < -40) setPanelState(s => CYCLE_DOWN[s]);
    dragStartY.current = null;
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const pinned = categories.filter(c => PINNED_NAMES.includes(c.name));
  const rest   = categories.filter(c => !PINNED_NAMES.includes(c.name));
  const mappable = services.filter((s: any) =>
    (s.service_latitude ?? s.provider_latitude) && (s.service_longitude ?? s.provider_longitude)
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col" style={{ top: '64px', bottom: '60px' }}>

      {/* ── MAP ── */}
      <div className="absolute inset-0 z-0">
        {viewMode === 'map' ? (
          <MapView
            services={mappable}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            radiusKm={radiusKm}
            height="100%"
            selectedProviderId={selectedProviderId}
            onMarkerClick={handleMarkerClick}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 dark:bg-[#111]" />
        )}
      </div>

      {/* ── FLOATING CONTROLS ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">

        {/* Search + view toggle */}
        <div className="pointer-events-auto flex gap-2">
          <div className="relative flex-1">
            {/* Mode toggle inside search bar */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
              <button
                onClick={() => setSearchMode('services')}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-colors ${searchMode === 'services' ? 'bg-[#1f2937] text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Services
              </button>
              <button
                onClick={() => setSearchMode('people')}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-colors ${searchMode === 'people' ? 'bg-[#1f2937] text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                People
              </button>
            </div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={searchMode === 'services' ? 'Search services, providers...' : 'Search by name, city, skill...'}
              className="w-full pl-[108px] pr-9 py-2.5 bg-white dark:bg-[#1c1c1c] rounded-xl text-sm shadow-md border border-gray-100 dark:border-gray-800 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
              aria-label="Search" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <button onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
            className="bg-white dark:bg-[#1c1c1c] shadow-md rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 whitespace-nowrap">
            {viewMode === 'map' ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>List</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>Map</>
            )}
          </button>
        </div>

        {/* Radius + city + locate */}
        <div className="pointer-events-auto flex gap-1.5 items-center flex-wrap">
          {RADIUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setRadiusKm(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all ${
                radiusKm === opt.value
                  ? 'bg-[#1f2937] text-white border-[#1f2937]'
                  : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}>{opt.label}</button>
          ))}
          <button onClick={() => setShowCityPicker(p => !p)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all flex items-center gap-1 ${
              cityFilter || countryFilter
                ? 'bg-[#1f2937] text-white border-[#1f2937]'
                : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            {cityFilter || countryFilter || 'City'}
            {(cityFilter || countryFilter) && (
              <span onClick={e => { e.stopPropagation(); setCityFilter(''); setCountryFilter(''); }} className="ml-0.5 opacity-70 hover:opacity-100">✕</span>
            )}
          </button>
          {!userCoords && (
            <button onClick={acquireLocation} disabled={locating}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-primary-500 text-white border-primary-500 flex items-center gap-1">
              {locating ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '📍'}
              Locate me
            </button>
          )}
          {/* See all services button — shown when radius is active */}
          {userCoords && (
            <button
              onClick={() => { setRadiusKm(0); setUserCoords(null); setCityFilter(''); setCountryFilter(''); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 flex items-center gap-1"
            >
              🌍 See all services
            </button>
          )}
        </div>

        {/* City picker */}
        {showCityPicker && (
          <div className="pointer-events-auto bg-white dark:bg-[#1c1c1c] rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">City</p>
              <input type="text" placeholder="e.g. Tbilisi, London..." value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none dark:bg-[#2a3942] dark:text-white focus:ring-1 focus:ring-primary-500"
                autoFocus />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Country</p>
              <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#2a3942] dark:text-white outline-none">
                <option value="">All countries</option>
                {['Georgia','Luxembourg','United Kingdom','Germany','France','Netherlands','Belgium','Spain','Portugal','Ireland','Switzerland','Austria','Italy','Sweden','Denmark','Norway','Finland','Poland','Czech Republic','Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button onClick={() => setShowCityPicker(false)}
              className="w-full bg-[#1f2937] text-white py-2 rounded-lg text-sm font-semibold">Apply</button>
          </div>
        )}

        {/* Category pills */}
        <div className="pointer-events-auto flex gap-1.5 flex-wrap">
          <button onClick={() => { setSelectedCat(''); setSearchParams({}); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all ${
              !selectedCat ? 'bg-[#1f2937] text-white border-[#1f2937]' : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            }`}>All</button>
          {pinned.map((c: any) => (
            <button key={c.id} onClick={() => handleCatClick(String(c.id))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all ${
                selectedCat === String(c.id) ? 'bg-[#1f2937] text-white border-[#1f2937]' : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}>{c.icon} {translateCat(c.name)}</button>
          ))}
          {showAllCats ? (
            <>
              {rest.map((c: any) => (
                <button key={c.id} onClick={() => handleCatClick(String(c.id))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all ${
                    selectedCat === String(c.id) ? 'bg-[#1f2937] text-white border-[#1f2937]' : 'bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}>{c.icon} {translateCat(c.name)}</button>
              ))}
              <button onClick={() => setShowAllCats(false)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-gray-100 dark:bg-[#242424] text-gray-500 border-gray-200 dark:border-gray-700">Show less ↑</button>
            </>
          ) : rest.length > 0 && (
            <button onClick={() => setShowAllCats(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">+{rest.length} more</button>
          )}
        </div>
      </div>

      {/* Location denied banner */}
      {locationDenied && (
        <div className="absolute top-[148px] left-3 right-3 z-10 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
          <p className="text-xs text-amber-800 dark:text-amber-300">Location blocked — showing all services.</p>
          <Link to="/settings" className="text-xs font-medium text-amber-600 shrink-0">Set address →</Link>
        </div>
      )}

      {/* ── BOTTOM PANEL ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 bg-white dark:bg-[#1c1c1c] rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out"
        style={{ height: PANEL_HEIGHTS[panelState] }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle — tap to cycle states */}
        <div
          className="flex-shrink-0 flex flex-col items-center py-2 cursor-pointer select-none"
          onClick={() => setPanelState(s => CYCLE_UP[s] === s ? CYCLE_DOWN[s] : CYCLE_UP[s])}
        >
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header — always visible when not collapsed */}
        {panelState !== 'collapsed' && (
          <div className="flex-shrink-0 px-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setPanelState('collapsed')}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Collapse panel">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <span className="text-sm font-semibold dark:text-white">
                {loading ? 'Loading...' : searchMode === 'people'
                  ? `${peopleResults.length} provider${peopleResults.length !== 1 ? 's' : ''}`
                  : `${services.length} service${services.length !== 1 ? 's' : ''}`}
              </span>
              {userCoords && (
                <span className="text-xs text-gray-400">
                  within {radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm}km`}
                </span>
              )}
            </div>
            <Link to="/services/new" className="text-xs font-semibold text-primary-500 hover:text-primary-600">
              + Offer a service
            </Link>
          </div>
        )}

        {/* Recently viewed — peek only */}
        {panelState === 'peek' && recentlyViewed.length > 0 && !search && (
          <div className="flex-shrink-0 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex gap-2">
              {recentlyViewed.map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`}
                  className="flex-shrink-0 bg-gray-50 dark:bg-[#242424] border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2 min-w-[130px] max-w-[160px]">
                  <p className="text-xs font-medium text-gray-800 dark:text-white line-clamp-1">{s.title}</p>
                  <p className="text-xs text-primary-500 font-semibold mt-0.5">{fmtPrice(s) || 'Contact'}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Service list — half / full only */}
        {(panelState === 'half' || panelState === 'full') && (
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchMode === 'people' ? (
              // ── People results ──
              peopleResults.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">{debouncedSearch ? 'No people found' : 'Search for a provider by name, city or skill'}</p>
                </div>
              ) : (
                peopleResults.map((p: any) => (
                  <Link key={p.id} to={`/users/${p.id}`}
                    className="flex items-center gap-3 bg-white dark:bg-[#242424] border border-gray-100 dark:border-gray-800 rounded-xl p-3 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {p.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 truncate">{p.username}</p>
                      {p.city && <p className="text-xs text-gray-400 truncate">📍 {p.city}</p>}
                      {p.bio && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{p.bio}</p>}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </Link>
                ))
              )
            ) : services.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  {userCoords ? `Nothing within ${radiusKm < 1 ? `${radiusKm * 1000}m` : `${radiusKm}km`}` : 'No services found'}
                </p>
                {userCoords && radiusKm < 10 && (
                  <button onClick={() => setRadiusKm(r => r === 0.5 ? 1 : r === 1 ? 5 : 10)}
                    className="text-xs bg-[#1f2937] text-white px-4 py-2 rounded-lg font-medium">
                    Expand radius →
                  </button>
                )}
              </div>
            ) : (
              services.map((s: any) => {
                const providerId = s.provider_id;
                const isSelected = providerId === selectedProviderId;
                return (
                  <div
                    key={s.id}
                    ref={el => { if (el) cardRefs.current.set(providerId, el); }}
                  >
                    <Link
                      to={`/services/${s.id}`}
                      onClick={() => saveRecentlyViewed(s)}
                      className={`flex gap-3 rounded-xl p-3 border transition-all group ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                          : 'bg-white dark:bg-[#242424] border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Thumbnail */}
                      {s.image ? (
                        <img src={s.image} alt={s.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                          {s.category_icon || '🛠'}
                        </div>
                      )}

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        {/* Title + price */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-semibold line-clamp-1 transition-colors ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white group-hover:text-primary-600'}`}>
                            {s.title}
                          </p>
                          {fmtPrice(s) && (
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400 shrink-0">
                              {fmtPrice(s)}
                            </span>
                          )}
                        </div>

                        {/* Provider + distance */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                            {s.provider_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.provider_name}</span>
                          {s.distance != null && (
                            <span className="text-xs text-primary-500 font-medium shrink-0">· {fmtDist(Number(s.distance))}</span>
                          )}
                          {s.avg_rating && (
                            <span className="text-xs text-yellow-500 ml-auto shrink-0">
                              ★ {Number(s.avg_rating).toFixed(1)}
                              {s.review_count > 0 && <span className="text-gray-400 dark:text-gray-500"> ({s.review_count})</span>}
                            </span>
                          )}
                        </div>

                        {/* Description preview */}
                        {s.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mb-1">{s.description}</p>
                        )}

                        {/* Category + request button */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-gray-300 dark:text-gray-600">{s.category_name}</span>
                          {user && s.provider_id !== user.id && (
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); setRequestConfirm({ service: s }); setRequestMessage(''); }}
                              className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-400 px-2.5 py-1 rounded-lg transition-all"
                            >
                              Request
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── "SEE ALL SERVICES AROUND ME" floating button ── */}
      {userCoords && radiusKm <= 1 && services.length < 5 && (
        <div className="absolute bottom-[calc(var(--panel-h,160px)+12px)] left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onClick={() => setRadiusKm(r => r === 0.5 ? 1 : r === 1 ? 5 : 10)}
            className="bg-white dark:bg-[#1c1c1c] shadow-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-white px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#242424] transition-all"
          >
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Expand to {radiusKm === 0.5 ? '1km' : radiusKm === 1 ? '5km' : '10km'} radius
          </button>
        </div>
      )}

      {/* ── SELLER PROFILE SHEET ── */}
      {sellerSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setSellerSheet(null); setSelectedProviderId(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1" />

            {sellerLoading || !sellerProfile ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="px-5 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

                {/* Provider header */}
                <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                  {sellerProfile.avatar ? (
                    <img src={sellerProfile.avatar} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                      {sellerProfile.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold dark:text-white">{sellerProfile.username}</h2>
                    {sellerProfile.avg_rating && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-yellow-500 text-sm">★</span>
                        <span className="text-sm font-semibold dark:text-white">{Number(sellerProfile.avg_rating).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({sellerProfile.review_count || 0} reviews)</span>
                      </div>
                    )}
                    {sellerProfile.city && (
                      <p className="text-xs text-gray-400 mt-0.5">📍 {sellerProfile.city}</p>
                    )}
                  </div>
                  <Link
                    to={`/users/${sellerSheet.providerId}`}
                    onClick={() => setSellerSheet(null)}
                    className="shrink-0 text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  >
                    Full profile →
                  </Link>
                </div>

                {/* Bio */}
                {sellerProfile.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{sellerProfile.bio}</p>
                )}

                {/* Services */}
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                  Services offered ({sellerProfile.services?.length || 0})
                </h3>
                {(!sellerProfile.services || sellerProfile.services.length === 0) ? (
                  <p className="text-sm text-gray-400">No services listed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {sellerProfile.services.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-3 bg-gray-50 dark:bg-[#242424] rounded-xl p-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl shrink-0">
                          {s.category_icon || '🛠'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold dark:text-white truncate">{s.title}</p>
                          <p className="text-xs text-gray-400">{s.category_name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.price_eur != null && (
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                              {s.currency === 'gel' ? '₾' : '€'}{Math.round(parseFloat(s.price_eur))}
                            </span>
                          )}
                          <Link
                            to={`/services/${s.id}`}
                            onClick={() => setSellerSheet(null)}
                            className="text-xs font-semibold bg-[#1f2937] text-white px-3 py-1.5 rounded-lg hover:bg-[#111827]"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message button */}
                {user && user.id !== sellerSheet.providerId && (
                  <Link
                    to={`/messages?to=${sellerSheet.providerId}`}
                    onClick={() => setSellerSheet(null)}
                    className="mt-4 w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                    Message {sellerProfile.username}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REQUEST SHEET ── */}
      {requestConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setRequestConfirm(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-t-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-4" />
            <div className="px-5 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0">
                  {requestConfirm.service.provider_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold dark:text-white">{requestConfirm.service.provider_name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    {requestConfirm.service.avg_rating && <span>★ {Number(requestConfirm.service.avg_rating).toFixed(1)}</span>}
                    {requestConfirm.service.provider_city && <span>· {requestConfirm.service.provider_city}</span>}
                  </div>
                </div>
                <Link to={`/messages?to=${requestConfirm.service.provider_id}`} onClick={() => setRequestConfirm(null)}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 shrink-0">
                  Message
                </Link>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{requestConfirm.service.title}</h3>
              {requestConfirm.service.price_eur != null && (
                <p className="text-sm font-bold text-primary-600 mb-4">
                  {requestConfirm.service.currency === 'gel' ? '₾' : '€'}{Math.round(parseFloat(requestConfirm.service.price_eur))}
                  <span className="text-xs font-normal text-gray-400 ml-1">· held until you confirm delivery</span>
                </p>
              )}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Message to provider (optional)</label>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)}
                  placeholder="e.g. I need this on weekday evenings..." rows={3}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm resize-none bg-white dark:bg-[#2a3942] dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRequestConfirm(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">Cancel</button>
                <button onClick={() => confirmRequest(requestConfirm.service.id)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#1f2937] text-white">Send Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
