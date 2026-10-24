import React, { useEffect, useRef, useState } from 'react';
import {
  Coordinates,
  RecommendationCandidate,
  RouteSummary,
} from '@weekend-ride/shared-types';
import { loadGoogleMaps } from '../services/google-maps-loader';
import { ActivePinTarget } from '../types';
import './MapView.css';

interface MapViewProps {
  riderALocation: Coordinates | null;
  riderBLocation: Coordinates | null;
  destinationLocation: Coordinates | null;
  activePinTarget: ActivePinTarget;
  onMapClickCoordinate: (coords: Coordinates) => void;
  riderARoute?: RouteSummary;
  riderBRoute?: RouteSummary;
  recommendations?: RecommendationCandidate[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (candidate: RecommendationCandidate) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  riderALocation,
  riderBLocation,
  destinationLocation,
  activePinTarget,
  onMapClickCoordinate,
  riderARoute,
  riderBRoute,
  recommendations = [],
  selectedCandidateId,
  onSelectCandidate,
}) => {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker | google.maps.InfoWindow }>({});
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Hook into Google Maps global authentication failure event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const windowWithGm = window as unknown as { gm_authFailure?: () => void };
    const prevAuthFailure = windowWithGm.gm_authFailure;

    windowWithGm.gm_authFailure = () => {
      console.warn('Google Maps authentication failure (InvalidKeyMapError). Switching to fallback schematic view.');
      setAuthError('Google Maps API Key Error (InvalidKeyMapError): The key in apps/web/.env is invalid or truncated. Using interactive fallback map.');
      setIsGoogleMapsReady(false);
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };

    return () => {
      windowWithGm.gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Initialize Google Maps instance
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !mapElementRef.current) return;

        if (!googleMapRef.current) {
          const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // Bengaluru Central
          const map = new google.maps.Map(mapElementRef.current, {
            center: defaultCenter,
            zoom: 11,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            clickableIcons: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }],
              },
            ],
          });

          // Map click handler for "Pick on Map"
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClickCoordinate({
                lat: Number(e.latLng.lat().toFixed(6)),
                lng: Number(e.latLng.lng().toFixed(6)),
              });
            }
          });

          googleMapRef.current = map;
        }

        setIsGoogleMapsReady(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsGoogleMapsReady(false);
        setLoadError((err as Error).message || 'Google Maps could not be loaded');
      });

    return () => {
      isMounted = false;
    };
  }, [onMapClickCoordinate]);

  // Update map cursor when picking a pin
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setOptions({
        draggableCursor: activePinTarget ? 'crosshair' : null,
      });
    }
  }, [activePinTarget]);

  // Render Markers and Polylines on Google Map
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !isGoogleMapsReady || typeof google === 'undefined') return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => {
      if ('setMap' in m) (m as google.maps.Marker).setMap(null);
    });
    markersRef.current = {};

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // 1. Rider A Marker (Blue Pin)
    if (riderALocation) {
      const pos = { lat: riderALocation.lat, lng: riderALocation.lng };
      bounds.extend(pos);
      hasPoints = true;

      markersRef.current['riderA'] = new google.maps.Marker({
        position: pos,
        map,
        title: 'Rider A Starting Point',
        label: { text: 'A', color: '#ffffff', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    // 2. Rider B Marker (Green Pin)
    if (riderBLocation) {
      const pos = { lat: riderBLocation.lat, lng: riderBLocation.lng };
      bounds.extend(pos);
      hasPoints = true;

      markersRef.current['riderB'] = new google.maps.Marker({
        position: pos,
        map,
        title: 'Rider B Starting Point',
        label: { text: 'B', color: '#ffffff', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    // 3. Destination Marker (Red Pin)
    if (destinationLocation) {
      const pos = { lat: destinationLocation.lat, lng: destinationLocation.lng };
      bounds.extend(pos);
      hasPoints = true;

      markersRef.current['destination'] = new google.maps.Marker({
        position: pos,
        map,
        title: 'Shared Destination',
        label: { text: 'D', color: '#ffffff', fontWeight: 'bold' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 13,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    // 4. Meeting Point Recommendation Markers (Numbered Amber Pins)
    recommendations.forEach((rec, idx) => {
      const pos = { lat: rec.location.lat, lng: rec.location.lng };
      bounds.extend(pos);
      hasPoints = true;

      const isSelected = selectedCandidateId === rec.id;
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `Meeting Point #${idx + 1}: ${rec.name || 'Stop'}`,
        label: {
          text: `${idx + 1}`,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        zIndex: isSelected ? 100 : 10,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 15 : 12,
          fillColor: isSelected ? '#d97706' : '#f59e0b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: isSelected ? 3 : 2,
        },
      });

      marker.addListener('click', () => {
        onSelectCandidate?.(rec);
      });

      markersRef.current[`rec-${rec.id}`] = marker;
    });

    // 5. Rider A Polyline (Blue Road Route)
    if (riderARoute?.geometry && riderARoute.geometry.length > 1) {
      const path = riderARoute.geometry.map((g) => ({ lat: g.lat, lng: g.lng }));
      path.forEach((p) => bounds.extend(p));
      hasPoints = true;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current.push(polyline);
    }

    // 6. Rider B Polyline (Green Road Route)
    if (riderBRoute?.geometry && riderBRoute.geometry.length > 1) {
      const path = riderBRoute.geometry.map((g) => ({ lat: g.lat, lng: g.lng }));
      path.forEach((p) => bounds.extend(p));
      hasPoints = true;

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      polylinesRef.current.push(polyline);
    }

    // Auto-fit camera view to enclose all active locations & routes
    if (hasPoints) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      // Prevent over-zooming on a single marker
      if (map.getZoom() && map.getZoom()! > 15) {
        map.setZoom(15);
      }
    }
  }, [
    isGoogleMapsReady,
    riderALocation,
    riderBLocation,
    destinationLocation,
    riderARoute,
    riderBRoute,
    recommendations,
    selectedCandidateId,
    onSelectCandidate,
  ]);

  // Fallback SVG Projection Calculation (for offline / test mode)
  const BBOX = { minLat: 12.75, maxLat: 13.45, minLng: 77.4, maxLng: 77.85 };
  const projectToSvg = (coords: Coordinates) => ({
    x: Math.max(2, Math.min(98, ((coords.lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100)),
    y: Math.max(2, Math.min(98, ((BBOX.maxLat - coords.lat) / (BBOX.maxLat - BBOX.minLat)) * 100)),
  });

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePinTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    onMapClickCoordinate({
      lat: Number((BBOX.maxLat - clickY * (BBOX.maxLat - BBOX.minLat)).toFixed(6)),
      lng: Number((BBOX.minLng + clickX * (BBOX.maxLng - BBOX.minLng)).toFixed(6)),
    });
  };

  return (
    <div className="map-view-wrapper">
      <div className="map-header">
        <div className="map-legend" role="group" aria-label="Map Legend">
          <span className="legend-item">
            <span className="legend-pin pin-a">A</span> Rider A
          </span>
          <span className="legend-item">
            <span className="legend-pin pin-b">B</span> Rider B
          </span>
          <span className="legend-item">
            <span className="legend-pin pin-dest">D</span> Destination
          </span>
          <span className="legend-item">
            <span className="legend-pin pin-meet">★</span> Meeting Point
          </span>
        </div>

        {activePinTarget && (
          <div className="pin-target-notice">
            Click map to set <strong>{activePinTarget === 'riderA' ? 'Rider A' : activePinTarget === 'riderB' ? 'Rider B' : 'Destination'}</strong>
          </div>
        )}
      </div>

      {/* Primary: Real Google Maps Container */}
      <div className="map-canvas-container">
        <div
          ref={mapElementRef}
          className="google-map-element"
          style={{ width: '100%', height: '100%', display: isGoogleMapsReady && !authError ? 'block' : 'none' }}
          role="region"
          aria-label="Google Map with motorcycle routes and meeting points"
        />

        {/* Fallback Preview when Google Maps Key is not provided or fails authentication */}
        {(!isGoogleMapsReady || authError) && (
          <div className="fallback-map-container">
            {(authError || loadError) && (
              <div className={`google-key-notice ${authError ? 'google-key-error' : ''}`}>
                <span>
                  <strong>{authError ? 'Google Maps Authentication Notice' : 'Interactive Map Preview Active'}:</strong>{' '}
                  {authError || (
                    <>
                      To view live Google Maps tiles, add your <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>apps/web/.env</code>.
                    </>
                  )}
                </span>
              </div>
            )}

            <svg
              className="interactive-map-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onClick={handleSvgClick}
              role="region"
              aria-label="Interactive route and location map"
            >
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="#f8fafc" />
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Route polylines */}
              {riderARoute?.geometry && riderARoute.geometry.length > 1 ? (
                <polyline
                  points={riderARoute.geometry.map((p) => `${projectToSvg(p).x},${projectToSvg(p).y}`).join(' ')}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : riderALocation && destinationLocation ? (
                <line
                  x1={projectToSvg(riderALocation).x}
                  y1={projectToSvg(riderALocation).y}
                  x2={projectToSvg(destinationLocation).x}
                  y2={projectToSvg(destinationLocation).y}
                  stroke="#2563eb"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
              ) : null}

              {riderBRoute?.geometry && riderBRoute.geometry.length > 1 ? (
                <polyline
                  points={riderBRoute.geometry.map((p) => `${projectToSvg(p).x},${projectToSvg(p).y}`).join(' ')}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : riderBLocation && destinationLocation ? (
                <line
                  x1={projectToSvg(riderBLocation).x}
                  y1={projectToSvg(riderBLocation).y}
                  x2={projectToSvg(destinationLocation).x}
                  y2={projectToSvg(destinationLocation).y}
                  stroke="#059669"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />
              ) : null}

              {/* Markers */}
              {riderALocation && (
                <g transform={`translate(${projectToSvg(riderALocation).x}, ${projectToSvg(riderALocation).y})`}>
                  <circle r="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                  <text textAnchor="middle" dy="1.4" fontSize="3.5" fill="#ffffff" fontWeight="bold">
                    A
                  </text>
                </g>
              )}

              {riderBLocation && (
                <g transform={`translate(${projectToSvg(riderBLocation).x}, ${projectToSvg(riderBLocation).y})`}>
                  <circle r="4" fill="#059669" stroke="#ffffff" strokeWidth="1" />
                  <text textAnchor="middle" dy="1.4" fontSize="3.5" fill="#ffffff" fontWeight="bold">
                    B
                  </text>
                </g>
              )}

              {destinationLocation && (
                <g transform={`translate(${projectToSvg(destinationLocation).x}, ${projectToSvg(destinationLocation).y})`}>
                  <circle r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
                  <text textAnchor="middle" dy="1.4" fontSize="3.5" fill="#ffffff" fontWeight="bold">
                    D
                  </text>
                </g>
              )}

              {recommendations.map((rec, index) => {
                const pos = projectToSvg(rec.location);
                const isSelected = selectedCandidateId === rec.id;
                return (
                  <g
                    key={rec.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCandidate?.(rec);
                    }}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    aria-label={`Meeting candidate #${index + 1}: ${rec.name || 'Location'}`}
                  >
                    <circle
                      r={isSelected ? 5.5 : 4.5}
                      fill={isSelected ? '#d97706' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    <text textAnchor="middle" dy="1.4" fontSize="3" fill="#ffffff" fontWeight="bold">
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        <div className="map-coordinates-bar">
          <span>Bengaluru Region (Two-Wheeler Traffic Enabled)</span>
          {activePinTarget && <span className="pin-active-tag">Click anywhere on map to place pin</span>}
        </div>
      </div>
    </div>
  );
};
