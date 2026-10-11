import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}); // 07:00 to 20:30

interface Slot { day_of_week: number; start_time: string; end_time: string; }

export default function ServiceHoursPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [service, setService] = useState<any>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getService(Number(id)),
      api.getServiceAvailability(Number(id)),
    ]).then(([svc, avail]) => {
      setService(svc);
      setSlots(Array.isArray(avail) ? avail : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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
    if (!id) return;
    // Validate end > start
    for (const s of slots) {
      if (s.end_time <= s.start_time) {
        toast(`End time must be after start time (${s.start_time} → ${s.end_time})`, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      await api.setServiceAvailability(Number(id), slots);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast('Hours saved!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!service) return <div className="text-center py-20 text-gray-400">Service not found</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-fade-in pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold dark:text-white">Available Hours</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{service.title}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202c33] border border-gray-100 dark:border-gray-700 rounded-2xl p-5 mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Set the days and times you're available for this service. Buyers will see these as bookable slots on the service calendar.
        </p>

        {/* Quick add per day */}
        <div className="space-y-4">
          {DAYS.map((dayName, dayIdx) => {
            const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter(s => s.day_of_week === dayIdx);
            return (
              <div key={dayIdx} className="bg-gray-50 dark:bg-[#2a3942] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm dark:text-white">{dayName}</h3>
                  <button onClick={() => addSlot(dayIdx)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Add slot</button>
                </div>
                {daySlots.length === 0 && (
                  <p className="text-xs text-gray-400">Not available</p>
                )}
                <div className="space-y-2">
                  {daySlots.map(s => (
                    <div key={s.idx} className="flex items-center gap-2 flex-wrap">
                      <select value={s.start_time} onChange={e => updateSlot(s.idx, 'start_time', e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none dark:bg-[#202c33] dark:text-white" aria-label="Start time">
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm">to</span>
                      <select value={s.end_time} onChange={e => updateSlot(s.idx, 'end_time', e.target.value)}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none dark:bg-[#202c33] dark:text-white" aria-label="End time">
                        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button onClick={() => removeSlot(s.idx)}
                        className="text-red-400 hover:text-red-600 text-sm" aria-label="Remove">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <Link to={`/services/${id}`} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
          View service →
        </Link>
      </div>
    </div>
  );
}
