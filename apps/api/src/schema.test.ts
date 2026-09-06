import { afterEach, describe, expect, it, vi } from "vitest";
import { yoga } from "./yoga.js";

const QUERY = /* GraphQL */ `
  query ($place: String!) {
    forecast(place: $place) {
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

async function callForecast(place: string) {
  const response = await yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { place } }),
  });
  return response.json();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("forecast query", () => {
  it("returns PLACE_NOT_FOUND when geocoding has no results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));

    const result = await callForecast("nowhere-at-all");

    expect(result.errors?.[0]?.extensions?.code).toBe("PLACE_NOT_FOUND");
  });

  it("returns UPSTREAM_ERROR when Open-Meteo is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await callForecast("London");

    expect(result.errors?.[0]?.extensions?.code).toBe("UPSTREAM_ERROR");
  });
});
