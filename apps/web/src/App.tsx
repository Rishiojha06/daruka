import React, { useState } from 'react';
import {
  Coordinates,
  MeetingPointSearchRequest,
  RecommendationCandidate,
  RouteSummary,
} from '@weekend-ride/shared-types';
import { LocationForm } from './components/LocationForm';
import { MapView } from './components/MapView';
import { RecommendationList } from './components/RecommendationList';
import { searchMeetingPoints } from './services/api';
import { ActivePinTarget, LocationState } from './types';
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

  const [searchStatus, setSearchStatus] = useState<'idle' | 'ok' | 'no_candidates' | 'error'>('idle');
  const [warningMessage, setWarningMessage] = useState<string | undefined>();
  const [riderARoute, setRiderARoute] = useState<RouteSummary | undefined>();
  const [riderBRoute, setRiderBRoute] = useState<RouteSummary | undefined>();
  const [recommendations, setRecommendations] = useState<RecommendationCandidate[]>([]);
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
    setSearchStatus('idle');

    const requestPayload: MeetingPointSearchRequest = {
      riders: [
        { id: 'rider-a', location: riderA.coordinates, label: riderA.label },
        { id: 'rider-b', location: riderB.coordinates, label: riderB.label },
      ],
      destination: destination.coordinates,
      preferences: {
        priority: 'balanced_arrival',
        maxDetourMinutes,
        limit: 3,
      },
    };

    try {
      const response = await searchMeetingPoints(requestPayload);
      setIsLoading(false);

      if (response.routes?.riderA) setRiderARoute(response.routes.riderA);
      if (response.routes?.riderB) setRiderBRoute(response.routes.riderB);

      if (response.status === 'ok') {
        setSearchStatus('ok');
        setRecommendations(response.recommendations);
        if (response.recommendations.length > 0) {
          setSelectedCandidateId(response.recommendations[0].id);
        }
      } else if (response.status === 'no_candidates') {
        setSearchStatus('no_candidates');
        setRecommendations([]);
        setSelectedCandidateId(null);
        setWarningMessage(response.warnings?.[0]?.message);
      }
    } catch (err) {
      setIsLoading(false);
      setSearchStatus('error');
      setFormError((err as Error).message || 'Unable to retrieve meeting points. Please try again.');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Daruka</h1>
        <p>Motorcycle Meeting-Point Finder</p>
      </header>

      <div className="beta-disclaimer" role="note" aria-label="Beta Disclaimer">
        <strong>Notice:</strong> Motorcycle routes and arrival estimates are based on current provider data and road network data. Always verify road conditions and legal motorcycle access before riding.
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

          <RecommendationList
            recommendations={recommendations}
            status={searchStatus}
            selectedId={selectedCandidateId}
            onSelect={(rec) => setSelectedCandidateId(rec.id)}
            warningMessage={warningMessage}
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
