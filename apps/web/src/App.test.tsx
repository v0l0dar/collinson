import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const CHAMONIX = { name: "Chamonix", country: "France", admin1: "Auvergne-Rhone-Alpes", latitude: 45.9, longitude: 6.9 };

function jsonResponse(body: unknown) {
  return { json: async () => body } as Response;
}

// Routes the mocked fetch by which query is in the request body, since the
// app now makes two different GraphQL calls (search-as-you-type, then the
// forecast for whatever place was picked).
function mockApi({ searchResult, forecastResult }: { searchResult?: unknown; forecastResult?: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      if (body.query.includes("SearchPlaces")) {
        return jsonResponse({ data: { searchPlaces: searchResult ?? [] } });
      }
      return jsonResponse(forecastResult);
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function pickPlace(place: typeof CHAMONIX) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByRole("combobox", { name: /city or town/i }), place.name);
  const option = await screen.findByRole(
    "option",
    { name: new RegExp(place.name), hidden: true },
    { timeout: 3000 },
  );
  await user.click(option);
  return user;
}

describe("App", () => {
  it("shows the forecast table once a suggested place is picked", async () => {
    mockApi({
      searchResult: [CHAMONIX],
      forecastResult: {
        data: {
          forecast: {
            place: CHAMONIX,
            days: [
              {
                date: "2026-01-01",
                activities: [
                  { activity: "SKIING", score: 60, label: "OK", reasons: [] },
                  { activity: "SURFING", score: null, label: "Not available", reasons: ["This place has no coast"] },
                  { activity: "OUTDOOR_SIGHTSEEING", score: 40, label: "Poor", reasons: [] },
                  { activity: "INDOOR_SIGHTSEEING", score: 100, label: "Great", reasons: [] },
                ],
              },
              {
                date: "2026-01-02",
                activities: [
                  { activity: "SKIING", score: 90, label: "Great", reasons: ["Fresh snow"] },
                  { activity: "SURFING", score: null, label: "Not available", reasons: ["This place has no coast"] },
                  { activity: "OUTDOOR_SIGHTSEEING", score: 40, label: "Poor", reasons: [] },
                  { activity: "INDOOR_SIGHTSEEING", score: 100, label: "Great", reasons: [] },
                ],
              },
            ],
          },
        },
      },
    });

    const user = await pickPlace(CHAMONIX);

    expect(await screen.findByRole("heading", { name: /Chamonix.*France/ })).toBeInTheDocument();
    expect(screen.getByText("Skiing")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
    // Surfing is "Not available" on every day, so it collapses to one message.
    expect(screen.getByText("This place has no coast")).toBeInTheDocument();
    // The reason is real text in the page (visually hidden), so a screen
    // reader gets it without a mouse and without opening the tooltip.
    expect(screen.getByText("Fresh snow")).toBeInTheDocument();

    // Sighted users get the same text by hovering the tile. This asserts the
    // tooltip really opens, not just that the attribute is set.
    const bestTile = screen.getByText("90").closest(".score-tip");
    expect(bestTile).not.toBeNull();
    await user.hover(bestTile as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector(".p-tooltip")?.textContent).toContain("Fresh snow");
    });

    // ...and it hides again when the mouse leaves.
    await user.unhover(bestTile as HTMLElement);
    await waitFor(() => {
      expect(document.querySelector(".p-tooltip")).toBeNull();
    });
    // Day 2 scores higher on skiing (90 vs 60), so it should be called out.
    expect(screen.getByText(/Best: Fri/)).toBeInTheDocument();
  });

  it("clearing the search takes the forecast off the screen", async () => {
    mockApi({
      searchResult: [CHAMONIX],
      forecastResult: {
        data: {
          forecast: {
            place: CHAMONIX,
            days: [
              {
                date: "2026-01-01",
                activities: [
                  { activity: "SKIING", score: 60, label: "OK", reasons: [] },
                  { activity: "SURFING", score: null, label: "Not available", reasons: ["This place has no coast"] },
                  { activity: "OUTDOOR_SIGHTSEEING", score: 40, label: "Poor", reasons: [] },
                  { activity: "INDOOR_SIGHTSEEING", score: 100, label: "Great", reasons: [] },
                ],
              },
            ],
          },
        },
      },
    });

    const user = await pickPlace(CHAMONIX);
    expect(await screen.findByRole("heading", { name: /Chamonix.*France/ })).toBeInTheDocument();

    await user.click(await screen.findByLabelText("Clear search"));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Chamonix.*France/ })).toBeNull();
    });
  });

  it("shows a network error message when the forecast call fails", async () => {
    mockApi({ searchResult: [CHAMONIX] });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        if (body.query.includes("SearchPlaces")) {
          return jsonResponse({ data: { searchPlaces: [CHAMONIX] } });
        }
        throw new Error("network down");
      }),
    );

    await pickPlace(CHAMONIX);

    await waitFor(() => {
      expect(screen.getByText(/we could not reach the server/i)).toBeInTheDocument();
    });
  });
});
