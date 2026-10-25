import React from 'react';
import { LocationInput } from './LocationInput';
import { LocationState, ActivePinTarget } from '../types';
import './LocationForm.css';

interface LocationFormProps {
  riderA: LocationState;
  onRiderAChange: (val: LocationState) => void;
  riderB: LocationState;
  onRiderBChange: (val: LocationState) => void;
  destination: LocationState;
  onDestinationChange: (val: LocationState) => void;
  activePinTarget: ActivePinTarget;
  onTogglePin: (target: ActivePinTarget) => void;
  maxDetourMinutes: number;
  onMaxDetourChange: (mins: number) => void;
  isLoading: boolean;
  onSubmit: () => void;
  formError?: string | null;
  onInputFocus?: () => void;
}

const RIDER_A_PRESETS = [
  { name: 'Whitefield', coordinates: { lat: 12.9698, lng: 77.75 } },
  { name: 'Indiranagar', coordinates: { lat: 12.9784, lng: 77.6408 } },
];

const RIDER_B_PRESETS = [
  { name: 'Koramangala', coordinates: { lat: 12.9352, lng: 77.6245 } },
  { name: 'Electronic City', coordinates: { lat: 12.8416, lng: 77.676 } },
];

const DESTINATION_PRESETS = [
  { name: 'Nandi Hills', coordinates: { lat: 13.3702, lng: 77.6835 } },
  { name: 'Avalabetta', coordinates: { lat: 13.5786, lng: 77.7712 } },
];

export const LocationForm: React.FC<LocationFormProps> = ({
  riderA,
  onRiderAChange,
  riderB,
  onRiderBChange,
  destination,
  onDestinationChange,
  activePinTarget,
  onTogglePin,
  maxDetourMinutes,
  onMaxDetourChange,
  isLoading,
  onSubmit,
  formError,
  onInputFocus,
}) => {
  const isFormValid =
    riderA.confirmed &&
    riderA.coordinates !== null &&
    riderB.confirmed &&
    riderB.coordinates !== null &&
    destination.confirmed &&
    destination.coordinates !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !isLoading) {
      onSubmit();
    }
  };

  return (
    <form className="location-form" onSubmit={handleSubmit} noValidate>
      <div className="inputs-timeline">
        <div className="inputs-container">
          <LocationInput
            id="rider-a-input"
            label="Rider A Starting Point"
            placeholder="e.g. Whitefield or 12.9698, 77.7500"
            markerLetter="A"
            markerColor="#2563eb"
            value={riderA}
            onChange={onRiderAChange}
            isPinActive={activePinTarget === 'riderA'}
            onTogglePin={() => onTogglePin(activePinTarget === 'riderA' ? null : 'riderA')}
            presets={RIDER_A_PRESETS}
            onInputFocus={onInputFocus}
          />

          <LocationInput
            id="rider-b-input"
            label="Rider B Starting Point"
            placeholder="e.g. Koramangala or 12.9352, 77.6245"
            markerLetter="B"
            markerColor="#059669"
            value={riderB}
            onChange={onRiderBChange}
            isPinActive={activePinTarget === 'riderB'}
            onTogglePin={() => onTogglePin(activePinTarget === 'riderB' ? null : 'riderB')}
            presets={RIDER_B_PRESETS}
            onInputFocus={onInputFocus}
          />

          <LocationInput
            id="destination-input"
            label="Shared Destination"
            placeholder="e.g. Nandi Hills or 13.3702, 77.6835"
            markerLetter="D"
            markerColor="#dc2626"
            value={destination}
            onChange={onDestinationChange}
            isPinActive={activePinTarget === 'destination'}
            onTogglePin={() => onTogglePin(activePinTarget === 'destination' ? null : 'destination')}
            presets={DESTINATION_PRESETS}
            onInputFocus={onInputFocus}
          />
        </div>
      </div>

      <div className="preferences-panel">
        <div className="preference-item">
          <div className="preference-header">
            <label htmlFor="detour-slider" className="preference-label">
              <span className="pref-icon">⏱️</span>
              <span>Max Added Detour per Rider:</span>
              <strong className="detour-value-badge">{maxDetourMinutes} mins</strong>
            </label>
          </div>
          <div className="slider-container">
            <input
              id="detour-slider"
              type="range"
              min="0"
              max="60"
              step="5"
              value={maxDetourMinutes}
              onChange={(e) => onMaxDetourChange(parseInt(e.target.value, 10))}
              className="detour-slider"
            />
            <div className="slider-ticks" aria-hidden="true">
              <span>0m</span>
              <span>15m (rec)</span>
              <span>30m</span>
              <span>45m</span>
              <span>60m</span>
            </div>
          </div>
          <span className="detour-hint">Default is 15 minutes. Candidates exceeding this are filtered out.</span>
        </div>
      </div>

      {formError && (
        <div className="form-error-banner" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      <div className="submit-row">
        <button
          type="submit"
          className="btn-submit"
          disabled={!isFormValid || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-dots" aria-hidden="true">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
              <span>Calculating Best Meeting Point...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">🏍️</span>
              <span>Find Meeting Point</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
