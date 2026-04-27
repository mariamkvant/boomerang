import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    title: 'Share what you can do',
    desc: 'Post a skill, service, or item you want to offer. Cooking lessons, tech help, homemade jam — anything goes.',
    visual: 'offer',
    color: 'from-primary-400 to-orange-400',
  },
  {
    title: 'Browse and request',
    desc: 'Find what you need from people in your community. One tap to request, pick a date, send a message.',
    visual: 'browse',
    color: 'from-blue-400 to-primary-400',
  },
  {
    title: 'Exchange with Boomerangs',
    desc: 'Help someone, earn Boomerangs. Need help? Spend them. No money changes hands.',
    visual: 'exchange',
    color: 'from-green-400 to-emerald-400',
  },
  {
    title: 'Build trust and community',
    desc: 'Rate exchanges, earn badges, climb the leaderboard. Join groups, attend events, grow your network.',
    visual: 'community',
    color: 'from-purple-400 to-primary-400',
  },
];

function OfferVisual() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 max-w-[260px] mx-auto animate-float">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Sophie</p>
          <p className="text-[10px] text-gray-400">Luxembourg City</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        <p className="text-sm font-medium text-gray-800">Guitar lessons for beginners</p>
        <p className="text-xs text-gray-500 mt-1">60 min session, all levels welcome</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary-600">15 🪃</span>
        <span className="text-[10px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">Published</span>
      </div>
    </div>
  );
}

function BrowseVisual() {
  return (
    <div className="space-y-2 max-w-[260px] mx-auto">
      {[
        { title: 'Guitar lessons', by: 'Sophie', cost: 15, city: 'Luxembourg City' },
        { title: 'Garden help', by: 'Marco', cost: 10, city: 'Esch-sur-Alzette' },
        { title: 'Homemade bread', by: 'Lea', cost: 8, city: 'Strassen' },
      ].map((s, i) => (
        <div key={i} className={`bg-white rounded-lg shadow-sm p-3 flex items-center justify-between transition-all ${i === 0 ? 'ring-2 ring-primary-300 scale-[1.02]' : 'opacity-70'}`}
          style={{ animationDelay: `${i * 200}ms` }}>
          <div>
            <p className="text-sm font-medium text-gray-800">{s.title}</p>
            <p className="text-[10px] text-gray-400">{s.by} · {s.city}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-primary-600">{s.cost} 🪃</span>
            {i === 0 && <p className="text-[9px] text-primary-500 mt-0.5">Request →</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExchangeVisual() {
  return (
    <div className="max-w-[260px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">M</div>
          <p className="text-xs font-medium text-gray-700">Marco</p>
          <p className="text-[10px] text-gray-400">-10 🪃</p>
        </div>
        <div className="flex-1 mx-3">
          <div className="h-0.5 bg-gray-200 relative">
            <div className="absolute inset-y-0 left-0 bg-primary-500 rounded-full animate-flow" style={{ width: '100%' }} />
          </div>
          <p className="text-[9px] text-center text-gray-400 mt-1">Garden help</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">S</div>
          <p className="text-xs font-medium text-gray-700">Sophie</p>
          <p className="text-[10px] text-green-500">+10 🪃</p>
        </div>
      </div>
      <div className="bg-green-50 rounded-lg p-3 text-center">
        <p className="text-xs font-medium text-green-700">Exchange complete</p>
        <div className="flex justify-center gap-0.5 mt-1">
          {[1,2,3,4,5].map(n => <span key={n} className="text-yellow-400 text-sm">★</span>)}
        </div>
      </div>
    </div>
  );
}

function CommunityVisual() {
  return (
    <div className="max-w-[260px] mx-auto space-y-2">
      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-[9px] font-bold">L</div>
          <p className="text-xs font-semibold text-gray-800">Luxembourg Helpers</p>
          <span className="text-[9px] text-gray-400 ml-auto">42 members</span>
        </div>
        <p className="text-[10px] text-gray-500">Yoga in the park — Saturday 10am</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 bg-white rounded-lg shadow-sm p-2 text-center">
          <p className="text-lg font-bold text-primary-600">Gold</p>
          <p className="text-[9px] text-gray-400">Trust level</p>
        </div>
        <div className="flex-1 bg-white rounded-lg shadow-sm p-2 text-center">
          <p className="text-lg font-bold text-gray-800">12</p>
          <p className="text-[9px] text-gray-400">Exchanges</p>
        </div>
      </div>
    </div>
  );
}

const visuals: Record<string, () => JSX.Element> = {
  offer: OfferVisual,
  browse: BrowseVisual,
  exchange: ExchangeVisual,
  community: CommunityVisual,
};

export default function AnimatedExplainer() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setActive(a => (a + 1) % steps.length), 4000);
    return () => clearInterval(timer);
  }, [paused]);

  const step = steps[active];
  const Visual = visuals[step.visual];

  return (
    <section className="bg-white dark:bg-[#111b21]">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">See how it works</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Four simple steps to start exchanging skills, services, and items with your community.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          {/* Left: steps */}
          <div className="space-y-2">
            {steps.map((s, i) => (
              <button key={i}
                onClick={() => { setActive(i); setPaused(true); setTimeout(() => setPaused(false), 10000); }}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${active === i ? 'bg-gray-50 dark:bg-[#202c33] shadow-sm' : 'hover:bg-gray-50/50 dark:hover:bg-[#202c33]/50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform ${active === i ? 'scale-110' : 'scale-90 opacity-50'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold transition-colors ${active === i ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.title}</p>
                    <p className={`text-xs mt-1 leading-relaxed transition-all ${active === i ? 'text-gray-500 dark:text-gray-400 max-h-20 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>{s.desc}</p>
                  </div>
                </div>
                {/* Progress bar */}
                {active === i && !paused && (
                  <div className="mt-3 ml-11 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full animate-progress" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Right: animated visual */}
          <div className="flex items-center justify-center min-h-[280px]">
            <div key={active} className="animate-fade-in">
              <Visual />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link to="/register" className="inline-block bg-primary-500 text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-primary-600 hover:shadow-lg transition-all">
            Get started free
          </Link>
          <p className="text-xs text-gray-400 mt-3">Free forever. Start with 50 Boomerangs.</p>
        </div>
      </div>
    </section>
  );
}
