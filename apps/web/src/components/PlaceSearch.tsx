import { AutoComplete } from "primereact/autocomplete";
import { useRef, useState } from "react";
import { searchPlaces } from "../api/client";
import type { PlaceInfo } from "../api/types";
import { formatPlace } from "../format";

interface Suggestion extends PlaceInfo {
  displayLabel: string;
}

interface PlaceSearchProps {
  loading: boolean;
  onSelect: (place: PlaceInfo) => void;
  onClear: () => void;
}

export function PlaceSearch({ loading, onSelect, onClear }: PlaceSearchProps) {
  const [query, setQuery] = useState<string | Suggestion>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Typing fast starts several lookups at once, and they can finish out of
  // order. Only the newest one is allowed to touch the list or the spinner.
  const latestRequest = useRef(0);

  const isEmpty = typeof query === "string" ? query.trim() === "" : false;
  const showClear = !isEmpty && !loading && !searching;

  async function search(event: { query: string }) {
    const requestId = ++latestRequest.current;
    setSearching(true);
    try {
      const places = await searchPlaces(event.query);
      if (requestId !== latestRequest.current) return;
      setSuggestions(places.map((place) => ({ ...place, displayLabel: formatPlace(place) })));
    } catch {
      if (requestId !== latestRequest.current) return;
      setSuggestions([]);
    } finally {
      if (requestId === latestRequest.current) setSearching(false);
    }
  }

  function clear() {
    // Retires any lookup still running, so a slow answer cannot refill the
    // list the user just emptied.
    latestRequest.current++;
    setQuery("");
    setSuggestions([]);
    setSearching(false);
    inputRef.current?.focus();
    onClear();
  }

  return (
    <div className="relative w-full">
      <AutoComplete<string | Suggestion>
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
          // The generic allows a bare string, so narrow before handing the
          // place to the parent — a string here would send no coordinates.
          if (typeof e.value === "string") return;
          setQuery(e.value);
          onSelect(e.value);
        }}
        itemTemplate={(item) => (
          <span>{typeof item === "string" ? item : item.displayLabel}</span>
        )}
      />
      {showClear ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center text-slate-500 hover:text-slate-700"
        >
          <i className="pi pi-times" aria-hidden="true" />
        </button>
      ) : (
        // Hidden while a lookup runs, because PrimeReact draws its own
        // spinner in this exact spot.
        !searching && (
          <i
            className="pi pi-search pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        )
      )}
    </div>
  );
}
