export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiderInput {
  id: string;
  location: Coordinates;
  label?: string;
}

export interface SearchPreferences {
  priority: 'balanced_arrival';
  maxDetourMinutes?: number;
  limit?: number;
}

export interface MeetingPointSearchRequest {
  riders: [RiderInput, RiderInput];
  destination: Coordinates;
  preferences?: SearchPreferences;
}

export interface RouteSummary {
  distanceMeters: number;
  durationSeconds: number;
  geometry?: Coordinates[];
  encodedPolyline?: string;
}

export interface CandidateTravelSummary {
  riderASeconds: number;
  riderBSeconds: number;
  arrivalDifferenceSeconds: number;
  toDestinationSeconds?: number;
}

export interface CandidateDetourSummary {
  riderASeconds: number;
  riderBSeconds: number;
}

export interface RecommendationCandidate {
  id: string;
  name?: string;
  category?: string;
  location: Coordinates;
  travel: CandidateTravelSummary;
  detour: CandidateDetourSummary;
  score: number;
  navigationUrl: string;
}

export interface WarningNotice {
  code: string;
  message: string;
}

export interface MeetingPointSearchResponse {
  status: 'ok' | 'no_candidates' | 'error';
  generatedAt?: string;
  routes?: {
    riderA?: RouteSummary;
    riderB?: RouteSummary;
  };
  recommendations: RecommendationCandidate[];
  warnings?: WarningNotice[];
  error?: {
    code: string;
    message: string;
  };
  requestId?: string;
}
