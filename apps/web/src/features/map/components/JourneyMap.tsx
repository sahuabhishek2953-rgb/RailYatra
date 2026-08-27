import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { RouteGeoJSON, LiveStatus, StationEvent } from '@railyatra/types';
import { calculateSmoothedLocation } from '../utils/interpolate';
import { MapControls } from './MapControls';

interface JourneyMapProps {
  route: RouteGeoJSON;
  liveStatus: LiveStatus;
  timeline: StationEvent[];
}

/** Split route coords into completed and remaining segments based on completion % */
function splitRoute(
  coords: [number, number][],
  completionPct: number
): { completed: [number, number][]; remaining: [number, number][] } {
  if (!coords.length) return { completed: [], remaining: [] };
  const splitIdx = Math.max(1, Math.round((completionPct / 100) * coords.length));
  return {
    completed: coords.slice(0, splitIdx),
    remaining: coords.slice(splitIdx - 1) // overlap 1 point so lines connect
  };
}

function buildPopupHtml(stop: StationEvent): string {
  const delay = stop.delayMinutes > 0
    ? `<div style="color:#D97706;font-weight:700;font-size:11px;margin-top:2px">+${stop.delayMinutes}m delay</div>`
    : stop.status === 'COMPLETED' ? `<div style="color:#10B981;font-size:11px;margin-top:2px">✓ Departed on time</div>` : '';

  const statusBadge = stop.status === 'CURRENT'
    ? `<span style="background:#ECFDF5;color:#065F46;font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;border:1px solid #A7F3D0">CURRENT</span>`
    : stop.status === 'COMPLETED'
    ? `<span style="background:#F3F4F6;color:#6B7280;font-size:10px;padding:1px 6px;border-radius:999px">PASSED</span>`
    : `<span style="background:#EFF6FF;color:#1D4ED8;font-size:10px;padding:1px 6px;border-radius:999px;border:1px solid #BFDBFE">UPCOMING</span>`;

  return `
    <div style="font-family:'Inter',sans-serif;padding:6px 2px;min-width:160px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px">
        <div style="font-weight:700;font-size:13px;color:#111827;line-height:1.2">${stop.station.name}</div>
        ${statusBadge}
      </div>
      <div style="color:#9CA3AF;font-size:10px;font-family:monospace;letter-spacing:0.05em">${stop.station.code}</div>
      ${stop.scheduledArrival ? `<div style="font-size:11px;color:#6B7280;margin-top:5px">⏱ Sch: <strong>${stop.scheduledArrival}</strong></div>` : ''}
      ${stop.actualArrival ? `<div style="font-size:11px;color:#6B7280">✓ Act: <strong>${stop.actualArrival}</strong></div>` : ''}
      ${stop.platform ? `<div style="font-size:11px;color:#6B7280">Platform <strong>${stop.platform}</strong></div>` : ''}
      ${delay}
    </div>
  `;
}

export const JourneyMap: React.FC<JourneyMapProps> = ({ route, liveStatus, timeline }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const trainMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  const mapStyleUrl = maptilerKey
    ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${maptilerKey}`
    : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

  const coords = (route.features[0]?.geometry?.coordinates ?? []) as [number, number][];
  const hasRoute = coords.length >= 2;
  const { completed, remaining } = splitRoute(coords, liveStatus.journeyCompletionPercent);

  const getSmoothedPos = () =>
    calculateSmoothedLocation(route, liveStatus.location, liveStatus.journeyCompletionPercent);

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const smoothed = getSmoothedPos();
    const initialCenter: [number, number] = hasRoute
      ? [coords[0][0], coords[0][1]]
      : [smoothed.lng, smoothed.lat];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center: initialCenter,
      zoom: 6,
      pitch: 20,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapReady(true);

      // ── CSS keyframes ──
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes stationPulse {
          0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.7)}
          70%{box-shadow:0 0 0 8px rgba(16,185,129,0)}
        }
      `;
      document.head.appendChild(styleEl);

      // ── Route layers ──
      if (hasRoute) {
        // Completed segment source
        if (completed.length >= 2) {
          map.addSource('route-completed', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: completed },
                properties: {}
              }]
            }
          });
          // Glow
          map.addLayer({
            id: 'route-completed-glow',
            type: 'line', source: 'route-completed',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#4F6EF7', 'line-width': 12, 'line-opacity': 0.15 }
          });
          // Core bright blue
          map.addLayer({
            id: 'route-completed-core',
            type: 'line', source: 'route-completed',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#6B8BFF', 'line-width': 4 }
          });
        }

        // Remaining segment source
        if (remaining.length >= 2) {
          map.addSource('route-remaining', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: remaining },
                properties: {}
              }]
            }
          });
          // Muted gray
          map.addLayer({
            id: 'route-remaining-core',
            type: 'line', source: 'route-remaining',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#4B5563', 'line-width': 3, 'line-opacity': 0.8 }
          });
        }

        // Fit all coords
        const bounds = new maplibregl.LngLatBounds();
        coords.forEach(c => bounds.extend(c));
        map.fitBounds(bounds, { padding: 80, maxZoom: 10, duration: 1200 });
      }

      // ── Station Markers with popups ──
      // Only render halts (isHalt stations) to keep map clean — use all if isHalt not differentiated
      const haltStops = timeline.filter(s =>
        s.station.lat && s.station.lng && s.station.lat !== 20.5937
      );

      haltStops.forEach(stop => {
        const el = document.createElement('div');
        const isCurrent = stop.status === 'CURRENT';
        const isDone = stop.status === 'COMPLETED';

        el.style.cssText = `
          width: ${isCurrent ? '18px' : '9px'};
          height: ${isCurrent ? '18px' : '9px'};
          border-radius: 50%;
          background: ${isCurrent ? '#10B981' : isDone ? '#4F6EF7' : '#374151'};
          border: 2px solid ${isCurrent ? '#A7F3D0' : isDone ? '#6B8BFF' : '#6B7280'};
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          ${isCurrent ? 'animation: stationPulse 2s infinite; box-shadow: 0 0 0 0 rgba(16,185,129,0.7);' : ''}
        `;

        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

        const popup = new maplibregl.Popup({
          offset: 12,
          closeButton: true,
          className: 'railyatra-popup',
          maxWidth: '220px'
        }).setHTML(buildPopupHtml(stop));

        new maplibregl.Marker({ element: el })
          .setLngLat([stop.station.lng, stop.station.lat])
          .setPopup(popup)
          .addTo(map);
      });

      // ── Train Marker ──
      const smoothed = getSmoothedPos();
      const trainEl = document.createElement('div');
      trainEl.innerHTML = `
        <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center">
          <span style="position:absolute;width:100%;height:100%;border-radius:50%;background:#4F6EF7;opacity:0.35;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite"></span>
          <div style="position:relative;width:36px;height:36px;border-radius:50%;background:linear-gradient(145deg,#4F6EF7,#3B52D4);color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(79,110,247,0.55);border:2.5px solid rgba(255,255,255,0.9)">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: trainEl, anchor: 'center' })
        .setLngLat([smoothed.lng, smoothed.lat])
        .addTo(map);

      trainMarkerRef.current = marker;

      // Popup style injection
      const popupStyle = document.createElement('style');
      popupStyle.textContent = `
        .railyatra-popup .maplibregl-popup-content {
          border-radius: 14px !important;
          padding: 12px 14px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
          font-family: Inter, sans-serif !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }
        .railyatra-popup .maplibregl-popup-tip { border-top-color: white !important; }
        .railyatra-popup .maplibregl-popup-close-button {
          font-size: 16px; color: #9CA3AF; padding: 4px 8px; border-radius: 6px;
        }
        .railyatra-popup .maplibregl-popup-close-button:hover { background: #F3F4F6; color: #374151; }
      `;
      document.head.appendChild(popupStyle);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [route, mapStyleUrl]);

  // ── Update train position & dual-color route on live data change ───────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const smoothed = getSmoothedPos();

    // Update marker
    if (trainMarkerRef.current) {
      trainMarkerRef.current.setLngLat([smoothed.lng, smoothed.lat]);
    }

    // Update completed / remaining sources
    const { completed: newCompleted, remaining: newRemaining } = splitRoute(
      coords, liveStatus.journeyCompletionPercent
    );

    const completedSrc = map.getSource('route-completed') as maplibregl.GeoJSONSource | undefined;
    if (completedSrc && newCompleted.length >= 2) {
      completedSrc.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: newCompleted },
          properties: {}
        }]
      });
    }

    const remainingSrc = map.getSource('route-remaining') as maplibregl.GeoJSONSource | undefined;
    if (remainingSrc && newRemaining.length >= 2) {
      remainingSrc.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: newRemaining },
          properties: {}
        }]
      });
    }

    if (isFollowing) {
      map.easeTo({ center: [smoothed.lng, smoothed.lat], duration: 1500 });
    }
  }, [liveStatus, isFollowing, mapReady]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const smoothed = getSmoothedPos();
    mapRef.current.flyTo({ center: [smoothed.lng, smoothed.lat], zoom: 9, duration: 1200 });
    setIsFollowing(true);
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-xl border border-gray-800">
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="h-8 w-8 rounded-full border-2 border-[#4F6EF7] border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-gray-400">Loading map…</span>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      {/* Route legend */}
      {mapReady && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-3 rounded-xl bg-gray-900/80 backdrop-blur-sm px-3 py-2 text-[11px] font-medium">
          <span className="flex items-center gap-1.5 text-[#6B8BFF]">
            <span className="h-0.5 w-4 rounded bg-[#6B8BFF]" />
            Completed
          </span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="h-0.5 w-4 rounded bg-gray-500" />
            Remaining
          </span>
        </div>
      )}
      <MapControls
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        onRecenter={handleRecenter}
        isFollowing={isFollowing}
        toggleFollow={() => setIsFollowing(f => !f)}
      />
    </div>
  );
};
