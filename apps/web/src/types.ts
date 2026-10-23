import { Coordinates } from '@weekend-ride/shared-types';

export interface LocationState {
  label: string;
  coordinates: Coordinates | null;
  confirmed: boolean;
  error?: string;
}

export type ActivePinTarget = 'riderA' | 'riderB' | 'destination' | null;
