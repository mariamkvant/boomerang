import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Welcome to Boomerang 🪃',
    body: 'Boomerang is a skill-exchange platform. You offer something, someone else offers something back — no money needed.',
    cta: 'Got it',
  },
  {
    title: 'What are 🪃 Boomerangs?',
    body: 'Boomerangs are your exchange currency. You start with 25. Spend them to request help, earn them by helping others.',
    cta: 'Next',
  },
  {
    title: 'How to get started',
    body: 'Post a service you can offer, then browse what others offer and send a request. That\'s it.',
    cta: 'Start exploring',
    link: '/browse',
  },
];

export default function OnboardingTooltip() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem('onboarding_tooltip_done');
    if (!done) {
      // Small delay so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem('onboarding_tooltip_done', 'true');
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
