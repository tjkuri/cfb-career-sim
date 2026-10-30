import type { Effect, GameState } from "./types";

export type InjuryInfo = { overallDelta: number; recoveryPhases: number; lasting?: number };
export type InjuryLookup = (injuryType: string) => InjuryInfo;

export function clampOverall(n: number): number {
  return Math.max(0, Math.min(99, Math.round(n)));
}
export function clampCharacter(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function currentSeason(state: GameState) {
  return state.seasons[state.seasons.length - 1];
}

export function applyEffect(state: GameState, effect: Effect, injuryOf: InjuryLookup): void {
  switch (effect.kind) {
    case "overall": {
      if (effect.timing === "deferred") {
        state.pendingEffects.push({
          effect,
          firePhaseAbs: state.phaseAbs + (effect.delayPhases ?? 1),
        });
      } else {
        state.overall = clampOverall(state.overall + effect.amount);
      }
      return;
    }
    case "character": {
      state.character = clampCharacter(state.character + effect.amount);
      return;
    }
    case "stat": {
      const s = currentSeason(state);
      // Floored at zero. A season stat is a counting stat -- a player cannot
      // kick minus one field goal. Authored negative `stat` effects exist (a
      // blown kick costs -1 FG), and on a redshirt season, whose
      // `sitSnapModifier: 0.05` rounds every generated stat to 0, the subtraction
      // has nothing to eat: 0 + (-1) = -1, which then printed in the rail and
      // permanently on the summary. Measured at 6 careers in 1,500, all six
      // redshirted (DECISION 039 item 2).
      if (s) s.stats[effect.stat] = Math.max(0, (s.stats[effect.stat] ?? 0) + effect.amount);
      return;
    }
    case "snaps": {
      const s = currentSeason(state);
      // Floored at zero, for the same reason the `stat` case above is, and by
      // the same mechanism: authored negative snap effects exist (-15, -20, -8)
      // and a redshirt season's `sitSnapModifier: 0.05` leaves single-digit
      // snaps for them to eat, so the line stored a negative. Measured at 15
      // careers in 9,000, all 15 redshirted.
      //
      // Unlike `stat`, this one is not merely a display fix: `productionScore`
      // sums `seasons[].snaps` across a career and feeds `deriveDraftStock`, so
      // the clamp moves draft stock -- bounded at 1 point (<=20 snaps against
      // 200 snaps per point) on 0.17% of careers. That is why it was carved out
      // of DECISION 039 and approved separately as DECISION 040, and why the
      // full-eligibility baseline in reports/018 §4 and reports/022 §1 was
      // re-taken after it landed. See reports/022 §8.
      if (s) s.snaps = Math.max(0, s.snaps + effect.amount);
      return;
    }
    case "injury": {
      const info = injuryOf(effect.injuryType);
      state.careerInjuries += 1;
      state.overall = clampOverall(state.overall - info.overallDelta);
      state.injuries.push({
        kind: "injury",
        injuryType: effect.injuryType,
        remainingPhases: info.recoveryPhases,
        restoreAmount: info.overallDelta - (info.lasting ?? 0),
      });
      return;
    }
    case "suspension": {
      // Modeled as an injury-like block with no overall penalty: it zeroes snaps
      // while active. Discriminated by kind so it never collides with a real injury id.
      state.injuries.push({
        kind: "suspension",
        injuryType: "suspension",
        remainingPhases: effect.phases,
        restoreAmount: 0,
      });
      return;
    }
    case "trophy": {
      state.trophies[effect.id] = (state.trophies[effect.id] ?? 0) + 1;
      return;
    }
    case "award": {
      if (!state.awards.includes(effect.id)) state.awards.push(effect.id);
      return;
    }
    case "moment": {
      state.moments.push({ seasonIndex: state.seasonIndex, item: effect.item, icon: effect.icon });
      return;
    }
    case "ending": {
      state.status = "busted";
      state.endingReason = effect.reason;
      return;
    }
    default: {
      const _exhaustive: never = effect;
      throw new Error(`Unhandled effect kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export function isSidelined(state: GameState): boolean {
  return state.injuries.some((i) => i.remainingPhases > 0);
}

// A deferred effect that has come due must be handed to applyEffect as
// immediate, or applyEffect would just re-queue it forever. DeferredEffect's
// `effect` is narrowed to "overall" (the only kind ever enqueued), so no kind
// check is needed here.
function asImmediate(
  effect: Extract<Effect, { kind: "overall" }>,
): Extract<Effect, { kind: "overall" }> {
  return effect.timing === "deferred" ? { ...effect, timing: "immediate" as const } : effect;
}

// Drain the whole queue regardless of firePhaseAbs. A career can end from a
// phase that never reaches another tickPhaseStart, and an effect that was
// earned must land before the draft is computed.
export function flushPendingEffects(state: GameState, injuryOf: InjuryLookup): void {
  const pending = state.pendingEffects;
  state.pendingEffects = [];
  for (const p of pending) applyEffect(state, asImmediate(p.effect), injuryOf);
}

export function tickPhaseStart(state: GameState, injuryOf: InjuryLookup): void {
  // 1) Fire deferred effects that are due, then drop them.
  const due = state.pendingEffects.filter((p) => p.firePhaseAbs <= state.phaseAbs);
  state.pendingEffects = state.pendingEffects.filter((p) => p.firePhaseAbs > state.phaseAbs);
  for (const p of due) applyEffect(state, asImmediate(p.effect), injuryOf);

  // 2) Decrement injuries; heal (restore overall) when they reach 0.
  const stillInjured: typeof state.injuries = [];
  for (const inj of state.injuries) {
    const remaining = inj.remainingPhases - 1;
    if (remaining <= 0) {
      state.overall = clampOverall(state.overall + inj.restoreAmount);
    } else {
      stillInjured.push({ ...inj, remainingPhases: remaining });
    }
  }
  state.injuries = stillInjured;
}
