import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loaderPromise: Promise<typeof google> | null = null;
let optionsConfigured = false;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  // Detect test / jsdom environment where external script loading should not hang
  const isTestEnv =
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom'));

  if (isTestEnv) {
    return Promise.reject(new Error('Google Maps script loading disabled in test environment'));
  }

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey || apiKey === 'your_browser_api_key_here') {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY not provided'));
  }

  if (apiKey.length < 35) {
    console.warn(
      `[GoogleMapsLoader] Warning: VITE_GOOGLE_MAPS_API_KEY is ${apiKey.length} characters long. Standard Google Cloud API keys are 39 characters. The key in apps/web/.env may be incomplete or truncated.`
    );
  }

  if (!optionsConfigured) {
    setOptions({
      key: apiKey,
      v: 'weekly',
    });
    optionsConfigured = true;
  }

  loaderPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('geometry'),
  ]).then(() => {
    if (window.google) {
      return window.google;
    }
    throw new Error('Google Maps API failed to initialize on window');
  });

  return loaderPromise;
}

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && Boolean(window.google?.maps);
}

