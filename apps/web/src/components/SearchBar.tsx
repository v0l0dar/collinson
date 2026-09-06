import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, type FormEvent } from "react";

interface SearchBarProps {
  loading: boolean;
  onSearch: (place: string) => void;
}

export function SearchBar({ loading, onSearch }: SearchBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const place = value.trim();
    if (!place) return;
    onSearch(place);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <InputText
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter a city, for example Chamonix"
        className="flex-1"
        aria-label="City or town"
        disabled={loading}
      />
      <Button type="submit" label="Search" loading={loading} disabled={!value.trim()} />
    </form>
  );
}
