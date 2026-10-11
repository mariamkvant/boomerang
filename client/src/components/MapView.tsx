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
}

function fmtPinPrice(s: Service): string {
  if (s.price_eur != null && Number(s.price_eur) > 0) {
    const sym = s.currency === 'gel' ? '₾' : '€';
    return `${sym}${Math.round(Number(s.price_eur))}`;
  }
  return '···';
}

function fmtPopupPrice(s: Service): string {
  if (s.price_eur != null && Number(s.price_eur) > 0) {
    const sym = s.currency === 'gel' ? '₾' : '€';
    const n = Number(s.price_eur);
    return `${sym}${Math.round(n)}`;
  }
  return 'Contact provider';
}

function stars(rating: number): string {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function buildPopupHtml(providerName: string, svcs: Service[]): string {
  const first = svcs[0];
  const avgRating = first.avg_rating ? Number(first.avg_rating) : null;
  const initial = (providerName || '?').charAt(0).toUpperCase();

  const servicesHtml = svcs.slice(0, 4).map(s => `
    <a href="/services/${s.id}" style="
      display:flex; align-items:center; justify-content:space-between;
      padding:7px 0; border-bottom:1px solid #f3f4f6; text-decoration:none; gap:8px;
    ">
      <span style="font-size:12px; color:#111827; font-weight:500; flex:1; min-width:0;
        overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${s.category_icon || ''} ${s.title}
      </span>
      <span style="font-size:12px; font-weight:700; color:#f97316; white-space:nowrap; flex-shrink:0;">
        ${fmtPopupPrice(s)}
      </span>
    </a>
  `).join('');

  const moreCount = svcs.length > 4 ? svcs.length - 4 : 0;

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif; min-width:220px; max-width:280px;">
      <a href="/users/${first.provider_id || first.provider_user_id}" style="
        display:flex; align-items:center; gap:10px; padding-bottom:10px;
        border-bottom:2px solid #f3f4f6; margin-bottom:8px; text-decoration:none;
      ">
        <div style="
          width:36px; height:36px; border-radius:50%;
          background:linear-gradient(135deg,#f97316,#ea580c);
          display:flex; align-items:center; justify-content:center;
          color:white; font-size:15px; font-weight:700; flex-shrink:0;
        ">${initial}</div>
        <div style="min-width:0; flex:1;">
          <div style="font-size:14px; font-weight:700; color:#111827;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${providerName}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            ${avgRating != null ? `
              <span style="font-size:11px; color:#f59e0b;">${stars(avgRating)}</span>
              <span style="font-size:11px; color:#6b7280;">${avgRating.toFixed(1)} (${first.review_count || 0})</span>
            ` : `<span style="font-size:11px; color:#9ca3af;">No reviews yet</span>`}
          </div>
          ${first.provider_city ? `<div style="font-size:11px; color:#9ca3af; margin-top:1px;">📍 ${first.provider_city}</div>` : ''}
        </div>
      </a>
      <div style="margin-bottom:${moreCount ? '4px' : '8px'};">${servicesHtml}</div>
      ${moreCount ? `<div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">+${moreCount} more service${moreCount > 1 ? 's' : ''}</div>` : ''}
      <a href="/users/${first.provider_id || first.provider_user_id}" style="
        display:block; text-align:center; background:#1f2937; color:white;
        padding:8px; border-radius:8px; font-size:12px; font-weight:600;
        text-decoration:none; margin-top:4px;
      ">View profile →</a>
    </div>
  `;
}

// Price-label pin (Airbnb-style) — selected state is larger with orange fill
function makePricePin(label: string, selected: boolean): L.DivIcon {
  const bg = selected ? '#f97316' : '#1f2937';
  const scale = selected ? 'transform:scale(1.15);' : '';
  return L.divIcon({
    html: `<div style="
      ${scale}
      background:${bg}; color:white;
      padding:5px 9px; border-radius:20px;
      font-size:12px; font-weight:700;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      border:2px solid white;
      cursor:pointer;
      transition:all 0.15s;
    ">${label}</div>`,
    className: '',
    iconSize: undefined,
    iconAnchor: [0, 0],
    popupAnchor: [0, -10],
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

export default function MapView({
  services, userLat, userLng, radiusKm = 0.5,
  height = '100%', selectedProviderId, onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  // Re-render markers when selection changes without destroying the whole map
  const updateMarkerIcons = (selectedId: number | null | undefined) => {
    markersRef.current.forEach((marker, providerId) => {
      const label = (marker as any)._priceLabel as string;
      marker.setIcon(makePricePin(label, providerId === selectedId));
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
    // Always start at street level (zoom 15) when we have user location.
    // Only fitBounds when there's no user location.
    const hasLocation = !!(userLat && userLng);
    let center: [number, number] = [49.6, 6.13]; // Luxembourg fallback
    if (hasLocation) center = [userLat!, userLng!];

    const map = L.map(mapRef.current, {
      center,
      zoom: hasLocation ? 15 : 13,
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
      lowestPrice: string;
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
          lowestPrice: fmtPinPrice(s),
        });
      }
      const entry = providerMap.get(key)!;
      entry.services.push(s);
      // Show the lowest price on the pin
      if (s.price_eur != null && Number(s.price_eur) > 0) {
        const current = entry.lowestPrice;
        const currentNum = current === '···' ? Infinity : parseFloat(current.replace(/[^0-9.]/g, ''));
        if (Number(s.price_eur) < currentNum) {
          entry.lowestPrice = fmtPinPrice(s);
        }
      }
    }

    const allPoints: L.LatLng[] = [];
    if (hasLocation) allPoints.push(L.latLng(userLat!, userLng!));

    providerMap.forEach(({ lat, lng, name, services: svcs, providerId, lowestPrice }) => {
      allPoints.push(L.latLng(lat, lng));
      const isSelected = providerId === selectedProviderId;
      const marker = L.marker([lat, lng], {
        icon: makePricePin(lowestPrice, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });
      // Store label for icon updates
      (marker as any)._priceLabel = lowestPrice;

      marker.addTo(map).bindPopup(buildPopupHtml(name, svcs), {
        maxWidth: 300, minWidth: 240, autoPan: false, closeButton: false,
        className: 'boomerang-popup',
      });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(providerId);
        // Close popup immediately — the in-app sheet handles details
        setTimeout(() => marker.closePopup(), 0);
      });

      // Hover: show popup on mouseover, hide on mouseout (desktop)
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());

      // Permanent name tooltip — visible when zoomed in (zoom ≥ 15)
      marker.bindTooltip(name, {
        permanent: true,
        direction: 'top',
        offset: [0, -8],
        className: 'boomerang-name-tooltip',
        opacity: 1,
      });

      // Show/hide name tooltip based on zoom level
      const updateTooltipVisibility = () => {
        const z = map.getZoom();
        const tt = marker.getTooltip();
        if (!tt) return;
        if (z >= 15) {
          tt.getElement()?.style.setProperty('display', 'block');
        } else {
          tt.getElement()?.style.setProperty('display', 'none');
        }
      };
      map.on('zoomend', updateTooltipVisibility);
      // Set initial state
      setTimeout(updateTooltipVisibility, 50);

      markersRef.current.set(providerId, marker);
    });

    // ── Only fitBounds when no user location ───────────────────────────────
    if (!hasLocation && allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 15 });
    } else if (!hasLocation && allPoints.length === 1) {
      map.setView(allPoints[0], 15);
    }
    // When user has location, keep the zoom at 15 centred on them

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      markersRef.current.clear();
    };
  }, [services, userLat, userLng, radiusKm]);

  return (
    <>
      <style>{`
        .boomerang-popup .leaflet-popup-content-wrapper {
          border-radius: 14px !important; padding: 0 !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          border: none !important; overflow: hidden;
        }
        .boomerang-popup .leaflet-popup-content { margin: 14px !important; }
        .boomerang-popup .leaflet-popup-tip-container { margin-top: -1px; }
        .leaflet-tooltip-clean {
          background: #1f2937; color: white; border: none;
          font-size: 11px; font-weight: 600; border-radius: 4px; padding: 2px 6px;
        }
        .leaflet-tooltip-clean::before { display: none; }
        .boomerang-name-tooltip {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 2px 7px;
          font-size: 11px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
          pointer-events: none;
        }
        .boomerang-name-tooltip::before { display: none; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important; }
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
