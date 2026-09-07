import type { PlaceForecast, PlaceInfo } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";

const SEARCH_PLACES_QUERY = `
  query SearchPlaces($query: String!) {
    searchPlaces(query: $query) {
      name
      country
      admin1
      latitude
      longitude
    }
  }
`;

const FORECAST_QUERY = `
  query Forecast($latitude: Float!, $longitude: Float!, $name: String!, $country: String!) {
    forecast(latitude: $latitude, longitude: $longitude, name: $name, country: $country) {
      place {
        name
        country
        admin1
        latitude
        longitude
      }
      days {
        date
        activities {
          activity
          score
          label
          reasons
        }
      }
    }
  }
`;

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// One GraphQL server, two queries, so a hand-typed fetch call is simpler
// than pulling in a full GraphQL client library (Apollo/urql).
async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new ApiError("We could not reach the server. Please try again.", "NETWORK_ERROR");
  }

  const json = await response.json();
  if (json.errors?.length) {
    const [firstError] = json.errors;
    throw new ApiError(firstError.message, firstError.extensions?.code ?? "UNKNOWN_ERROR");
  }
  return json.data as T;
}

export async function searchPlaces(query: string): Promise<PlaceInfo[]> {
  const data = await graphqlRequest<{ searchPlaces: PlaceInfo[] }>(SEARCH_PLACES_QUERY, { query });
  return data.searchPlaces;
}

export async function fetchForecast(place: PlaceInfo): Promise<PlaceForecast> {
  const data = await graphqlRequest<{ forecast: PlaceForecast }>(FORECAST_QUERY, {
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    country: place.country,
  });
  return data.forecast;
}
