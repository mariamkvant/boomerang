import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ShareCard from '../components/ShareCard';
import { nativeShare, haptic } from '../utils/platform';

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
  const [hasServices, setHasServices] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pickupDetails, setPickupDetails] = useState('');

  useEffect(() => { api.getService(Number(id)).then(setService).catch(() => {}); api.trackView('service', Number(id)); }, [id]);
  useEffect(() => { if (user) api.isFavorited(Number(id)).then(r => setFavorited(r.favorited)).catch(() => {}); }, [id, user]);
  useEffect(() => {
    if (user) {
      api.getServices(`provider=${user.id}`).then((res: any) => {
        const svcs = Array.isArray(res) ? res : res.services || [];
        setHasServices(svcs.filter((s: any) => s.is_active !== 0).length > 0);
      }).catch(() => {});
    }
  }, [user]);

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
      const res = await api.createRequest({ service_id: Number(id), message, pickup_details: pickupDetails || undefined });
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
          <div className="flex items-center gap-2 ml-auto">
            {user && (
              <button onClick={toggleFavorite} className="text-xl hover:scale-110 transition-transform" aria-label={favorited ? 'Unfavorite' : 'Favorite'}
                onPointerDown={() => haptic('light')}>
                {favorited ? '❤️' : <svg className="w-5 h-5 text-gray-300 hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>}
              </button>
            )}
            {'share' in navigator && (
              <button onClick={() => { haptic('light'); nativeShare({ title: service.title, text: `${service.title} — ${service.points_cost} boomerangs on Boomerang`, url: window.location.href }); }}
                className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Share">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
              </button>
            )}
          </div>
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
              <div className="text-lg font-bold text-gray-700">{service.is_product ? (service.quantity || 1) : service.duration_minutes}</div>
              <div className="text-xs text-gray-500">{service.is_product ? 'available' : 'minutes'}</div>
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
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span>View profile →</span>
                  {service.provider_stats?.completed > 0 && (
                    <span>{Math.round((service.provider_stats.completed / Math.max(1, service.provider_stats.total)) * 100)}% completion</span>
                  )}
                  {service.provider_stats?.avg_hours && Number(service.provider_stats.avg_hours) > 0 && (
                    <span>~{Number(service.provider_stats.avg_hours) < 24 ? Math.round(Number(service.provider_stats.avg_hours)) + 'h' : Math.round(Number(service.provider_stats.avg_hours) / 24) + 'd'} avg</span>
                  )}
                </div>
              </div>
            </Link>
            {user && !isOwner && (
              <Link to={`/messages?to=${service.provider_id}`} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 shrink-0">Message</Link>
            )}
          </div>
        </div>

        {/* Request form */}
        {user && !isOwner && status !== 'success' && !hasServices && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
              <svg className="w-8 h-8 mx-auto text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Offer a service first</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">To request services, you need to offer at least one service. Give first, then get help back!</p>
              <Link to="/services/new" className="inline-block bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Offer a Service</Link>
            </div>
          </div>
        )}
        {user && !isOwner && status !== 'success' && hasServices && (
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
            {service.is_product && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">📍 Pickup / delivery details</label>
                <input type="text" value={pickupDetails} onChange={e => setPickupDetails(e.target.value)}
                  placeholder="e.g. I can pick up in Luxembourg City, or prefer delivery to Kirchberg"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
            )}
            <button onClick={() => setShowConfirm(true)} disabled={requesting}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 font-semibold text-sm disabled:opacity-50 hover:shadow-md">
              {requesting ? 'Sending...' : service.is_product ? `Get item for ${service.points_cost} 🪃` : `Request for ${service.points_cost} 🪃`}
            </button>
            {status && status !== 'success' && <p className="mt-3 text-sm text-red-500">{status}</p>}
          </div>
        )}

        {/* Confirmation bottom sheet */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowConfirm(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h3 className="font-bold text-lg dark:text-white mb-4">Confirm request</h3>
              <div className="bg-gray-50 dark:bg-[#2a3942] rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium dark:text-white text-right max-w-[60%]">{service.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium dark:text-white">{service.provider_name}</span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium dark:text-white">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}{selectedSlot ? ` · ${selectedSlot.start_time}` : ''}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <span className="text-gray-500">Cost</span>
                  <span className="font-bold text-primary-600">{service.points_cost} 🪃</span>
                </div>
                {user && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your balance after</span>
                    <span className={`font-medium ${(user.points - service.points_cost) < 0 ? 'text-red-500' : 'dark:text-white'}`}>{user.points - service.points_cost} 🪃</span>
                  </div>
                )}
              </div>
              {user && user.points < service.points_cost && (
                <p className="text-xs text-red-500 mb-3 text-center">You don't have enough Boomerangs for this request.</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 border border-gray-200 dark:border-gray-600 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50">Cancel</button>
                <button onClick={async () => { setShowConfirm(false); await handleRequest(); }}
                  disabled={requesting || (user ? user.points < service.points_cost : false)}
                  className="flex-1 bg-primary-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
                  {requesting ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
        {status === 'success' && (
          <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🪃</div>
              <p className="font-semibold text-primary-700">Request sent</p>
              <p className="text-sm text-primary-600 mt-1">The provider will review your request. Check your dashboard for updates.</p>
              <div className="flex gap-3 justify-center mt-3">
                <Link to={`/messages?to=${service.provider_id}`} className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">Message {service.provider_name}</Link>
                <Link to="/dashboard" className="text-sm font-medium text-primary-600 hover:underline py-2">Dashboard →</Link>
              </div>
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

      {/* Sticky mobile request bar */}
      {user && !isOwner && status !== 'success' && hasServices && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between z-40 md:hidden safe-area-bottom shadow-lg">
          <div>
            <span className="text-lg font-bold text-primary-700">{service.points_cost}</span>
            <span className="text-xs text-primary-500 ml-1">🪃</span>
          </div>
          <button onClick={() => setShowConfirm(true)}
            className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600">
            Request
          </button>
        </div>
      )}

      {/* Reviews */}
      {service.reviews?.length > 0 && (
        <div className="bg-white dark:bg-[#202c33] p-6 sm:p-8 rounded-2xl shadow-sm mb-6">
          <h3 className="font-bold text-lg dark:text-white mb-5">Reviews ({service.reviews.length})</h3>
          <div className="space-y-4">
            {service.reviews.map((r: any) => (
              <div key={r.id} className="border-b border-gray-50 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                      {r.reviewer_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium dark:text-white">{r.reviewer_name}</span>
                      <div className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                  </div>
                  {user?.id === r.reviewer_id && (
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const newComment = prompt('Edit your review:', r.comment || '');
                        if (newComment !== null) { api.editReview(r.id, { comment: newComment }).then(() => window.location.reload()).catch(() => {}); }
                      }} className="text-[10px] text-primary-500 hover:text-primary-600">Edit</button>
                      <button onClick={async () => { if (confirm('Delete your review?')) { try { await api.deleteReview(r.id); window.location.reload(); } catch {} } }}
                        className="text-[10px] text-gray-400 hover:text-red-500">Delete</button>
                    </div>
                  )}
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 ml-11">{r.comment}</p>}
                {r.image && <img src={r.image} alt="Review photo" className="ml-11 mt-2 rounded-lg max-h-48 object-cover" />}
                {/* Provider reply */}
                {r.provider_reply && (
                  <div className="ml-11 mt-2 bg-gray-50 dark:bg-[#2a3942] rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 mb-1">Provider reply</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.provider_reply}</p>
                  </div>
                )}
                {/* Reply button for provider */}
                {user?.id === service.provider_id && !r.provider_reply && (
                  <button onClick={async () => {
                    const reply = prompt('Reply to this review:');
                    if (reply?.trim()) { try { await api.replyToReview(r.id, reply); window.location.reload(); } catch {} }
                  }} className="text-[10px] text-primary-500 hover:text-primary-600 ml-11 mt-1">Reply</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Services */}
      {service.similar?.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-card">
          <h3 className="font-bold text-lg mb-5">Similar services</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {service.similar.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md group transition-all">
                <h4 className="font-semibold text-sm group-hover:text-primary-600 mb-1">{s.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{s.points_cost} boomerangs · {s.duration_minutes}min</span>
                  {s.avg_rating && <span>⭐ {Number(s.avg_rating).toFixed(1)}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">by {s.provider_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
