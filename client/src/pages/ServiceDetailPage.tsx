import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ShareCard from '../components/ShareCard';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [service, setService] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => { api.getService(Number(id)).then(setService).catch(() => {}); }, [id]);
  useEffect(() => { if (user) api.isFavorited(Number(id)).then(r => setFavorited(r.favorited)).catch(() => {}); }, [id, user]);

  const toggleFavorite = async () => {
    if (favorited) { await api.unfavoriteService(Number(id)); setFavorited(false); }
    else { await api.favoriteService(Number(id)); setFavorited(true); }
  };

  // Load available slots when date changes
  useEffect(() => {
    if (selectedDate && service) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      api.getAvailableSlots(Number(id), selectedDate)
        .then(s => { setAvailableSlots(s); setLoadingSlots(false); })
        .catch(() => { setAvailableSlots([]); setLoadingSlots(false); });
    }
  }, [selectedDate, service]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const res = await api.createRequest({ service_id: Number(id), message });
      // Book the slot if one was selected
      if (selectedSlot && selectedDate) {
        await api.bookSlot({ request_id: res.id, booked_date: selectedDate, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time });
      }
      setStatus('success');
      setMessage('');
    } catch (err: any) { setStatus(err.message); }
    setRequesting(false);
  };

  // Generate next 14 days for date picker
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  if (!service) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
    </div>
  );

  const isOwner = user?.id === service.provider_id;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
        <div className="flex items-center gap-2">
          <Link to="/browse" className="hover:text-primary-600">Browse</Link>
          <span>›</span>
          <span className="text-gray-600">{service.title}</span>
        </div>
        {isOwner && (
          <Link to={`/services/${id}/edit`} className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600">✏️ Edit</Link>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-50 text-sm px-3 py-1.5 rounded-full text-gray-500">{service.category_icon} {service.category_name}</span>
            {service.subcategory_name && <span className="bg-gray-50 text-xs px-2.5 py-1 rounded-full text-gray-400">{service.subcategory_name}</span>}
            {service.multiplier && <span className="text-xs text-primary-500 font-medium">{service.multiplier}x</span>}
          </div>
          {service.avg_rating && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-accent-500">⭐</span>
              <span className="font-semibold">{Number(service.avg_rating).toFixed(1)}</span>
              <span className="text-gray-400">({service.review_count} review{service.review_count !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-3">
          {service.title}
          {user && (
            <button onClick={toggleFavorite} className="text-2xl hover:scale-110 transition-transform" aria-label={favorited ? 'Unfavorite' : 'Favorite'}>
              {favorited ? '❤️' : '🤍'}
            </button>
          )}
          <ShareCard
            title={service.title} description={service.description} points={service.points_cost}
            category={service.category_name} categoryIcon={service.category_icon}
            providerName={service.provider_name} rating={service.avg_rating}
            url={window.location.href}
          />
        </h1>
        <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 bg-primary-50 px-4 py-2.5 rounded-xl">
            <span className="text-lg">🪃</span>
            <div>
              <div className="text-lg font-bold text-primary-700">{service.points_cost}</div>
              <div className="text-xs text-primary-500">boomerangs</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl">
            <span className="text-lg">⏱️</span>
            <div>
              <div className="text-lg font-bold text-gray-700">{service.duration_minutes}</div>
              <div className="text-xs text-gray-500">minutes</div>
            </div>
          </div>
          {service.total_requests > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl">
              <span className="text-lg">📊</span>
              <div>
                <div className="text-lg font-bold text-gray-700">{service.total_completed}/{service.total_requests}</div>
                <div className="text-xs text-gray-500">completed</div>
              </div>
            </div>
          )}
          {service.avg_rating && (
            <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2.5 rounded-xl">
              <span className="text-lg">⭐</span>
              <div>
                <div className="text-lg font-bold text-yellow-700">{Number(service.avg_rating).toFixed(1)}</div>
                <div className="text-xs text-yellow-600">{service.review_count} reviews</div>
              </div>
            </div>
          )}
        </div>

        {/* Provider card */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between">
            <Link to={`/users/${service.provider_id}`} className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {service.provider_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-primary-600">{service.provider_name}</div>
                <div className="text-xs text-gray-400">View profile →</div>
              </div>
            </Link>
            {user && !isOwner && (
              <Link to={`/messages?to=${service.provider_id}`} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 shrink-0">Message</Link>
            )}
          </div>
        </div>

        {/* Request form */}
        {user && !isOwner && status !== 'success' && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="font-semibold mb-3">Request this service</h3>

            {/* Date picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">📅 Pick a date</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map(d => {
                  const date = new Date(d + 'T12:00:00');
                  const dayName = date.toLocaleDateString('en', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const monthName = date.toLocaleDateString('en', { month: 'short' });
                  return (
                    <button key={d} type="button" onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-16 py-2 rounded-xl text-center text-xs font-medium border transition-all ${selectedDate === d ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                      <div>{dayName}</div>
                      <div className="text-lg font-bold">{dayNum}</div>
                      <div>{monthName}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">⏰ Available times</label>
                {loadingSlots ? (
                  <p className="text-xs text-gray-400">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-gray-400">No available slots on this date. Try another day.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((s: any, i: number) => (
                      <button key={i} type="button" onClick={() => setSelectedSlot(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedSlot?.start_time === s.start_time ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
                        {s.start_time} – {s.end_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a message to the provider (optional)..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 h-24 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" aria-label="Request message" />
            <button onClick={handleRequest} disabled={requesting}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 font-semibold text-sm disabled:opacity-50 hover:shadow-md">
              {requesting ? 'Sending...' : `Request for ${service.points_cost} 🪃`}
            </button>
            {status && status !== 'success' && <p className="mt-3 text-sm text-red-500">{status}</p>}
          </div>
        )}
        {status === 'success' && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🪃</div>
              <p className="font-semibold text-primary-700">Request sent</p>
              <p className="text-sm text-primary-600 mt-1">The provider will review your request. Check your dashboard for updates.</p>
              <Link to="/dashboard" className="inline-block mt-3 text-sm font-medium text-primary-600 hover:underline">Go to Dashboard →</Link>
            </div>
          </div>
        )}
        {!user && (
          <div className="border-t border-gray-100 pt-6 mt-6 text-center">
            <p className="text-gray-500 text-sm mb-3">Want to request this service?</p>
            <Link to="/login" className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Log in to request</Link>
          </div>
        )}
      </div>

      {/* Reviews */}
      {service.reviews?.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-card">
          <h3 className="font-bold text-lg mb-5">Reviews ({service.reviews.length})</h3>
          <div className="space-y-4">
            {service.reviews.map((r: any) => (
              <div key={r.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-500">
                    {r.reviewer_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{r.reviewer_name}</span>
                    <div className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600 ml-11">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
