import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + bundlers issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Service {
  id: number;
  title: string;
  points_cost: number;
  category_icon?: string;
  category_name?: string;
  provider_name?: string;
  provider_city?: string;
  provider_user_id?: number;
  provider_id?: number;
  latitude?: number;
  longitude?: number;
  provider_latitude?: number;
  provider_longitude?: number;
}

interface MapViewProps {
  services: Service[];
  userLat?: number | null;
  userLng?: number | null;
}

export default function MapView({ services, userLat, userLng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const center: [number, number] = userLat && userLng ? [userLat, userLng] : [49.6, 6.13]; // Default: Luxembourg
    const map = L.map(mapRef.current).setView(center, 11);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // User location marker
    if (userLat && userLng) {
      L.circleMarker([userLat, userLng], {
        radius: 8, fillColor: '#f97316', color: '#fff', weight: 2, fillOpacity: 0.9,
      }).addTo(map).bindPopup('📍 You are here');
    }

    // Service markers — group by provider location
    const providerMap = new Map<string, { lat: number; lng: number; services: Service[] }>();
    for (const s of services) {
      const lat = (s as any).provider_latitude || (s as any).latitude;
      const lng = (s as any).provider_longitude || (s as any).longitude;
      if (!lat || !lng) continue;
      const key = `${lat},${lng}`;
      if (!providerMap.has(key)) providerMap.set(key, { lat, lng, services: [] });
      providerMap.get(key)!.services.push(s);
    }

    const bounds: [number, number][] = [];
    if (userLat && userLng) bounds.push([userLat, userLng]);

    providerMap.forEach(({ lat, lng, services: svcs }) => {
      bounds.push([lat, lng]);
      const popupHtml = svcs.map(s =>
        `<div style="margin-bottom:6px"><a href="/services/${s.id}" style="color:#f97316;font-weight:600;text-decoration:none">${s.category_icon || ''} ${s.title}</a><br/><span style="font-size:11px;color:#888">${s.points_cost} 🪃 · ${s.provider_name || ''}</span></div>`
      ).join('');
      L.marker([lat, lng]).addTo(map).bindPopup(popupHtml, { maxWidth: 250 });
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [services, userLat, userLng]);

  return <div ref={mapRef} className="w-full h-[500px] rounded-2xl shadow-card z-0" />;
}
