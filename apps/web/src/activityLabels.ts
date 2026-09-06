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

// PrimeReact Tag severities per score label, so the badge color comes from
// the component library's own theme instead of fighting its CSS with
// custom utility classes.
export const LABEL_SEVERITY: Record<string, "success" | "info" | "warning" | "danger" | "secondary"> = {
  Great: "success",
  OK: "info",
  Poor: "warning",
  Bad: "danger",
  "Not available": "secondary",
};

export function formatDate(isoDate: string): { weekday: string; day: string } {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}
