import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { t } from '../i18n';

const TESTIMONIALS = [
  { name: 'Sophie', text: 'I taught French and got my bike fixed — 2 exchanges done!', emoji: '🇫🇷' },
  { name: 'Marco', text: 'Found a guitar teacher in my community within minutes.', emoji: '🎸' },
  { name: 'Léa', text: 'My garden has never looked better. Thank you Boomerang!', emoji: '🌿' },
  { name: 'David', text: 'Got help setting up my smart home. Saved hundreds of euros.', emoji: '💡' },
  { name: 'Ana', text: 'I offer yoga classes and get cooking lessons in return.', emoji: '🧘' },
];

// Refined category icons — SVG-style minimal circles
const CAT_COLORS: Record<string, string> = {
  'Cleaning': 'from-blue-400 to-blue-500', 'Gardening': 'from-green-400 to-green-500',
  'Pet Care': 'from-amber-400 to-amber-500', 'Transportation': 'from-slate-400 to-slate-500',
  'Sports & Fitness': 'from-red-400 to-red-500', 'Cooking': 'from-orange-400 to-orange-500',
  'Tutoring': 'from-indigo-400 to-indigo-500', 'Languages': 'from-purple-400 to-purple-500',
  'Music': 'from-pink-400 to-pink-500', 'Tech Help': 'from-cyan-400 to-cyan-500',
  'Home Repair': 'from-yellow-500 to-yellow-600', 'Arts & Crafts': 'from-rose-400 to-rose-500',
  'Health & Wellness': 'from-teal-400 to-teal-500', 'Business & Career': 'from-gray-500 to-gray-600',
  'Design & Creative': 'from-violet-400 to-violet-500', 'Childcare & Education': 'from-sky-400 to-sky-500',
  'Auto & Mechanics': 'from-zinc-500 to-zinc-600', 'Listening & Support': 'from-fuchsia-400 to-fuchsia-500',
  'Beauty & Skincare': 'from-pink-300 to-pink-400', 'Other': 'from-gray-400 to-gray-500',
};

export default function HomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getServices('').then((res: any) => setRecentServices(Array.isArray(res) ? res : res.services || [])).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in -mx-4 -mt-6">
      {/* Hero */}
      <section className="hero-section px-4 pt-14 pb-20 md:pt-24 md:pb-28" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fffbeb 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-orange-100 rounded-full px-4 py-1.5 mb-8 text-sm text-orange-700 shadow-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            {t('hero.location')}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] text-gray-900">
            {t('hero.headline')} <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">{t('hero.headline2')}</span>
          </h1>
          <p className="text-lg text-gray-500 mb-3 max-w-xl mx-auto leading-relaxed">{t('hero.subtitle')}</p>
          <p className="text-sm text-gray-400 italic mb-10">{t('hero.quote')}</p>

          {/* Clean CTA — one primary action */}
          {user ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/browse" className="bg-primary-500 text-white px-8 py-3.5 rounded-2xl text-base font-semibold hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 shadow-md transition-all">{t('hero.browseBtn')}</Link>
              <Link to="/services/new" className="bg-white text-primary-600 border border-primary-200 px-8 py-3.5 rounded-2xl text-base font-semibold hover:bg-primary-50 transition-all">{t('hero.offerBtn')}</Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Link to="/register" className="bg-primary-500 text-white px-12 py-4 rounded-2xl text-lg font-bold hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 shadow-lg transition-all">
                {t('hero.cta')}
              </Link>
              <p className="text-sm text-gray-400">
                {t('hero.cta.free')} · <Link to="/login" className="text-primary-500 font-medium hover:underline">{t('login')}</Link>
              </p>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-10 mt-12">
              {[
                [stats.total_users, t('hero.members')],
                [stats.total_services, t('hero.services')],
                [stats.total_completed, t('hero.exchanges')],
              ].map(([val, label], i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">{val}+</div>
                  <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-2">{t('how.title')}</h2>
          <p className="text-center text-gray-500 mb-10 text-sm">{t('how.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: t('step1.title'), desc: t('step1.desc'), color: 'from-orange-400 to-amber-400' },
              { step: '2', title: t('step2.title'), desc: t('step2.desc'), color: 'from-primary-400 to-primary-500' },
              { step: '3', title: t('step3.title'), desc: t('step3.desc'), color: 'from-green-400 to-emerald-400' },
            ].map(f => (
              <div key={f.step} className="relative bg-white p-7 rounded-2xl shadow-card hover:shadow-card-hover transition-all group">
                <div className={`w-10 h-10 bg-gradient-to-br ${f.color} text-white rounded-xl flex items-center justify-center text-sm font-bold mb-4 group-hover:scale-110 transition-transform`}>{f.step}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories — refined cards */}
      {categories.length > 0 && (
        <section className="px-4 py-12 bg-gray-50/50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
                <p className="text-gray-400 text-sm mt-1">{t('categories.subtitle')}</p>
              </div>
              <Link to="/browse" className="text-sm font-medium text-primary-500 hover:text-primary-600">{t('categories.viewAll')}</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.slice(0, 10).map((c: any) => (
                <Link key={c.id} to={`/browse?category=${c.id}`}
                  className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md text-center group transition-all">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${CAT_COLORS[c.name] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform shadow-sm`}>
                    {c.icon}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{c.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-8">{t('testimonials.title')}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.slice(0, 3).map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-lg mb-4">{item.emoji}</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{item.text}"</p>
                <p className="text-xs font-semibold text-gray-900">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available services */}
      {(popularServices.length > 0 || recentServices.length > 0) && (
        <section className="px-4 py-12 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">{t('available.title')}</h2>
              <Link to="/browse" className="text-sm font-medium text-primary-500 hover:text-primary-600">{t('available.seeAll')}</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...(popularServices.length > 0 ? popularServices : recentServices)].slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`}
                  className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md group transition-all">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span className="bg-gray-50 px-2.5 py-1 rounded-full">{s.category_icon} {s.category_name}</span>
                    {s.avg_rating && <span className="text-amber-500">⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{s.title}</h3>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-primary-600 font-semibold text-sm">{s.points_cost} 🪃</span>
                    <span className="text-xs text-gray-400">{s.provider_name}{s.provider_city ? ` · ${s.provider_city}` : ''}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More testimonials */}
      <section className="px-4 py-12 bg-gray-50/50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4">
          {TESTIMONIALS.slice(3).map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-lg mb-4">{item.emoji}</div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">"{item.text}"</p>
              <p className="text-xs font-semibold text-gray-900">— {item.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="px-4 py-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-10 md:p-14 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('cta.title')}</h2>
            <p className="text-primary-100 mb-8 max-w-md mx-auto text-sm">{t('cta.subtitle')}</p>
            <Link to="/register" className="inline-block bg-white text-primary-600 px-10 py-3.5 rounded-2xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">{t('cta.button')}</Link>
            <p className="text-primary-200 text-xs mt-4">{t('cta.note')}</p>
          </div>
        </section>
      )}
    </div>
  );
}
