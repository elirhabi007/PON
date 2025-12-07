export interface GeoLocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  error: string | null;
  loading: boolean;
}

export interface WatermarkConfig {
  timestamp: string;
  location: string;
}
