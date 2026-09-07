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
});
