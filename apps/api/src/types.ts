export type Activity =
  | "SKIING"
  | "SURFING"
  | "OUTDOOR_SIGHTSEEING"
  | "INDOOR_SIGHTSEEING";

export interface PlaceInfo {
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

export interface DailyWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  rainSum: number;
  snowfallSum: number;
  windSpeedMax: number;
  weatherCode: number;
  waveHeightMax: number | null;
  wavePeriodMax: number | null;
}

export interface ActivityScoreResult {
  activity: Activity;
  score: number | null;
  label: string;
  reasons: string[];
}

export interface DayForecastResult {
  date: string;
  activities: ActivityScoreResult[];
}

export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamError";
  }
}
