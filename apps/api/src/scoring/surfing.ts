import { ActivityScoreResult, DailyWeather } from "../types.js";
import { combineFactors, labelFor, linearScore, rangeScore } from "./helpers.js";

// Surfing needs waves with real size and a long enough period to be
// organised swell, not just wind chop. Open-Meteo's Marine API only covers
// coastal points — inland places get no wave data at all, which we treat
// as "not applicable" rather than scoring them zero.
export function scoreSurfing(day: DailyWeather): ActivityScoreResult {
  if (day.waveHeightMax === null || day.wavePeriodMax === null) {
    return {
      activity: "SURFING",
      score: null,
      label: "Not available",
      reasons: ["This place has no coast"],
    };
  }

  const waveHeight = rangeScore(day.waveHeightMax, 0.2, 1.0, 2.2, 4.0);
  const wavePeriod = linearScore(day.wavePeriodMax, 4, 14);
  const wind = linearScore(day.windSpeedMax, 40, 10);

  const { score, reasons } = combineFactors([
    { score: waveHeight, weight: 0.5, goodReason: "Good size waves", badReason: "Wave size not ideal" },
    { score: wavePeriod, weight: 0.3, goodReason: "Well-formed swell", badReason: "Choppy, short-period swell" },
    { score: wind, weight: 0.2, badReason: "Too windy" },
  ]);

  return { activity: "SURFING", score, label: labelFor(score), reasons };
}
