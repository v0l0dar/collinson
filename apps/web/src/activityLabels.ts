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

// The labels the scorers can return (apps/api/src/scoring/helpers.ts labelFor,
// plus "Not available" from surfing.ts). Naming them makes LABEL_STYLE
// exhaustive, so a new label cannot be forgotten here without a build error.
export type ScoreLabel = "Great" | "OK" | "Poor" | "Bad" | "Not available";

// Tile colours per score label. Soft fills so a full week of them reads as
// a heatmap without shouting; the label text is always shown too, so the
// colour is never the only thing carrying the meaning.
const LABEL_STYLE: Record<ScoreLabel, string> = {
  Great: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  OK: "bg-sky-100 text-sky-900 ring-sky-200",
  Poor: "bg-amber-100 text-amber-900 ring-amber-200",
  Bad: "bg-rose-100 text-rose-900 ring-rose-200",
  "Not available": "bg-slate-50 text-slate-500 ring-slate-200",
};

// A label the API adds later must not borrow the "Not available" grey — that
// would show a real score as missing data. Neutral, but clearly not empty.
const UNKNOWN_LABEL_STYLE = "bg-slate-100 text-slate-700 ring-slate-300";

export const UNAVAILABLE_STYLE = LABEL_STYLE["Not available"];

// The API types `label` as a plain string, so the lookup has to survive a
// value this build has never heard of.
export function labelStyle(label: string): string {
  return Object.hasOwn(LABEL_STYLE, label)
    ? LABEL_STYLE[label as ScoreLabel]
    : UNKNOWN_LABEL_STYLE;
}
