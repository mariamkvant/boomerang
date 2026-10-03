import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import ShareCard from '../components/ShareCard';
import { nativeShare, haptic } from '../utils/platform';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtEur(v: number | string | null | undefined, currency?: string): string {
  const n = parseFloat(String(v ?? 0));
  const symbol = currency === 'gel' ? '₾' : '€';
  return `${symbol}${(n % 1 === 0 ? n.toFixed(0) : n.toFixed(2))}`;
}

// ── tiny inline modal so we can replace window.prompt / window.confirm ────────
function InlineModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="font-bold text-base dark:text-white mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ── component ────────────────────────────────────────────────────────────────
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
  const [providerConnectStatus, setProviderConnectStatus] = useState<'unknown' | 'ok' | 'not_connected' | 'not_active'>('unknown');
  const [hasServices, setHasServices] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pickupDetails, setPickupDetails] = useState('');

  // Stripe Elements state — card input lives inside the confirm sheet
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [cardReady, setCardReady] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const cardMountRef = useRef<HTMLDivElement>(null);

  // Review modals (replacing window.prompt / window.confirm)
  const [editReview, setEditReview] = useState<{ id: number; comment: string } | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const [replyReview, setReplyReview] = useState<{ id: number } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  useEffect(() => {
    api.getService(Number(id)).then(setService).catch(() => {});
    api.trackView('service', Number(id));
  }, [id]);

  useEffect(() => {
    // Check if provider can receive payments (has active Stripe Connect account)
    // Only relevant for paid services — fetch provider's public profile which includes stripe_account_status
    if (service && service.price_eur && user && user.id !== service.provider_id) {
      api.getUser(service.provider_id).then((p: any) => {
        if (!p.stripe_account_id) setProviderConnectStatus('not_connected');
        else if (p.stripe_account_status !== 'active') setProviderConnectStatus('not_active');
        else setProviderConnectStatus('ok');
      }).catch(() => setProviderConnectStatus('unknown'));
    } else {
      setProviderConnectStatus('ok');
    }
  }, [service, user]);

  useEffect(() => {
    if (user) api.isFavorited(Number(id)).then(r => setFavorited(r.favorited)).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (user) {
      api.getServices(`provider=${user.id}`).then((res: any) => {
        const svcs = Array.isArray(res) ? res : res.services || [];
        setHasServices(svcs.filter((s: any) => s.is_active !== 0).length > 0);
      }).catch(() => {});
    }
  }, [user]);

  // Load Stripe.js once (no npm install — CDN script)
  useEffect(() => {
    if ((window as any).Stripe) { setStripeInstance((window as any).Stripe()); return; }
    api.getStripePublishableKey().then((r: any) => {
      if (!r.key) return;
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => setStripeInstance((window as any).Stripe(r.key));
      document.head.appendChild(script);
    }).catch(() => {});
  }, []);

  // Mount CardElement when confirm sheet opens and service has a EUR price
  useEffect(() => {
    if (!showConfirm || !stripeInstance || !priceEurRef.current) return;
    if (cardElement) return; // already mounted
    // Small delay so the sheet is fully rendered before mounting
    const t = setTimeout(() => {
      if (!cardMountRef.current) return;
      const elements = stripeInstance.elements();
      const card = elements.create('card', {
        style: {
          base: { fontSize: '15px', color: '#1f2937', '::placeholder': { color: '#9ca3af' }, fontFamily: 'system-ui, sans-serif' },
          invalid: { color: '#ef4444' },
        },
        hidePostalCode: true,
      });
      card.mount(cardMountRef.current);
      card.on('change', (e: any) => { setPaymentError(e.error?.message || ''); setCardReady(e.complete); });
      setCardElement(card);
    }, 80);
    return () => clearTimeout(t);
  }, [showConfirm, stripeInstance]);

  // Cleanup card element when sheet closes
  useEffect(() => {
    if (!showConfirm && cardElement) {
      cardElement.destroy();
      setCardElement(null);
      setCardReady(false);
      setPaymentError('');
    }
  }, [showConfirm]);

  const toggleFavorite = async () => {
    if (favorited) { await api.unfavoriteService(Number(id)); setFavorited(false); }
    else { await api.favoriteService(Number(id)); setFavorited(true); }
  };

  useEffect(() => {
    if (selectedDate && service) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      api.getAvailableSlots(Number(id), selectedDate)
        .then(s => { setAvailableSlots(s); setLoadingSlots(false); })
        .catch(() => { setAvailableSlots([]); setLoadingSlots(false); });
    }
  }, [selectedDate, service]);

  // Ref so Stripe effects can read latest priceEur without stale closure issues
  const priceEurRef = useRef<number | null>(null);

  const handleRequest = async () => {
    setRequesting(true);
    setPaymentError('');
    try {
      // Step 1: Create the request record
      const res = await api.createRequest({ service_id: Number(id), message, pickup_details: pickupDetails || undefined });

      if (selectedSlot && selectedDate) {
        await api.bookSlot({ request_id: res.id, booked_date: selectedDate, start_time: selectedSlot.start_time, end_time: selectedSlot.end_time });
      }

      // Step 2: If service has EUR price, authorise card (Vinted-style hold)
      if (priceEurRef.current && res.requires_payment) {
        const intentRes: any = await api.createServiceIntent(res.id);

        if (!stripeInstance || !cardElement) {
          setStatus('Payment setup error. Please refresh and try again.');
          setRequesting(false);
          return;
        }

        // Step 3: Stripe authorises the card but does NOT charge yet — escrow hold
        const { error, paymentIntent } = await stripeInstance.confirmCardPayment(
          intentRes.client_secret,
          { payment_method: { card: cardElement } },
        );

        if (error) {
          setPaymentError(error.message || 'Card declined. Please try another card.');
          setRequesting(false);
          return;
        }
        // paymentIntent.status === 'requires_capture' — money held, not moved
        console.log('[PAYMENT] Held in escrow:', paymentIntent.id);
      }

      setStatus('success');
      setMessage('');
    } catch (err: any) { setStatus(err.message); }
    setRequesting(false);
  };

  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  if (!service) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );

  const isOwner = user?.id === service.provider_id;
  const priceEur: number | null = service.price_eur != null ? parseFloat(service.price_eur) : null;
  // Keep ref in sync so async Stripe callbacks see the current value
  priceEurRef.current = priceEur;
  const currency: string = service.currency || 'eur';
  const platformFee = priceEur != null ? Math.round(priceEur * 0.20 * 100) / 100 : null;
  const providerGets = priceEur != null && platformFee != null ? Math.round((priceEur - platformFee) * 100) / 100 : null;
  const displayPrice = priceEur != null ? fmtEur(priceEur, currency) : `${service.points_cost ?? '?'} pts`;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-40 md:pb-8">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500 mb-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to="/browse" className="hover:text-primary-600 flex items-center gap-1 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Browse
          </Link>
          {service.category_name && (<><span>›</span><Link to={`/browse?category=${service.category_id}`} className="hover:text-primary-600 shrink-0">{service.category_name}</Link></>)}
          <span>›</span>
          <span className="text-gray-600 dark:text-gray-300 truncate">{service.title}</span>
        </div>
        {isOwner && (
          <Link to={`/services/${id}/edit`} className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-600 shrink-0 ml-2">Edit</Link>
        )}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-[#202c33] p-4 sm:p-8 rounded-2xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-gray-50 dark:bg-gray-800 text-sm px-3 py-1.5 rounded-full text-gray-500 dark:text-gray-400">{service.category_icon} {service.category_name}</span>
            {service.subcategory_name && <span className="bg-gray-50 dark:bg-gray-800 text-xs px-2.5 py-1 rounded-full text-gray-400">{service.subcategory_name}</span>}
          </div>
          {service.avg_rating && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold dark:text-white">{Number(service.avg_rating).toFixed(1)}</span>
              <span className="text-gray-400">({service.review_count})</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3 dark:text-white flex items-center gap-3">
          {service.title}
          <div className="flex items-center gap-2 ml-auto">
            {user && (
              <button onClick={toggleFavorite} className="text-xl hover:scale-110 transition-transform" aria-label={favorited ? 'Unfavorite' : 'Favorite'}
                onPointerDown={() => haptic('light')}>
                {favorited
                  ? <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                  : <svg className="w-5 h-5 text-gray-300 hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                }
              </button>
            )}
            {'share' in navigator && (
              <button onClick={() => { haptic('light'); nativeShare({ title: service.title, text: `${service.title} — ${displayPrice} on Boomerang`, url: window.location.href }); }}
                className="text-gray-400 hover:text-primary-500 transition-colors" aria-label="Share">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>
              </button>
            )}
          </div>
        </h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{service.description}</p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Price badge */}
          <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-4 py-2.5 rounded-xl">
            <div>
              <div className="text-xl font-bold text-primary-700 dark:text-primary-400">{displayPrice}</div>
              <div className="text-xs text-primary-500">{priceEur != null ? 'per session' : 'boomerangs'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 rounded-xl">
            <div>
              <div className="text-lg font-bold text-gray-700 dark:text-white">{service.is_product ? (service.quantity || 1) : service.duration_minutes}</div>
              <div className="text-xs text-gray-500">{service.is_product ? 'available' : 'minutes'}</div>
            </div>
          </div>
          {service.total_requests > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 rounded-xl">
              <div>
                <div className="text-lg font-bold text-gray-700 dark:text-white">{service.total_completed}/{service.total_requests}</div>
                <div className="text-xs text-gray-500">completed</div>
              </div>
            </div>
          )}
          {service.avg_rating && (
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2.5 rounded-xl">
              <div>
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{Number(service.avg_rating).toFixed(1)}</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500">{service.review_count} review{service.review_count !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </div>

        {/* Provider card */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between">
            <Link to={`/users/${service.provider_id}`} className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                {service.provider_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">{service.provider_name}</div>
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
              <Link to={`/messages?to=${service.provider_id}`} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 shrink-0">Message</Link>
            )}
          </div>
        </div>

        {/* ── No price set — old service ── */}
        {user && !isOwner && status !== 'success' && priceEur == null && service.points_cost > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Price not set yet</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">This service hasn't been updated with a price. Message the provider directly to arrange payment.</p>
              <Link to={`/messages?to=${service.provider_id}`} className="inline-block mt-3 text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Message {service.provider_name}</Link>
            </div>
          </div>
        )}

        {/* ── Provider not on Stripe Connect — can't take payment ── */}
        {user && !isOwner && status !== 'success' && priceEur != null && providerConnectStatus === 'not_connected' && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Provider hasn't set up payouts yet</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">This provider hasn't connected their bank account yet so can't accept payments. You can message them to let them know.</p>
              <Link to={`/messages?to=${service.provider_id}`} className="inline-block mt-3 text-sm font-medium bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600">Message {service.provider_name}</Link>
            </div>
          </div>
        )}

        {/* ── Provider Connect pending verification ── */}
        {user && !isOwner && status !== 'success' && priceEur != null && providerConnectStatus === 'not_active' && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Payout account pending verification</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">The provider's payment account is being verified by Stripe. Payment will be available once approved — check back shortly.</p>
            </div>
          </div>
        )}

        {/* ── Request gate: no services ── */}
        {user && !isOwner && status !== 'success' && !hasServices && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-center">
              <svg className="w-8 h-8 mx-auto text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Offer a service first</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">To request services, you need to offer at least one service. Give first, then get help back!</p>
              <Link to="/services/new" className="inline-block bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Offer a Service</Link>
            </div>
          </div>
        )}

        {/* ── Request form ── */}
        {user && !isOwner && status !== 'success' && hasServices && priceEur != null && providerConnectStatus === 'ok' && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm dark:text-white">Request this service</h3>
              <button type="button" onClick={() => setMessage(`Hi ${service.provider_name}, I'd like to request "${service.title}". When would work for you?`)}
                className="text-xs text-primary-500 hover:text-primary-600 font-medium">Use template</button>
            </div>

            {/* Date picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pick a date</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map(d => {
                  const date = new Date(d + 'T12:00:00');
                  return (
                    <button key={d} type="button" onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 w-16 py-2 rounded-xl text-center text-xs font-medium border transition-all ${selectedDate === d ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
                      <div>{date.toLocaleDateString('en', { weekday: 'short' })}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      <div>{date.toLocaleDateString('en', { month: 'short' })}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available times</label>
                {loadingSlots ? (
                  <p className="text-xs text-gray-400">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-xs text-gray-400">No available slots on this date. Try another day.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((s: any, i: number) => (
                      <button key={i} type="button" onClick={() => setSelectedSlot(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedSlot?.start_time === s.start_time ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-[#2a3942] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300'}`}>
                        {s.start_time} – {s.end_time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Add a message to the provider (optional)..."
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm mb-3 h-24 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white"
              aria-label="Request message" />

            {service.is_product && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pickup / delivery details</label>
                <input type="text" value={pickupDetails} onChange={e => setPickupDetails(e.target.value)}
                  placeholder="e.g. I can pick up in Luxembourg City, or prefer delivery to Kirchberg"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-[#2a3942] dark:text-white" />
              </div>
            )}

            <button onClick={() => setShowConfirm(true)} disabled={requesting}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 font-semibold text-sm disabled:opacity-50 hover:shadow-md">
              {requesting ? 'Sending...' : `Request for ${displayPrice}`}
            </button>
            {status && status !== 'success' && <p className="mt-3 text-sm text-red-500">{status}</p>}
          </div>
        )}

        {/* ── Confirm bottom sheet ── */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowConfirm(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white dark:bg-[#202c33] rounded-t-2xl w-full max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-5" />
              <h3 className="font-bold text-lg dark:text-white mb-4">Confirm request</h3>

              <div className="bg-gray-50 dark:bg-[#2a3942] rounded-xl p-4 mb-4 space-y-2.5">
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
                    <span className="font-medium dark:text-white">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {selectedSlot ? ` · ${selectedSlot.start_time}` : ''}
                    </span>
                  </div>
                )}

                {/* EUR price breakdown */}
                {priceEur != null ? (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Service price</span>
                        <span className="font-bold text-primary-600">{fmtEur(priceEur, currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Platform fee (20%)</span>
                        <span>−{fmtEur(platformFee!, currency)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Provider receives</span>
                        <span className="text-green-600 font-medium">{fmtEur(providerGets!, currency)}</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-2.5 mt-1">
                      <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                        🔒 Your card is authorised but <strong>not charged</strong> until you confirm the service was delivered.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <span className="text-gray-500">Cost</span>
                    <span className="font-bold text-primary-600">{service.points_cost} 🪃</span>
                  </div>
                )}
              </div>

              {/* ── Stripe CardElement — only shown for paid services ── */}
              {priceEur != null && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Card details</label>
                  <div
                    ref={cardMountRef}
                    className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3.5 bg-white dark:bg-[#2a3942] min-h-[46px]"
                  />
                  {paymentError && (
                    <p className="text-xs text-red-500 mt-1.5">{paymentError}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a11 11 0 1 0 0 22A11 11 0 0 0 12 1zm0 2a9 9 0 1 1 0 18A9 9 0 0 1 12 3zm-.5 4v5.5l4.3 2.5.7-1.2-3.5-2V7h-1.5z"/></svg>
                    <p className="text-[10px] text-gray-300 dark:text-gray-600">Secured by Stripe · card not charged until delivery confirmed</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a3942]">
                  Cancel
                </button>
                <button
                  onClick={handleRequest}
                  disabled={requesting || (priceEur != null && !cardReady)}
                  className="flex-1 bg-[#1f2937] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {requesting ? (
                    <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
                  ) : priceEur != null ? (
                    <>Confirm & Hold {fmtEur(priceEur, currency)}</>
                  ) : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Success state ── */}
        {status === 'success' && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-semibold text-primary-700 dark:text-primary-400">Request sent!</p>
              <p className="text-sm text-primary-600 dark:text-primary-300 mt-1">
                {priceEur != null
                  ? `The provider will review your request. Payment of ${fmtEur(priceEur, currency)} is held securely until you confirm delivery.`
                  : 'The provider will review your request. Check your dashboard for updates.'}
              </p>
              <div className="flex gap-3 justify-center mt-3">
                <Link to={`/messages?to=${service.provider_id}`} className="text-sm font-medium bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600">Message {service.provider_name}</Link>
                <Link to="/dashboard" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline py-2">Dashboard →</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Not logged in ── */}
        {!user && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6 text-center">
            <p className="text-gray-500 text-sm mb-3">Want to request this service?</p>
            <Link to="/login" className="inline-block bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-600">Log in to request</Link>
          </div>
        )}
      </div>

      {/* ── Sticky mobile request bar ── */}
      {user && !isOwner && status !== 'success' && hasServices && priceEur != null && providerConnectStatus === 'ok' && (
        <div className="fixed left-0 right-0 bg-white dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between z-40 md:hidden shadow-lg"
          style={{ bottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
          <div>
            <span className="text-lg font-bold text-primary-700 dark:text-primary-400">{displayPrice}</span>
          </div>
          <button onClick={() => setShowConfirm(true)} className="bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-600">
            Request
          </button>
        </div>
      )}

      {/* ── Reviews ── */}
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
                  {/* Edit / Delete — own review — now uses modal instead of window.prompt */}
                  {user?.id === r.reviewer_id && (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditReview({ id: r.id, comment: r.comment || '' }); setEditReviewText(r.comment || ''); }}
                        className="text-[10px] text-primary-500 hover:text-primary-600">Edit</button>
                      <button onClick={() => setDeleteReviewId(r.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500">Delete</button>
                    </div>
                  )}
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 ml-11">{r.comment}</p>}
                {r.image && <img src={r.image} alt="Review photo" loading="lazy" className="ml-11 mt-2 rounded-lg max-h-48 object-cover" />}
                {r.provider_reply && (
                  <div className="ml-11 mt-2 bg-gray-50 dark:bg-[#2a3942] rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 mb-1">Provider reply</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{r.provider_reply}</p>
                  </div>
                )}
                {/* Provider reply button — uses modal */}
                {user?.id === service.provider_id && !r.provider_reply && (
                  <button onClick={() => { setReplyReview({ id: r.id }); setReplyText(''); }}
                    className="text-[10px] text-primary-500 hover:text-primary-600 ml-11 mt-1">Reply</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Similar services ── */}
      {service.similar?.length > 0 && (
        <div className="bg-white dark:bg-[#202c33] p-8 rounded-2xl shadow-sm mb-6">
          <h3 className="font-bold text-lg dark:text-white mb-5">Similar services</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {service.similar.map((s: any) => (
              <Link key={s.id} to={`/services/${s.id}`} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 hover:shadow-md group transition-all">
                <h4 className="font-semibold text-sm dark:text-white group-hover:text-primary-600 mb-1">{s.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {s.price_eur != null ? fmtEur(s.price_eur, s.currency) : `${s.points_cost} 🪃`}
                    {!s.price_eur && s.duration_minutes ? ` · ${s.duration_minutes}min` : ''}
                  </span>
                  {s.avg_rating && <span>★ {Number(s.avg_rating).toFixed(1)}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">by {s.provider_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Review edit modal ── */}
      {editReview && (
        <InlineModal title="Edit your review" onClose={() => setEditReview(null)}>
          <textarea value={editReviewText} onChange={e => setEditReviewText(e.target.value)} rows={3}
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none outline-none dark:bg-[#2a3942] dark:text-white mb-4" />
          <div className="flex gap-3">
            <button onClick={() => setEditReview(null)}
              className="flex-1 border border-gray-200 dark:border-gray-600 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300">Cancel</button>
            <button disabled={reviewActionLoading} onClick={async () => {
              setReviewActionLoading(true);
              await api.editReview(editReview.id, { comment: editReviewText }).catch(() => {});
              setReviewActionLoading(false);
              setEditReview(null);
              api.getService(Number(id)).then(setService).catch(() => {});
            }} className="flex-1 bg-[#1f2937] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {reviewActionLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </InlineModal>
      )}

      {/* ── Review delete confirm modal ── */}
      {deleteReviewId != null && (
        <InlineModal title="Delete review?" onClose={() => setDeleteReviewId(null)}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This can't be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteReviewId(null)}
              className="flex-1 border border-gray-200 dark:border-gray-600 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300">Cancel</button>
            <button disabled={reviewActionLoading} onClick={async () => {
              setReviewActionLoading(true);
              await api.deleteReview(deleteReviewId).catch(() => {});
              setReviewActionLoading(false);
              setDeleteReviewId(null);
              api.getService(Number(id)).then(setService).catch(() => {});
            }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {reviewActionLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </InlineModal>
      )}

      {/* ── Provider reply modal ── */}
      {replyReview && (
        <InlineModal title="Reply to review" onClose={() => setReplyReview(null)}>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} placeholder="Write your reply..."
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm resize-none outline-none dark:bg-[#2a3942] dark:text-white mb-4" />
          <div className="flex gap-3">
            <button onClick={() => setReplyReview(null)}
              className="flex-1 border border-gray-200 dark:border-gray-600 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300">Cancel</button>
            <button disabled={reviewActionLoading || !replyText.trim()} onClick={async () => {
              setReviewActionLoading(true);
              await api.replyToReview(replyReview.id, replyText).catch(() => {});
              setReviewActionLoading(false);
              setReplyReview(null);
              api.getService(Number(id)).then(setService).catch(() => {});
            }} className="flex-1 bg-[#1f2937] text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {reviewActionLoading ? 'Posting...' : 'Post reply'}
            </button>
          </div>
        </InlineModal>
      )}
    </div>
  );
}
