import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendationList } from './RecommendationList';
import { RecommendationCandidate } from '@weekend-ride/shared-types';

describe('RecommendationList', () => {
  const candidates: RecommendationCandidate[] = [
    {
      id: 'rec-1',
      name: 'Stop One',
      category: 'cafe',
      location: { lat: 13.0, lng: 77.6 },
      travel: {
        riderASeconds: 1800,
        riderBSeconds: 1800,
        arrivalDifferenceSeconds: 0,
        toDestinationSeconds: 1200,
      },
      detour: { riderASeconds: 120, riderBSeconds: 120 },
      score: 10,
      navigationUrl: 'https://example.com/1',
    },
  ];

  it('renders nothing when status is idle', () => {
    const { container } = render(
      <RecommendationList
        recommendations={[]}
        status="idle"
        selectedId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders actionable no-candidates notice when no candidate meets constraints', () => {
    render(
      <RecommendationList
        recommendations={[]}
        status="no_candidates"
        selectedId={null}
        onSelect={vi.fn()}
        warningMessage="No meeting point met the current detour constraints."
      />,
    );

    expect(screen.getByRole('heading', { name: /no feasible meeting point found/i })).toBeInTheDocument();
    expect(screen.getByText(/suggested adjustments:/i)).toBeInTheDocument();
    expect(screen.getByText(/increase the allowed detour allowance/i)).toBeInTheDocument();
  });

  it('renders list of recommendation cards when candidates exist', () => {
    render(
      <RecommendationList
        recommendations={candidates}
        status="ok"
        selectedId="rec-1"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /recommended meeting points/i })).toBeInTheDocument();
    expect(screen.getByText('Stop One')).toBeInTheDocument();
  });
});
