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
      {/* One Tooltip instance, attached to every tile via data-pr-tooltip.
          event="both" opens it on hover and on keyboard focus, so the reasons
          are not mouse-only. */}
      <Tooltip target=".score-tip" event="both" className="max-w-xs" showDelay={120} />

      <h2 className="text-lg font-semibold text-slate-800">
        {place.name}, {region}
        {place.country}
      </h2>
      <p className="text-sm text-slate-500">Next 7 days</p>

      {/* table-fixed + w-full keeps the 7 days inside the page from 768px up.
          Below that the min width brings back a horizontal scroll, so the
          cells stay readable on a phone. */}
      <div className="mt-4 overflow-x-auto md:overflow-x-visible">
        <table className="w-full min-w-190 table-fixed border-collapse md:min-w-0">
          <thead>
            <tr>
              <th className="w-28 pb-2 text-left text-xs font-medium tracking-wide text-slate-400 uppercase">
                Activity
              </th>
              {days.map((day) => {
                const { weekday, day: dayLabel } = formatDate(day.date);
                return (
                  <th key={day.date} className="px-1 pb-2 text-center">
                    <div className="text-sm font-semibold text-slate-700">{weekday}</div>
                    <div className="text-xs font-normal text-slate-400">{dayLabel}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {ACTIVITY_ORDER.map((activity) => {
            const scores = days.map((day) => day.activities.find((a) => a.activity === activity));
            const allUnavailable = scores.every((score) => score && score.score === null);
            const bestIndex = allUnavailable ? null : bestDayIndex(scores);

            return (
              <tbody key={activity} className="border-t border-slate-100">
                <tr>
                  <th scope="row" className="py-3 pr-3 text-left align-top">
                    <div className="text-sm font-semibold text-slate-800">
                      {ACTIVITY_NAMES[activity]}
                    </div>
                    {bestIndex !== null && (
                      <div className="mt-0.5 text-xs font-medium text-amber-600">
                        Best: {formatDate(days[bestIndex].date).weekday}
                      </div>
                    )}
                  </th>
                  {allUnavailable ? (
                    <td colSpan={days.length} className="px-1 py-3 align-top">
                      <div className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-400 ring-1 ring-slate-200 ring-inset">
                        {(scores[0] as ActivityScore).reasons[0] ?? "Not available here"}
                      </div>
                    </td>
                  ) : (
                    days.map((day, i) => {
                      const activityScore = scores[i];
                      if (!activityScore) return <td key={day.date} className="px-1 py-3" />;
                      return (
                        <td key={day.date} className="px-1 py-3 align-top">
                          <ScoreBadge activityScore={activityScore} isBest={i === bestIndex} />
                        </td>
                      );
                    })
                  )}
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
