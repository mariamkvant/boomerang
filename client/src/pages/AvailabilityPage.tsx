import React, { useState, useEffect } from 'react';
import { api } from '../api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}); // 07:00 to 20:30

interface Slot { day_of_week: number; start_time: string; end_time: string; }

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyAvailability().then(s => { setSlots(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const addSlot = (day: number) => {
    setSlots(s => [...s, { day_of_week: day, start_time: '09:00', end_time: '10:00' }]);
    setSaved(false);
  };

  const removeSlot = (idx: number) => {
    setSlots(s => s.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const updateSlot = (idx: number, field: 'start_time' | 'end_time', value: string) => {
    setSlots(s => s.map((slot, i) => i === idx ? { ...slot, [field]: value } : slot));
    setSaved(false);
  };

  const save = async () => {
    try { await api.setMyAvailability(slots); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-2">My Availability</h2>
      <p className="text-gray-500 text-sm mb-6">Set when you're available to provide services. Requesters will book from these time slots.</p>

      <div className="space-y-4">
        {DAYS.map((dayName, dayIdx) => {
          const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter(s => s.day_of_week === dayIdx);
          return (
            <div key={dayIdx} className="bg-white p-5 rounded-xl shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{dayName}</h3>
                <button onClick={() => addSlot(dayIdx)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add slot</button>
              </div>
              {daySlots.length === 0 && <p className="text-xs text-gray-400">No availability set</p>}
              <div className="space-y-2">
                {daySlots.map(s => (
                  <div key={s.idx} className="flex items-center gap-2">
                    <select value={s.start_time} onChange={e => updateSlot(s.idx, 'start_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" aria-label="Start time">
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm">to</span>
                    <select value={s.end_time} onChange={e => updateSlot(s.idx, 'end_time', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" aria-label="End time">
                      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => removeSlot(s.idx)} className="text-red-400 hover:text-red-600 text-sm ml-1" aria-label="Remove slot">✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 hover:shadow-md">Save Availability</button>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
      </div>
    </div>
  );
}
