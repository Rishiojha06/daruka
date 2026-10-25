export interface CandidateEvaluationInput {
  id: string;
  name?: string;
  category?: string;
  location: { lat: number; lng: number };
  tASeconds: number; // travel duration A -> M
  tBSeconds: number; // travel duration B -> M
  tOnwardSeconds: number; // travel duration M -> D
  directASeconds: number; // travel duration A -> D
  directBSeconds: number; // travel duration B -> D
  isReachable: boolean;
}

export interface ScoredCandidate {
  id: string;
  name?: string;
  category?: string;
  location: { lat: number; lng: number };
  tASeconds: number;
  tBSeconds: number;
  tOnwardSeconds: number;
  arrivalDifferenceSeconds: number;
  detourASeconds: number;
  detourBSeconds: number;
  score: number;
}

export interface ScoringWeights {
  alpha: number; // weight for arrival gap
  beta: number; // weight for max approach
  gamma: number; // weight for total detour
  delta?: number; // weight for shared ride onward duration (rewards earlier meeting)
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  alpha: 3.0,
  beta: 1.0,
  gamma: 1.0,
  delta: 0.5,
};

/**
 * Validates and scores candidates, sorting by best score ascending.
 * Rejects candidates violating reachability, valid durations, or detour limits.
 * Rewards earlier meetings via onward shared travel time credit (delta * tOnwardMinutes).
 */
export function scoreAndRankCandidates(
  candidates: CandidateEvaluationInput[],
  maxDetourSeconds: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ScoredCandidate[] {
  const scored: ScoredCandidate[] = [];

  for (const c of candidates) {
    // Constraint 1: Must be reachable
    if (!c.isReachable) continue;

    // Constraint 2: Durations must be valid positive numbers
    if (
      typeof c.tASeconds !== 'number' ||
      typeof c.tBSeconds !== 'number' ||
      typeof c.tOnwardSeconds !== 'number' ||
      isNaN(c.tASeconds) ||
      isNaN(c.tBSeconds) ||
      isNaN(c.tOnwardSeconds) ||
      c.tASeconds <= 0 ||
      c.tBSeconds <= 0 ||
      c.tOnwardSeconds < 0
    ) {
      continue;
    }

    // Rectified Detour Calculation (Phase 0 Gap 1 fix):
    // Detour is the extra time added to the entire journey compared to the direct route.
    const detourASeconds = Math.max(0, c.tASeconds + c.tOnwardSeconds - c.directASeconds);
    const detourBSeconds = Math.max(0, c.tBSeconds + c.tOnwardSeconds - c.directBSeconds);

    // Constraint 3: Must not exceed configured maximum detour per rider
    if (detourASeconds > maxDetourSeconds || detourBSeconds > maxDetourSeconds) {
      continue;
    }

    const arrivalDiffSeconds = Math.abs(c.tASeconds - c.tBSeconds);

    // Scoring in minutes for numerical balance and documentation transparency
    const arrivalGapMinutes = arrivalDiffSeconds / 60;
    const maxApproachMinutes = Math.max(c.tASeconds, c.tBSeconds) / 60;
    const totalDetourMinutes = (detourASeconds + detourBSeconds) / 60;
    const onwardMinutes = c.tOnwardSeconds / 60;
    const deltaWeight = weights.delta ?? 0.5;

    // Multiobjective cost function with shared-ride credit (lower score is better)
    const rawScore =
      weights.alpha * arrivalGapMinutes +
      weights.beta * maxApproachMinutes +
      weights.gamma * totalDetourMinutes -
      deltaWeight * onwardMinutes;

    if (!isFinite(rawScore) || isNaN(rawScore)) {
      continue;
    }

    scored.push({
      id: c.id,
      name: c.name,
      category: c.category,
      location: c.location,
      tASeconds: c.tASeconds,
      tBSeconds: c.tBSeconds,
      tOnwardSeconds: c.tOnwardSeconds,
      arrivalDifferenceSeconds: arrivalDiffSeconds,
      detourASeconds,
      detourBSeconds,
      score: Number(rawScore.toFixed(2)),
    });
  }

  // Stable deterministic sort:
  // 1. Lowest score first
  // 2. Tie-break: lowest arrivalDifferenceSeconds
  // 3. Tie-break: highest onward journey duration (riding together longer)
  // 4. Tie-break: alphabetical ID
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.arrivalDifferenceSeconds !== b.arrivalDifferenceSeconds) {
      return a.arrivalDifferenceSeconds - b.arrivalDifferenceSeconds;
    }
    if (a.tOnwardSeconds !== b.tOnwardSeconds) {
      return b.tOnwardSeconds - a.tOnwardSeconds;
    }
    return a.id.localeCompare(b.id);
  });

  return scored;
}
