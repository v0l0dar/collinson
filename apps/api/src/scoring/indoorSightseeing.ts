import { ActivityScoreResult, DailyWeather } from "../types.js";
import { labelFor } from "./helpers.js";

// Assumption (see AI_NOTES.md): indoor sightseeing barely depends on the
// weather — museums and galleries are fine in rain or shine. So instead of
// the weighted-factor model used for outdoor activities, this starts from
// a high baseline and only drops for conditions that make it hard to even
// get there: extreme heat/cold or a storm.
export function scoreIndoorSightseeing(day: DailyWeather): ActivityScoreResult {
  let score = 100;
  const reasons: string[] = [];

  if (day.tempMax > 32) {
    score -= 25;
    reasons.push("Very hot outside");
  }
  if (day.tempMin < -10) {
    score -= 25;
    reasons.push("Very cold outside");
  }
  if (day.weatherCode >= 95) {
    score -= 40;
    reasons.push("Storm outside");
  }
  if (day.windSpeedMax > 60) {
    score -= 20;
    reasons.push("Very strong wind");
  }

  score = Math.max(0, Math.min(100, score));
  if (reasons.length === 0) reasons.push("Good day to stay indoors");

  return { activity: "INDOOR_SIGHTSEEING", score, label: labelFor(score), reasons };
}
