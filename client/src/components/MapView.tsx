import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Service {
  id: number;
  title: string;
  points_cost: number;
  price_eur?: number | null;
  currency?: string;
  category_icon?: string;
  category_name?: string;
  provider_name?: string;
  provider_id?: number;
  provider_user_id?: number;
  provider_city?: string;
  provider_latitude?: number;
  provider_longitude?: number;
  avg_rating?: number | null;
  review_count?: number;
  service_latitude?: number | null;
  service_longitude?: number | null;
}

interface MapViewProps {
  services: Service[];
  userLat?: number | null;
  userLng?: number | null;
  radiusKm?: number;
}

function fmtPrice(s: Service): string {
  if (s.price_eur != null && Number(s.price_eur) > 0) {
    const sym = s.currency === 'gel' ? '₾' : '€';
    const n = Number(s.price_eur);
    return `${sym}${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
  }
  return 'Contact provider';
}

function stars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// Build the rich popup HTML for a provider's pin
function buildPopupHtml(providerName: string, svcs: Service[]): string {
  const first = svcs[0];
  const avgRating = first.avg_rating ? Number(first.avg_rating) : null;
  const initial = (providerName || '?').charAt(0).toUpperCase();

  const servicesHtml = svcs.slice(0, 4).map(s => `
    <a href="/services/${s.id}" style="
      display:flex; align-items:center; justify-content:space-between;
      padding:7px 0; border-bottom:1px solid #f3f4f6; text-decoration:none; gap:8px;
    ">
      <span style="font-size:12px; color:#111827; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${s.category_icon || ''} ${s.title}
      </span>
      <span style="font-size:12px; font-weight:700; color:#f97316; white-space:nowrap; flex-shrink:0;">
        ${fmtPrice(s)}
      </span>
    </a>
  `).join('');

  const moreCount = svcs.length > 4 ? svcs.length - 4 : 0;

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif; min-width:220px; max-width:280px;">
      <!-- Provider header -->
      <a href="/users/${first.provider_id || first.provider_user_id}" style="
        display:flex; align-items:center; gap:10px; padding-bottom:10px;
        border-bottom:2px solid #f3f4f6; margin-bottom:8px; text-decoration:none;
      ">
        <div style="
          width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#f97316,#ea580c);
          display:flex; align-items:center; justify-content:center;
          color:white; font-size:15px; font-weight:700; flex-shrink:0;
        ">${initial}</div>
        <div style="min-width:0; flex:1;">
          <div style="font-size:14px; font-weight:700; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${providerName}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            ${avgRating != null ? `
              <span style="font-size:11px; color:#f59e0b;">${stars(avgRating)}</span>
              <span style="font-size:11px; color:#6b7280;">${avgRating.toFixed(1)} (${first.review_count || 0})</span>
            ` : `<span style="font-size:11px; color:#9ca3af;">No reviews yet</span>`}
          </div>
          ${first.provider_city ? `<div style="font-size:11px; color:#9ca3af; margin-top:1px;">📍 ${first.provider_city}</div>` : ''}
        </div>
      </a>
      <!-- Services list -->
      <div style="margin-bottom:${moreCount ? '4px' : '8px'};">
        ${servicesHtml}
      </div>
      ${moreCount ? `<div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">+${moreCount} more service${moreCount > 1 ? 's' : ''}</div>` : ''}
      <!-- CTA -->
      <a href="/users/${first.provider_id || first.provider_user_id}" style="
        display:block; text-align:center; background:#1f2937; color:white;
        padding:8px; border-radius:8px; font-size:12px; font-weight:600; text-decoration:none;
        margin-top:4px;
      ">View profile →</a>
    </div>
  `;
}

// Custom SVG pin marker — orange for providers, blue pulse for user
function makeProviderIcon(count: number): L.DivIcon {
  const badge = count > 1 ? `<div style="
    position:absolute; top:-4px; right:-4px;
    background:#f97316; color:white; border-radius:50%;
    width:16px; height:16px; font-size:9px; font-weight:700;
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid white; line-height:1;
  ">${count}</div>` : '';

  return L.divIcon({
    html: `<div style="position:relative; display:inline-block;">
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="#1f2937"/>
        <circle cx="15" cy="14" r="7" fill="white" fill-opacity="0.95"/>
        <text x="15" y="18" text-anchor="middle" font-size="9" fill="#1f2937" font-weight="700" font-family="system-ui">★</text>
      </svg>
      ${badge}
    </div>`,
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -40],
  });
}

function makeUserIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:16px; height:16px; border-radius:50%;
      background:#3b82f6; border:3px solid white;
      box-shadow:0 0 0 3px rgba(59,130,246,0.35);
    "></div>`,
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView({ services, userLat, userLng, radiusKm = 5 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Destroy previous instance cleanly
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Default center: user location > service centroid > Luxembourg
    let center: [number, number] = [49.6, 6.13];
    if (userLat && userLng) center = [userLat, userLng];

    const map = L.map(mapRef.current, {
      center, zoom: 13,
      zoomControl: false,
    });
    mapInstance.current = map;

    // Zoom control — top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tile layer — OpenStreetMap (free, no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // User location marker
    if (userLat && userLng) {
      L.marker([userLat, userLng], { icon: makeUserIcon() })
        .addTo(map)
        .bindTooltip('You', { permanent: false, direction: 'top', className: 'leaflet-tooltip-clean' });

      // Radius circle around user (matches selected radius filter)
      L.circle([userLat, userLng], {
        radius: (radiusKm > 0 ? radiusKm : 5) * 1000, color: '#3b82f6', fillColor: '#3b82f6',
        fillOpacity: 0.06, weight: 1.5, dashArray: '4 4',
      }).addTo(map);
    }

    // Group services by provider location
    const providerMap = new Map<string, { lat: number; lng: number; name: string; services: Service[] }>();
    for (const s of services) {
      const lat = s.service_latitude ?? s.provider_latitude;
      const lng = s.service_longitude ?? s.provider_longitude;
      if (!lat || !lng) continue;
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (!providerMap.has(key)) {
        providerMap.set(key, { lat, lng, name: s.provider_name || 'Provider', services: [] });
      }
      providerMap.get(key)!.services.push(s);
    }

    const allPoints: L.LatLng[] = [];
    if (userLat && userLng) allPoints.push(L.latLng(userLat, userLng));

    providerMap.forEach(({ lat, lng, name, services: svcs }) => {
      allPoints.push(L.latLng(lat, lng));
      const marker = L.marker([lat, lng], { icon: makeProviderIcon(svcs.length) });
      marker.addTo(map).bindPopup(buildPopupHtml(name, svcs), {
        maxWidth: 300,
        minWidth: 240,
        autoPan: true,
        closeButton: true,
        className: 'boomerang-popup',
      });
    });

    // Fit bounds to show everything
    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 15 });
    } else if (allPoints.length === 1) {
      map.setView(allPoints[0], 14);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [services, userLat, userLng, radiusKm]);

  return (
    <>
      {/* Inject popup styles — scoped so they don't leak */}
      <style>{`
        .boomerang-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          padding: 0 !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          border: none !important;
          overflow: hidden;
        }
        .boomerang-popup .leaflet-popup-content {
          margin: 14px !important;
        }
        .boomerang-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .leaflet-tooltip-clean {
          background: #1f2937;
          color: white;
          border: none;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          padding: 2px 6px;
        }
        .leaflet-tooltip-clean::before { display: none; }
      `}</style>
      <div ref={mapRef} className="w-full rounded-2xl overflow-hidden" style={{ height: '520px', zIndex: 0 }} />
    </>
  );
}
