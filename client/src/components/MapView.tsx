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
  height?: string;
  selectedProviderId?: number | null;
  onMarkerClick?: (providerId: number) => void;
  flyToCenter?: { lat: number; lng: number } | null;
}

function fmtPinPrice(s: Service): string {
  if (s.price_eur != null && Number(s.price_eur) === 0) return 'Free';
  if (s.price_eur != null && Number(s.price_eur) > 0) {
    const sym = s.currency === 'gel' ? '₾' : '€';
    return `${sym}${Math.round(Number(s.price_eur))}`;
  }
  return '···';
}

// Name-label pin (Airbnb-style) — shows provider name; selected state uses orange fill
function makeNamePin(name: string, selected: boolean): L.DivIcon {
  const bg = selected ? '#f97316' : '#1f2937';
  const scale = selected ? 'transform:scale(1.12);' : '';
  // Truncate long names to keep pins readable
  const label = name.length > 14 ? name.slice(0, 13) + '…' : name;
  return L.divIcon({
    html: `<div style="
      ${scale}
      background:${bg}; color:white;
      padding:4px 9px; border-radius:20px;
      font-size:11px; font-weight:600;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.22);
      border:2px solid white;
      cursor:pointer;
      transition:all 0.15s;
      letter-spacing:0.01em;
    ">${label}</div>`,
    className: '',
    iconSize: [80, 26],
    iconAnchor: [40, 13],
    popupAnchor: [0, -18],
  });
}

function makeUserIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      width:14px; height:14px; border-radius:50%;
      background:#3b82f6; border:2.5px solid white;
      box-shadow:0 0 0 3px rgba(59,130,246,0.3);
    "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Build the hover preview card HTML shown in the Leaflet popup.
// Shows provider name + rating + city + up to 2 service titles with prices.
// Clicking the card itself navigates to the provider profile.
function buildHoverCard(name: string, svcs: Service[]): string {
  const first = svcs[0];
  const avgRating = first.avg_rating ? Number(first.avg_rating) : null;
  const city = first.provider_city || '';
  const initial = (name || '?').charAt(0).toUpperCase();
  const providerId = first.provider_id || first.provider_user_id;

  const ratingHtml = avgRating != null
    ? `<span style="font-size:11px;color:#f59e0b;">★</span>
       <span style="font-size:11px;color:#374151;font-weight:600;">${avgRating.toFixed(1)}</span>
       <span style="font-size:10px;color:#9ca3af;">(${first.review_count || 0})</span>`
    : `<span style="font-size:10px;color:#9ca3af;">No reviews yet</span>`;

  const cityHtml = city
    ? `<div style="font-size:10px;color:#9ca3af;margin-top:1px;">📍 ${city}</div>`
    : '';

  const svcRows = svcs.slice(0, 2).map(s => {
    const sym = s.currency === 'gel' ? '₾' : '€';
    const price = s.price_eur != null && Number(s.price_eur) > 0
      ? `${sym}${Math.round(Number(s.price_eur))}`
      : s.price_eur != null && Number(s.price_eur) === 0
        ? 'Free'
        : '';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 0;border-top:1px solid #f3f4f6;">
        <span style="font-size:11px;color:#374151;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${s.category_icon || ''} ${s.title}
        </span>
        ${price ? `<span style="font-size:11px;font-weight:700;color:#f97316;white-space:nowrap;flex-shrink:0;">${price}</span>` : ''}
      </div>`;
  }).join('');

  const moreCount = svcs.length > 2 ? svcs.length - 2 : 0;

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:200px;max-width:260px;padding:2px 0;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:34px;height:34px;border-radius:50%;
          background:linear-gradient(135deg,#f97316,#ea580c);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:14px;font-weight:700;flex-shrink:0;">${initial}</div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:13px;font-weight:700;color:#111827;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:1px;">${ratingHtml}</div>
          ${cityHtml}
        </div>
      </div>
      ${svcRows}
      ${moreCount ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px;">+${moreCount} more</div>` : ''}
      <a href="/users/${providerId}" style="
        display:block;text-align:center;
        background:#1f2937;color:white;
        padding:7px;border-radius:8px;
        font-size:11px;font-weight:600;
        text-decoration:none;margin-top:8px;
      ">View profile →</a>
    </div>
  `;
}

export default function MapView({
  services, userLat, userLng, radiusKm = 0.5,
  height = '100%', selectedProviderId, onMarkerClick, flyToCenter,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  // Fly map to a new city center without full remount
  useEffect(() => {
    if (!flyToCenter || !mapInstance.current) return;
    mapInstance.current.flyTo([flyToCenter.lat, flyToCenter.lng], 14, { duration: 1.2 });
  }, [flyToCenter]);

  // Re-render markers when selection changes — no map remount needed
  const updateMarkerIcons = (selectedId: number | null | undefined) => {
    markersRef.current.forEach((marker, providerId) => {
      const name = (marker as any)._providerName as string;
      marker.setIcon(makeNamePin(name, providerId === selectedId));
    });
  };

  useEffect(() => {
    updateMarkerIcons(selectedProviderId);
  }, [selectedProviderId]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    markersRef.current.clear();

    // ── Center & zoom ───────────────────────────────────────────────────────
    const hasLocation = !!(userLat && userLng);
    let center: [number, number] = [49.6, 6.13]; // Luxembourg fallback
    let zoom = 13;
    if (flyToCenter) {
      center = [flyToCenter.lat, flyToCenter.lng];
      zoom = 14;
    } else if (hasLocation) {
      center = [userLat!, userLng!];
      zoom = 16; // Street-level zoom centred on user
    }

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
    });
    mapInstance.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // User location dot + radius circle
    if (hasLocation) {
      L.marker([userLat!, userLng!], { icon: makeUserIcon() })
        .addTo(map)
        .bindTooltip('You', { permanent: false, direction: 'top', className: 'leaflet-tooltip-clean' });

      if (radiusKm > 0) {
        L.circle([userLat!, userLng!], {
          radius: radiusKm * 1000,
          color: '#3b82f6', fillColor: '#3b82f6',
          fillOpacity: 0.05, weight: 1.5, dashArray: '5 5',
        }).addTo(map);
      }
    }

    // ── Group services by location ──────────────────────────────────────────
    const providerMap = new Map<string, {
      lat: number; lng: number;
      name: string; services: Service[];
      providerId: number;
    }>();

    for (const s of services) {
      const lat = s.service_latitude ?? s.provider_latitude;
      const lng = s.service_longitude ?? s.provider_longitude;
      if (!lat || !lng) continue;
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (!providerMap.has(key)) {
        providerMap.set(key, {
          lat, lng,
          name: s.provider_name || 'Provider',
          services: [],
          providerId: s.provider_id || s.provider_user_id || 0,
        });
      }
      providerMap.get(key)!.services.push(s);
    }

    const allPoints: L.LatLng[] = [];
    if (hasLocation) allPoints.push(L.latLng(userLat!, userLng!));

    providerMap.forEach(({ lat, lng, name, services: svcs, providerId }) => {
      allPoints.push(L.latLng(lat, lng));
      const isSelected = providerId === selectedProviderId;
      const marker = L.marker([lat, lng], {
        icon: makeNamePin(name, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });
      // Store name for icon updates
      (marker as any)._providerName = name;

      // Hover card — uses a popup because Leaflet tooltips can't contain links.
      // The popup stays open while hovering because we track mouseenter/mouseleave
      // on both the marker and the popup element.
      const popupContent = buildHoverCard(name, svcs);
      marker.bindPopup(popupContent, {
        maxWidth: 280, minWidth: 210,
        autoPan: false, closeButton: false,
        className: 'boomerang-hover-card',
      });

      let leaveTimer: ReturnType<typeof setTimeout> | null = null;

      const openPopup = () => {
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        marker.openPopup();
      };
      const scheduleClose = () => {
        leaveTimer = setTimeout(() => {
          marker.closePopup();
        }, 200);
      };

      marker.on('mouseover', openPopup);
      marker.on('mouseout', scheduleClose);

      // When popup opens, wire up hover on the popup element itself
      marker.on('popupopen', (e: any) => {
        const el = e.popup.getElement() as HTMLElement | null;
        if (!el) return;
        el.addEventListener('mouseenter', () => {
          if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        });
        el.addEventListener('mouseleave', scheduleClose);
      });

      // Click opens the in-app compact sheet
      marker.on('click', () => {
        marker.closePopup();
        if (onMarkerClick) onMarkerClick(providerId);
      });

      marker.addTo(map);
      markersRef.current.set(providerId, marker);
    });

    // ── Only fitBounds when no user location ───────────────────────────────
    if (!hasLocation && allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 15 });
    } else if (!hasLocation && allPoints.length === 1) {
      map.setView(allPoints[0], 15);
    }

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      markersRef.current.clear();
    };
  }, [services, userLat, userLng, radiusKm, flyToCenter]);

  return (
    <>
      <style>{`
        /* Hover card popup */
        .boomerang-hover-card .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 6px 24px rgba(0,0,0,0.14) !important;
          border: none !important;
          overflow: hidden;
        }
        .boomerang-hover-card .leaflet-popup-content {
          margin: 12px !important;
        }
        .boomerang-hover-card .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        /* "You" tooltip */
        .leaflet-tooltip-clean {
          background: #1f2937; color: white; border: none;
          font-size: 10px; font-weight: 600;
          border-radius: 4px; padding: 2px 6px;
        }
        .leaflet-tooltip-clean::before { display: none; }
        /* Zoom control */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .leaflet-control-zoom a {
          background: white !important; color: #1f2937 !important;
          font-size: 16px !important; line-height: 30px !important;
          width: 30px !important; height: 30px !important;
        }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height, zIndex: 0 }} />
    </>
  );
}
