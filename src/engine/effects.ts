import type { Effect, GameState } from "./types";

export type InjuryInfo = { overallDelta: number; recoveryPhases: number };
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
        // immediate and permanent both apply to overall now; the distinction
        // matters only for injury recovery (which never restores permanent loss).
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
      if (s) s.stats[effect.stat] = (s.stats[effect.stat] ?? 0) + effect.amount;
      return;
    }
    case "snaps": {
      const s = currentSeason(state);
      if (s) s.snaps += effect.amount;
      return;
    }
    case "injury": {
      const info = injuryOf(effect.injuryType);
      state.overall = clampOverall(state.overall - info.overallDelta);
      state.injuries.push({
        injuryType: effect.injuryType,
        remainingPhases: info.recoveryPhases,
        restoreAmount: info.overallDelta,
      });
      return;
    }
    case "suspension": {
      // Modeled as an injury-like block with no overall penalty: it zeroes snaps
      // while active. Reuse the injuries list with restoreAmount 0.
      state.injuries.push({
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
  }
}
