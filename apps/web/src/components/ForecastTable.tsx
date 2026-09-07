import { Tooltip } from "primereact/tooltip";
import type { ActivityScore, PlaceForecast } from "../api/types";
import { ACTIVITY_NAMES, ACTIVITY_ORDER, formatDate } from "../activityLabels";
import { ScoreBadge } from "./ScoreBadge";

interface ForecastTableProps {
  forecast: PlaceForecast;
}

// Index of the highest-scoring day for a row, or null when every day is
// "Not available" (nothing to crown as the best).
function bestDayIndex(scores: (ActivityScore | undefined)[]): number | null {
  let best: number | null = null;
  scores.forEach((score, i) => {
    if (!score || score.score === null) return;
    if (best === null || (scores[best]?.score ?? -1) < score.score) best = i;
  });
  return best;
}

export function ForecastTable({ forecast }: ForecastTableProps) {
  const { place, days } = forecast;
  const region = place.admin1 && place.admin1 !== place.name ? `${place.admin1}, ` : "";

  return (
    <div className="mt-8">
      {/* One Tooltip instance, attached to every badge via data-pr-tooltip. */}
      <Tooltip target=".score-tip" />

      <h2 className="text-lg font-semibold text-slate-800">
        {place.name}, {region}
        {place.country}
      </h2>
      <p className="text-sm text-slate-500">Next 7 days</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-x-3 border-spacing-y-3">
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-slate-500">Activity</th>
              {days.map((day) => {
                const { weekday, day: dayLabel } = formatDate(day.date);
                return (
                  <th key={day.date} className="text-center text-sm font-medium text-slate-500">
                    <div>{weekday}</div>
                    <div className="text-xs font-normal text-slate-400">{dayLabel}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ACTIVITY_ORDER.map((activity) => {
              const scores = days.map((day) => day.activities.find((a) => a.activity === activity));
              const allUnavailable = scores.every((score) => score && score.score === null);
              const bestIndex = allUnavailable ? null : bestDayIndex(scores);

              return (
                <tr key={activity}>
                  <th scope="row" className="py-1 text-left text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {ACTIVITY_NAMES[activity]}
                    {bestIndex !== null && (
                      <div className="text-[11px] font-normal text-slate-400">
                        Best: {formatDate(days[bestIndex].date).weekday}
                      </div>
                    )}
                  </th>
                  {allUnavailable ? (
                    <td colSpan={days.length} className="py-1 text-center text-sm text-slate-400 italic">
                      {(scores[0] as ActivityScore).reasons[0] ?? "Not available here"}
                    </td>
                  ) : (
                    days.map((day, i) => {
                      const activityScore = scores[i];
                      if (!activityScore) return <td key={day.date} />;
                      return (
                        <td
                          key={day.date}
                          className={`py-1 text-center ${i === bestIndex ? "rounded-lg bg-amber-50" : ""}`}
                        >
                          <ScoreBadge activityScore={activityScore} />
                        </td>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
