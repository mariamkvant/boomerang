import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { t, translateCat } from '../i18n';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const RECENTLY_VIEWED_KEY = 'bm_recently_viewed';
const MAX_RECENT = 5;

function saveRecentlyViewed(service: any) {
  try {
    const existing: any[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    const filtered = existing.filter((s: any) => s.id !== service.id);
    const updated = [{ id: service.id, title: service.title, points_cost: service.points_cost, provider_name: service.provider_name }, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
}

function getRecentlyViewed(): any[] {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'); } catch { return []; }
}

export default function BrowsePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [cityFilter, setCityFilter] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'services' | 'items'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showAllCats, setShowAllCats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ service: any } | null>(null);
  const [requestConfirm, setRequestConfirm] = useState<{ service: any } | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressTriggered = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Load recently viewed on mount
  useEffect(() => { setRecentlyViewed(getRecentlyViewed()); }, []);

  const reloadServices = async () => {
    setRefreshing(true);
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat) params.set('category', selectedCat);
    if (selectedSub) params.set('subcategory', selectedSub);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedCity) params.set('city', debouncedCity);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (typeFilter === 'items') params.set('is_product', '1');
    if (typeFilter === 'services') params.set('is_product', '0');
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    try {
      const res: any = await api.getServices(params.toString());
      if (Array.isArray(res)) { setServices(res); setTotal(res.length); setTotalPages(1); }
      else { setServices(res.services); setTotal(res.total); setTotalPages(res.totalPages); }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };
  usePullToRefresh(reloadServices);

  const quickRequest = async (serviceId: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const svc = services.find(s => s.id === serviceId);
    if (svc) { setRequestConfirm({ service: svc }); }
  };

  const confirmRequest = async (serviceId: number) => {
    try {
      await api.createRequest({ service_id: serviceId, message: 'Quick request from browse' });
      toast('Request sent! Check your dashboard.');
      setRequestConfirm(null);
    } catch (err: any) { toast(err.message, 'error'); setRequestConfirm(null); }
  };

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  // Debounce search and city inputs
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setDebouncedCity(cityFilter); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, cityFilter]);

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCat) {
      api.getSubcategories(Number(selectedCat)).then(setSubcategories).catch(() => setSubcategories([]));
    } else {
      setSubcategories([]); setSelectedSub('');
    }
  }, [selectedCat]);

  useEffect(() => {
    setLoading(true);
    if (nearMe) {
      if (!navigator.geolocation) { setNearMe(false); setLoading(false); toast('Geolocation not supported', 'error'); return; }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          api.getNearbyServices(pos.coords.latitude, pos.coords.longitude).then(s => { setServices(s); setLoading(false); setLocating(false); }).catch(() => { setLoading(false); setLocating(false); });
        },
        () => { setNearMe(false); setLoading(false); setLocating(false); toast('Location access denied. Enable it in settings.', 'error'); },
        { enableHighAccuracy: false, timeout: 10000 }
      );
      return;
    }
    const params = new URLSearchParams();
    if (selectedCat) params.set('category', selectedCat);
    if (selectedSub) params.set('subcategory', selectedSub);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedCity) params.set('city', debouncedCity);
    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (typeFilter === 'items') params.set('is_product', '1');
    if (typeFilter === 'services') params.set('is_product', '0');
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    api.getServices(params.toString()).then((res: any) => {
      // Handle both old array format and new paginated format
      if (Array.isArray(res)) { setServices(res); setTotal(res.length); setTotalPages(1); }
      else { setServices(res.services); setTotal(res.total); setTotalPages(res.totalPages); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCat, selectedSub, debouncedSearch, debouncedCity, nearMe, page, sortBy, typeFilter, minPrice, maxPrice]);

  const handleCatClick = (id: string) => {
    const val = selectedCat === id ? '' : id;
    setSelectedCat(val); setSelectedSub(''); setPage(1);
    if (val) setSearchParams({ category: val }); else setSearchParams({});
  };

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      {refreshing && <div className="flex justify-center py-2"><div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">{t('browse.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{t('browse.subtitle')}</p>
      </div>

      {/* Search bar — single clean row */}
      <div className="sticky top-16 z-30 bg-[#f8f7f5] dark:bg-[#111111] -mx-4 px-4 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" placeholder="Search services, items..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 outline-none dark:text-white"
              aria-label="Search services" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5" aria-label="Clear search">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="relative w-32 shrink-0">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <input type="text" placeholder="City..." value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              className="w-full pl-8 pr-2 py-2 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 outline-none dark:text-white"
              aria-label="Filter by location" />
          </div>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="px-2 py-2 rounded-lg text-xs font-medium bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 outline-none">
            <option value="newest">Newest</option>
            <option value="price_low">Price ↑</option>
            <option value="price_high">Price ↓</option>
            <option value="rating">Rating</option>
          </select>
          <div className="flex gap-1">
            <button onClick={() => setNearMe(!nearMe)} title="Near Me"
              className={`p-2 rounded-lg border text-xs transition-colors ${nearMe ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-800 text-gray-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            </button>
            <button onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')} title="Map view"
              className={`p-2 rounded-lg border text-xs transition-colors ${viewMode === 'map' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-800 text-gray-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" /></svg>
            </button>
            <button onClick={() => setShowFilters(!showFilters)} title="Filters"
              className={`p-2 rounded-lg border text-xs transition-colors ${showFilters || typeFilter !== 'all' || minPrice || maxPrice ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-gray-800 text-gray-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
            </button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3 mb-2">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Type</p>
              <div className="flex gap-2">
                {(['all', 'services', 'items'] as const).map(t => (
                  <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === t ? 'bg-gray-900 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                    {t === 'all' ? 'All' : t === 'services' ? 'Services' : 'Items'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Price range (🪃)</p>
              <div className="flex items-center gap-2">
                <input type="number" min="0" placeholder="Min" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm outline-none dark:bg-[#1c1c1c] dark:text-white" />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm outline-none dark:bg-[#1c1c1c] dark:text-white" />
                {(minPrice || maxPrice) && (
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category pills — wrap layout, no scroll needed */}
      {(() => {
        const VISIBLE = 8;
        const allShown = showAllCats || selectedCat !== '' || categories.length <= VISIBLE;
        const visible = allShown ? categories : categories.slice(0, VISIBLE);
        return (
          <div className="mt-3 mb-5">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { handleCatClick(''); setShowAllCats(false); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${!selectedCat ? 'bg-[#1f2937] text-white' : 'bg-white dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}>
                All
              </button>
              {visible.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => handleCatClick(String(c.id))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedCat === String(c.id) ? 'bg-[#1f2937] text-white' : 'bg-white dark:bg-[#1c1c1c] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}>
                  {translateCat(c.name)}
                </button>
              ))}
              {!allShown && (
                <button
                  onClick={() => setShowAllCats(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#242424] text-gray-500 dark:text-gray-400 whitespace-nowrap hover:bg-gray-200 transition-colors">
                  +{categories.length - VISIBLE} more
                </button>
              )}
              {allShown && categories.length > VISIBLE && !selectedCat && (
                <button
                  onClick={() => setShowAllCats(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#242424] text-gray-500 dark:text-gray-400 whitespace-nowrap hover:bg-gray-200 transition-colors">
                  Show less
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setSelectedSub('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${!selectedSub ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}>
            All
          </button>
          {subcategories.map((s: any) => (
            <button key={s.id} onClick={() => setSelectedSub(selectedSub === String(s.id) ? '' : String(s.id))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${selectedSub === String(s.id) ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Recently viewed — shown when no search/filter active */}
      {!search && !selectedCat && !debouncedCity && recentlyViewed.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recently viewed</p>
            <button onClick={() => { localStorage.removeItem(RECENTLY_VIEWED_KEY); setRecentlyViewed([]); }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {recentlyViewed.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`}
                className="flex-shrink-0 bg-white dark:bg-[#1c1c1c] border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2.5 hover:border-gray-300 transition-all min-w-[140px] max-w-[180px]">
                <p className="text-xs font-medium text-gray-800 dark:text-white line-clamp-2 leading-snug mb-1">{s.title}</p>
                <p className="text-xs text-gray-400">{s.points_cost} 🪃</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-base font-semibold text-gray-700 dark:text-white mb-1">
            {selectedCat ? `No ${translateCat(categories.find(c => String(c.id) === selectedCat)?.name || '')} listings yet` : 'Nothing here yet'}
          </h3>
          <p className="text-gray-400 text-sm mb-5">Be the first to offer something in this category</p>
          <Link to="/services/new" className="inline-block bg-[#1f2937] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            + Offer something
          </Link>
        </div>
      ) : viewMode === 'map' ? (
        <>
          <p className="text-sm text-gray-400 mb-4">{services.filter((s: any) => s.provider_latitude && s.provider_longitude).length} {t('browse.onMap')}</p>
          <MapView services={services} userLat={userCoords?.lat} userLng={userCoords?.lng} />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{total} {t('browse.servicesFound')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`}
                onTouchStart={() => { longPressTriggered.current = false; longPressRef.current = setTimeout(() => { longPressTriggered.current = true; setContextMenu({ service: s }); }, 500); }}
                onTouchEnd={() => { if (longPressRef.current) clearTimeout(longPressRef.current); }}
                onTouchMove={() => { if (longPressRef.current) clearTimeout(longPressRef.current); }}
                onClick={(e) => {
                  if (longPressTriggered.current) { e.preventDefault(); longPressTriggered.current = false; return; }
                  saveRecentlyViewed(s);
                }}
                className="block bg-white dark:bg-[#1c1c1c] rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-sm group overflow-hidden transition-all duration-200">
                {s.image && (
                  <img src={s.image} alt={s.title} loading="lazy" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 mb-3">{s.title}</h3>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                      {s.provider_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.provider_name}</span>
                    {s.provider_city && <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0">· {s.provider_city}</span>}
                    {s.avg_rating && <span className="text-xs text-gray-400 ml-auto shrink-0">★ {Number(s.avg_rating).toFixed(1)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{s.points_cost} <span className="text-primary-500">🪃</span></span>
                    {user && s.provider_id !== user.id && (
                      <button onClick={(e) => quickRequest(s.id, e)}
                        className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-3 py-1.5 rounded-lg transition-all">
                        Request
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">←</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">→</button>
            </div>
          )}
        </>
      )}

      {/* Back to top */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-40 w-10 h-10 bg-[#1f2937] dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg flex items-center justify-center hover:bg-[#111827] transition-all animate-fade-in"
          aria-label="Back to top">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
        </button>
      )}

      {/* Request confirmation modal */}
      {requestConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setRequestConfirm(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl p-5 w-full max-w-sm animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Send request?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">{requestConfirm.service.title}</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-5">
              Cost: {requestConfirm.service.points_cost} <span className="text-primary-500">🪃</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRequestConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => confirmRequest(requestConfirm.service.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#1f2937] text-white">Send Request</button>
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setContextMenu(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mt-3 mb-2" />
            <div className="px-4 pb-2">
              <p className="text-sm font-semibold dark:text-white truncate">{contextMenu.service.title}</p>
              <p className="text-xs text-gray-400">{contextMenu.service.provider_name} · {contextMenu.service.points_cost} 🪃</p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => { navigator.share?.({ title: contextMenu.service.title, url: `${window.location.origin}/services/${contextMenu.service.id}` }); setContextMenu(null); }}
                className="w-full text-left px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3942] flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
                Share
              </button>
              {user && <Link to={`/messages?to=${contextMenu.service.provider_id}`} onClick={() => setContextMenu(null)}
                className="w-full text-left px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3942] flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                Message provider
              </Link>}
              <Link to={`/services/${contextMenu.service.id}`} onClick={() => setContextMenu(null)}
                className="w-full text-left px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a3942] flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                View details
              </Link>
            </div>
            <button onClick={() => setContextMenu(null)} className="w-full py-4 text-sm font-medium text-gray-400 border-t border-gray-100 dark:border-gray-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
