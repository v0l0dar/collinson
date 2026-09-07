import type { ActivityScore } from "../api/types";
import { labelStyle } from "../activityLabels";

interface ScoreTileProps {
  activityScore: ActivityScore;
  isBest: boolean;
}

export function ScoreTile({ activityScore, isBest }: ScoreTileProps) {
  const { score, label, reasons } = activityScore;
  const details = reasons.join(" · ");

  return (
    <div
      className={`score-tip flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 ring-1 ring-inset ${labelStyle(label)} ${
        isBest ? "outline-2 outline-offset-1 outline-amber-400" : ""
      }`}
      data-pr-tooltip={details || undefined}
      data-pr-position="top"
    >
      {score === null ? (
        <span className="text-xs leading-tight font-medium">{label}</span>
      ) : (
        <>
          <span className="text-xl leading-none font-semibold tabular-nums">{score}</span>
          <span className="text-[11px] leading-tight font-medium tracking-wide uppercase opacity-80">
            {label}
          </span>
        </>
      )}
      {/* Sighted users read the reasons in the tooltip. PrimeReact marks that
          tooltip aria-hidden while it is open and never links it to this tile,
          so screen readers need their own copy here. */}
      {details && <span className="sr-only">{details}</span>}
    </div>
  );
}
