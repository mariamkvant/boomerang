import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { SkeletonGrid } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { t, translateCat } from '../i18n';

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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const quickRequest = async (serviceId: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    try {
      await api.createRequest({ service_id: serviceId, message: 'Quick request from browse' });
      toast('Request sent! Check your dashboard.');
    } catch (err: any) { toast(err.message, 'error'); }
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
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          api.getNearbyServices(pos.coords.latitude, pos.coords.longitude).then(s => { setServices(s); setLoading(false); setLocating(false); }).catch(() => { setLoading(false); setLocating(false); });
        },
        () => { setNearMe(false); setLoading(false); setLocating(false); toast('Could not get your location', 'error'); }
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
    api.getServices(params.toString()).then((res: any) => {
      // Handle both old array format and new paginated format
      if (Array.isArray(res)) { setServices(res); setTotal(res.length); setTotalPages(1); }
      else { setServices(res.services); setTotal(res.total); setTotalPages(res.totalPages); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedCat, selectedSub, debouncedSearch, debouncedCity, nearMe, page, sortBy]);

  const handleCatClick = (id: string) => {
    const val = selectedCat === id ? '' : id;
    setSelectedCat(val); setSelectedSub(''); setPage(1);
    if (val) setSearchParams({ category: val }); else setSearchParams({});
  };

  return (
    <div className="animate-fade-in pb-24 md:pb-8">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold dark:text-white">{t('browse.title')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{t('browse.subtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" placeholder={t('browse.search')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
            aria-label="Search services" />
        </div>
        <div className="relative flex-1 sm:max-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <input type="text" placeholder={t('browse.cityPlaceholder')} value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
            aria-label="Filter by location" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setNearMe(!nearMe)}
            className={`px-3 py-2.5 rounded-xl text-sm font-medium shrink-0 transition-colors ${nearMe ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'}`}>
            {locating ? '...' : t('browse.nearMe')}
          </button>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className={`px-3 py-2.5 rounded-xl text-sm font-medium shrink-0 transition-colors ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'}`}>
            {viewMode === 'map' ? t('browse.list') : t('browse.map')}
          </button>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary-500">
            <option value="newest">{t('browse.sort.newest')}</option>
            <option value="price_low">{t('browse.sort.priceLow')}</option>
            <option value="price_high">{t('browse.sort.priceHigh')}</option>
            <option value="rating">{t('browse.sort.rating')}</option>
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="relative mb-8">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleCatClick('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCat ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
            {t('browse.all')}
          </button>
          {categories.map((c: any) => (
            <button key={c.id} onClick={() => handleCatClick(String(c.id))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCat === String(c.id) ? 'bg-primary-500 text-white' : 'bg-white dark:bg-[#202c33] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
              {translateCat(c.name)}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 pointer-events-none" />
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedSub('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selectedSub ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-200'}`}>
            All in {translateCat(categories.find(c => String(c.id) === selectedCat)?.name || '')}
          </button>
          {subcategories.map((s: any) => (
            <button key={s.id} onClick={() => setSelectedSub(selectedSub === String(s.id) ? '' : String(s.id))}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedSub === String(s.id) ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-200'}`}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-card">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('browse.noResults')}</h3>
          <p className="text-gray-500 text-sm mb-4">{t('browse.beFirst')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/services/new" className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">{t('browse.offerService')}</Link>
            <Link to="/help-wanted" className="inline-block border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">See Help Wanted requests →</Link>
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <>
          <p className="text-sm text-gray-400 mb-4">{services.filter((s: any) => s.provider_latitude && s.provider_longitude).length} {t('browse.onMap')}</p>
          <MapView services={services} userLat={userCoords?.lat} userLng={userCoords?.lng} />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{total} {t('browse.servicesFound')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="block bg-white dark:bg-[#202c33] rounded-2xl shadow-sm hover:shadow-md group overflow-hidden transition-all">
                {s.image && (
                  <img src={s.image} alt="" className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{translateCat(s.category_name)}{s.subcategory_name ? ` · ${s.subcategory_name}` : ''}</span>
                    {s.avg_rating && <span className="text-xs text-amber-500">★ {Number(s.avg_rating).toFixed(1)}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-primary-600 transition-colors">{s.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{s.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <span className="text-primary-600 font-semibold text-sm">{s.points_cost} 🪃</span>
                    <div className="flex items-center gap-2">
                      {s.distance != null && <span className="text-[11px] text-gray-400">{Number(s.distance).toFixed(1)} km</span>}
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-medium">
                          {s.provider_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{s.provider_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">←</button>
              <span className="text-sm text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}