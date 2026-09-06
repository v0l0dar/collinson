import { DailyWeather, PlaceInfo, PlaceNotFoundError, UpstreamError } from "./types.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

interface GeocodingResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

async function fetchJson(url: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new UpstreamError(`Could not reach Open-Meteo: ${(cause as Error).message}`);
  }
  if (!response.ok) {
    throw new UpstreamError(`Open-Meteo returned ${response.status}`);
  }
  return response.json();
}

// Finds a place by name. Open-Meteo ranks results by relevance/population,
// so we take the first (best) match. Ambiguous names (e.g. "Paris") are not
// disambiguated further — see AI_NOTES.md.
export async function geocodePlace(place: string): Promise<PlaceInfo> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(place)}&count=1&language=en&format=json`;
  const data: GeocodingResponse = await fetchJson(url);
  const first = data.results?.[0];
  if (!first) {
    throw new PlaceNotFoundError(place);
  }
  return {
    name: first.name,
    country: first.country ?? "",
    latitude: first.latitude,
    longitude: first.longitude,
  };
}

interface ForecastDaily {
  time: string[];
  weathercode: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  snowfall_sum: number[];
  windspeed_10m_max: number[];
  uv_index_max: number[];
}

async function fetchForecast(latitude: number, longitude: number): Promise<ForecastDaily> {
  const params = [
    "weathercode",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "snowfall_sum",
    "windspeed_10m_max",
    "uv_index_max",
  ].join(",");
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&daily=${params}&timezone=auto&forecast_days=7`;
  const data = await fetchJson(url);
  return data.daily as ForecastDaily;
}

interface MarineDaily {
  wave_height_max: (number | null)[];
  wave_period_max: (number | null)[];
}

// Marine data only exists near coasts. Inland places return HTTP 200 with
// every value set to null (not an error) — we treat that the same as "no
// marine data available" so surfing can be marked "Not available" instead
// of scored.
async function fetchMarine(latitude: number, longitude: number): Promise<MarineDaily | null> {
  const url = `${MARINE_URL}?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max,wave_period_max&timezone=auto&forecast_days=7`;
  try {
    const data = await fetchJson(url);
    return data.daily as MarineDaily;
  } catch {
    // Some inland coordinates are rejected outright by the marine grid.
    // That is a "no coast" case for us, not a fatal error.
    return null;
  }
}

export async function fetchWeek(
  place: PlaceInfo,
): Promise<DailyWeather[]> {
  const [forecast, marine] = await Promise.all([
    fetchForecast(place.latitude, place.longitude),
    fetchMarine(place.latitude, place.longitude),
  ]);

  return forecast.time.map((date, i) => ({
    date,
    tempMax: forecast.temperature_2m_max[i],
    tempMin: forecast.temperature_2m_min[i],
    precipitationSum: forecast.precipitation_sum[i],
    snowfallSum: forecast.snowfall_sum[i],
    windSpeedMax: forecast.windspeed_10m_max[i],
    weatherCode: forecast.weathercode[i],
    uvIndexMax: forecast.uv_index_max[i],
    waveHeightMax: marine?.wave_height_max[i] ?? null,
    wavePeriodMax: marine?.wave_period_max[i] ?? null,
  }));
}
