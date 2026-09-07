import { Tag } from "primereact/tag";
import type { ActivityScore } from "../api/types";
import { LABEL_SEVERITY } from "../activityLabels";

interface ScoreBadgeProps {
  activityScore: ActivityScore;
}

export function ScoreBadge({ activityScore }: ScoreBadgeProps) {
  const { score, label, reasons } = activityScore;
  const severity = LABEL_SEVERITY[label] ?? "secondary";
  const tooltip = reasons.join(". ");

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="score-tip" data-pr-tooltip={tooltip || undefined} data-pr-position="top">
        <Tag severity={severity} value={score === null ? label : `${score}`} rounded />
      </span>
      {score !== null && <span className="text-xs font-medium text-slate-400">{label}</span>}
    </div>
  );
}
