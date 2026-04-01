import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { t } from '../i18n';

const TESTIMONIALS = [
  { name: 'Sophie', text: 'I taught French and got my bike fixed — 2 exchanges done!', emoji: '🇫🇷🚲' },
  { name: 'Marco', text: 'Found a guitar teacher in my community within minutes.', emoji: '🎸' },
  { name: 'Léa', text: 'My garden has never looked better. Thank you Boomerang community!', emoji: '🌻' },
  { name: 'David', text: 'Got help setting up my smart home. Saved hundreds of euros.', emoji: '🏠' },
  { name: 'Ana', text: 'I offer yoga classes and get cooking lessons in return. Love it!', emoji: '🧘‍♀️🍳' },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getServices('').then(setRecentServices).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in -mx-4 -mt-6">
      {/* Hero — above the fold */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 border border-orange-100 rounded-full px-4 py-1.5 mb-6 text-sm text-orange-700 shadow-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Active in Luxembourg &amp; surrounding areas
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight text-gray-900">
            Exchange skills with your community — <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">no money needed</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-4 max-w-2xl mx-auto leading-relaxed">
            Teach guitar, get help with gardening. Fix a computer, learn to cook. Start with 50 free Boomerangs.
          </p>
          <p className="text-sm text-gray-400 italic mb-8">"What you give, comes back" — Shota Rustaveli</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {user ? (
              <>
                <Link to="/browse" className="bg-primary-500 text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 shadow-md">🔍 Browse Services</Link>
                <Link to="/services/new" className="bg-white border-2 border-primary-200 text-primary-600 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-primary-50 hover:border-primary-300 shadow-sm">➕ Offer a Service</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="bg-primary-500 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5 shadow-md">Create Free Account →</Link>
                <Link to="/browse" className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-gray-50 shadow-sm">Browse First</Link>
              </>
            )}
          </div>
          {!user && <p className="text-xs text-gray-400">Free forever · No credit card · 50 🪃 to start</p>}

          {/* Social proof numbers */}
          {stats && (
            <div className="flex justify-center gap-8 mt-10">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total_users}+</div>
                <div className="text-xs text-gray-400">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total_services}+</div>
                <div className="text-xs text-gray-400">Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stats.total_completed}+</div>
                <div className="text-xs text-gray-400">Exchanges</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-8">What people are saying</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-gray-50 p-5 rounded-2xl">
                <div className="text-2xl mb-3">{t.emoji}</div>
                <p className="text-sm text-gray-600 italic mb-3">"{t.text}"</p>
                <p className="text-xs font-semibold text-gray-900">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-2">{t('how.title')}</h2>
          <p className="text-center text-gray-500 mb-10 text-sm">{t('how.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', icon: '🎯', title: t('step1.title'), desc: t('step1.desc') },
              { step: '2', icon: '🪃', title: t('step2.title'), desc: t('step2.desc') },
              { step: '3', icon: '✨', title: t('step3.title'), desc: t('step3.desc') },
            ].map(f => (
              <div key={f.step} className="relative bg-white p-7 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">{f.step}</div>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Browse by Category</h2>
                <p className="text-gray-500 text-sm mt-1">20+ categories, 100+ subcategories</p>
              </div>
              <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all →</Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((c: any) => (
                <Link key={c.id} to={`/browse?category=${c.id}`}
                  className="bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover text-center group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{c.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular + Recent services */}
      {(popularServices.length > 0 || recentServices.length > 0) && (
        <section className="px-4 py-12 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">🔥 Available Now</h2>
              <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">See all →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...(popularServices.length > 0 ? popularServices : recentServices)].slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`}
                  className="bg-gray-50 p-5 rounded-2xl hover:shadow-card-hover group border border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <span className="bg-white px-2.5 py-1 rounded-full border border-gray-100">{s.category_icon} {s.category_name}</span>
                    {s.avg_rating && <span className="text-amber-500">⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600">{s.title}</h3>
                  <div className="flex items-center justify-between mt-3">
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
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            {TESTIMONIALS.slice(3).map((t, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl shadow-card">
                <div className="text-2xl mb-3">{t.emoji}</div>
                <p className="text-sm text-gray-600 italic mb-3">"{t.text}"</p>
                <p className="text-xs font-semibold text-gray-900">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="px-4 py-16">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start exchanging?</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Join your community on Boomerang. It's free, it's local, and it works.</p>
            <Link to="/register" className="inline-block bg-white text-primary-600 px-10 py-4 rounded-2xl text-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all">Create Free Account →</Link>
            <p className="text-primary-200 text-xs mt-4">Takes 30 seconds · No credit card needed</p>
          </div>
        </section>
      )}
    </div>
  );
}
