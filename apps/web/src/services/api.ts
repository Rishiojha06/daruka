import {
  MeetingPointSearchRequest,
  MeetingPointSearchResponse,
} from '@weekend-ride/shared-types';

interface CustomImportMeta {
  env?: {
    VITE_API_BASE_URL?: string;
  };
}

const API_BASE_URL =
  (import.meta as unknown as CustomImportMeta).env?.VITE_API_BASE_URL ||
  'http://localhost:4000/api/v1';

export async function searchMeetingPoints(
  request: MeetingPointSearchRequest,
): Promise<MeetingPointSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/meeting-points/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Search failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as MeetingPointSearchResponse;
}
