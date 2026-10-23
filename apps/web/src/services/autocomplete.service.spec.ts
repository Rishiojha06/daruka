import { describe, it, expect } from 'vitest';
import { searchLocationSuggestions } from './autocomplete.service';

describe('AutocompleteService', () => {
  it('returns matching suggestions for Nandi Hills', async () => {
    const results = await searchLocationSuggestions('nandi');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].mainText).toContain('Nandi Hills');
    expect(results[0].coordinates.lat).toBeCloseTo(13.3702, 2);
    expect(results[0].coordinates.lng).toBeCloseTo(77.6835, 2);
  });

  it('performs case-insensitive search for Koramangala', async () => {
    const results = await searchLocationSuggestions('KORAMANGALA');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].mainText).toContain('Koramangala');
  });

  it('searches by secondary text (e.g. NH 44 / Hosur Road)', async () => {
    const results = await searchLocationSuggestions('Hosur Road');
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns empty array when query is less than 2 characters', async () => {
    const results = await searchLocationSuggestions('k');
    expect(results).toEqual([]);
  });

  it('returns empty array when no matching places exist', async () => {
    const results = await searchLocationSuggestions('xyznonexistentplacename');
    expect(results).toEqual([]);
  });
});
