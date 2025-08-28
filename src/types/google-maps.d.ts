declare global {
  interface Window {
    google: typeof google;
  }
}

export interface GoogleMapsPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
      status: string;
    }>;
  }>;
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      start_location: GoogleMapsPoint;
      end_location: GoogleMapsPoint;
    }>;
    overview_path: GoogleMapsPoint[];
  }>;
}
