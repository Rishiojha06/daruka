import { describe, it, expect } from 'vitest';
import { parseCoordinates, isValidCoordinate, formatCoordinates } from './coordinates';

describe('Coordinate Utilities', () => {
  it('parses valid comma-separated coordinates', () => {
    const result = parseCoordinates('12.9698, 77.7500');
    expect(result).toEqual({ lat: 12.9698, lng: 77.75 });
  });

  it('parses coordinates without space', () => {
    const result = parseCoordinates('12.9698,77.7500');
    expect(result).toEqual({ lat: 12.9698, lng: 77.75 });
  });

  it('rejects coordinates out of bounds', () => {
    expect(parseCoordinates('95.0, 77.0')).toBeNull();
    expect(parseCoordinates('12.0, 190.0')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(parseCoordinates('Bengaluru, Karnataka')).toBeNull();
  });

  it('formats coordinates correctly', () => {
    expect(formatCoordinates({ lat: 12.969812, lng: 77.750034 })).toBe('12.9698, 77.7500');
  });

  it('validates coordinates accurately', () => {
    expect(isValidCoordinate({ lat: 12.0, lng: 77.0 })).toBe(true);
    expect(isValidCoordinate({ lat: -91, lng: 77.0 })).toBe(false);
  });
});
