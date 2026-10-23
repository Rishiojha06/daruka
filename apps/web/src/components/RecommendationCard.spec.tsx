import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationCandidate } from '@weekend-ride/shared-types';

describe('RecommendationCard', () => {
  const candidate: RecommendationCandidate = {
    id: 'cand-1',
    name: 'Shell Fuel & Cafe',
    category: 'fuel_station',
    location: { lat: 13.05, lng: 77.65 },
    travel: {
      riderASeconds: 2040, // 34 mins
      riderBSeconds: 2160, // 36 mins
      arrivalDifferenceSeconds: 120, // 2 mins
      toDestinationSeconds: 1800, // 30 mins
    },
    detour: {
      riderASeconds: 300, // 5 mins
      riderBSeconds: 240, // 4 mins
    },
    score: 12.0,
    navigationUrl: 'https://www.google.com/maps/dir/?api=1&destination=13.05,77.65',
  };

  it('renders recommendation details and formatted times', () => {
    render(
      <RecommendationCard
        candidate={candidate}
        rank={1}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Shell Fuel & Cafe')).toBeInTheDocument();
    expect(screen.getByText('fuel_station')).toBeInTheDocument();
    expect(screen.getByText('34 mins')).toBeInTheDocument();
    expect(screen.getByText('36 mins')).toBeInTheDocument();
    expect(screen.getByText('2 mins')).toBeInTheDocument();
    expect(screen.getByText('★ Best Arrival Balance')).toBeInTheDocument();
  });

  it('links to external navigation url safely', () => {
    render(
      <RecommendationCard
        candidate={candidate}
        rank={1}
        isSelected={false}
        onSelect={vi.fn()}
      />,
    );

    const navLink = screen.getByRole('link', { name: /open navigation in external maps/i });
    expect(navLink).toHaveAttribute('href', candidate.navigationUrl);
    expect(navLink).toHaveAttribute('target', '_blank');
    expect(navLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('triggers onSelect when card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <RecommendationCard
        candidate={candidate}
        rank={1}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalled();
  });
});
