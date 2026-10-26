import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Welcome to Boomerang 🪃',
    body: 'Discover and book local services from people in your neighbourhood — dog walking, tutoring, home repairs, and more. Providers set their own prices in EUR or GEL.',
    cta: 'Next',
  },
  {
    title: 'How payments work',
    body: 'Pay securely by card when you book. Your money is held safely until you confirm the service was delivered — then released to the provider. Cancel anytime before delivery for a full refund.',
    cta: 'Next',
  },
  {
    title: 'Ready to explore',
    body: 'Browse services nearby on the map, post your own offer to earn, or ask the community for help via Requests.',
    cta: 'Start exploring',
    link: '/browse',
  },
];

export default function OnboardingTooltip() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // v2 key — forces existing users who saw the old boomerang-points tooltip to see the new one
    const done = localStorage.getItem('onboarding_tooltip_v2_done');
    if (!done) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('onboarding_tooltip_v2_done', 'true');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Step dots */}
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-6 bg-[#1f2937]' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{current.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{current.body}</p>

        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600">Skip</button>
          {current.link ? (
            <Link to={current.link} onClick={dismiss}
              className="bg-[#1f2937] text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              {current.cta}
            </Link>
          ) : (
            <button onClick={next} className="bg-[#1f2937] text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              {current.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
