import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
import { t } from '../i18n';
import AnimatedExplainer from '../components/AnimatedExplainer';

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
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fff8f3] via-white to-[#f0f9ff] dark:from-[#1a1410] dark:via-[#141210] dark:to-[#0f1a1f]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #f07028 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-12">
            <div className="max-w-xl flex-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                Now live in Europe
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-gray-900 dark:text-white mb-6 tracking-tight">
                {t('hero.headline')}<br /><span className="text-primary-500">{t('hero.headline2')}</span>
              </h1>
              <p className="text-xl text-gray-500 dark:text-gray-400 leading-relaxed mb-4 max-w-lg">{t('hero.subtitle')}</p>
              <p className="text-sm text-gray-400 italic mb-10">{t('hero.quote')}</p>
              {user ? (
                <div className="flex flex-wrap gap-4">
                  <Link to="/browse" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg">{t('hero.browseBtn')}</Link>
                  <Link to="/services/new" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-50 transition-all">{t('hero.offerBtn')}</Link>
                </div>
              ) : (
                <div>
                  <Link to="/register" className="inline-block bg-gray-900 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:bg-gray-800 transition-all shadow-lg">{t('hero.cta')}</Link>
                  <p className="text-sm text-gray-400 mt-4">{t('hero.cta.free')} · <Link to="/login" className="text-primary-500 hover:underline">{t('login')}</Link></p>
                </div>
              )}
            </div>
            {!user && (
              <div className="w-full md:w-72 lg:w-80 shrink-0">
                <Link to="/browse" className="block bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl px-8 py-10 border border-gray-200/50 dark:border-gray-700/30 hover:shadow-xl hover:border-primary-200 transition-all text-center group shadow-md">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{t('hero.browseBtn')}</p>
                  <p className="text-sm text-gray-400 mt-1.5">{t('browse.subtitle')}</p>
                  <svg className="w-5 h-5 mx-auto mt-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            )}
          </div>
        </div>
        {stats && (
          <div className="relative border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-start gap-12">
              {[[stats.total_users, t('hero.members')], [stats.total_services, t('hero.services')], [stats.total_completed, t('hero.exchanges')]].map(([val, label], i) => (
                <div key={i}><div className="text-3xl font-bold text-gray-900 dark:text-white">{val}+</div><div className="text-sm text-gray-500 mt-0.5">{label}</div></div>
              ))}
            </div>
          </div>
        )}
      </section>

      <AnimatedExplainer />

      {/* "For you" section — numbered cards with accent colors */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="mb-12">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Who it's for</p>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-4">{t('home.forYou')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg">{t('home.forYouDesc')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: t('home.persona1'), desc: t('home.persona1Desc'), n: '01', bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-100 dark:border-orange-900/20' },
            { title: t('home.persona2'), desc: t('home.persona2Desc'), n: '02', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-100 dark:border-blue-900/20' },
            { title: t('home.persona3'), desc: t('home.persona3Desc'), n: '03', bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-100 dark:border-green-900/20' },
          ].map((p, i) => (
            <div key={i} className={`${p.bg} border ${p.border} p-6 rounded-2xl`}>
              <span className="text-xs font-bold text-gray-300 dark:text-gray-600 tracking-widest">{p.n}</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mt-3 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — dark section for contrast */}
      <section className="bg-gray-900 dark:bg-black">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-white mb-6">{t('home.howTitle')}</h2>
              <p className="text-lg text-gray-400 leading-relaxed">{t('home.howDesc')}</p>
            </div>
            <div className="space-y-5">
              {[
                { n: '1', title: t('home.step1'), desc: t('home.step1Desc'), color: 'bg-orange-500' },
                { n: '2', title: t('home.step2'), desc: t('home.step2Desc'), color: 'bg-primary-500' },
                { n: '3', title: t('home.step3'), desc: t('home.step3Desc'), color: 'bg-emerald-500' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className={`w-9 h-9 ${s.color} text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0`}>{s.n}</div>
                  <div><h3 className="font-semibold text-white mb-1">{s.title}</h3><p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Categories</p>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.catTitle')}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{t('home.catDesc')}</p>
            <Link to="/browse" className="inline-flex items-center gap-2 text-gray-900 dark:text-white font-semibold hover:text-primary-600 transition-colors">
              {t('home.browseAll')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.slice(0, 8).map((c: any) => (
              <Link key={c.id} to={`/browse?category=${c.id}`}
                className="bg-white dark:bg-[#1e1b18] px-4 py-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-300 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 group transition-all">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">{tc(c.name)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section — clean, minimal */}
      <section className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-3">
              {[t('home.trust1'), t('home.trust2'), t('home.trust3'), t('home.trust4')].map((label, i) => (
                <div key={i} className="bg-white dark:bg-[#1e1b18] p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t(`home.trust${i+1}Desc`)}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Trust & Safety</p>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.trustTitle')}</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">{t('home.trustDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Community</p>
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white">{t('home.proofTitle')}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[t('home.quote1'), t('home.quote2'), t('home.quote3'), t('home.quote4')].map((text, i) => (
            <div key={i} className="bg-white dark:bg-[#1e1b18] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">"{text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                  {['S','M','L','D'][i]}
                </div>
                <span className="text-xs font-medium text-gray-500">{['Sophie','Marco','Lea','David'][i]}</span>
              </div>
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
        <section className="bg-primary-50/40 dark:bg-primary-900/10">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.needHelp')}</h2>
              <Link to="/help-wanted" className="text-sm text-primary-600 font-medium hover:underline">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {matches.slice(0, 3).map((m: any) => (
                <div key={m.id} className="bg-white dark:bg-[#1e1b18] p-5 rounded-2xl border border-primary-100 dark:border-primary-900/30 hover:shadow-lg transition-all">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('available.title')}</h2>
              <Link to="/browse" className="text-sm text-primary-600 font-medium hover:underline">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {popularServices.slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`} className="bg-white dark:bg-[#1e1b18] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-lg group transition-all">
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

      <section className="bg-white dark:bg-[#141210]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.communityTitle')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10">{t('home.communityDesc')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/groups" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">{t('home.exploreCommunities')}</Link>
            <Link to="/people" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">{t('home.findPeople')}</Link>
          </div>
        </div>
      </section>

      {!user && (
        <section className="bg-gray-900 dark:bg-black">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-4">Get started</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">{t('cta.title')}</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="inline-block bg-white text-gray-900 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-gray-100 transition-all shadow-lg">{t('cta.button')}</Link>
              <a href="https://apps.apple.com/app/boomerang-skill-exchange/id6761754319" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl transition-colors border border-white/20">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none">Download on the</div>
                  <div className="text-sm font-semibold leading-tight">App Store</div>
                </div>
              </a>
            </div>
            <p className="text-gray-600 text-sm mt-4">{t('cta.note')}</p>
          </div>
        </section>
      )}

      <section className="bg-gray-50 dark:bg-[#0b141a]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white dark:bg-[#1e1b18] rounded-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
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
    </div>
  );
}
