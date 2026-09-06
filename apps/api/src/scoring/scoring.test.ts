import { describe, expect, it } from "vitest";
import { DailyWeather } from "../types.js";
import { scoreSkiing } from "./skiing.js";
import { scoreSurfing } from "./surfing.js";
import { scoreOutdoorSightseeing } from "./outdoorSightseeing.js";
import { scoreIndoorSightseeing } from "./indoorSightseeing.js";

const baseDay: DailyWeather = {
  date: "2026-01-01",
  tempMax: 15,
  tempMin: 5,
  precipitationSum: 0,
  snowfallSum: 0,
  windSpeedMax: 10,
  weatherCode: 0,
  uvIndexMax: 3,
  waveHeightMax: null,
  wavePeriodMax: null,
};

describe("scoreSkiing", () => {
  it("scores a cold, fresh-snow, calm day highly", () => {
    const day: DailyWeather = { ...baseDay, tempMax: -3, snowfallSum: 10, windSpeedMax: 5 };
    const result = scoreSkiing(day);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.label).toBe("Great");
    expect(result.reasons).toContain("Fresh snow");
  });

  it("scores a warm, snowless, rainy day poorly", () => {
    const day: DailyWeather = { ...baseDay, tempMax: 12, snowfallSum: 0, precipitationSum: 10 };
    const result = scoreSkiing(day);
    expect(result.score).toBeLessThan(50);
  });
});

describe("scoreSurfing", () => {
  it("is not available when there is no marine data", () => {
    const result = scoreSurfing(baseDay);
    expect(result.score).toBeNull();
    expect(result.label).toBe("Not available");
  });

  it("scores clean, mid-size, long-period swell highly", () => {
    const day: DailyWeather = { ...baseDay, waveHeightMax: 1.5, wavePeriodMax: 12, windSpeedMax: 8 };
    const result = scoreSurfing(day);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("scores a flat day poorly", () => {
    const day: DailyWeather = { ...baseDay, waveHeightMax: 0.2, wavePeriodMax: 5, windSpeedMax: 10 };
    const result = scoreSurfing(day);
    expect(result.score ?? 0).toBeLessThan(50);
  });
});

describe("scoreOutdoorSightseeing", () => {
  it("scores a mild, dry, clear day highly", () => {
    const day: DailyWeather = { ...baseDay, tempMax: 20, precipitationSum: 0, windSpeedMax: 8, weatherCode: 0 };
    const result = scoreOutdoorSightseeing(day);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it("scores a hot, stormy, wet day poorly", () => {
    const day: DailyWeather = { ...baseDay, tempMax: 34, precipitationSum: 20, windSpeedMax: 40, weatherCode: 95 };
    const result = scoreOutdoorSightseeing(day);
    expect(result.score).toBeLessThan(30);
  });
});

describe("scoreIndoorSightseeing", () => {
  it("is high on an ordinary day, regardless of it being unremarkable weather", () => {
    const result = scoreIndoorSightseeing(baseDay);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("drops during a storm", () => {
    const day: DailyWeather = { ...baseDay, weatherCode: 96 };
    const result = scoreIndoorSightseeing(day);
    expect(result.score).toBeLessThan(90);
    expect(result.reasons).toContain("Storm outside");
  });
});
