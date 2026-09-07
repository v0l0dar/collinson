export type Activity =
  | "SKIING"
  | "SURFING"
  | "OUTDOOR_SIGHTSEEING"
  | "INDOOR_SIGHTSEEING";

export interface ActivityScore {
  activity: Activity;
  score: number | null;
  label: string;
  reasons: string[];
}

export interface DayForecast {
  date: string;
  activities: ActivityScore[];
}

export interface PlaceInfo {
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

export interface PlaceForecast {
  place: PlaceInfo;
  days: DayForecast[];
}
