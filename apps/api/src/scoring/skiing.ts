import { ActivityScoreResult, DailyWeather } from "../types.js";
import { combineFactors, labelFor, linearScore } from "./helpers.js";

// Good skiing needs fresh snow, cold enough that it does not melt, calm
// wind (lifts close in high wind), and rain instead of snow is a bad sign.
// Thresholds are simplified, common-sense values, not resort-specific data.
export function scoreSkiing(day: DailyWeather): ActivityScoreResult {
  const snow = linearScore(day.snowfallSum, 0, 10);
  const cold = linearScore(day.tempMax, 8, -2);
  const wind = linearScore(day.windSpeedMax, 50, 10);
  // precipitation_sum from Open-Meteo includes snow's water content, so we
  // only treat it as a bad sign (rain) when little of it fell as snow.
  const rainAmount = Math.max(0, day.precipitationSum - day.snowfallSum);
  const dry = linearScore(rainAmount, 15, 0);

  const { score, reasons } = combineFactors([
    { score: snow, weight: 0.4, goodReason: "Fresh snow", badReason: "No new snow" },
    { score: cold, weight: 0.25, goodReason: "Cold enough for snow", badReason: "Too warm for snow" },
    { score: dry, weight: 0.15, badReason: "Rainy, not snowy" },
    { score: wind, weight: 0.2, badReason: "Too windy for lifts" },
  ]);

  return { activity: "SKIING", score, label: labelFor(score), reasons };
}
