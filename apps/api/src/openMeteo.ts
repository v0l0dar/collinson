import { DailyWeather, PlaceInfo, UpstreamError } from "./types.js";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

interface GeocodingResult {
  name: string;
  country?: string;
  admin1?: string;
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

// Returns place candidates for a (partial) name, e.g. "Ode" matches both
// Odesa, Ukraine and Odessa, Texas. The caller picks the exact one instead
// of us silently guessing the "best" match.
export async function searchPlaces(query: string, count = 5): Promise<PlaceInfo[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
  const data: GeocodingResponse = await fetchJson(url);
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? "",
    admin1: r.admin1 ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
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

export async function fetchWeek(latitude: number, longitude: number): Promise<DailyWeather[]> {
  const [forecast, marine] = await Promise.all([
    fetchForecast(latitude, longitude),
    fetchMarine(latitude, longitude),
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
