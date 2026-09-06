// Small scoring building blocks shared by every activity. Keeping the math
// in one place means each activity file only lists which factors matter and
// how much they matter — see AI_NOTES.md for the reasoning behind the
// numbers.

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

// Straight line from `worst` (score 0) to `best` (score 100). Works in
// either direction, so it covers "more is better" (best > worst) and
// "less is better" (best < worst) factors with the same function.
export function linearScore(value: number, worst: number, best: number): number {
  if (best === worst) return value >= best ? 100 : 0;
  const t = (value - worst) / (best - worst);
  return Math.round(clamp01(t) * 100);
}

// A "sweet spot" shape: 0 below `min` or above `max`, 100 between
// `idealLow` and `idealHigh`, ramping up/down in between. Used for factors
// where both too little and too much are bad (wave height, temperature).
export function rangeScore(
  value: number,
  min: number,
  idealLow: number,
  idealHigh: number,
  max: number,
): number {
  if (value <= min || value >= max) return 0;
  if (value < idealLow) {
    return Math.round(clamp01((value - min) / (idealLow - min)) * 100);
  }
  if (value > idealHigh) {
    return Math.round(clamp01((max - value) / (max - idealHigh)) * 100);
  }
  return 100;
}

export interface Factor {
  score: number;
  weight: number;
  goodReason?: string;
  badReason?: string;
}

export interface ScoreAndReasons {
  score: number;
  reasons: string[];
}

// Combines weighted factors into one 0-100 score, and turns any standout
// factor (clearly good or clearly bad) into a short, plain-English reason.
export function combineFactors(factors: Factor[]): ScoreAndReasons {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weighted = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const score = Math.round(weighted / totalWeight);

  const reasons: string[] = [];
  for (const f of factors) {
    if (f.score >= 85 && f.goodReason) reasons.push(f.goodReason);
    else if (f.score <= 20 && f.badReason) reasons.push(f.badReason);
  }
  return { score, reasons };
}

export function labelFor(score: number): string {
  if (score >= 75) return "Great";
  if (score >= 50) return "OK";
  if (score >= 25) return "Poor";
  return "Bad";
}
