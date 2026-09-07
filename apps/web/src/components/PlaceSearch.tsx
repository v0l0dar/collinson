import { AutoComplete } from "primereact/autocomplete";
import { useState } from "react";
import { searchPlaces } from "../api/client";
import type { PlaceInfo } from "../api/types";

interface Suggestion extends PlaceInfo {
  displayLabel: string;
}

function formatPlace(place: PlaceInfo): string {
  const region = place.admin1 && place.admin1 !== place.name ? `${place.admin1}, ` : "";
  return `${place.name}, ${region}${place.country}`;
}

interface PlaceSearchProps {
  loading: boolean;
  onSelect: (place: PlaceInfo) => void;
}

export function PlaceSearch({ loading, onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState<string | Suggestion>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function search(event: { query: string }) {
    try {
      const places = await searchPlaces(event.query);
      setSuggestions(places.map((place) => ({ ...place, displayLabel: formatPlace(place) })));
    } catch {
      setSuggestions([]);
    }
  }

  return (
    <AutoComplete
      value={query}
      suggestions={suggestions}
      completeMethod={search}
      field="displayLabel"
      minLength={2}
      delay={300}
      disabled={loading}
      placeholder="Enter a city, for example Odesa"
      emptyMessage="No places found. Check the spelling."
      inputClassName="w-full"
      className="w-full"
      aria-label="City or town"
      onChange={(e) => setQuery(e.value)}
      onSelect={(e) => {
        setQuery(e.value);
        onSelect(e.value);
      }}
      itemTemplate={(item: Suggestion) => <span>{item.displayLabel}</span>}
    />
  );
}
