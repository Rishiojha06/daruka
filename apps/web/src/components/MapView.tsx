import React, { useRef } from 'react';
import { Coordinates, RouteSummary, RecommendationCandidate } from '@weekend-ride/shared-types';
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
  recommendations = [],
  selectedCandidateId,
  onSelectCandidate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Bengaluru bounding box bounds for interactive SVG coordinate projection
  // minLat ~12.75, maxLat ~13.45, minLng ~77.40, maxLng ~77.85
  const BBOX = {
    minLat: 12.75,
    maxLat: 13.45,
    minLng: 77.4,
    maxLng: 77.85,
  };

  const projectToSvg = (coords: Coordinates) => {
    const x = ((coords.lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100;
    // Invert Y because latitude increases northward (up) while SVG y increases downward (down)
    const y = ((BBOX.maxLat - coords.lat) / (BBOX.maxLat - BBOX.minLat)) * 100;
    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activePinTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const lng = BBOX.minLng + clickX * (BBOX.maxLng - BBOX.minLng);
    const lat = BBOX.maxLat - clickY * (BBOX.maxLat - BBOX.minLat);

    onMapClickCoordinate({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    });
  };

  return (
    <div className="map-view-wrapper" ref={containerRef}>
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

      <div className={`map-canvas-container ${activePinTarget ? 'cursor-crosshair' : ''}`}>
        <svg
          className="interactive-map-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleSvgClick}
          role="region"
          aria-label="Interactive route and location map"
        >
          {/* Subtle grid background simulating roads and map grid */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="#f8fafc" />
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Bengaluru landmarks subtle reference lines */}
          <line x1="20" y1="20" x2="80" y2="80" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="1,1" />
          <line x1="15" y1="70" x2="85" y2="30" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="1,1" />

          {/* Direct approach guides if locations are placed */}
          {riderALocation && destinationLocation && (
            <line
              x1={projectToSvg(riderALocation).x}
              y1={projectToSvg(riderALocation).y}
              x2={projectToSvg(destinationLocation).x}
              y2={projectToSvg(destinationLocation).y}
              stroke="#2563eb"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              opacity="0.6"
            />
          )}

          {riderBLocation && destinationLocation && (
            <line
              x1={projectToSvg(riderBLocation).x}
              y1={projectToSvg(riderBLocation).y}
              x2={projectToSvg(destinationLocation).x}
              y2={projectToSvg(destinationLocation).y}
              stroke="#059669"
              strokeWidth="1.2"
              strokeDasharray="2,2"
              opacity="0.6"
            />
          )}

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

          {/* Candidate Recommendation Markers */}
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

        <div className="map-coordinates-bar">
          <span>Bengaluru Region (12.75°N, 77.40°E to 13.45°N, 77.85°E)</span>
          {activePinTarget && <span className="pin-active-tag">Click anywhere to place marker</span>}
        </div>
      </div>
    </div>
  );
};
