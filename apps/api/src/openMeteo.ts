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
  rain_sum: number[];
  snowfall_sum: number[];
  windspeed_10m_max: number[];
}

const FORECAST_FIELDS = [
  "weathercode",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "rain_sum",
  "snowfall_sum",
  "windspeed_10m_max",
];

// Open-Meteo marks a missing reading as `null`, which would otherwise flow
// straight into the scoring math as a falsy 0 — a quietly wrong score
// instead of an honest "try again". This only checks the fields we treat
// as always-present; marine wave values are allowed to be null (that is
// the "no coast" signal, not a data problem).
function assertNoGaps(daily: Record<string, unknown>, fields: string[]): void {
  const days = daily.time;
  if (!Array.isArray(days) || days.length === 0) {
    throw new UpstreamError('Open-Meteo returned no "time" values');
  }
  for (const field of fields) {
    const values = daily[field];
    if (!Array.isArray(values) || values.length !== days.length || values.some((v) => v === null || v === undefined)) {
      throw new UpstreamError(`Open-Meteo returned an incomplete "${field}" reading`);
    }
  }
}

async function fetchForecast(latitude: number, longitude: number): Promise<ForecastDaily> {
  const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&daily=${FORECAST_FIELDS.join(",")}&timezone=auto&forecast_days=7`;
  const data = await fetchJson(url);
  const daily = data?.daily ?? {};
  assertNoGaps(daily, FORECAST_FIELDS);
  return daily as ForecastDaily;
}

interface MarineDaily {
  wave_height_max: (number | null)[];
  wave_period_max: (number | null)[];
}

// Marine data only exists near coasts. Inland places return HTTP 200 with
// every value set to null (verified against Mongolia, the Sahara, and
// other inland points) — that is the only "no coast" signal we rely on.
// A real outage (network error, 5xx) should fail like any other Open-Meteo
// call, not be silently read as "no coast".
async function fetchMarine(latitude: number, longitude: number): Promise<MarineDaily> {
  const url = `${MARINE_URL}?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max,wave_period_max&timezone=auto&forecast_days=7`;
  const data = await fetchJson(url);
  const daily = data?.daily ?? {};
  // Values themselves may legitimately be null (no coast) — only the
  // shape is checked here, not the contents.
  if (!Array.isArray(daily.wave_height_max) || !Array.isArray(daily.wave_period_max)) {
    throw new UpstreamError("Open-Meteo returned an unexpected marine response shape");
  }
  return daily as MarineDaily;
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
    rainSum: forecast.rain_sum[i],
    snowfallSum: forecast.snowfall_sum[i],
    windSpeedMax: forecast.windspeed_10m_max[i],
    weatherCode: forecast.weathercode[i],
    waveHeightMax: marine.wave_height_max[i],
    wavePeriodMax: marine.wave_period_max[i],
  }));
}
