import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ForecastTable } from "./ForecastTable";
import type { ActivityScore, PlaceForecast } from "../api/types";

// Mon..Sun 2026
const DATES = [
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-12",
  "2026-09-13",
];

function ski(score: number | null, label: string): ActivityScore {
  return { activity: "SKIING", score, label, reasons: [] };
}

// A week where skiing takes the given scores and every other activity is
// flat, so only the skiing row is under test.
function forecastWith(skiDays: ActivityScore[]): PlaceForecast {
  return {
    place: { name: "Chamonix", country: "France", admin1: null },
    days: DATES.map((date, i) => ({
      date,
      activities: [
        skiDays[i],
        { activity: "SURFING", score: null, label: "Not available", reasons: ["This place has no coast"] },
        { activity: "OUTDOOR_SIGHTSEEING", score: 30, label: "Poor", reasons: [] },
        { activity: "INDOOR_SIGHTSEEING", score: 30, label: "Poor", reasons: [] },
      ],
    })),
  };
}

function outlinedTiles(container: HTMLElement): number {
  return container.querySelectorAll(".outline-amber-400").length;
}

describe("ForecastTable best-day callout", () => {
  it("names the best day when that day is Great", () => {
    const days = DATES.map((_, i) => (i === 2 ? ski(90, "Great") : ski(60, "OK")));
    const { container } = render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.getByText("Best: Wed")).toBeInTheDocument();
    expect(outlinedTiles(container)).toBe(1);
  });

  it("names the best day when that day is only OK", () => {
    const days = DATES.map((_, i) => (i === 0 ? ski(60, "OK") : ski(30, "Poor")));
    render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.getByText("Best: Mon")).toBeInTheDocument();
  });

  it("names no day when the whole week is only Poor", () => {
    const days = DATES.map((_, i) => ski(30 + i, "Poor"));
    const { container } = render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.queryByText(/^Best:/)).toBeNull();
    expect(outlinedTiles(container)).toBe(0);
  });

  it("names no day when the whole week is Bad", () => {
    const days = DATES.map((_, i) => ski(10 + i, "Bad"));
    const { container } = render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.queryByText(/^Best:/)).toBeNull();
    expect(outlinedTiles(container)).toBe(0);
  });

  it("names no day when every day is Not available", () => {
    // Surfing has no coast on every day, so its row collapses to one message
    // and gets no callout either.
    const days = DATES.map(() => ski(60, "OK"));
    render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.getByText("This place has no coast")).toBeInTheDocument();
    // Skiing is OK, so exactly one row is called out — not surfing, and not
    // the two Poor rows.
    expect(screen.getAllByText(/^Best:/)).toHaveLength(1);
  });

  it("still names the best day when the week mixes OK with Bad", () => {
    const days = DATES.map((_, i) => (i === 6 ? ski(55, "OK") : ski(10, "Bad")));
    render(<ForecastTable forecast={forecastWith(days)} />);

    expect(screen.getByText("Best: Sun")).toBeInTheDocument();
  });
});
