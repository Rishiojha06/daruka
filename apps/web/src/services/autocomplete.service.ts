import { Coordinates } from '@weekend-ride/shared-types';

export interface PlaceSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  coordinates: Coordinates;
}

// Built-in indexed places in and around Bengaluru for instant, zero-latency search
// and reliable fallback when offline or running without a live Google API key
export const BENGALURU_PLACES_INDEX: PlaceSuggestion[] = [
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
    id: 'blr-mysore-road-toll',
    mainText: 'Mysore Road (Kengeri / Bengaluru-Mysuru Expressway Entry)',
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
];

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoogleGeocodeResult {
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface GoogleMapsNamespace {
  maps?: {
    places?: {
      AutocompleteService: new () => {
        getPlacePredictions: (
          request: { input: string; componentRestrictions?: { country: string } },
          callback: (predictions: GoogleAutocompletePrediction[] | null, status: string) => void,
        ) => void;
      };
    };
    Geocoder: new () => {
      geocode: (
        request: { placeId: string },
        callback: (results: GoogleGeocodeResult[] | null, status: string) => void,
      ) => void;
    };
  };
}

/**
 * Searches location suggestions matching the query.
 * If Google Maps Places Autocomplete is available in the window, queries it.
 * Otherwise, searches the built-in Bengaluru landmarks index.
 */
export async function searchLocationSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  // 1. Check if Google Maps JS SDK Places library is loaded on window
  const google = (window as unknown as { google?: GoogleMapsNamespace }).google;
  if (google?.maps?.places?.AutocompleteService) {
    try {
      const suggestions = await queryGoogleAutocomplete(query, google);
      if (suggestions.length > 0) {
        return suggestions;
      }
    } catch {
      // Fallback to local index
    }
  }

  // 2. Query built-in local index
  return BENGALURU_PLACES_INDEX.filter((place) => {
    return (
      place.mainText.toLowerCase().includes(trimmed) ||
      place.secondaryText.toLowerCase().includes(trimmed)
    );
  }).slice(0, 5);
}

function queryGoogleAutocomplete(
  input: string,
  google: GoogleMapsNamespace,
): Promise<PlaceSuggestion[]> {
  return new Promise((resolve) => {
    if (!google.maps?.places?.AutocompleteService || !google.maps?.Geocoder) {
      resolve([]);
      return;
    }

    const service = new google.maps.places.AutocompleteService();
    const geocoder = new google.maps.Geocoder();

    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'in' },
      },
      (predictions, status) => {
        if (status !== 'OK' || !predictions) {
          resolve([]);
          return;
        }

        const topPredictions = predictions.slice(0, 5);
        const resolved: PlaceSuggestion[] = [];

        // Geocode each prediction to retrieve coordinates
        let completed = 0;
        topPredictions.forEach((pred) => {
          geocoder.geocode({ placeId: pred.place_id }, (results, geoStatus) => {
            completed++;
            if (geoStatus === 'OK' && results?.[0]?.geometry?.location) {
              const loc = results[0].geometry.location;
              resolved.push({
                id: pred.place_id,
                mainText: pred.structured_formatting?.main_text || pred.description,
                secondaryText: pred.structured_formatting?.secondary_text || '',
                coordinates: {
                  lat: Number(loc.lat().toFixed(6)),
                  lng: Number(loc.lng().toFixed(6)),
                },
              });
            }

            if (completed === topPredictions.length) {
              resolve(resolved);
            }
          });
        });
      },
    );
  });
}
