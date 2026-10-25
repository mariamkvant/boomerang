import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import CommunityIllustration from '../components/CommunityIllustration';

const SKILL_OPTIONS = [
  { icon: '🌱', label: 'Gardening' },
  { icon: '🎸', label: 'Music' },
  { icon: '🍳', label: 'Cooking' },
  { icon: '💻', label: 'Tech Help' },
  { icon: '🔧', label: 'Home Repair' },
  { icon: '🏸', label: 'Sports' },
  { icon: '📚', label: 'Tutoring' },
  { icon: '🗣️', label: 'Languages' },
  { icon: '🐕', label: 'Pet Care' },
  { icon: '🎨', label: 'Arts & Crafts' },
  { icon: '🧘', label: 'Wellness' },
  { icon: '💼', label: 'Business' },
  { icon: '🧹', label: 'Cleaning' },
  { icon: '🚗', label: 'Transport' },
  { icon: '💜', label: 'Listening' },
  { icon: '📷', label: 'Photography' },
  { icon: '📦', label: 'Deliveries' },
  { icon: '✨', label: 'Other' },
];

const NEED_OPTIONS = [
  { icon: '🔧', label: 'Fix something at home' },
  { icon: '🗣️', label: 'Learn a language' },
  { icon: '🎸', label: 'Learn an instrument' },
  { icon: '💻', label: 'Tech help' },
  { icon: '🌱', label: 'Garden help' },
  { icon: '📚', label: 'Tutoring' },
  { icon: '🐕', label: 'Pet care' },
  { icon: '💜', label: 'Someone to talk to' },
  { icon: '📦', label: 'Package delivery' },
  { icon: '🍳', label: 'Home-cooked meals' },
];

// Green header bar shared by all steps
function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  const totalSteps = 4;
  return (
    <div className="flex-shrink-0 px-6 pt-8 pb-0" style={{ background: '#4a9b6f' }}>
      {/* Back + logo row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
          <img src="/logo.svg" alt="" className="w-5 h-5" />
        </div>
        <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Boomerang</span>
        <div className="ml-auto text-white/60 text-xs">{step}/{totalSteps}</div>
      </div>
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i < step ? 'bg-white flex-1' : i === step - 1 ? 'bg-white flex-[2]' : 'bg-white/30 flex-1'}`} />
        ))}
      </div>
      <h2 className="text-xl font-bold text-white mb-1 px-0">{title}</h2>
      <p className="text-white/70 text-xs leading-relaxed mb-4">{subtitle}</p>
      {/* Illustration strip */}
      <CommunityIllustration className="w-full" style={{ maxHeight: '130px' }} />
    </div>
  );
}

export default function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { api.getCategories().catch(() => {}); }, []);

  const handleCityChange = (val: string) => {
    setCity(val); setCityCoords(null);
    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current);
    if (val.length < 3) { setCitySuggestions([]); return; }
    setGeocoding(true);
    cityDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'Boomerang/1.0' } });
        setCitySuggestions(await res.json());
      } catch {}
      setGeocoding(false);
    }, 500);
  };

  const selectCitySuggestion = async (s: any) => {
    const lat = parseFloat(s.lat); const lng = parseFloat(s.lon);
    const a = s.address || {};
    const displayCity = a.neighbourhood || a.suburb || a.city_district || a.city || a.town || a.village || s.display_name.split(',')[0];
    setCity(displayCity); setCityCoords({ lat, lng }); setCitySuggestions([]);
    await api.updateProfile({ city: displayCity, latitude: lat, longitude: lng });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const detected = data.address?.city || data.address?.town || data.address?.village || '';
          setCity(detected); setCityCoords({ lat: latitude, lng: longitude });
          await api.updateProfile({ city: detected, latitude, longitude });
        } catch {}
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const toggleSkill = (s: string) => setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleNeed = (s: string) => setSelectedNeeds(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleFinish = async () => {
    const finalBio = bio || (selectedSkills.length > 0 ? `I offer: ${selectedSkills.join(', ')}` : '');
    if (finalBio) await api.updateProfile({ bio: finalBio });
    if (selectedNeeds.length > 0) await api.updateProfile({ interests: selectedNeeds.join(',') });
    localStorage.setItem('onboarding_done', 'true');
    await refreshUser();
    navigate('/services/new');
  };

  const skipAll = async () => {
    localStorage.setItem('onboarding_done', 'true');
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-white">

      {/* ── STEP 1 — Location ── */}
      {step === 1 && (
        <>
          <StepHeader step={1} title="Where are you?" subtitle="We'll show you services and requests within 500m of your home." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            {/* GPS button */}
            <button onClick={detectLocation} disabled={locating}
              className={`w-full py-4 rounded-2xl text-white text-sm font-bold mb-3 flex items-center justify-center gap-2 transition-all ${cityCoords ? 'bg-[#4a9b6f]' : 'bg-[#1a4731]'} disabled:opacity-60`}>
              {locating ? (
                <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Detecting…</>
              ) : cityCoords ? (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> {city} — GPS saved</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> Use GPS (recommended)</>
              )}
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-gray-300">or type your address</span><div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Address search */}
            <div className="relative mb-1">
              <input value={city} onChange={e => handleCityChange(e.target.value)}
                placeholder="e.g. Tbilisi, Vake or Rue de Hollerich…"
                className="w-full pl-4 pr-8 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4a9b6f] transition-all" />
              {geocoding && <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-block w-3.5 h-3.5 border-2 border-[#4a9b6f]/30 border-t-[#4a9b6f] rounded-full animate-spin" />}
              {citySuggestions.length > 0 && !cityCoords && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                  {citySuggestions.map((s: any, i: number) => (
                    <button key={i} type="button" onClick={() => selectCitySuggestion(s)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#edf7f1] border-b border-gray-50 last:border-0 transition-colors">
                      <p className="font-medium truncate">{s.display_name.split(',').slice(0,2).join(',')}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{s.display_name.split(',').slice(2).join(',').trim()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-6">🔒 Your exact location is never shown to others</p>

            <button onClick={async () => {
              if (city && !cityCoords) await api.updateProfile({ city });
              setStep(2);
            }} disabled={!city.trim()}
              className="w-full py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#1a4731' }}>
              Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
            <button onClick={skipAll} className="w-full text-center text-xs text-gray-300 hover:text-gray-400 mt-3 py-2">Skip for now</button>
          </div>
        </>
      )}

      {/* ── STEP 2 — Provider: skills ── */}
      {step === 2 && (
        <>
          <StepHeader step={2} title="Provider" subtitle="Pick what services you are open to providing." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {SKILL_OPTIONS.map(s => (
                <button key={s.label} onClick={() => toggleSkill(s.label)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selectedSkills.includes(s.label) ? 'border-[#4a9b6f] bg-[#edf7f1]' : 'border-gray-100 bg-gray-50 hover:border-[#4a9b6f]/30'}`}>
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <span className={`text-sm font-medium leading-tight ${selectedSkills.includes(s.label) ? 'text-[#1a4731]' : 'text-gray-600'}`}>{s.label}</span>
                  {selectedSkills.includes(s.label) && (
                    <svg className="w-4 h-4 text-[#4a9b6f] ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-xs text-[#4a9b6f] font-medium text-center mb-4">{selectedSkills.length} selected</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={selectedSkills.length === 0}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
            {selectedSkills.length === 0 && <p className="text-xs text-gray-300 text-center mt-2">Select at least one to continue</p>}
          </div>
        </>
      )}

      {/* ── STEP 3 — Almost there: needs ── */}
      {step === 3 && (
        <>
          <StepHeader step={3} title="Almost there!" subtitle="Pick what services you are open to receiving." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {NEED_OPTIONS.map(s => (
                <button key={s.label} onClick={() => toggleNeed(s.label)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${selectedNeeds.includes(s.label) ? 'border-[#4a9b6f] bg-[#edf7f1]' : 'border-gray-100 bg-gray-50 hover:border-[#4a9b6f]/30'}`}>
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <span className={`text-sm font-medium leading-tight ${selectedNeeds.includes(s.label) ? 'text-[#1a4731]' : 'text-gray-600'}`}>{s.label}</span>
                  {selectedNeeds.includes(s.label) && (
                    <svg className="w-4 h-4 text-[#4a9b6f] ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(4)}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Continue <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 4 — Bio ── */}
      {step === 4 && (
        <>
          <StepHeader step={4} title="Tell us about you" subtitle="A short bio builds trust with your first customers." />
          <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl -mt-4 px-6 pt-7 pb-10 shadow-2xl">
            {/* Skills summary */}
            {selectedSkills.length > 0 && (
              <div className="bg-[#edf7f1] border border-[#4a9b6f]/20 rounded-2xl p-4 mb-5">
                <p className="text-xs font-semibold text-[#1a4731] mb-2">Your skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map(s => (
                    <span key={s} className="text-xs bg-white border border-[#4a9b6f]/30 text-[#1a4731] px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About you</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
              placeholder="e.g. I'm a guitar teacher based in Vake. I also do home repairs and gardening."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm resize-none outline-none focus:ring-2 focus:ring-[#4a9b6f] transition-all mb-4" />

            <div className="bg-[#edf7f1] border border-[#4a9b6f]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <span className="text-xl shrink-0">🎉</span>
              <div>
                <p className="text-sm font-semibold text-[#1a4731] mb-0.5">Almost done!</p>
                <p className="text-xs text-[#4a9b6f] leading-relaxed">Next step: post your first service listing. It takes 2 minutes and you'll start receiving requests straight away.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold hover:border-gray-200 transition-colors">
                ← Back
              </button>
              <button onClick={handleFinish}
                className="flex-[2] py-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: '#1a4731' }}>
                Post my first service →
              </button>
            </div>
            <button onClick={skipAll} className="w-full text-center text-xs text-gray-300 hover:text-gray-400 mt-3 py-2">Skip for now</button>
          </div>
        </>
      )}
    </div>
  );
}
