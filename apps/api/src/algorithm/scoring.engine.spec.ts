import {
  CandidateEvaluationInput,
  scoreAndRankCandidates,
} from './scoring.engine';

describe('ScoringEngine', () => {
  const directA = 2400; // 40 mins direct
  const directB = 2100; // 35 mins direct
  const maxDetour = 900; // 15 mins detour limit

  const createCandidate = (
    id: string,
    tA: number,
    tB: number,
    tOnward: number,
    isReachable = true,
  ): CandidateEvaluationInput => ({
    id,
    location: { lat: 13.0, lng: 77.6 },
    tASeconds: tA,
    tBSeconds: tB,
    tOnwardSeconds: tOnward,
    directASeconds: directA,
    directBSeconds: directB,
    isReachable,
  });

  it('ranks balanced arrival times with similar detours highly', () => {
    const c1 = createCandidate('c1', 1800, 1800, 800); // 0 diff, approach 30m, detourA = 1800+800-2400=200s, detourB = 1800+800-2100=500s
    const c2 = createCandidate('c2', 1500, 2100, 800); // 600s diff (10m), approach 35m

    const results = scoreAndRankCandidates([c1, c2], maxDetour);
    expect(results[0].id).toBe('c1');
    expect(results[0].arrivalDifferenceSeconds).toBe(0);
  });

  it('small arrival gap wins over large arrival gap when approach is comparable', () => {
    const balanced = createCandidate('balanced', 1800, 1860, 700); // 60s gap (1 min)
    const unbalanced = createCandidate('unbalanced', 1500, 2160, 700); // 660s gap (11 mins)

    const results = scoreAndRankCandidates([balanced, unbalanced], maxDetour);
    expect(results[0].id).toBe('balanced');
  });

  it('candidate with small arrival gap but extreme approach time loses to practical alternative', () => {
    // Extreme point: 4 hours away each, arrival gap = 0, but massive approach
    const extreme = createCandidate('extreme', 14400, 14400, 500);
    // Practical point: 25 mins vs 28 mins
    const practical = createCandidate('practical', 1500, 1680, 800);

    const results = scoreAndRankCandidates([extreme, practical], 3600);
    expect(results[0].id).toBe('practical');
  });

  it('rejects candidate exceeding Rider A detour limit', () => {
    // Rider A direct is 2400. tA(2000) + tOnward(1400) = 3400. Detour = 1000s > 900s limit
    const c = createCandidate('excessive-a', 2000, 1500, 1400);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('rejects candidate exceeding Rider B detour limit', () => {
    // Rider B direct is 2100. tB(2000) + tOnward(1200) = 3200. Detour = 1100s > 900s limit
    const c = createCandidate('excessive-b', 1500, 2000, 1200);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('rejects unreachable candidate', () => {
    const c = createCandidate('unreachable', 1800, 1800, 600, false);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('rejects candidate with missing or NaN duration', () => {
    const c = createCandidate('nan-duration', NaN, 1800, 600);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('rejects candidate with negative duration', () => {
    const c = createCandidate('neg-duration', -100, 1800, 600);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('returns empty array when given empty candidate list', () => {
    const results = scoreAndRankCandidates([], maxDetour);
    expect(results).toHaveLength(0);
  });

  it('tie-breaking is stable and deterministic', () => {
    const c1 = createCandidate('candidate-b', 1800, 1800, 600);
    const c2 = createCandidate('candidate-a', 1800, 1800, 600);

    const results = scoreAndRankCandidates([c1, c2], maxDetour);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('candidate-a');
    expect(results[1].id).toBe('candidate-b');
  });

  it('all calculated scores are finite and non-NaN', () => {
    const c = createCandidate('c', 1800, 1800, 600);
    const results = scoreAndRankCandidates([c], maxDetour);
    expect(results).toHaveLength(1);
    expect(Number.isFinite(results[0].score)).toBe(true);
    expect(Number.isNaN(results[0].score)).toBe(false);
  });
  it('favors meeting earlier to ride together longer when arrival balance and detours are similar', () => {
    // Both early and late have 0s arrival diff and modest 100s/400s detours
    const early = createCandidate('early', 600, 600, 1900);
    const late = createCandidate('late', 1900, 1900, 600);

    const results = scoreAndRankCandidates([late, early], maxDetour);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('early');
  });

});
