import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useInstall } from '../components/InstallPrompt';
import { t } from '../i18n';

function InstallButton() {
  const { canInstall, install } = useInstall();
  if (!canInstall) {
    return (
      <div className="text-center shrink-0">
        <p className="text-xs text-gray-400 mb-2">On mobile? Open this site in your browser, then:</p>
        <p className="text-xs text-gray-500">iOS: Tap Share → "Add to Home Screen"</p>
        <p className="text-xs text-gray-500">Android: Tap Menu → "Install app"</p>
      </div>
    );
  }
  return (
    <button onClick={install} className="bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:shadow-xl transition-all shrink-0">
      Install app
    </button>
  );
}

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

      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-gray-900 mb-6">
              Help others.<br />
              <span className="text-primary-500">Get help back.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-4 max-w-lg">
              Boomerang connects people who exchange skills, services, and help — without money. Fix a bike, walk a dog, teach a language, design a logo. Give what you can, get what you need.
            </p>
            <p className="text-sm text-gray-400 italic mb-10">"What you give is yours, what you don't is lost" — Shota Rustaveli</p>
            {user ? (
              <div className="flex flex-wrap gap-4">
                <Link to="/browse" className="bg-primary-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary-600 hover:shadow-xl transition-all">Browse services</Link>
                <Link to="/services/new" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all">Offer a service</Link>
              </div>
            ) : (
              <div>
                <Link to="/register" className="inline-block bg-primary-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-primary-600 hover:shadow-xl transition-all">Get started free</Link>
                <p className="text-sm text-gray-400 mt-4">No credit card needed · <Link to="/login" className="text-primary-500 hover:underline">Already have an account?</Link></p>
              </div>
            )}
          </div>
        </div>
        {stats && (
          <div className="border-t border-gray-100 bg-white/60 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-start gap-16">
              {[[stats.total_users, 'People'], [stats.total_services, 'Services'], [stats.total_completed, 'Exchanges']].map(([val, label], i) => (
                <div key={i}>
                  <div className="text-3xl font-bold text-gray-900">{val}+</div>
                  <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Who is Boomerang for? */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-4">
          Boomerang is for<br />people like you
        </h2>
        <p className="text-lg text-gray-500 mb-12 max-w-lg">Whether you're new in town or a long-time local, there's always something you can teach and something you can learn.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'New to the area', desc: 'Just moved? Get help settling in — furniture assembly, local tips, language practice — and offer your own skills in return.', color: 'border-l-primary-500' },
            { title: 'On a tight budget', desc: 'Need a plumber, a dog walker, or a ride to the airport? Trade your skills instead of paying cash. Everyone has something to offer.', color: 'border-l-green-500' },
            { title: 'Want to give back', desc: 'Good at cooking, repairs, tech, or just listening? Share what you know with your community and build real connections.', color: 'border-l-blue-500' },
          ].map((p, i) => (
            <div key={i} className={`bg-white p-6 rounded-2xl border border-gray-100 border-l-4 ${p.color}`}>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — real scenarios */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
                It works like<br />a boomerang
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">What you give comes back to you. Help someone, earn boomerangs. Need help? Spend them. The cycle keeps going.</p>
            </div>
            <div className="space-y-6">
              {[
                { n: '1', title: 'You fix someone\'s leaky faucet', desc: 'You earn 20 boomerangs for your plumbing skills.', color: 'from-orange-400 to-amber-400' },
                { n: '2', title: 'You need a ride to the airport', desc: 'You spend 15 boomerangs and a neighbor drives you.', color: 'from-primary-400 to-primary-500' },
                { n: '3', title: 'That neighbor gets cooking lessons', desc: 'They spend their boomerangs learning to make pasta. The cycle continues.', color: 'from-green-400 to-emerald-400' },
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
          </div>
        </div>
      </section>

      {/* Browse categories */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
              20+ categories.<br />Hundreds of skills.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">Home repair, pet care, transport, cooking, tech help, gardening, music, wellness, design — if you can do it, someone nearby needs it.</p>
            <Link to="/browse" className="text-primary-600 font-semibold hover:underline text-lg">Browse all services →</Link>
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

      {/* Trust section */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Verified profiles', desc: 'Email verification and trust scores for every user' },
                { label: 'Ratings & reviews', desc: 'Both sides rate each exchange — transparency builds trust' },
                { label: 'Safe payments', desc: 'Points only transfer after both parties confirm completion' },
                { label: 'Community moderation', desc: 'Report system with admin review keeps the platform safe' },
              ].map((f, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-1">{f.label}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
                Built on trust,<br />not transactions
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">Every exchange builds your reputation. No anonymous interactions — real people helping real people in their community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-12 text-center">
          Real exchanges,<br />real people
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { text: 'Got my bike fixed and helped someone with their CV. Two exchanges, zero euros.', name: 'Sophie' },
            { text: 'A neighbor walked my dog while I was sick. I helped her move furniture later.', name: 'Marco' },
            { text: 'Someone assembled my IKEA shelves. I made them a week of home-cooked meals.', name: 'Lea' },
            { text: 'Got my smart home set up by a tech guy. Saved hundreds. Helped him with his garden.', name: 'David' },
          ].map((t, i) => (
            <div key={i} className="bg-gray-50 p-5 rounded-2xl">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">"{t.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full" />
                <span className="text-xs font-medium text-gray-500">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended for you */}
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
                    <span className="text-sm font-semibold text-primary-600">{m.points_budget} boomerangs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Available services */}
      {popularServices.length > 0 && (
        <section>
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Available now</h2>
              <Link to="/browse" className="text-sm text-primary-600 font-medium hover:underline">See all →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {popularServices.slice(0, 6).map((s: any) => (
                <Link key={s.id} to={`/services/${s.id}`}
                  className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg group transition-all">
                  <span className="text-xs text-gray-400">{s.category_name}</span>
                  <h3 className="font-semibold text-[15px] mt-1 mb-2 group-hover:text-primary-600">{s.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{s.provider_name}{s.provider_city ? ` · ${s.provider_city}` : ''}</span>
                    <span className="text-sm font-semibold text-primary-600">{s.points_cost} boomerangs</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
            Your neighborhood.<br />Your community.
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto mb-10">Create or join local groups. Share services with neighbors. Build connections that go beyond a single exchange.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/groups" className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all">Explore communities</Link>
            <Link to="/people" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all">Find people</Link>
          </div>
        </div>
      </section>

      {/* Get the app */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Boomerang on your phone</h3>
              <p className="text-gray-500 text-sm max-w-md">Install the app on your home screen for instant access. No app store needed — it works like a native app with notifications and offline support.</p>
            </div>
            <InstallButton />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="bg-gradient-to-br from-primary-500 to-primary-600">
          <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              What you give<br />comes back to you
            </h2>
            <p className="text-primary-100 text-lg mb-10 max-w-md mx-auto">Join a community where helping others helps you too. No money, no catch — just people sharing what they can.</p>
            <Link to="/register" className="inline-block bg-white text-primary-600 px-10 py-4 rounded-full text-lg font-bold hover:shadow-xl transition-all">Create free account</Link>
            <p className="text-primary-200 text-sm mt-4">Free forever. No credit card. Start with 50 boomerangs.</p>
          </div>
        </section>
      )}
    </div>
  );
}
