import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocationInput } from './LocationInput';

describe('LocationInput', () => {
  const defaultProps = {
    id: 'test-input',
    label: 'Rider A Start',
    placeholder: 'Enter coordinates',
    markerLetter: 'A',
    markerColor: '#2563eb',
    value: { label: '', coordinates: null, confirmed: false },
    onChange: vi.fn(),
    isPinActive: false,
    onTogglePin: vi.fn(),
    presets: [{ name: 'Whitefield', coordinates: { lat: 12.9698, lng: 77.75 } }],
  };

  it('renders label, input, and actions', () => {
    render(<LocationInput {...defaultProps} />);
    expect(screen.getByRole('textbox', { name: /rider a start/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /use my current location/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pick on map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /whitefield/i })).toBeInTheDocument();
  });

  it('parses manual coordinates and confirms', () => {
    const onChange = vi.fn();
    render(<LocationInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/enter coordinates/i);
    fireEvent.change(input, { target: { value: '12.9698, 77.7500' } });

    expect(onChange).toHaveBeenCalledWith({
      label: '12.9698, 77.7500',
      coordinates: { lat: 12.9698, lng: 77.75 },
      confirmed: true,
      error: undefined,
    });
  });

  it('shows error message for non-coordinate text', () => {
    const onChange = vi.fn();
    render(<LocationInput {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText(/enter coordinates/i);
    fireEvent.change(input, { target: { value: 'some random text' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmed: false,
        error: expect.stringContaining('Enter valid coordinates'),
      }),
    );
  });

  it('selects preset when preset chip is clicked', () => {
    const onChange = vi.fn();
    render(<LocationInput {...defaultProps} onChange={onChange} />);

    const presetBtn = screen.getByRole('button', { name: /whitefield/i });
    fireEvent.click(presetBtn);

    expect(onChange).toHaveBeenCalledWith({
      label: 'Whitefield',
      coordinates: { lat: 12.9698, lng: 77.75 },
      confirmed: true,
      error: undefined,
    });
  });

  it('triggers pin toggle when Pick on Map button is clicked', () => {
    const onTogglePin = vi.fn();
    render(<LocationInput {...defaultProps} onTogglePin={onTogglePin} />);

    const pinBtn = screen.getByRole('button', { name: /pick on map/i });
    fireEvent.click(pinBtn);

    expect(onTogglePin).toHaveBeenCalled();
  });

  it('handles explicit GPS click and geolocation callback', () => {
    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 12.9352,
          longitude: 77.6245,
        },
      });
    });

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    const onChange = vi.fn();
    render(<LocationInput {...defaultProps} onChange={onChange} />);

    const gpsBtn = screen.getByRole('button', { name: /use my current location/i });
    fireEvent.click(gpsBtn);

    expect(mockGetCurrentPosition).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmed: true,
        coordinates: { lat: 12.9352, lng: 77.6245 },
      }),
    );
  });

  it('displays user-friendly error when GPS permission is denied', () => {
    const mockGetCurrentPosition = vi.fn((_, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        PERMISSION_DENIED: 1,
      });
    });

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    render(<LocationInput {...defaultProps} />);
    const gpsBtn = screen.getByRole('button', { name: /use my current location/i });
    fireEvent.click(gpsBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/location permission was denied/i);
  });
});
