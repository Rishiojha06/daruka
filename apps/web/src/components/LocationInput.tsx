import React, { useState } from 'react';
import { Coordinates } from '@weekend-ride/shared-types';
import { LocationState } from '../types';
import { parseCoordinates, formatCoordinates } from '../utils/coordinates';
import './LocationInput.css';

interface PresetOption {
  name: string;
  coordinates: Coordinates;
}

interface LocationInputProps {
  id: string;
  label: string;
  placeholder?: string;
  markerLetter: string;
  markerColor: string;
  value: LocationState;
  onChange: (value: LocationState) => void;
  isPinActive: boolean;
  onTogglePin: () => void;
  presets?: PresetOption[];
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  placeholder = 'Enter address or lat, lng',
  markerLetter,
  markerColor,
  value,
  onChange,
  isPinActive,
  onTogglePin,
  presets = [],
}) => {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const parsed = parseCoordinates(text);

    if (parsed) {
      onChange({
        label: text,
        coordinates: parsed,
        confirmed: true,
        error: undefined,
      });
    } else {
      onChange({
        label: text,
        coordinates: null,
        confirmed: false,
        error: text.trim().length > 0 ? 'Enter valid coordinates (e.g. 12.9716, 77.5946) or pick a preset' : undefined,
      });
    }
  };

  const handlePresetSelect = (preset: PresetOption) => {
    onChange({
      label: preset.name,
      coordinates: preset.coordinates,
      confirmed: true,
      error: undefined,
    });
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const coords: Coordinates = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        onChange({
          label: `GPS (${formatCoordinates(coords)})`,
          coordinates: coords,
          confirmed: true,
          error: undefined,
        });
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. Enter coordinates manually or select on the map.');
        } else {
          setGeoError('Unable to retrieve location. Please enter manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleClear = () => {
    setGeoError(null);
    onChange({
      label: '',
      coordinates: null,
      confirmed: false,
    });
  };

  return (
    <div className="location-input-group">
      <div className="location-header">
        <label htmlFor={id} className="location-label">
          <span
            className="marker-badge"
            style={{ backgroundColor: markerColor }}
            aria-hidden="true"
          >
            {markerLetter}
          </span>
          <span className="location-title">{label}</span>
        </label>
        {value.confirmed && value.coordinates && (
          <span className="confirmed-pill" title={formatCoordinates(value.coordinates)}>
            ✓ {formatCoordinates(value.coordinates)}
          </span>
        )}
      </div>

      <div className="input-row">
        <input
          id={id}
          type="text"
          className={`location-text-input ${value.error ? 'input-error' : ''}`}
          placeholder={placeholder}
          value={value.label}
          onChange={handleTextChange}
          aria-describedby={value.error ? `${id}-error` : undefined}
        />
        {value.label && (
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            aria-label={`Clear ${label}`}
          >
            ✕
          </button>
        )}
      </div>

      <div className="action-row">
        <button
          type="button"
          className="btn-action btn-geo"
          onClick={handleGeolocation}
          disabled={geoLoading}
          aria-label={`Use my current location for ${label}`}
        >
          {geoLoading ? 'Detecting...' : '📍 GPS'}
        </button>

        <button
          type="button"
          className={`btn-action btn-pin ${isPinActive ? 'btn-pin-active' : ''}`}
          onClick={onTogglePin}
          aria-pressed={isPinActive}
        >
          {isPinActive ? '📍 Click Map to Place' : '📌 Pick on Map'}
        </button>

        {presets.length > 0 && (
          <div className="preset-chips" role="group" aria-label={`Presets for ${label}`}>
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="chip-btn"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {geoError && (
        <p className="geo-error-msg" role="alert">
          {geoError}
        </p>
      )}

      {value.error && (
        <p id={`${id}-error`} className="validation-error-msg" role="alert">
          {value.error}
        </p>
      )}
    </div>
  );
};
