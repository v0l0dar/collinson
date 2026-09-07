import type { Activity } from "./api/types";

export const ACTIVITY_NAMES: Record<Activity, string> = {
  SKIING: "Skiing",
  SURFING: "Surfing",
  OUTDOOR_SIGHTSEEING: "Outdoor sightseeing",
  INDOOR_SIGHTSEEING: "Indoor sightseeing",
};

export const ACTIVITY_ORDER: Activity[] = [
  "SKIING",
  "SURFING",
  "OUTDOOR_SIGHTSEEING",
  "INDOOR_SIGHTSEEING",
];

// Tile colours per score label. Soft fills so a full week of them reads as
// a heatmap without shouting; the label text is always shown too, so the
// colour is never the only thing carrying the meaning.
export const LABEL_STYLE: Record<string, string> = {
  Great: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  OK: "bg-sky-100 text-sky-900 ring-sky-200",
  Poor: "bg-amber-100 text-amber-900 ring-amber-200",
  Bad: "bg-rose-100 text-rose-900 ring-rose-200",
  "Not available": "bg-slate-50 text-slate-400 ring-slate-200",
};

export const FALLBACK_LABEL_STYLE = LABEL_STYLE["Not available"];

export function formatDate(isoDate: string): { weekday: string; day: string } {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}
