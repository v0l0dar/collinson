import { Tag } from "primereact/tag";
import type { ActivityScore } from "../api/types";
import { LABEL_SEVERITY } from "../activityLabels";

interface ScoreBadgeProps {
  activityScore: ActivityScore;
}

export function ScoreBadge({ activityScore }: ScoreBadgeProps) {
  const { score, label, reasons } = activityScore;
  const severity = LABEL_SEVERITY[label] ?? "secondary";
  const title = reasons.join(". ");

  return (
    <div className="flex flex-col items-center gap-1" title={title || undefined}>
      <Tag severity={severity} value={score === null ? label : `${score}`} rounded />
      {score !== null && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  );
}
