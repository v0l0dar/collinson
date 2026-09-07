import { AutoComplete } from "primereact/autocomplete";
import { useRef, useState } from "react";
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
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmpty = typeof query === "string" ? query.trim() === "" : false;
  const showClear = !isEmpty && !loading && !searching;

  async function search(event: { query: string }) {
    setSearching(true);
    try {
      const places = await searchPlaces(event.query);
      setSuggestions(places.map((place) => ({ ...place, displayLabel: formatPlace(place) })));
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function clear() {
    setQuery("");
    setSuggestions([]);
    setSearching(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
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
        inputRef={inputRef}
        inputClassName="w-full pr-10"
        className="w-full"
        aria-label="City or town"
        onChange={(e) => setQuery(e.value)}
        onSelect={(e) => {
          setQuery(e.value);
          onSelect(e.value);
        }}
        itemTemplate={(item: Suggestion) => <span>{item.displayLabel}</span>}
      />
      {!searching && !showClear && (
        <i className="pi pi-search absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 pointer-events-none" />
      )}
      {showClear && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <i className="pi pi-times" />
        </button>
      )}
    </div>
  );
}
