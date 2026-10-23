import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as api from './services/api';
import { MeetingPointSearchResponse } from '@weekend-ride/shared-types';

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders application header, disclaimer, and map', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /weekend ride/i })).toBeInTheDocument();
    expect(screen.getByRole('note', { name: /beta disclaimer/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /interactive route and location map/i })).toBeInTheDocument();
  });

  it('renders three distinct location input groups with labels', () => {
    render(<App />);
    expect(screen.getByRole('textbox', { name: /rider a starting point/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /rider b starting point/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /shared destination/i })).toBeInTheDocument();
  });

  it('allows user to confirm locations using presets and submit search', async () => {
    const mockResponse: MeetingPointSearchResponse = {
      status: 'ok',
      generatedAt: new Date().toISOString(),
      routes: {
        riderA: { distanceMeters: 45000, durationSeconds: 3600, geometry: [] },
        riderB: { distanceMeters: 40000, durationSeconds: 3200, geometry: [] },
      },
      recommendations: [
        {
          id: 'rec-1',
          name: 'Highway Cafe & Fuel',
          category: 'fuel_station',
          location: { lat: 13.1, lng: 77.62 },
          travel: {
            riderASeconds: 1800,
            riderBSeconds: 1800,
            arrivalDifferenceSeconds: 0,
            toDestinationSeconds: 1500,
          },
          detour: {
            riderASeconds: 180,
            riderBSeconds: 240,
          },
          score: 10.5,
          navigationUrl: 'https://maps.google.com/?destination=13.1,77.62',
        },
      ],
      warnings: [],
    };

    vi.spyOn(api, 'searchMeetingPoints').mockResolvedValue(mockResponse);

    render(<App />);

    // Click presets
    fireEvent.click(screen.getByRole('button', { name: /whitefield/i }));
    fireEvent.click(screen.getByRole('button', { name: /koramangala/i }));
    fireEvent.click(screen.getByRole('button', { name: /nandi hills/i }));

    const submitBtn = screen.getByRole('button', { name: /find meeting point/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /recommended meeting points/i })).toBeInTheDocument();
      expect(screen.getByText('Highway Cafe & Fuel')).toBeInTheDocument();
    });
  });

  it('sets coordinates on map click when pin target is active', () => {
    render(<App />);

    const pickMapBtns = screen.getAllByRole('button', { name: /pick on map/i });
    fireEvent.click(pickMapBtns[0]); // Rider A

    expect(screen.getByText(/click map to set/i)).toBeInTheDocument();

    const mapSvg = screen.getByRole('region', { name: /interactive route and location map/i });
    fireEvent.click(mapSvg, { clientX: 50, clientY: 50 });

    const riderAInput = screen.getByRole('textbox', { name: /rider a starting point/i }) as HTMLInputElement;
    expect(riderAInput.value).toContain('Map Pin');
  });
});
