import { afterEach, describe, expect, it, vi } from "vitest";
import { yoga } from "./yoga.js";

const SEARCH_QUERY = /* GraphQL */ `
  query ($query: String!) {
    searchPlaces(query: $query) {
      name
      country
      admin1
      latitude
      longitude
    }
  }
`;

const FORECAST_QUERY = /* GraphQL */ `
  query ($latitude: Float!, $longitude: Float!, $name: String!, $country: String!) {
    forecast(latitude: $latitude, longitude: $longitude, name: $name, country: $country) {
      place {
        name
      }
      days {
        date
      }
    }
  }
`;

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body } as Response;
}

async function query(document: string, variables: Record<string, unknown>) {
  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: document, variables }),
  });
  return response.json();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchPlaces query", () => {
  it("does not call Open-Meteo for a very short query", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await query(SEARCH_QUERY, { query: "o" });

    expect(result.data.searchPlaces).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps every Open-Meteo match to a place, not just the first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          results: [
            { name: "Odesa", country: "Ukraine", admin1: "Odesa", latitude: 46.48, longitude: 30.74 },
            { name: "Odessa", country: "United States", admin1: "Texas", latitude: 31.85, longitude: -102.36 },
          ],
        }),
      ),
    );

    const result = await query(SEARCH_QUERY, { query: "Ode" });

    expect(result.data.searchPlaces).toHaveLength(2);
    expect(result.data.searchPlaces[1]).toEqual({
      name: "Odessa",
      country: "United States",
      admin1: "Texas",
      latitude: 31.85,
      longitude: -102.36,
    });
  });

  it("returns UPSTREAM_ERROR when Open-Meteo is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await query(SEARCH_QUERY, { query: "Odesa" });

    expect(result.errors?.[0]?.extensions?.code).toBe("UPSTREAM_ERROR");
  });
});

const VALID_FORECAST_DAILY = {
  time: ["2026-01-01"],
  weathercode: [0],
  temperature_2m_max: [10],
  temperature_2m_min: [2],
  precipitation_sum: [0],
  rain_sum: [0],
  snowfall_sum: [0],
  windspeed_10m_max: [10],
};

describe("forecast query", () => {
  it("returns UPSTREAM_ERROR when Open-Meteo is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await query(FORECAST_QUERY, {
      latitude: 46.48,
      longitude: 30.74,
      name: "Odesa",
      country: "Ukraine",
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("UPSTREAM_ERROR");
  });

  // Regression test: a real Marine API outage used to be swallowed and
  // shown as "This place has no coast" for a real coastal town — it must
  // fail honestly instead, like every other Open-Meteo call.
  it("returns UPSTREAM_ERROR when only the Marine API is down, not a fake 'no coast'", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        if (url.includes("marine-api")) throw new Error("marine outage");
        return jsonResponse({ daily: VALID_FORECAST_DAILY });
      }),
    );

    const result = await query(FORECAST_QUERY, {
      latitude: 43.48,
      longitude: -1.56,
      name: "Biarritz",
      country: "France",
    });

    expect(result.errors?.[0]?.extensions?.code).toBe("UPSTREAM_ERROR");
    expect(result.data).toBeNull();
  });
});
