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

type MobileSheetState = 'peek' | 'mid' | 'full';
type ActiveTab = 'form' | 'results';

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

  // Modern UI/UX state
  const [sheetState, setSheetState] = useState<MobileSheetState>('mid');
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');

  const handleMapClickCoordinate = (coords: Coordinates) => {
    const formatted = formatCoordinates(coords);
    if (activePinTarget === 'riderA') {
      setRiderA({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
      setSheetState('mid');
    } else if (activePinTarget === 'riderB') {
      setRiderB({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
      setSheetState('mid');
    } else if (activePinTarget === 'destination') {
      setDestination({
        label: `Map Pin (${formatted})`,
        coordinates: coords,
        confirmed: true,
      });
      setActivePinTarget(null);
      setSheetState('mid');
    }
  };

  const handleTogglePin = (target: ActivePinTarget) => {
    setActivePinTarget(target);
    // When user activates "Pick on Map", minimize sheet to peek state on mobile so the map is visible
    if (target !== null) {
      setSheetState('peek');
    } else {
      setSheetState('mid');
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
        setActiveTab('results');
        setSheetState('mid');
      } else if (response.status === 'no_candidates') {
        setSearchStatus('no_candidates');
        setRecommendations([]);
        setSelectedCandidateId(null);
        setWarningMessage(response.warnings?.[0]?.message);
        setActiveTab('results');
        setSheetState('mid');
      }
    } catch (err) {
      setIsLoading(false);
      setSearchStatus('error');
      setFormError((err as Error).message || 'Unable to retrieve meeting points. Please try again.');
    }
  };

  const toggleSheetState = () => {
    setSheetState((prev) => (prev === 'peek' ? 'mid' : prev === 'mid' ? 'full' : 'peek'));
  };

  return (
    <div className="app-container">
      {/* Mobile Map Toggle FAB button */}
      <button
        type="button"
        className="mobile-map-toggle-fab"
        onClick={() => setSheetState((prev) => (prev === 'peek' ? 'mid' : 'peek'))}
        aria-label="Toggle map view"
      >
        <span>{sheetState === 'peek' ? '📋 Open Planner' : '🗺️ View Map'}</span>
      </button>

      <div className="app-main-grid">
        {/* Left Floating Sidebar / Bottom Sheet */}
        <div className={`form-column sheet-${sheetState}`}>
          {/* Mobile Drag Handle */}
          <div
            className="mobile-drag-handle"
            onClick={toggleSheetState}
            aria-label="Toggle sheet height"
            role="button"
            tabIndex={0}
          >
            <div className="handle-bar"></div>
          </div>

          {/* Collapsed Peek Summary Header for Mobile */}
          {sheetState === 'peek' && (
            <div className="peek-summary" onClick={() => setSheetState('mid')}>
              <div className="peek-title">
                <span>🏍️</span>
                <span>
                  {recommendations.length > 0
                    ? `Found ${recommendations.length} Meeting Points`
                    : 'Plan Meeting Point'}
                </span>
              </div>
              <span className="peek-btn">Expand ↑</span>
            </div>
          )}

          <div className="sidebar-scroll-container">
            <header className="app-header">
              <div className="brand-group">
                <span className="brand-icon" aria-hidden="true">🏍️</span>
                <div className="brand-text">
                  <h1>Daruka</h1>
                  <p>Motorcycle Meeting-Point Finder</p>
                </div>
              </div>
              <span className="brand-badge">2-Wheeler</span>
            </header>

            <div className="beta-disclaimer" role="note" aria-label="Beta Disclaimer">
              <strong>Notice:</strong> Motorcycle routes and arrival estimates are based on current provider data and road network data. Always verify road conditions and legal motorcycle access before riding.
            </div>

            {/* View Switcher Tabs (Visible when results or search active) */}
            {recommendations.length > 0 && (
              <div className="view-tabs" role="tablist" aria-label="Planner views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'form'}
                  className={`tab-btn ${activeTab === 'form' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('form')}
                >
                  <span>✏️ Route Plan</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'results'}
                  className={`tab-btn ${activeTab === 'results' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('results')}
                >
                  <span>⭐ Recommendations</span>
                  <span className="tab-badge">{recommendations.length}</span>
                </button>
              </div>
            )}

            {/* Content Display: Always render Form and Recommendations so test suites can query them,
                use CSS/display to hide when tab is switched */}
            <div style={{ display: recommendations.length > 0 && activeTab === 'results' ? 'none' : 'block' }}>
              <LocationForm
                riderA={riderA}
                onRiderAChange={setRiderA}
                riderB={riderB}
                onRiderBChange={setRiderB}
                destination={destination}
                onDestinationChange={setDestination}
                activePinTarget={activePinTarget}
                onTogglePin={handleTogglePin}
                maxDetourMinutes={maxDetourMinutes}
                onMaxDetourChange={setMaxDetourMinutes}
                isLoading={isLoading}
                onSubmit={handleFindMeetingPoint}
                formError={formError}
                onInputFocus={() => setSheetState('full')}
              />
            </div>

            <div style={{ display: recommendations.length > 0 && activeTab === 'form' ? 'none' : 'block' }}>
              <RecommendationList
                recommendations={recommendations}
                status={searchStatus}
                selectedId={selectedCandidateId}
                onSelect={(rec) => {
                  setSelectedCandidateId(rec.id);
                  // On mobile, minimize to mid so the selected pin and route are prominent on map
                  setSheetState('mid');
                }}
                warningMessage={warningMessage}
              />
            </div>
          </div>
        </div>

        {/* Right Map Canvas fills entire viewport */}
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
            onSelectCandidate={(rec) => {
              setSelectedCandidateId(rec.id);
              setActiveTab('results');
              setSheetState('mid');
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
