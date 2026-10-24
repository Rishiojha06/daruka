import { Coordinates } from '@weekend-ride/shared-types';
import { loadGoogleMaps } from './google-maps-loader';

export interface PlaceSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  coordinates?: Coordinates;
  placeId?: string;
}

// Session token to group autocomplete keystrokes and place details for Google billing optimization
let currentSessionToken: google.maps.places.AutocompleteSessionToken | null = null;

// Built-in indexed places in and around Bengaluru for instant, zero-latency search
// and reliable fallback when offline or running without a live Google API key
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
 * 1. Checks modern Google Places Autocomplete (AutocompleteSuggestion - March 2025 standard).
 * 2. Falls back to legacy Google Places Autocomplete (AutocompleteService).
 * 3. Falls back to built-in Bengaluru index for instant/offline results.
 */
export async function searchLocationSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Try Google Maps Places Autocomplete if available
  try {
    const google = await loadGoogleMaps();
    if (google?.maps?.places) {
      // 1A. Modern Places API (March 2025+ standard)
      if (typeof google.maps.places.AutocompleteSuggestion?.fetchAutocompleteSuggestions === 'function') {
        const modernResults = await queryModernGoogleAutocomplete(trimmed, google);
        if (modernResults.length > 0) {
          return modernResults;
        }
      }

      // 1B. Legacy Places API fallback (older projects)
      if (typeof google.maps.places.AutocompleteService === 'function') {
        const legacyResults = await queryLegacyGoogleAutocomplete(trimmed, google);
        if (legacyResults.length > 0) {
          return legacyResults;
        }
      }
    }
  } catch {
    // Google Maps unavailable or key invalid; smoothly proceed to local index
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
 * 2. Uses modern Google Places API Place class (fetchFields).
 * 3. Uses Geocoder fallback.
 */
export async function resolveSuggestionCoordinates(suggestion: PlaceSuggestion): Promise<Coordinates> {
  if (suggestion.coordinates) {
    return suggestion.coordinates;
  }

  if (suggestion.placeId) {
    try {
      const google = await loadGoogleMaps();
      // 1. Modern Places API Place class
      if (google?.maps?.places?.Place) {
        const place = new google.maps.places.Place({
          id: suggestion.placeId,
          requestedLanguage: 'en',
        });
        await place.fetchFields({
          fields: ['location', 'displayName', 'formattedAddress'],
        });
        if (place.location) {
          currentSessionToken = null; // Reset session after selection
          return {
            lat: Number(place.location.lat().toFixed(6)),
            lng: Number(place.location.lng().toFixed(6)),
          };
        }
      }

      // 2. Geocoder fallback
      if (google?.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({ placeId: suggestion.placeId });
        if (response.results && response.results[0]?.geometry?.location) {
          const loc = response.results[0].geometry.location;
          currentSessionToken = null;
          return {
            lat: Number(loc.lat().toFixed(6)),
            lng: Number(loc.lng().toFixed(6)),
          };
        }
      }
    } catch (err) {
      console.warn('Could not resolve place coordinates via Google API:', err);
    }
  }

  // Default coordinate if unresolved
  return { lat: 12.9716, lng: 77.5946 };
}

/**
 * Modern Google Places Autocomplete using AutocompleteSuggestion (March 2025 standard).
 */
async function queryModernGoogleAutocomplete(
  input: string,
  google: typeof window.google,
): Promise<PlaceSuggestion[]> {
  const places = google?.maps?.places;
  if (!places || typeof places.AutocompleteSuggestion?.fetchAutocompleteSuggestions !== 'function') {
    return [];
  }

  const { AutocompleteSuggestion, AutocompleteSessionToken } = places;

  if (!currentSessionToken && AutocompleteSessionToken) {
    currentSessionToken = new AutocompleteSessionToken();
  }

  const request: google.maps.places.AutocompleteRequest = {
    input,
    includedRegionCodes: ['in'],
    origin: { lat: 12.9716, lng: 77.5946 }, // Proximity bias for Bengaluru region
    ...(currentSessionToken ? { sessionToken: currentSessionToken } : {}),
  };

  try {
    const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    if (!response?.suggestions || response.suggestions.length === 0) {
      return [];
    }

    const results: PlaceSuggestion[] = [];
    for (const s of response.suggestions.slice(0, 5)) {
      const pred = s.placePrediction;
      if (pred) {
        results.push({
          id: pred.placeId,
          placeId: pred.placeId,
          mainText: pred.mainText?.toString() || pred.text?.toString() || input,
          secondaryText: pred.secondaryText?.toString() || '',
        });
      }
    }

    return results;
  } catch (err) {
    console.debug('AutocompleteSuggestion.fetchAutocompleteSuggestions failed:', err);
    return [];
  }
}

/**
 * Legacy Google Places Autocomplete using AutocompleteService (for older projects).
 */
function queryLegacyGoogleAutocomplete(
  input: string,
  google: typeof window.google,
): Promise<PlaceSuggestion[]> {
  return new Promise((resolve) => {
    if (!google?.maps?.places?.AutocompleteService) {
      resolve([]);
      return;
    }

    try {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'in' },
        },
        (predictions, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            resolve([]);
            return;
          }

          const suggestions: PlaceSuggestion[] = predictions.slice(0, 5).map((pred) => ({
            id: pred.place_id,
            placeId: pred.place_id,
            mainText: pred.structured_formatting?.main_text || pred.description,
            secondaryText: pred.structured_formatting?.secondary_text || '',
          }));

          resolve(suggestions);
        },
      );
    } catch {
      resolve([]);
    }
  });
}
