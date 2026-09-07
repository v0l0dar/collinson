import { ActivityScoreResult, DailyWeather } from "../types.js";
import { combineFactors, labelFor, linearScore, rangeScore } from "./helpers.js";

// WMO weather codes, grouped into a rough "how clear/pleasant is the sky"
// score. See https://open-meteo.com/en/docs for the full code list.
function skyScore(weatherCode: number): number {
  if (weatherCode === 0) return 100;
  if (weatherCode <= 2) return 80;
  if (weatherCode === 3) return 55;
  if (weatherCode === 45 || weatherCode === 48) return 40;
  if (weatherCode >= 51 && weatherCode <= 57) return 35;
  if (weatherCode >= 61 && weatherCode <= 67) return 20;
  if (weatherCode >= 71 && weatherCode <= 77) return 20;
  if (weatherCode >= 80 && weatherCode <= 86) return 20;
  if (weatherCode >= 95) return 5;
  return 50;
}

// A good outdoor sightseeing day is mild, dry, calm and reasonably clear.
export function scoreOutdoorSightseeing(day: DailyWeather): ActivityScoreResult {
  const temp = rangeScore(day.tempMax, -5, 15, 25, 38);
  const dry = linearScore(day.precipitationSum, 10, 0);
  const wind = linearScore(day.windSpeedMax, 45, 10);
  const sky = skyScore(day.weatherCode);

  // Temperature uses a sweet-spot shape (too cold and too hot are both
  // bad), so its reason text needs to know which side it fell on — the
  // generic good/bad phrasing in combineFactors can't express that.
  const tempReasons: string[] = [];
  if (temp <= 20 && day.tempMax < 15) tempReasons.push("Too cold");
  if (temp <= 20 && day.tempMax > 25) tempReasons.push("Too hot");
  if (temp >= 85) tempReasons.push("Comfortable temperature");

  const { score, reasons } = combineFactors([
    { score: temp, weight: 0.35 },
    { score: dry, weight: 0.25, goodReason: "Dry day", badReason: "Rainy" },
    { score: wind, weight: 0.15, badReason: "Windy" },
    { score: sky, weight: 0.25, goodReason: "Clear sky", badReason: "Rain, snow, or storms" },
  ]);

  return {
    activity: "OUTDOOR_SIGHTSEEING",
    score,
    label: labelFor(score),
    reasons: [...tempReasons, ...reasons],
  };
}
