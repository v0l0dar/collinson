import type { PlaceForecast } from "../api/types";
import { ACTIVITY_NAMES, ACTIVITY_ORDER, formatDate } from "../activityLabels";
import { ScoreBadge } from "./ScoreBadge";

interface ForecastTableProps {
  forecast: PlaceForecast;
}

export function ForecastTable({ forecast }: ForecastTableProps) {
  const { place, days } = forecast;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-800">
        {place.name}, {place.country}
      </h2>
      <p className="text-sm text-slate-500">Next 7 days</p>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-2">
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
            {ACTIVITY_ORDER.map((activity) => (
              <tr key={activity}>
                <th scope="row" className="text-left text-sm font-medium text-slate-700 whitespace-nowrap">
                  {ACTIVITY_NAMES[activity]}
                </th>
                {days.map((day) => {
                  const activityScore = day.activities.find((a) => a.activity === activity);
                  if (!activityScore) return <td key={day.date} />;
                  return (
                    <td key={day.date} className="text-center">
                      <ScoreBadge activityScore={activityScore} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">Hover a score to see why.</p>
    </div>
  );
}
