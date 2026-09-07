import type { ActivityScore } from "../api/types";
import { FALLBACK_LABEL_STYLE, LABEL_STYLE } from "../activityLabels";

interface ScoreBadgeProps {
  activityScore: ActivityScore;
  isBest: boolean;
}

export function ScoreBadge({ activityScore, isBest }: ScoreBadgeProps) {
  const { score, label, reasons } = activityScore;
  const style = LABEL_STYLE[label] ?? FALLBACK_LABEL_STYLE;
  const details = reasons.join(" · ");
  const summary = score === null ? label : `${score}, ${label}`;

  return (
    <div
      // Focusable so the reasons are not mouse-only: the tooltip opens on
      // keyboard focus too (Tooltip event="both"), and tapping focuses on
      // touch. aria-label carries the same text for screen readers.
      className={`score-tip flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 ring-1 ring-inset outline-offset-1 focus-visible:outline-2 focus-visible:outline-slate-500 ${style} ${
        isBest ? "outline-2 outline-amber-400" : ""
      }`}
      tabIndex={details ? 0 : undefined}
      aria-label={details ? `${summary}. ${details}` : undefined}
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
    </div>
  );
}
