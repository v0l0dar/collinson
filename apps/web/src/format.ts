import type { PlaceInfo } from "./api/types";

export function formatDate(isoDate: string): { weekday: string; day: string } {
  const date = new Date(`${isoDate}T00:00:00`);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

// One place name for the whole app, so the search list and the result
// heading can never disagree about how a place is written.
export function formatPlace(place: Pick<PlaceInfo, "name" | "country" | "admin1">): string {
  const region = place.admin1 && place.admin1 !== place.name ? `${place.admin1}, ` : "";
  return `${place.name}, ${region}${place.country}`;
}
