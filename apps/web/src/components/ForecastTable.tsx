import { Tooltip } from "primereact/tooltip";
import type { CSSProperties } from "react";
import type { ActivityScore, PlaceForecast } from "../api/types";
import {
  ACTIVITY_NAMES,
  ACTIVITY_ORDER,
  UNAVAILABLE_STYLE,
  isWorthRecommending,
} from "../activityLabels";
import { formatDate, formatPlace } from "../format";
import { ScoreTile } from "./ScoreTile";

interface ForecastTableProps {
  forecast: PlaceForecast;
}

// Below md the table keeps its own width and scrolls sideways, so the cells
// stay readable on a phone. That width has to follow the number of days the
// API actually sends, not a number tuned to today's seven.
const ACTIVITY_COL_REM = 7; // matches w-28 on the row-header column
const DAY_COL_MIN_REM = 5.75; // room for a 2-digit score and its label

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

// The best day, but only when it is actually worth going out for. A week of
// "Poor" days has a highest score, yet naming one of them "Best" would read
// as advice to go.
function recommendedDayIndex(scores: (ActivityScore | undefined)[]): number | null {
  const best = bestDayIndex(scores);
  if (best === null) return null;
  const label = scores[best]?.label;
  return label && isWorthRecommending(label) ? best : null;
}

export function ForecastTable({ forecast }: ForecastTableProps) {
  const { place, days } = forecast;
  const minWidth = `${ACTIVITY_COL_REM + days.length * DAY_COL_MIN_REM}rem`;

  return (
    <div className="mt-8">
      {/* One Tooltip instance, attached to every tile via data-pr-tooltip.
          Left on the default hover event on purpose: with event="both" a
          focused tile makes PrimeReact drop its mouseleave listener, and the
          tooltip then stays on screen. Screen readers get the same text from
          the sr-only span inside each tile instead. */}
      <Tooltip
        target=".score-tip"
        className="max-w-xs"
        showDelay={120}
        closeOnEscape
        autoHide={false}
      />

      <h2 className="text-lg font-semibold text-slate-800">{formatPlace(place)}</h2>
      <p className="text-sm text-slate-500">Next 7 days</p>

      <div className="mt-4 overflow-x-auto md:overflow-x-visible">
        <table
          className="w-full min-w-(--forecast-min-w) table-fixed border-collapse md:min-w-0"
          style={{ "--forecast-min-w": minWidth } as CSSProperties}
        >
          <thead>
            <tr>
              <th className="w-28 pb-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase">
                Activity
              </th>
              {days.map((day) => {
                const { weekday, day: dayLabel } = formatDate(day.date);
                return (
                  <th key={day.date} className="px-1 pb-2 text-center">
                    <div className="text-sm font-semibold text-slate-700">{weekday}</div>
                    <div className="text-xs font-normal text-slate-500">{dayLabel}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {ACTIVITY_ORDER.map((activity) => {
            const scores = days.map((day) => day.activities.find((a) => a.activity === activity));
            const allUnavailable =
              scores.length > 0 && scores.every((score) => score && score.score === null);
            const bestIndex = allUnavailable ? null : recommendedDayIndex(scores);

            return (
              <tbody key={activity} className="border-t border-slate-100">
                <tr>
                  <th scope="row" className="py-3 pr-3 text-left align-top">
                    <div className="text-sm font-semibold text-slate-800">
                      {ACTIVITY_NAMES[activity]}
                    </div>
                    {bestIndex !== null && (
                      <div className="mt-0.5 text-xs font-medium text-amber-700">
                        Best: {formatDate(days[bestIndex].date).weekday}
                      </div>
                    )}
                  </th>
                  {allUnavailable ? (
                    <td colSpan={days.length} className="px-1 py-3 align-top">
                      <div
                        className={`rounded-xl px-3 py-4 text-center text-sm ring-1 ring-inset ${UNAVAILABLE_STYLE}`}
                      >
                        {scores[0]?.reasons[0] ?? "Not available here"}
                      </div>
                    </td>
                  ) : (
                    days.map((day, i) => {
                      const activityScore = scores[i];
                      if (!activityScore) return <td key={day.date} className="px-1 py-3" />;
                      return (
                        <td key={day.date} className="px-1 py-3 align-top">
                          <ScoreTile activityScore={activityScore} isBest={i === bestIndex} />
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
