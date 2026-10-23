import React, { useEffect, useRef, useState } from 'react';
import { Coordinates } from '@weekend-ride/shared-types';
import {
  PlaceSuggestion,
  resolveSuggestionCoordinates,
  searchLocationSuggestions,
} from '../services/autocomplete.service';
import { LocationState } from '../types';
import { formatCoordinates, parseCoordinates } from '../utils/coordinates';
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
  placeholder = 'Search place (e.g. Indiranagar, Nandi Hills) or enter address',
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

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const parsedCoords = parseCoordinates(text);

    if (parsedCoords) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      onChange({
        label: text,
        coordinates: parsedCoords,
        confirmed: true,
        error: undefined,
      });
      return;
    }

    onChange({
      label: text,
      coordinates: null,
      confirmed: false,
      error: undefined,
    });

    if (text.trim().length >= 2) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        const results = await searchLocationSuggestions(text);
        setSuggestions(results);
        setIsDropdownOpen(results.length > 0);
        setHighlightedIndex(-1);
      }, 150);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setIsDropdownOpen(false);
    setSuggestions([]);
    const coords = await resolveSuggestionCoordinates(suggestion);
    onChange({
      label: suggestion.mainText,
      coordinates: coords,
      confirmed: true,
      error: undefined,
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        await handleSuggestionSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handlePresetSelect = (preset: PresetOption) => {
    onChange({
      label: preset.name,
      coordinates: preset.coordinates,
      confirmed: true,
      error: undefined,
    });
    setIsDropdownOpen(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setIsDropdownOpen(false);

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
    setSuggestions([]);
    setIsDropdownOpen(false);
    onChange({
      label: '',
      coordinates: null,
      confirmed: false,
    });
  };

  return (
    <div className="location-input-group" ref={wrapperRef}>
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
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !value.confirmed) {
              setIsDropdownOpen(true);
            }
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isDropdownOpen}
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

        {/* Autocomplete Dropdown List */}
        {isDropdownOpen && suggestions.length > 0 && (
          <ul
            className="autocomplete-dropdown"
            role="listbox"
            aria-label={`Location suggestions for ${label}`}
          >
            {suggestions.map((suggestion, index) => {
              const isHighlighted = highlightedIndex === index;
              return (
                <li
                  key={suggestion.id}
                  className={`autocomplete-item ${isHighlighted ? 'item-highlighted' : ''}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="item-icon" aria-hidden="true">
                    📍
                  </span>
                  <div className="item-text-group">
                    <span className="item-main">{suggestion.mainText}</span>
                    {suggestion.secondaryText && (
                      <span className="item-sub">{suggestion.secondaryText}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
