import { DailyWeather, DayForecastResult } from "../types.js";
import { scoreIndoorSightseeing } from "./indoorSightseeing.js";
import { scoreOutdoorSightseeing } from "./outdoorSightseeing.js";
import { scoreSkiing } from "./skiing.js";
import { scoreSurfing } from "./surfing.js";

export function scoreDay(day: DailyWeather): DayForecastResult {
  return {
    date: day.date,
    activities: [
      scoreSkiing(day),
      scoreSurfing(day),
      scoreOutdoorSightseeing(day),
      scoreIndoorSightseeing(day),
    ],
  };
}
