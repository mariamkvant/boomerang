import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import { SkeletonGrid } from '../components/Skeleton';
import { t } from '../i18n';

export default function BrowsePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const quickRequest = async (serviceId: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    try {
      await api.createRequest({ service_id: serviceId, message: 'Quick request from browse' });
      alert('Request sent! Check your dashboard.');
    } catch (err: any) { alert(err.message); }
  };

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

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
        () => { setNearMe(false); setLoading(false); setLocating(false); alert('Could not get your location'); }
      );
      return;
    }
    const params = new URLSearchParams();
    if (selectedCat) params.set('category', selectedCat);
    if (selectedSub) params.set('subcategory', selectedSub);
    if (search) params.set('search', search);
    api.getServices(params.toString()).then(s => { setServices(s); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedCat, selectedSub, search, nearMe]);

  const handleCatClick = (id: string) => {
    const val = selectedCat === id ? '' : id;
    setSelectedCat(val); setSelectedSub('');
    if (val) setSearchParams({ category: val }); else setSearchParams({});
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">{t('browse.title')}</h2>
        <p className="text-gray-500">{t('browse.subtitle')}</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder={t('browse.search')} value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none shadow-card"
            aria-label="Search services" />
        </div>
        <button onClick={() => setNearMe(!nearMe)}
          className={`px-4 py-3.5 rounded-xl text-sm font-medium shrink-0 ${nearMe ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
          {locating ? '...' : t('browse.nearMe')}
        </button>
        <button onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
          className={`px-4 py-3.5 rounded-xl text-sm font-medium shrink-0 ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'}`}>
          {viewMode === 'map' ? t('browse.list') : t('browse.map')}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => handleCatClick('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCat ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
          {t('browse.all')}
        </button>
        {categories.map((c: any) => (
          <button key={c.id} onClick={() => handleCatClick(String(c.id))}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCat === String(c.id) ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedSub('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selectedSub ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary-200'}`}>
            All in {categories.find(c => String(c.id) === selectedCat)?.name}
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
          <p className="text-gray-500 text-sm mb-6">{t('browse.beFirst')}</p>
          <Link to="/services/new" className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">{t('browse.offerService')}</Link>
        </div>
      ) : viewMode === 'map' ? (
        <>
          <p className="text-sm text-gray-400 mb-4">{services.filter((s: any) => s.provider_latitude && s.provider_longitude).length} {t('browse.onMap')}</p>
          <MapView services={services} userLat={userCoords?.lat} userLng={userCoords?.lng} />
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{services.length} {t('browse.servicesFound')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="block bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{s.category_name}{s.subcategory_name ? ` · ${s.subcategory_name}` : ''}</span>
                  {s.avg_rating && <span className="text-xs text-gray-500">⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600">{s.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-primary-600 font-semibold text-sm">{s.points_cost} {t('browse.boomerangs')}</span>
                  <div className="flex items-center gap-2">
                    {s.distance != null && <span className="text-xs text-gray-400">{Number(s.distance).toFixed(1)} km</span>}
                    <span className="text-xs text-gray-400">{s.provider_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}