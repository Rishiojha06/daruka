import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
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

  it('allows user to confirm locations using presets', () => {
    render(<App />);

    // Click Rider A preset (Whitefield)
    const whitefieldBtn = screen.getByRole('button', { name: /whitefield/i });
    fireEvent.click(whitefieldBtn);

    // Click Rider B preset (Koramangala)
    const koramangalaBtn = screen.getByRole('button', { name: /koramangala/i });
    fireEvent.click(koramangalaBtn);

    // Click Destination preset (Nandi Hills)
    const nandiHillsBtn = screen.getByRole('button', { name: /nandi hills/i });
    fireEvent.click(nandiHillsBtn);

    // Find Meeting Point should now be enabled
    const submitBtn = screen.getByRole('button', { name: /find meeting point/i });
    expect(submitBtn).toBeEnabled();
  });

  it('sets coordinates on map click when pin target is active', () => {
    render(<App />);

    // Activate pin pick for Rider A
    const pickMapBtns = screen.getAllByRole('button', { name: /pick on map/i });
    fireEvent.click(pickMapBtns[0]); // Rider A

    // Notice appears
    expect(screen.getByText(/click map to set/i)).toBeInTheDocument();

    // Click map
    const mapSvg = screen.getByRole('region', { name: /interactive route and location map/i });
    fireEvent.click(mapSvg, { clientX: 50, clientY: 50 });

    // Rider A input now shows Map Pin coordinates
    const riderAInput = screen.getByRole('textbox', { name: /rider a starting point/i }) as HTMLInputElement;
    expect(riderAInput.value).toContain('Map Pin');
  });
});
