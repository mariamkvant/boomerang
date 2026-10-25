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
      {/* ── HERO ── True full-viewport-width — breaks out of max-w-6xl container */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: '760px',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          width: '100vw',
        }}
      >
        {/* Sage green background */}
        <div className="absolute inset-0" style={{ background: '#b5c99a' }} />

        {/* Brick wall pattern — behind illustrations on right side */}
        <svg className="absolute right-0 top-0 bottom-0 h-full opacity-20" style={{ width: '65%' }} preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 22 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 52 + (row % 2 === 0 ? 0 : 26) - 10}
                y={row * 32}
                width="48" height="28" rx="2"
                fill="none"
                stroke="#6b7c4a"
                strokeWidth="1.2"
              />
            ))
          )}
        </svg>

        {/* Illustration collage — 3 images, bigger, arranged across full right area */}
        <div className="absolute right-0 top-0 bottom-0" style={{ width: '65%' }}>
          {/* Dog walker — top left of collage */}
          <img
            src="/illustration3.png"
            alt=""
            aria-hidden="true"
            className="absolute object-contain drop-shadow-md"
            style={{ width: '42%', top: '4%', left: '2%' }}
          />
          {/* Cup/neighbours — top right */}
          <img
            src="/illustration2.png"
            alt=""
            aria-hidden="true"
            className="absolute object-contain drop-shadow-md"
            style={{ width: '42%', top: '2%', right: '2%' }}
          />
          {/* Main window scene — bottom centre, biggest */}
          <img
            src="/hero-illustration.png"
            alt=""
            aria-hidden="true"
            className="absolute object-contain drop-shadow-lg"
            style={{ width: '68%', bottom: '2%', left: '16%' }}
          />
        </div>

        {/* Gradient fade from olive into illustrations */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #b5c99a 30%, rgba(181,201,154,0.85) 38%, rgba(181,201,154,0.1) 50%, transparent 62%)' }} />

        {/* Text — left half, aligned to same grid as rest of page */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 h-full flex flex-col justify-center py-16" style={{ minHeight: '700px' }}>
          <div style={{ maxWidth: '46%' }}>
          <div className="inline-flex items-center gap-2 bg-white/70 border border-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit">
            Now live in Europe & Georgia
          </div>
          <h1 className="text-3xl md:text-[42px] lg:text-[52px] font-extrabold leading-[1.05] text-gray-900 mb-5 tracking-tight">
            {t('hero.headline')}<br />
            <span className="text-primary-500">{t('hero.headline2')}</span>
          </h1>
          <p className="text-base text-gray-700 leading-relaxed mb-6" style={{ maxWidth: '420px' }}>{t('hero.subtitle')}</p>

          <div className="flex flex-wrap gap-2 mb-7">
            {[
              { emoji: '🌿', label: 'Plants & Pet Care' },
              { emoji: '👶', label: 'Childcare' },
              { emoji: '🚗', label: 'Transportation' },
              { emoji: '📦', label: 'Item Rental' },
              { emoji: '🚚', label: 'Courier Services' },
              { emoji: '✨', label: '+ more' },
            ].map((s, i) => (
              <Link key={i} to="/browse"
                className="inline-flex items-center gap-1.5 bg-white/90 border border-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors">
                {s.emoji} {s.label}
              </Link>
            ))}
          </div>

          {user ? (
            <div className="flex flex-wrap gap-3">
              <Link to="/browse" className="bg-[#1a4731] text-white px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-[#143828] transition-all">{t('hero.browseBtn')}</Link>
              <Link to="/services/new" className="bg-white text-gray-700 border border-gray-200 px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">{t('hero.offerBtn')}</Link>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-3 mb-3">
                <Link to="/register" className="bg-[#1a4731] text-white px-7 py-3.5 rounded-xl text-sm font-bold hover:bg-[#143828] transition-all">{t('hero.cta')}</Link>
                <a href="https://apps.apple.com/app/boomerang-skill-exchange/id6761754319" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  App Store
                </a>
              </div>
              <p className="text-xs text-gray-600">{t('hero.cta.free')} · <Link to="/login" className="text-[#1a4731] font-medium hover:underline">{t('login')}</Link></p>
            </div>
          )}
          </div>{/* end maxWidth inner wrapper */}
        </div>{/* end max-w-6xl */}

        {/* Stats bar pinned to bottom — aligned to page grid */}
        {stats && stats.total_users > 5 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/30" style={{ background: 'rgba(181,201,154,0.7)' }}>
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex gap-10">
              {[[stats.total_users, t('hero.members')], [stats.total_services, t('hero.services')], [stats.total_completed, t('hero.exchanges')]].map(([val, label], i) => (
                <div key={i}>
                  <div className="text-lg md:text-2xl font-bold text-[#1a4731]">{val}+</div>
                  <div className="text-xs text-[#2d6a4f]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── FOR YOU ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Who it's for</p>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white mb-4">{t('home.forYou')}</h2>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-8 max-w-md">{t('home.forYouDesc')}</p>
            <div className="space-y-4">
              {[
                { title: t('home.persona1'), desc: t('home.persona1Desc'), n: '01' },
                { title: t('home.persona2'), desc: t('home.persona2Desc'), n: '02' },
                { title: t('home.persona3'), desc: t('home.persona3Desc'), n: '03' },
              ].map((p, i) => (
                <div key={i} className="flex gap-4 items-start bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-gray-800 p-5 rounded-2xl">
                  <span className="text-xs font-bold text-gray-300 dark:text-gray-600 tracking-widest mt-0.5 shrink-0">{p.n}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img src="/illustration3.png" alt="Community illustration" className="w-full h-auto object-contain" />
          </div>
        </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── illustration2 on the right */}
      <section className="border-t border-gray-100 dark:border-gray-800" style={{ background: '#f5fbf7' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.howTitle')}</h2>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{t('home.howDesc')}</p>
              <div className="space-y-5">
                {[
                  { n: '1', title: t('home.step1'), desc: t('home.step1Desc') },
                  { n: '2', title: t('home.step2'), desc: t('home.step2Desc') },
                  { n: '3', title: t('home.step3'), desc: t('home.step3Desc') },
                ].map(s => (
                  <div key={s.n} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#1a4731] text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{s.n}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img src="/illustration2.png" alt="How it works" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Categories</p>
            <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.catTitle')}</h2>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{t('home.catDesc')}</p>
            <Link to="/browse" className="inline-flex items-center gap-2 bg-[#1a4731] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#143828] transition-all">
              {t('home.browseAll')} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.slice(0, 8).map((c: any) => (
              <Link key={c.id} to={`/browse?category=${c.id}`}
                className="bg-white dark:bg-[#1e1b18] px-4 py-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-300 hover:bg-primary-50/30 group transition-all">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">{tc(c.name)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── illustration4 on left */}
      <section className="border-t border-gray-100 dark:border-gray-800" style={{ background: '#f5fbf7' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex items-center justify-center">
              <img src="/illustration4.png" alt="Neighbours sharing" className="w-full h-auto object-contain" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Trust & Safety</p>
              <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.trustTitle')}</h2>
              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{t('home.trustDesc')}</p>
              <div className="grid grid-cols-2 gap-4">
                {[t('home.trust1'), t('home.trust2'), t('home.trust3'), t('home.trust4')].map((label, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#edf7f1] flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-[#1a4731]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{label}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{t(`home.trust${i+1}Desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-3">Community</p>
          <h2 className="text-2xl md:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white">{t('home.proofTitle')}</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { text: t('home.quote1'), name: 'Sophie L.', city: 'Luxembourg' },
            { text: t('home.quote2'), name: 'Marco V.', city: 'Luxembourg' },
            { text: t('home.quote3'), name: 'Lea M.', city: 'Luxembourg' },
            { text: t('home.quote4'), name: 'David K.', city: 'Luxembourg' },
          ].map((q, i) => (
            <div key={i} className="bg-white dark:bg-[#1e1b18] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">"{q.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#edf7f1] flex items-center justify-center text-[#1a4731] text-xs font-bold">{q.name.charAt(0)}</div>
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{q.name}</span>
                  <span className="text-xs text-gray-400 ml-1">· {q.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live activity feed */}
      {activityFeed.length > 0 && (
        <section className="bg-[#f8f7f5] dark:bg-[#111111]">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Happening now</h2>
            <div className="space-y-3">
              {activityFeed.slice(0, window.innerWidth < 768 ? 3 : 5).map((item: any, i: number) => (
                <div key={item.id || item.created_at || i} className="bg-white dark:bg-[#1c1c1c] rounded-xl p-4 flex items-start gap-3 shadow-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 bg-gray-400 dark:bg-gray-600`}>
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
        <section className="bg-[#f8f7f5] dark:bg-[#111111]">
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
                    {m.budget_eur && <span className="text-sm font-semibold text-amber-600">€{Math.round(parseFloat(m.budget_eur))}</span>}
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
                    <span className="text-sm font-semibold text-primary-600">
                      {s.price_eur != null ? `€${parseFloat(s.price_eur).toFixed(0)}` : ''}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#f8f7f5] dark:bg-[#111111]">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white mb-6">{t('home.communityTitle')}</h2>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-10">{t('home.communityDesc')}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/groups" className="bg-[#1f2937] dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 md:px-8 md:py-4 rounded-full text-sm md:text-lg font-semibold hover:bg-[#111827] dark:hover:bg-gray-100 transition-all">{t('home.exploreCommunities')}</Link>
            <Link to="/people" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-6 py-3.5 md:px-8 md:py-4 rounded-full text-sm md:text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">{t('home.findPeople')}</Link>
          </div>
        </div>
      </section>

      {!user && (
        <section className="border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
            <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-4">Get started</p>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">{t('cta.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-10 max-w-md mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="inline-block bg-[#1f2937] dark:bg-white text-white dark:text-gray-900 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-[#111827] transition-all">{t('cta.button')}</Link>
              <a href="https://apps.apple.com/app/boomerang-skill-exchange/id6761754319" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-gray-200 px-6 py-4 rounded-2xl transition-colors border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#242424]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none">Download on the</div>
                  <div className="text-sm font-semibold leading-tight">App Store</div>
                </div>
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">{t('cta.note')}</p>
          </div>
        </section>
      )}
    </div>
  );
}
