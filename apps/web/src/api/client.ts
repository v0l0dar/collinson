import type { PlaceForecast } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/graphql";

const FORECAST_QUERY = `
  query Forecast($place: String!) {
    forecast(place: $place) {
      place {
        name
        country
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

// One query, so a hand-typed fetch call is simpler than pulling in a full
// GraphQL client library (Apollo/urql) for this project.
export async function fetchForecast(place: string): Promise<PlaceForecast> {
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: FORECAST_QUERY, variables: { place } }),
    });
  } catch {
    throw new ApiError("We could not reach the server. Please try again.", "NETWORK_ERROR");
  }

  const json = await response.json();
  if (json.errors?.length) {
    const [firstError] = json.errors;
    throw new ApiError(firstError.message, firstError.extensions?.code ?? "UNKNOWN_ERROR");
  }
  return json.data.forecast as PlaceForecast;
}
