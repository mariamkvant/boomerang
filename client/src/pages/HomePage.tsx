import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
import { t, translateCat } from '../i18n';

function InstallButton() {
  const { canInstall, install } = useInstall();
  if (!canInstall) return (
    <div className="text-center shrink-0">
      <p className="text-xs text-gray-400 mb-2">{t('install.manual')}</p>
      <p className="text-xs text-gray-500">{t('install.ios')}</p>
      <p className="text-xs text-gray-500">{t('install.android')}</p>
    </div>
  );
  return <button onClick={install} className="bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:shadow-xl transition-all shrink-0">{t('install.btn')}</button>;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
    if (user) api.getSmartMatches().then(setMatches).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in -mx-4 -mt-6">
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
            {/* Left: headline + CTA */}
            <div className="max-w-xl flex-1">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-gray-900 dark:text-white mb-6">
                {t('hero.headline')}<br /><span className="text-primary-500">{t('hero.headline2')}</span>
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-lg">{t('hero.subtitle')}</p>
              <p className="text-sm text-gray-400 italic mb-10">{t('hero.quote')}</p>
              {user ? (
                <div className="flex flex-wrap gap-4">
                  <Link to="/browse" className="bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:shadow-xl transition-all">{t('hero.browseBtn')}</Link>
                  <Link to="/services/new" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all">{t('hero.offerBtn')}</Link>
                </div>
              ) : (
                <div>
                  <Link to="/register" className="inline-block bg-primary-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-primary-600 hover:shadow-xl transition-all">{t('hero.cta')}</Link>
                  <p className="text-sm text-gray-400 mt-4">{t('hero.cta.free')} · <Link to="/login" className="text-primary-500 hover:underline">{t('login')}</Link></p>
                </div>
              )}
            </div>

            {/* Right: search card */}
            <div className="w-full md:w-80 lg:w-96 shrink-0">
              <form onSubmit={e => { e.preventDefault(); if (heroSearch.trim()) navigate(`/browse?search=${encodeURIComponent(heroSearch.trim())}`); else navigate('/browse'); }}
                className="bg-white/80 dark:bg-[#202c33]/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/50 dark:border-gray-700/50">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('home.searchPlaceholder')}</p>
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input type="text" value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
                    placeholder={t('browse.search')}
                    className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#2a3942] border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white placeholder:text-gray-400" />
                </div>
                <button type="submit" className="w-full bg-primary-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-600 transition-all">
                  {t('home.searchBtn')}
                </button>
              </form>
            </div>
          </div>
        </div>
        {stats && (
          <div className="border-t border-gray-100 bg-white/60 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-start gap-16">
              {[[stats.total_users, t('hero.members')], [stats.total_services, t('hero.services')], [stats.total_completed, t('hero.exchanges')]].map(([val, label], i) => (
                <div key={i}><div className="text-3xl font-bold text-gray-900">{val}+</div><div className="text-sm text-gray-500 mt-0.5">{label}</div></div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-4">{t('home.forYou')}</h2>
        <p className="text-lg text-gray-500 mb-12 max-w-lg">{t('home.forYouDesc')}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: t('home.persona1'), desc: t('home.persona1Desc'), color: 'border-l-primary-500' },
            { title: t('home.persona2'), desc: t('home.persona2Desc'), color: 'border-l-green-500' },
            { title: t('home.persona3'), desc: t('home.persona3Desc'), color: 'border-l-blue-500' },
          ].map((p, i) => (
            <div key={i} className={`bg-white p-6 rounded-2xl border border-gray-100 border-l-4 ${p.color}`}>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">{t('home.howTitle')}</h2>
              <p className="text-lg text-gray-500 leading-relaxed">{t('home.howDesc')}</p>
            </div>
            <div className="space-y-6">
              {[
                { n: '1', title: t('home.step1'), desc: t('home.step1Desc'), color: 'from-orange-400 to-amber-400' },
                { n: '2', title: t('home.step2'), desc: t('home.step2Desc'), color: 'from-primary-400 to-primary-500' },
                { n: '3', title: t('home.step3'), desc: t('home.step3Desc'), color: 'from-green-400 to-emerald-400' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0`}>{s.n}</div>
                  <div><h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3><p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">{t('home.catTitle')}</h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">{t('home.catDesc')}</p>
            <Link to="/browse" className="text-primary-600 font-semibold hover:underline text-lg">{t('home.browseAll')}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 8).map((c: any) => (
              <Link key={c.id} to={`/browse?category=${c.id}`} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg group transition-all">
                <div className="flex items-center gap-3"><span className="text-2xl">{c.icon}</span><span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">{translateCat(c.name)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4">
              {[t('home.trust1'), t('home.trust2'), t('home.trust3'), t('home.trust4')].map((label, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t(`home.trust${i+1}Desc`)}</p>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">{t('home.trustTitle')}</h2>
              <p className="text-lg text-gray-500 leading-relaxed">{t('home.trustDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-12 text-center">{t('home.proofTitle')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[t('home.quote1'), t('home.quote2'), t('home.quote3'), t('home.quote4')].map((text, i) => (
            <div key={i} className="bg-gray-50 p-5 rounded-2xl">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">"{text}"</p>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full" /><span className="text-xs font-medium text-gray-500">{['Sophie','Marco','Lea','David'][i]}</span></div>
            </div>
          ))}
        </div>
      </section>

      {user && matches.length > 0 && (
        <section className="bg-primary-50/40">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('home.needHelp')}</h2>
              <Link to="/help-wanted" className="text-sm text-primary-600 font-medium hover:underline">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {matches.slice(0, 3).map((m: any) => (
                <div key={m.id} className="bg-white p-5 rounded-2xl border border-primary-100 hover:shadow-lg transition-all">
                  <span className="text-xs text-gray-400">{translateCat(m.category_name)}</span>
                  <h3 className="font-semibold text-[15px] mt-1 mb-2">{m.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{m.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{m.requester_name}</span>
                    <span className="text-sm font-semibold text-primary-600">{m.points_budget} {t('browse.boomerangs')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {popularServices.length > 0 && (
        <section>
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('available.title')}</h2>
              <Link to="/browse" className="text-sm text-primary-600 font-medium hover:underline">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {popularServices.slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg group transition-all">
                  <span className="text-xs text-gray-400">{translateCat(s.category_name)}</span>
                  <h3 className="font-semibold text-[15px] mt-1 mb-2 group-hover:text-primary-600">{s.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.provider_name}</span>
                    <span className="text-sm font-semibold text-primary-600">{s.points_cost} {t('browse.boomerangs')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">{t('home.communityTitle')}</h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto mb-10">{t('home.communityDesc')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/groups" className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all">{t('home.exploreCommunities')}</Link>
            <Link to="/people" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all">{t('home.findPeople')}</Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('install.title')}</h3>
              <p className="text-gray-500 text-sm max-w-md">{t('install.desc')}</p>
            </div>
            <InstallButton />
          </div>
        </div>
      </section>

      {!user && (
        <section className="bg-gradient-to-br from-primary-500 to-primary-600">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">{t('cta.title')}</h2>
            <p className="text-primary-100 text-lg mb-10 max-w-md mx-auto">{t('cta.subtitle')}</p>
            <Link to="/register" className="inline-block bg-white text-primary-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-xl transition-all">{t('cta.button')}</Link>
            <p className="text-primary-200 text-sm mt-4">{t('cta.note')}</p>
          </div>
        </section>
      )}
    </div>
  );
}
