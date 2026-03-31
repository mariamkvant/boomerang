import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const SKILL_OPTIONS = [
  { icon: '🌱', label: 'Gardening', cat: 'Gardening' },
  { icon: '🎸', label: 'Music', cat: 'Music' },
  { icon: '🍳', label: 'Cooking', cat: 'Cooking' },
  { icon: '💻', label: 'Tech Help', cat: 'Tech Help' },
  { icon: '🔧', label: 'Home Repair', cat: 'Home Repair' },
  { icon: '🏸', label: 'Sports', cat: 'Sports & Fitness' },
  { icon: '📚', label: 'Tutoring', cat: 'Tutoring' },
  { icon: '🗣️', label: 'Languages', cat: 'Languages' },
  { icon: '🐕', label: 'Pet Care', cat: 'Pet Care' },
  { icon: '🎨', label: 'Arts & Crafts', cat: 'Arts & Crafts' },
  { icon: '🧘', label: 'Wellness', cat: 'Health & Wellness' },
  { icon: '💼', label: 'Business', cat: 'Business & Career' },
  { icon: '🧹', label: 'Cleaning', cat: 'Cleaning' },
  { icon: '🚗', label: 'Transport', cat: 'Transportation' },
  { icon: '💜', label: 'Listening', cat: 'Listening & Support' },
  { icon: '✨', label: 'Other', cat: 'Other' },
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
];

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bio, setBio] = useState('');

  useEffect(() => { api.getCategories().then(setCategories).catch(() => {}); }, []);

  const toggleSkill = (s: string) => setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleNeed = (s: string) => setSelectedNeeds(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleFinish = async () => {
    // Save bio
    if (bio) await api.updateProfile({ bio });
    // Auto-create services for selected skills
    for (const skillLabel of selectedSkills) {
      const skill = SKILL_OPTIONS.find(s => s.label === skillLabel);
      if (skill) {
        const cat = categories.find((c: any) => c.name === skill.cat);
        if (cat) {
          try {
            await api.createService({ title: `I can help with ${skill.label}`, description: `I'm offering my ${skill.label.toLowerCase()} skills to the community.`, category_id: cat.id, points_cost: 10, duration_minutes: 60 });
          } catch {}
        }
      }
    }
    localStorage.setItem('onboarding_done', 'true');
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="max-w-lg mx-auto mt-8 animate-fade-in">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1,2,3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-primary-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">What are you good at? 🎯</h2>
          <p className="text-gray-500 text-sm mb-6">Tap all that apply. We'll create your first service listings.</p>
          <div className="grid grid-cols-2 gap-3">
            {SKILL_OPTIONS.map(s => (
              <button key={s.label} onClick={() => toggleSkill(s.label)}
                className={`p-4 rounded-xl text-left border-2 transition-all ${selectedSkills.includes(s.label) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}>
                <span className="text-2xl">{s.icon}</span>
                <div className="text-sm font-medium mt-1">{s.label}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={selectedSkills.length === 0}
            className="w-full mt-6 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50">
            Next →
          </button>
          <button onClick={() => { localStorage.setItem('onboarding_done', 'true'); navigate('/dashboard'); }}
            className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2">Skip for now</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">What do you need help with? 🆘</h2>
          <p className="text-gray-500 text-sm mb-6">This helps us match you with the right people.</p>
          <div className="grid grid-cols-2 gap-3">
            {NEED_OPTIONS.map(s => (
              <button key={s.label} onClick={() => toggleNeed(s.label)}
                className={`p-4 rounded-xl text-left border-2 transition-all ${selectedNeeds.includes(s.label) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'}`}>
                <span className="text-2xl">{s.icon}</span>
                <div className="text-sm font-medium mt-1">{s.label}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-medium text-gray-600">← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600">Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Tell people about yourself ✨</h2>
          <p className="text-gray-500 text-sm mb-6">A short bio helps build trust.</p>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="e.g. I'm a guitar teacher who loves gardening. Always happy to help neighbors!"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none mb-4" />
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-primary-700 font-medium">🎉 You're all set!</p>
            <p className="text-xs text-primary-600 mt-1">We'll create {selectedSkills.length} service listing{selectedSkills.length !== 1 ? 's' : ''} for you.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-medium text-gray-600">← Back</button>
            <button onClick={handleFinish} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600">🪃 Start Boomeranging</button>
          </div>
        </div>
      )}
    </div>
  );
}
