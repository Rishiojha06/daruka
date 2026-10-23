import React, { useState } from 'react';
import { Coordinates, RecommendationCandidate, RouteSummary } from '@weekend-ride/shared-types';
import { LocationForm } from './components/LocationForm';
import { MapView } from './components/MapView';
import { LocationState, ActivePinTarget } from './types';
import { formatCoordinates } from './utils/coordinates';
import './App.css';

const INITIAL_LOCATION_STATE: LocationState = {
  label: '',
  coordinates: null,
  confirmed: false,
};

export const App: React.FC = () => {
  const [riderA, setRiderA] = useState<LocationState>(INITIAL_LOCATION_STATE);
  const [riderB, setRiderB] = useState<LocationState>(INITIAL_LOCATION_STATE);
  const [destination, setDestination] = useState<LocationState>(INITIAL_LOCATION_STATE);
  const [activePinTarget, setActivePinTarget] = useState<ActivePinTarget>(null);
  const [maxDetourMinutes, setMaxDetourMinutes] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [riderARoute] = useState<RouteSummary | undefined>();
  const [riderBRoute] = useState<RouteSummary | undefined>();
  const [recommendations] = useState<RecommendationCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const handleMapClickCoordinate = (coords: Coordinates) => {
    const formatted = formatCoordinates(coords);
    if (activePinTarget === 'riderA') {
      setRiderA({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
    } else if (activePinTarget === 'riderB') {
      setRiderB({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
    } else if (activePinTarget === 'destination') {
      setDestination({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
    }
  };

  const handleFindMeetingPoint = async () => {
    if (!riderA.coordinates || !riderB.coordinates || !destination.coordinates) {
      setFormError('Please select and confirm all three locations before searching.');
      return;
    }

    setFormError(null);
    setIsLoading(true);

    try {
      // In Phase 2, verify input handling & route preview prep
      // In Phase 3-5, this calls POST /api/v1/meeting-points/search
      setIsLoading(false);
    } catch {
      setIsLoading(false);
      setFormError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Weekend Ride</h1>
        <p>Motorcycle Meeting-Point Finder</p>
      </header>

      <div className="beta-disclaimer" role="note" aria-label="Beta Disclaimer">
        <strong>Notice:</strong> Motorcycle routes and arrival estimates are based on current provider data and traffic snapshots. Always verify road conditions and legal motorcycle access before riding.
      </div>

      <div className="app-main-grid">
        <div className="form-column">
          <LocationForm
            riderA={riderA}
            onRiderAChange={setRiderA}
            riderB={riderB}
            onRiderBChange={setRiderB}
            destination={destination}
            onDestinationChange={setDestination}
            activePinTarget={activePinTarget}
            onTogglePin={setActivePinTarget}
            maxDetourMinutes={maxDetourMinutes}
            onMaxDetourChange={setMaxDetourMinutes}
            isLoading={isLoading}
            onSubmit={handleFindMeetingPoint}
            formError={formError}
          />
        </div>

        <div className="map-column">
          <MapView
            riderALocation={riderA.coordinates}
            riderBLocation={riderB.coordinates}
            destinationLocation={destination.coordinates}
            activePinTarget={activePinTarget}
            onMapClickCoordinate={handleMapClickCoordinate}
            riderARoute={riderARoute}
            riderBRoute={riderBRoute}
            recommendations={recommendations}
            selectedCandidateId={selectedCandidateId}
            onSelectCandidate={(rec) => setSelectedCandidateId(rec.id)}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
