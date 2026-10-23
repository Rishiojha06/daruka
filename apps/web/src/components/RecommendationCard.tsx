import React from 'react';
import { RecommendationCandidate } from '@weekend-ride/shared-types';
import { formatCoordinates } from '../utils/coordinates';
import './RecommendationCard.css';

interface RecommendationCardProps {
  candidate: RecommendationCandidate;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  candidate,
  rank,
  isSelected,
  onSelect,
}) => {
  const formatMins = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
  };

  const isBest = rank === 1;

  return (
    <article
      className={`recommendation-card ${isSelected ? 'card-selected' : ''}`}
      onClick={onSelect}
      aria-label={`Recommendation #${rank}: ${candidate.name || 'Meeting Point'}`}
    >
      <div className="card-header">
        <div className="card-title-group">
          <span className={`rank-badge ${isBest ? 'rank-best' : ''}`}>
            #{rank}
          </span>
          <div>
            <h3 className="place-name">{candidate.name || 'Roadside Meeting Point'}</h3>
            <span className="place-category">{candidate.category || 'Stopping Point'}</span>
          </div>
        </div>

        {isBest && <span className="best-balance-pill">★ Best Arrival Balance</span>}
      </div>

      <div className="card-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Rider A Arrival</span>
          <span className="metric-value">{formatMins(candidate.travel.riderASeconds)}</span>
          <span className="metric-sub">
            +{formatMins(candidate.detour.riderASeconds)} detour
          </span>
        </div>

        <div className="metric-box">
          <span className="metric-label">Rider B Arrival</span>
          <span className="metric-value">{formatMins(candidate.travel.riderBSeconds)}</span>
          <span className="metric-sub">
            +{formatMins(candidate.detour.riderBSeconds)} detour
          </span>
        </div>

        <div className="metric-box highlight-metric">
          <span className="metric-label">Arrival Gap</span>
          <span className="metric-value">
            {formatMins(candidate.travel.arrivalDifferenceSeconds)}
          </span>
          <span className="metric-sub">difference</span>
        </div>

        {candidate.travel.toDestinationSeconds !== undefined && (
          <div className="metric-box">
            <span className="metric-label">Onward Ride</span>
            <span className="metric-value">
              {formatMins(candidate.travel.toDestinationSeconds)}
            </span>
            <span className="metric-sub">to destination</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="coords-text">
          📍 {formatCoordinates(candidate.location)}
        </span>

        <a
          href={candidate.navigationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-nav"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open navigation in external maps to ${candidate.name || 'Meeting Point'}`}
        >
          Open Navigation ↗
        </a>
      </div>
    </article>
  );
};
