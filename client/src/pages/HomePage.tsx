import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function HomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getServices('').then(setRecentServices).catch(() => {});
    api.getPopularServices().then(setPopularServices).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center py-16 md:py-24">
        <img src="/logo.svg" alt="Boomerang" className="w-20 h-20 mx-auto mb-8 animate-slide-up" />
        <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight">
          What You Give, <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">Comes Back</span>
        </h1>
        <p className="text-sm text-gray-400 italic mb-6">— Shota Rustaveli</p>
        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Share your talents with your community and earn points. Use those points to get help when you need it. No money involved — just people helping people.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          {user ? (
            <>
              <Link to="/browse" className="bg-primary-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5">Browse Services</Link>
              <Link to="/services/new" className="border-2 border-primary-200 text-primary-600 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-50 hover:border-primary-300">Offer a Service</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="bg-primary-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-primary-600 hover:shadow-lg hover:-translate-y-0.5">Get Started Free</Link>
              <Link to="/browse" className="border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-50 hover:border-gray-300">Browse Services</Link>
            </>
          )}
        </div>
        <p className="text-sm text-gray-400">🪃 New members start with 50 free points</p>
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="text-center text-2xl font-bold mb-2">How Boomerang Works</h2>
        <p className="text-center text-gray-500 mb-10 text-sm">Three simple steps to start exchanging</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { step: '1', icon: '🎯', title: 'Share What You Know', desc: 'List your skills — gardening, guitar, cooking, tech help, anything you\'re good at.' },
            { step: '2', icon: '🪃', title: 'Help & Earn Points', desc: 'When someone requests your service and you complete it, you earn points automatically.' },
            { step: '3', icon: '✨', title: 'Get Help Back', desc: 'Use your earned points to request services from others. The cycle continues.' },
          ].map(f => (
            <div key={f.step} className="relative bg-white p-7 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">{f.step}</div>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Browse by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Find the help you need</p>
            </div>
            <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((c: any) => (
              <Link key={c.id} to={`/browse?category=${c.id}`}
                className="bg-white p-4 rounded-xl shadow-card hover:shadow-card-hover text-center group cursor-pointer">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{c.icon}</div>
                <div className="text-sm font-medium text-gray-700">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular this week */}
      {popularServices.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">🔥 Popular This Week</h2>
              <p className="text-gray-500 text-sm mt-1">Most requested services</p>
            </div>
            <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">See more →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularServices.slice(0, 6).map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`}
                className="bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover group animate-slide-up">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-gray-50 px-2 py-1 rounded-full">{s.category_icon} {s.category_name}</span>
                  {s.avg_rating && <span className="text-accent-500">⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600">{s.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">🪃 {s.points_cost} pts</span>
                  <span className="text-xs text-gray-400">{s.provider_name}{s.provider_city ? ` · ${s.provider_city}` : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {recentServices.length > 0 && (
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Recently Added</h2>
              <p className="text-gray-500 text-sm mt-1">Fresh services from the community</p>
            </div>
            <Link to="/browse" className="text-sm font-medium text-primary-600 hover:text-primary-700">See more →</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentServices.slice(0, 6).map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`}
                className="bg-white p-5 rounded-2xl shadow-card hover:shadow-card-hover group animate-slide-up">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span className="bg-gray-50 px-2 py-1 rounded-full">{s.category_icon} {s.category_name}</span>
                  {s.subcategory_name && <span className="bg-gray-50 px-2 py-0.5 rounded-full text-gray-400">{s.subcategory_name}</span>}
                  {s.avg_rating && <span className="text-accent-500">⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600">{s.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-sm font-semibold px-3 py-1 rounded-full">🪃 {s.points_cost} pts</span>
                  <span className="text-xs text-gray-400">by {s.provider_name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {!user && (
        <section className="py-16">
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-10 md:p-16 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to join the community?</h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto">Start with 50 free points. Offer your skills, help your neighbors, and get help when you need it.</p>
            <Link to="/register" className="inline-block bg-white text-primary-600 px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all">Create Free Account</Link>
          </div>
        </section>
      )}
    </div>
  );
}
