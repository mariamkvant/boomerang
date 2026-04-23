import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
import { t } from '../i18n';

function tc(name: string): string {
  const key = 'cat.' + name;
  const val = t(key);
  return val !== key ? val : name;
}

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

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };
  const [categories, setCategories] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
    api.getCommunityFeed().then((data: any) => setActivityFeed(data.feed || [])).catch(() => {});
    if (user) api.getSmartMatches().then(setMatches).catch(() => {});
    api.trackView('home');
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

            {/* Right: browse card — only for non-logged-in users */}
            {!user && (
              <div className="w-full md:w-72 lg:w-80 shrink-0">
                <Link to="/browse"
                  className="block bg-white/60 dark:bg-[#202c33]/60 backdrop-blur-lg rounded-2xl px-8 py-10 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-lg hover:border-primary-200 transition-all text-center group">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{t('hero.browseBtn')}</p>
                  <p className="text-sm text-gray-400 mt-1.5">{t('browse.subtitle')}</p>
                  <svg className="w-5 h-5 mx-auto mt-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}
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
            { title: t('home.persona1'), desc: t('home.persona1Desc') },
            { title: t('home.persona2'), desc: t('home.persona2Desc') },
            { title: t('home.persona3'), desc: t('home.persona3Desc') },
          ].map((p, i) => (
            <div key={i} className="bg-white dark:bg-[#202c33] p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
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
              <Link key={c.id} to={`/browse?category=${c.id}`}
                className="bg-white dark:bg-[#202c33] px-4 py-3.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-300 hover:shadow-md group transition-all">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary-600">{tc(c.name)}</span>
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
            <div key={i} className="bg-white dark:bg-[#202c33] p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">"{text}"</p>
              <span className="text-xs text-gray-400">{['Sophie','Marco','Lea','David'][i]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Live activity feed */}
      {activityFeed.length > 0 && (
        <section className="bg-gray-50 dark:bg-[#0b141a]">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Happening now</h2>
            <div className="space-y-3">
              {activityFeed.slice(0, window.innerWidth < 768 ? 3 : 5).map((item: any, i: number) => (
                <div key={i} className="bg-white dark:bg-[#202c33] rounded-xl p-4 flex items-start gap-3 shadow-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 ${
                    item.type === 'exchange' ? 'bg-green-500' :
                    item.type === 'new_service' ? 'bg-primary-500' :
                    'bg-purple-500'
                  }`}>
                    {item.type === 'exchange' ? '✓' : item.type === 'new_service' ? '+' : '♥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.type === 'exchange' && (
                      <p className="text-sm dark:text-gray-200"><span className="font-medium">{item.provider_name}</span> helped <span className="font-medium">{item.requester_name}</span> with {item.service_title}</p>
                    )}
                    {item.type === 'new_service' && (
                      <p className="text-sm dark:text-gray-200"><span className="font-medium">{item.provider_name}</span> is now offering <Link to={`/services/${item.id}`} className="font-medium text-primary-600 hover:underline">{item.title}</Link></p>
                    )}
                    {item.type === 'shoutout' && (
                      <p className="text-sm dark:text-gray-200"><span className="font-medium">{item.from_username}</span> thanked <span className="font-medium">{item.to_username}</span>: "{item.message}"</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
                  <span className="text-xs text-gray-400">{tc(m.category_name)}</span>
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
                  <span className="text-xs text-gray-400">{tc(s.category_name)}</span>
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
          <div className="bg-white dark:bg-[#202c33] rounded-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Now on the App Store</h3>
              <p className="text-gray-500 text-sm max-w-md">Download Boomerang on your iPhone or iPad and start exchanging skills with your community.</p>
            </div>
            <a href="https://apps.apple.com/app/boomerang-skill-exchange/id6761754319" target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-3 bg-black text-white px-6 py-3.5 rounded-2xl hover:bg-gray-900 transition-colors">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-300 leading-none">Download on the</div>
                <div className="text-base font-semibold leading-tight">App Store</div>
              </div>
            </a>
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
