import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => body,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function search(place: string) {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText(/city or town/i), place);
  await user.click(screen.getByRole("button", { name: /search/i }));
}

describe("App", () => {
  it("shows the forecast table on a successful search", async () => {
    mockFetchOnce({
      data: {
        forecast: {
          place: { name: "Chamonix", country: "France", latitude: 45.9, longitude: 6.9 },
          days: [
            {
              date: "2026-01-01",
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
    });

    await search("Chamonix");

    expect(await screen.findByText("Chamonix, France")).toBeInTheDocument();
    expect(screen.getByText("Skiing")).toBeInTheDocument();
    expect(screen.getByText("90")).toBeInTheDocument();
  });

  it("shows a not-found message when the place does not exist", async () => {
    mockFetchOnce({
      errors: [{ message: 'We cannot find "zzz".', extensions: { code: "PLACE_NOT_FOUND" } }],
    });

    await search("zzz");

    expect(await screen.findByText(/we cannot find this place/i)).toBeInTheDocument();
  });

  it("shows a network error message when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await search("Chamonix");

    await waitFor(() => {
      expect(screen.getByText(/we could not reach the server/i)).toBeInTheDocument();
    });
  });
});
