import { Coordinates } from '@weekend-ride/shared-types';

export interface PlaceSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  coordinates?: Coordinates;
  placeId?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api/v1';

// Built-in indexed places in and around Bengaluru for instant, zero-latency search
// and reliable fallback when offline or running in mock provider mode
export const BENGALURU_PLACES_INDEX: (PlaceSuggestion & { coordinates: Coordinates })[] = [
  {
    id: 'blr-nandi-hills',
    mainText: 'Nandi Hills',
    secondaryText: 'Chikkaballapur, Karnataka (Popular Biker Sunrise Destination)',
    coordinates: { lat: 13.3702, lng: 77.6835 },
  },
  {
    id: 'blr-avalabetta',
    mainText: 'Avalabetta Hilltop',
    secondaryText: 'Chikkaballapur, Karnataka (Scenic Motorcycle Tour)',
    coordinates: { lat: 13.5786, lng: 77.7712 },
  },
  {
    id: 'blr-antaragange',
    mainText: 'Antaragange Caves',
    secondaryText: 'Kolar Highway / NH 75, Karnataka',
    coordinates: { lat: 13.1428, lng: 78.1009 },
  },
  {
    id: 'blr-dd-hills',
    mainText: 'Devarayanadurga (DD Hills)',
    secondaryText: 'Tumkur Road, Karnataka (Biker Hill Route)',
    coordinates: { lat: 13.3742, lng: 77.2117 },
  },
  {
    id: 'blr-whitefield',
    mainText: 'Whitefield',
    secondaryText: 'Bengaluru East, Karnataka',
    coordinates: { lat: 12.9698, lng: 77.75 },
  },
  {
    id: 'blr-koramangala',
    mainText: 'Koramangala (Sony World Signal)',
    secondaryText: 'Bengaluru South, Karnataka',
    coordinates: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: 'blr-indiranagar',
    mainText: 'Indiranagar (100 Feet Road)',
    secondaryText: 'Bengaluru East, Karnataka',
    coordinates: { lat: 12.9784, lng: 77.6408 },
  },
  {
    id: 'blr-electronic-city',
    mainText: 'Electronic City Toll Plaza',
    secondaryText: 'Hosur Road / NH 44, Bengaluru',
    coordinates: { lat: 12.8416, lng: 77.676 },
  },
  {
    id: 'blr-hsr-layout',
    mainText: 'HSR Layout (27th Main)',
    secondaryText: 'Bengaluru South, Karnataka',
    coordinates: { lat: 12.9121, lng: 77.6446 },
  },
  {
    id: 'blr-hebbal',
    mainText: 'Hebbal Flyover (Airport Road Junction)',
    secondaryText: 'Bellary Road / NH 44, Bengaluru',
    coordinates: { lat: 13.0358, lng: 77.597 },
  },
  {
    id: 'blr-yelahanka',
    mainText: 'Yelahanka Bypass (IndianOil Fuel & Cafe)',
    secondaryText: 'NH 44, Bengaluru North',
    coordinates: { lat: 13.1007, lng: 77.5963 },
  },
  {
    id: 'blr-devanahalli',
    mainText: 'Devanahalli Toll Plaza (Airport Corridor)',
    secondaryText: 'NH 44, Bengaluru Rural',
    coordinates: { lat: 13.2483, lng: 77.7126 },
  },
  {
    id: 'blr-airport',
    mainText: 'Kempegowda International Airport (BLR)',
    secondaryText: 'Airport Road / NH 44, Devanahalli',
    coordinates: { lat: 13.1986, lng: 77.7066 },
  },
  {
    id: 'blr-mg-road',
    mainText: 'MG Road / Trinity Circle',
    secondaryText: 'Central Bengaluru, Karnataka',
    coordinates: { lat: 12.9756, lng: 77.6097 },
  },
  {
    id: 'blr-jayanagar',
    mainText: 'Jayanagar 4th Block',
    secondaryText: 'Bengaluru South, Karnataka',
    coordinates: { lat: 12.9299, lng: 77.5824 },
  },
  {
    id: 'blr-jp-nagar',
    mainText: 'JP Nagar (Brigade Millennium / 24th Main)',
    secondaryText: 'Bengaluru South, Karnataka',
    coordinates: { lat: 12.8918, lng: 77.5855 },
  },
  {
    id: 'blr-banashankari',
    mainText: 'Banashankari (Temple / Ring Road)',
    secondaryText: 'Bengaluru South, Karnataka',
    coordinates: { lat: 12.9255, lng: 77.5468 },
  },
  {
    id: 'blr-nice-road-bannerghatta',
    mainText: 'NICE Road Bannerghatta Toll',
    secondaryText: 'NICE Peripheral Ring Road, Bengaluru',
    coordinates: { lat: 12.8682, lng: 77.5902 },
  },
  {
    id: 'blr-nice-road-kanakapura',
    mainText: 'NICE Road Kanakapura Interchange',
    secondaryText: 'Kanakapura Road / NH 948, Bengaluru',
    coordinates: { lat: 12.8719, lng: 77.5401 },
  },
  {
    id: 'blr-kanakapura-aol',
    mainText: 'Kanakapura Road (Art of Living Ashram)',
    secondaryText: 'NH 948, Bengaluru South',
    coordinates: { lat: 12.7915, lng: 77.5085 },
  },
  {
    id: 'blr-mysore-road-toll',
    mainText: 'Mysore Road (Kengeri / Expressway Entry)',
    secondaryText: 'NH 275, Bengaluru West',
    coordinates: { lat: 12.8984, lng: 77.4817 },
  },
  {
    id: 'blr-tumkur-road-nelamangala',
    mainText: 'Nelamangala Toll Plaza',
    secondaryText: 'Tumkur Road / NH 48, Bengaluru North-West',
    coordinates: { lat: 13.0975, lng: 77.3879 },
  },
  {
    id: 'blr-silk-board',
    mainText: 'Central Silk Board Junction',
    secondaryText: 'Hosur Road / Outer Ring Road, Bengaluru',
    coordinates: { lat: 12.9176, lng: 77.6238 },
  },
  {
    id: 'blr-marathahalli',
    mainText: 'Marathahalli Bridge',
    secondaryText: 'Outer Ring Road, Bengaluru East',
    coordinates: { lat: 12.9569, lng: 77.7011 },
  },
  {
    id: 'blr-bellandur',
    mainText: 'Bellandur (EcoSpace / Outer Ring Road)',
    secondaryText: 'Bengaluru South-East, Karnataka',
    coordinates: { lat: 12.926, lng: 77.6762 },
  },
  {
    id: 'blr-bannerghatta-np',
    mainText: 'Bannerghatta National Park',
    secondaryText: 'Bannerghatta Road, Bengaluru South',
    coordinates: { lat: 12.8009, lng: 77.5777 },
  },
  {
    id: 'blr-sarjapur-road',
    mainText: 'Sarjapur Road / Wipro Gate',
    secondaryText: 'Bengaluru South-East, Karnataka',
    coordinates: { lat: 12.9102, lng: 77.6834 },
  },
  {
    id: 'blr-kr-puram',
    mainText: 'KR Puram (Hanging Bridge / Tin Factory)',
    secondaryText: 'Old Madras Road / Outer Ring Road, Bengaluru East',
    coordinates: { lat: 12.9982, lng: 77.6775 },
  },
  {
    id: 'blr-hoskote',
    mainText: 'Hoskote Toll Plaza (Highway Breakfast Hub)',
    secondaryText: 'NH 75, Bengaluru Rural',
    coordinates: { lat: 13.0712, lng: 77.7981 },
  },
  {
    id: 'blr-malleshwaram',
    mainText: 'Malleshwaram (8th Main)',
    secondaryText: 'Bengaluru West, Karnataka',
    coordinates: { lat: 13.0031, lng: 77.5702 },
  },
  {
    id: 'blr-rajajinagar',
    mainText: 'Rajajinagar (Orion Mall / 1st Block)',
    secondaryText: 'Bengaluru West, Karnataka',
    coordinates: { lat: 13.0111, lng: 77.555 },
  },
  {
    id: 'blr-yeshwanthpur',
    mainText: 'Yeshwanthpur Junction / Flyover',
    secondaryText: 'Tumkur Road, Bengaluru North-West',
    coordinates: { lat: 13.0238, lng: 77.5501 },
  },
];

/**
 * Searches location suggestions matching the query.
 * 1. Calls backend Places Autocomplete proxy (uses Server key with Places API New enabled).
 * 2. Falls back to built-in Bengaluru index for offline or instant matching.
 */
export async function searchLocationSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // In test / jsdom environments, use local deterministic index directly
  const isTestEnv =
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
    (typeof navigator !== 'undefined' && navigator.userAgent?.includes('jsdom'));

  if (!isTestEnv) {
    // 1. Query Backend Places Autocomplete Proxy
    try {
      const res = await fetch(`${API_BASE_URL}/places/autocomplete?input=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          return data.suggestions.map((s: { id: string; placeId?: string; mainText: string; secondaryText: string }) => ({
            id: s.id || s.placeId || Math.random().toString(),
            placeId: s.placeId || s.id,
            mainText: s.mainText,
            secondaryText: s.secondaryText,
          }));
        }
      }
    } catch {
      // Backend offline or in transit; fall through to local index
    }
  }

  // 2. Query built-in local index
  const lowerQuery = trimmed.toLowerCase();
  const searchWords = lowerQuery.split(/\s+/).filter(Boolean);

  return BENGALURU_PLACES_INDEX.filter((place) => {
    const text = `${place.mainText} ${place.secondaryText}`.toLowerCase();
    return searchWords.every((word) => text.includes(word));
  }).slice(0, 5);
}

/**
 * Resolves exact coordinates for a selected suggestion.
 * 1. Returns embedded coordinates if already present (e.g. from local index).
 * 2. Queries backend Place Details (powered by server key with Places API New).
 * 3. Falls back to default Bengaluru central coordinates.
 */
export async function resolveSuggestionCoordinates(suggestion: PlaceSuggestion): Promise<Coordinates> {
  if (suggestion.coordinates) {
    return suggestion.coordinates;
  }

  if (suggestion.placeId) {
    try {
      const res = await fetch(`${API_BASE_URL}/places/details/${encodeURIComponent(suggestion.placeId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.details?.location) {
          return {
            lat: data.details.location.lat,
            lng: data.details.location.lng,
          };
        }
      }
    } catch {
      // Backend details query failed; fallback
    }
  }

  // Default coordinate if unresolved
  return { lat: 12.9716, lng: 77.5946 };
}
