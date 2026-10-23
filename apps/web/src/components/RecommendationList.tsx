import React from 'react';
import { RecommendationCandidate } from '@weekend-ride/shared-types';
import { RecommendationCard } from './RecommendationCard';
import './RecommendationList.css';

interface RecommendationListProps {
  recommendations: RecommendationCandidate[];
  status: 'idle' | 'ok' | 'no_candidates' | 'error';
  selectedId: string | null;
  onSelect: (rec: RecommendationCandidate) => void;
  warningMessage?: string;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  status,
  selectedId,
  onSelect,
  warningMessage,
}) => {
  if (status === 'idle') {
    return null;
  }

  if (status === 'no_candidates') {
    return (
      <section className="no-candidates-panel" aria-labelledby="no-candidates-title">
        <div className="no-candidates-icon">⚠️</div>
        <h3 id="no-candidates-title">No Feasible Meeting Point Found</h3>
        <p className="no-candidates-desc">
          {warningMessage ||
            'No meeting point satisfied both riders’ travel time and maximum detour limits.'}
        </p>
        <div className="suggestion-box">
          <strong>Suggested adjustments:</strong>
          <ul>
            <li>Increase the allowed detour allowance (e.g. 25–30 mins).</li>
            <li>Select starting points that have connecting arterial corridors.</li>
            <li>Choose a shared destination accessible via common highways.</li>
          </ul>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="recommendations-section" aria-labelledby="results-title">
      <div className="results-header">
        <h2 id="results-title">Recommended Meeting Points</h2>
        <span className="results-count">{recommendations.length} options found</span>
      </div>

      <p className="ranking-explanation">
        Ranked primarily to minimize waiting time by balancing both riders’ arrival times, subject to route detour limits.
      </p>

      <div className="cards-list">
        {recommendations.map((candidate, idx) => (
          <RecommendationCard
            key={candidate.id}
            candidate={candidate}
            rank={idx + 1}
            isSelected={selectedId === candidate.id}
            onSelect={() => onSelect(candidate)}
          />
        ))}
      </div>
    </section>
  );
};
