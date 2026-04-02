import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { t } from '../i18n';

export default function HomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
    if (user) api.getSmartMatches().then(setMatches).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in -mx-4 -mt-6">

      {/* Hero — WhatsApp style: big headline, generous space, single CTA */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 40%, #f0fdf4 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-gray-900 mb-6">
              {t('hero.headline')}<br />
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">{t('hero.headline2')}</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">{t('hero.subtitle')}</p>
            {user ? (
              <div className="flex flex-wrap gap-4">
                <Link to="/browse" className="bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:shadow-xl transition-all">{t('hero.browseBtn')}</Link>
                <Link to="/services/new" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all">{t('hero.offerBtn')}</Link>
              </div>
            ) : (
              <div>
                <Link to="/register" className="inline-block bg-primary-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-primary-600 hover:shadow-xl transition-all">{t('hero.cta')}</Link>
                <p className="text-sm text-gray-400 mt-4">{t('hero.cta.free')}</p>
              </div>
            )}
          </div>
        </div>
        {/* Stats bar */}
        {stats && (
          <div className="border-t border-gray-100 bg-white/60 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-start gap-16">
              {[[stats.total_users, t('hero.members')], [stats.total_services, t('hero.services')], [stats.total_completed, t('hero.exchanges')]].map(([val, label], i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-gray-900">{val}+</div>
                  <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Section 1 — Share your skills (left text, right visual) */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
              Share<br />what you know
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">List your skills — gardening, guitar, cooking, tech help, anything you're good at. Set your own schedule and boomerang price.</p>
            <Link to={user ? '/services/new' : '/register'} className="text-primary-600 font-semibold hover:underline text-lg">Start offering →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 8).map((c: any) => (
              <Link key={c.id} to={`/browse?category=${c.id}`}
                className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg group transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">{c.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2 — How it works (alternating, right text) */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {[
                { n: '1', title: t('step1.title'), desc: t('step1.desc'), color: 'from-orange-400 to-amber-400' },
                { n: '2', title: t('step2.title'), desc: t('step2.desc'), color: 'from-primary-400 to-primary-500' },
                { n: '3', title: t('step3.title'), desc: t('step3.desc'), color: 'from-green-400 to-emerald-400' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0`}>{s.n}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
                {t('how.title').split(' ').slice(0, 2).join(' ')}<br />{t('how.title').split(' ').slice(2).join(' ') || 'works'}
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">{t('how.subtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Trust & community (left text) */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
              Built on<br />trust
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-6">Every exchange builds your reputation. Earn trust through reviews, completion rates, and community engagement. Your trust score grows with every interaction.</p>
            <Link to="/leaderboard" className="text-primary-600 font-semibold hover:underline text-lg">See the leaderboard →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Ratings & Reviews', desc: 'Rate every exchange to build trust' },
              { label: 'Trust Scores', desc: 'Earn Bronze, Silver, Gold, Platinum' },
              { label: 'Communities', desc: 'Join local groups and connect' },
              { label: 'Fair Exchange', desc: 'Points-based, no money involved' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-1">{f.label}</h4>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Recommended for you (logged in only) */}
      {user && matches.length > 0 && (
        <section className="bg-primary-50/40">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">People need your help</h2>
              <Link to="/help-wanted" className="text-sm text-primary-600 font-medium hover:underline">See all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {matches.slice(0, 3).map((m: any) => (
                <div key={m.id} className="bg-white p-5 rounded-2xl border border-primary-100 hover:shadow-lg transition-all">
                  <span className="text-xs text-gray-400">{m.category_name}</span>
                  <h3 className="font-semibold text-[15px] mt-1 mb-2">{m.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{m.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{m.requester_name}</span>
                    <span className="text-sm font-semibold text-primary-600">{m.points_budget} 🪃</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 5 — Available services */}
      {popularServices.length > 0 && (
        <section className={user && matches.length > 0 ? '' : 'bg-gray-50'}>
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('available.title')}</h2>
              <Link to="/browse" className="text-sm text-primary-600 font-medium hover:underline">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {popularServices.slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`}
                  className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg group transition-all">
                  <span className="text-xs text-gray-400">{s.category_name}</span>
                  <h3 className="font-semibold text-[15px] mt-1 mb-2 group-hover:text-primary-600">{s.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.provider_name}{s.provider_city ? ` · ${s.provider_city}` : ''}</span>
                    <span className="text-sm font-semibold text-primary-600">{s.points_cost} 🪃</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 6 — Keep in touch with your community */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-3">
                {['Sophie taught French and got her bike fixed', 'Marco found a guitar teacher in minutes', 'Léa got her garden transformed', 'David saved hundreds on smart home setup'].map((text, i) => (
                  <div key={i} className="bg-gray-50 p-5 rounded-2xl">
                    <p className="text-sm text-gray-600 leading-relaxed">"{text}"</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full"></div>
                      <span className="text-xs text-gray-400">{['Sophie', 'Marco', 'Léa', 'David'][i]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
                Keep in touch<br />with your<br />community
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">Join local groups, exchange skills with neighbors, and build real connections. What you give comes back to you.</p>
              <Link to="/groups" className="text-primary-600 font-semibold hover:underline text-lg">Explore communities →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
