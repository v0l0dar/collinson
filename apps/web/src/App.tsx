import { useState } from "react";
import { ApiError, fetchForecast } from "./api/client";
import type { PlaceForecast, PlaceInfo } from "./api/types";
import { ErrorState } from "./components/ErrorState";
import { ForecastTable } from "./components/ForecastTable";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { PlaceSearch } from "./components/PlaceSearch";

type Status = "idle" | "loading" | "success" | "error";

function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [forecast, setForecast] = useState<PlaceForecast | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [lastPlace, setLastPlace] = useState<PlaceInfo | null>(null);

  async function search(place: PlaceInfo) {
    setLastPlace(place);
    setStatus("loading");
    setError(null);
    try {
      const result = await fetchForecast(place);
      setForecast(result);
      setStatus("success");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Something went wrong.", "UNKNOWN_ERROR");
      setError({ code: apiError.code, message: apiError.message });
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">What is good today?</h1>
      <p className="mt-1 text-slate-500">
        Enter a city. We check skiing, surfing, and sightseeing for the next 7 days.
      </p>

      <div className="mt-6">
        <PlaceSearch loading={status === "loading"} onSelect={search} />
      </div>

      {/* Announces state changes to screen readers, since the table only
          exists after a place is picked. */}
      <div aria-live="polite">
        {status === "loading" && <LoadingSkeleton />}
        {status === "error" && error && (
          <ErrorState code={error.code} message={error.message} onRetry={() => lastPlace && search(lastPlace)} />
        )}
        {status === "success" && forecast && <ForecastTable forecast={forecast} />}
      </div>
    </main>
  );
}

export default App;
