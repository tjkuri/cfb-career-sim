import type { BigGameStakes, Effect, GameEvent, GameState, Role, Spot, Tier } from "./types";
import { PHASE_ORDER, CLASS_ORDER } from "./types";
import { createRng, rngChance, rngInt, type Rng } from "./rng";
import { applyEffect, tickPhaseStart, flushPendingEffects, clampOverall, type InjuryLookup } from "./effects";
import { resolveOutcome } from "./outcomes";
import { selectRandomEvent, selectFixedEvent } from "./select-event";
import { simulatePhaseProduction } from "./simulate";
import { applyRecruitingChoice } from "./recruiting";
import { computeDraftResult } from "./draft";
import { runAwards, simulateTeamRecord } from "./postseason";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";
import { generateTransferOffers } from "./transfer";
import { rollAmbientInjury, schoolTraitOf } from "./school-effects";
import { roleFor } from "./role";
import { BIG_GAME_EVENT_ID, pendingBigGame, resolveBigGame, setupBigGame } from "./big-game";
import { BIG_GAME_INTRO, PLAYBOOKS } from "../content/big-game";

const TRANSFER_EVENT_ID = "transfer";
const REDSHIRT_EVENT_ID = "redshirt";
const ON_FIELD_PHASES = new Set(["nonconf", "conference", "postseason"]);

type HubStep = "entry" | "redshirt" | "transfer";
const HUB_ORDER: Exclude<HubStep, "entry">[] = ["redshirt", "transfer"];

// A season has two gambles -- one in the offseason, one mid-season -- plus a
// bowl-week card some years. The rest is played out, and it ends on the big game.
const RANDOM_SLOTS: Partial<Record<GameState["phase"], GameState["phase"][]>> = {
  offseason: ["offseason"],
  conference: ["nonconf", "conference"],
  postseason: ["postseason"],
};

export interface DecisionOption {
  id: string;
  label: string;
  /** A gamble: the chance of `positive`, and what each branch does. */
  probability?: number;
  positive?: Effect[];
  negative?: Effect[];
  /** A school on offer, and where the player would sit on its depth chart. */
  school?: { name: string; tier: Tier; conference: string; role: Role; trait?: string; current?: boolean };
  /** A play call: what it is built to beat. */
  detail?: string;
}

export interface PendingDecision {
  eventId: string;
  kind: "event" | "school" | "redshirt" | "bigGame";
  title: string;
  description: string;
  options: DecisionOption[];
  bigGame?: {
    stakes: BigGameStakes;
    intro: string;
    name: string;
    opponent: string;
    situation: string;
    scout: { call: string; percent: number };
    look: string;
    lookIndex: number;
    spot: Spot;
    thrownIn: boolean;
  };
}

function injuryLookup(content: ContentBundle): InjuryLookup {
  return (t) => content.injuries[t] ?? { overallDelta: 3, recoveryPhases: 2 };
}

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function schoolOptions(state: GameState, content: ContentBundle): DecisionOption[] {
  return (state.pendingOptions ?? []).map((o) => {
    const school = content.schools.find((s) => s.id === o.schoolId);
    return {
      id: o.id,
      label: o.label,
      school: {
        name: school?.name ?? o.schoolId,
        tier: o.tier,
        conference: school?.conference ?? "",
        role: roleFor(state.overall, o.tier),
        trait: school?.trait ? content.traitHints[school.trait] : undefined,
        current: o.id === "stay",
      },
    };
  });
}

export function getDecision(state: GameState, content: ContentBundle = CONTENT): PendingDecision | null {
  if (state.status !== "active" || state.currentEventId === null) return null;
  if (state.currentEventId === "recruiting") {
    return {
      eventId: "recruiting",
      kind: "school",
      title: "Signing Day",
      description: "Three programs want you. Start right away somewhere small, or fight for a job somewhere big?",
      options: schoolOptions(state, content),
    };
  }
  if (state.currentEventId === TRANSFER_EVENT_ID) {
    return {
      eventId: TRANSFER_EVENT_ID,
      kind: "school",
      title: "Transfer Portal",
      description: "The portal is open and your phone is ringing. Stay, or chase a bigger stage?",
      options: schoolOptions(state, content),
    };
  }
  if (state.currentEventId === REDSHIRT_EVENT_ID) {
    const cfg = content.redshirt;
    return {
      eventId: REDSHIRT_EVENT_ID,
      kind: "redshirt",
      title: "Redshirt?",
      description: "Sit out a season without burning a year of eligibility. A year in the weight room — or a year of rust.",
      options: [
        {
          id: "redshirt",
          label: "Take the redshirt",
          probability: cfg.successProb,
          positive: [{ kind: "overall", timing: "immediate", amount: cfg.bumpOverall }],
          negative: [{ kind: "overall", timing: "immediate", amount: cfg.sinkOverall }],
        },
        { id: "decline", label: "Play this season", probability: 1, positive: [] },
      ],
    };
  }
  if (state.currentEventId === BIG_GAME_EVENT_ID && state.pendingBigGame) {
    const g = pendingBigGame(state)!;
    const book = PLAYBOOKS[state.setup.position];
    return {
      eventId: BIG_GAME_EVENT_ID,
      kind: "bigGame",
      title: g.name,
      description: `vs ${g.opponent}`,
      options: book.calls.map((c) => ({ id: c.id, label: c.label, detail: c.detail })),
      bigGame: {
        stakes: g.stakes,
        intro: bigGameIntro(state, content),
        name: g.name,
        opponent: g.opponent,
        situation: book.situations[g.situation] ?? book.situations[0]!,
        scout: { call: book.counters[g.scoutedCall]!.label, percent: g.tendency },
        look: book.counters[g.lookCall]!.look,
        lookIndex: g.lookCall,
        spot: g.spot,
        thrownIn: g.thrownIn,
      },
    };
  }
  const ev = content.events.find((e) => e.id === state.currentEventId);
  if (!ev) return null;
  return {
    eventId: ev.id,
    kind: "event",
    title: ev.title,
    description: ev.description,
    options: ev.options.map((o) => ({
      id: o.id,
      label: o.label,
      probability: o.negativeOutcome ? o.probability : 1,
      positive: o.positiveOutcome.effects,
      negative: o.negativeOutcome && o.probability < 1 ? o.negativeOutcome.effects : undefined,
    })),
  };
}

function bigGameIntro(state: GameState, content: ContentBundle): string {
  const g = pendingBigGame(state)!;
  const lines = BIG_GAME_INTRO[g.stakes];
  const conf = content.schools.find((s) => s.id === state.school.schoolId)?.conference ?? "conference";
  // The nth game at these stakes this career gets the nth line, so a repeat
  // trip to the title game never reads the same as the last one.
  const before = state.seasons.filter((l) => l.bigGame?.stakes === g.stakes).length;
  return lines[before % lines.length]!.replace("{conf}", conf);
}

export function advance(state: GameState, choiceId: string, content: ContentBundle = CONTENT): GameState {
  const s = clone(state);
  const rng = createRng(s.seed, s.rngCursor);
  const injuryOf = injuryLookup(content);
  delete s.lastOutcome;

  applyChoice(s, choiceId, content, rng, injuryOf);
  if (s.status === "active") autoProgress(s, content, rng, injuryOf);
  finalizeIfEnded(s, rng, injuryOf);

  s.rngCursor = rng.cursor;
  return s;
}

function applyChoice(s: GameState, choiceId: string, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.currentEventId === "recruiting") {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid recruiting choice: ${choiceId}`);
    applyRecruitingChoice(s, offer.schoolId, content);
    s.pendingOptions = undefined;
    s.currentEventId = null;
    return;
  }
  if (s.currentEventId === TRANSFER_EVENT_ID) {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid transfer choice: ${choiceId}`);
    if (offer.id !== "stay") s.school = { schoolId: offer.schoolId, tier: offer.tier };
    s.snapModifier = offer.snapModifier;
    s.pendingOptions = undefined;
    s.currentEventId = null;
    raiseNextHubDecision(s, content, rng, "transfer");
    return;
  }
  if (s.currentEventId === REDSHIRT_EVENT_ID) {
    if (choiceId !== "redshirt" && choiceId !== "decline") {
      throw new Error(`Invalid redshirt choice: ${choiceId}`);
    }
    if (choiceId === "decline") {
      raiseNextHubDecision(s, content, rng, "redshirt");
      return;
    }
    const cfg = content.redshirt;
    const success = rngChance(rng, cfg.successProb);
    applyEffect(s, { kind: "overall", timing: "immediate", amount: success ? cfg.bumpOverall : cfg.sinkOverall }, injuryOf);
    s.lastOutcome = { description: success ? cfg.bumpDescription : cfg.sinkDescription, positive: success };
    s.eligibility.redshirtUsed = true;
    s.snapModifier = cfg.sitSnapModifier;
    s.redshirtSeasonActive = true;
    s.currentEventId = null;
    return;
  }
  if (s.currentEventId === BIG_GAME_EVENT_ID) {
    resolveBigGame(s, choiceId, rng, injuryOf);
    const result = s.seasons[s.seasons.length - 1]?.bigGame;
    if (result) s.lastOutcome = { description: result.text, positive: result.won };
    return;
  }
  const ev = content.events.find((e) => e.id === s.currentEventId);
  if (!ev) throw new Error(`No current event: ${s.currentEventId}`);
  const opt = ev.options.find((o) => o.id === choiceId);
  if (!opt) throw new Error(`Invalid choice ${choiceId} for event ${ev.id}`);
  const outcome = resolveOutcome(opt, rng);
  const gamble = !!opt.negativeOutcome && opt.probability < 1;
  s.lastOutcome = {
    description: outcome.description,
    positive: gamble ? outcome === opt.positiveOutcome : undefined,
  };
  for (const eff of outcome.effects) applyEffect(s, eff, injuryOf);
  if (ev.kind === "fixed") s.phaseFiredEventIds.push(ev.id);
  s.currentEventId = null;
}

function advancePhase(s: GameState): void {
  const idx = PHASE_ORDER.indexOf(s.phase);
  if (idx === PHASE_ORDER.length - 1) {
    s.seasonIndex += 1;
    s.phase = "offseason";
  } else {
    s.phase = PHASE_ORDER[idx + 1]!;
  }
  s.phaseAbs += 1;
}

/**
 * Overall gained over an offseason: a base for the class year just played, a
 * bonus for playing time, a little noise, and a bump at a developmental school.
 */
export function offseasonDevelopment(
  s: GameState,
  line: GameState["seasons"][number],
  content: ContentBundle,
  rng: Rng,
): number {
  const prog = content.progression;
  const role: Role = line.redshirt ? "backup" : (line.role ?? "rotation");
  const jitter = rngInt(rng, -prog.devJitter, prog.devJitter);
  const developmental = schoolTraitOf(s, content) === "developmental" ? content.schoolTraits.developmental.developmentalBonus : 0;
  return prog.devByClass[line.classYear] + prog.devByRole[role] + jitter + developmental;
}

export const WASHOUT_REASONS = {
  overall: "Lost a step and washed out",
  buried: "Buried on the depth chart",
} as const;

export function enterOffseason(s: GameState, content: ContentBundle, rng: Rng): void {
  s.snapModifier = 1;
  const satOut = s.redshirtSeasonActive;
  s.redshirtSeasonActive = false;

  const lastSeason = s.seasons[s.seasons.length - 1];
  if (lastSeason) {
    lastSeason.overall = s.overall;
    s.overall = clampOverall(s.overall + offseasonDevelopment(s, lastSeason, content, rng));
  }

  const prog = content.progression;
  const recent = s.seasons.filter((line) => !line.redshirt).slice(-prog.washoutConsecutiveSeasons);
  const buried =
    recent.length >= prog.washoutConsecutiveSeasons &&
    recent.every((line) => line.snaps < (prog.washoutSnapFloorByPosition?.[s.setup.position] ?? prog.washoutSnapFloor));
  if (s.overall < prog.washoutOverallFloor || buried) {
    s.status = "busted";
    s.endingReason =
      s.overall < prog.washoutOverallFloor ? WASHOUT_REASONS.overall : WASHOUT_REASONS.buried;
    s.currentEventId = null;
    return;
  }

  // A redshirt season keeps the class year: the year after it is played as
  // the same class, which is what the extra year of eligibility is.
  const ci = CLASS_ORDER.indexOf(s.eligibility.classYear);
  if (!satOut && ci < CLASS_ORDER.length - 1) s.eligibility.classYear = CLASS_ORDER[ci + 1]!;
  s.eligibility.yearsUsed += 1;
  s.eligibility.draftEligible = s.eligibility.classYear === "JR" || s.eligibility.classYear === "SR";

  const eligibilityCap = CLASS_ORDER.length + (s.eligibility.redshirtUsed ? 1 : 0);
  if (s.eligibility.yearsUsed >= eligibilityCap) {
    s.status = "declared";
    return;
  }

  raiseNextHubDecision(s, content, rng, "entry");
}

function redshirtOffered(s: GameState): boolean {
  return (
    !s.eligibility.redshirtUsed &&
    (s.eligibility.classYear === "SO" ||
      s.eligibility.classYear === "JR" ||
      s.injuries.some((i) => i.kind === "injury"))
  );
}

function raiseNextHubDecision(s: GameState, content: ContentBundle, rng: Rng, from: HubStep): void {
  const startIdx = from === "entry" ? 0 : HUB_ORDER.indexOf(from) + 1;
  for (let i = startIdx; i < HUB_ORDER.length; i++) {
    const step = HUB_ORDER[i]!;
    if (step === "redshirt") {
      if (redshirtOffered(s)) { s.currentEventId = REDSHIRT_EVENT_ID; return; }
      continue;
    }
    if (step === "transfer") {
      s.pendingOptions = generateTransferOffers(s, content, rng);
      s.currentEventId = TRANSFER_EVENT_ID;
      return;
    }
  }
  s.currentEventId = null;
}

function autoProgress(s: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  let guard = 0;
  while (s.status === "active" && s.currentEventId === null && guard++ < 1000) {
    if (!s.phaseSimulated) {
      tickPhaseStart(s, injuryOf);
      if (s.status !== "active") return;
      if (ON_FIELD_PHASES.has(s.phase)) {
        let last = s.seasons[s.seasons.length - 1];
        if (!last || last.seasonIndex !== s.seasonIndex) {
          last = {
            seasonIndex: s.seasonIndex,
            schoolId: s.school.schoolId,
            snaps: 0,
            stats: {},
            teamWins: 0,
            teamLosses: 0,
            overall: s.overall,
            classYear: s.eligibility.classYear,
            redshirt: s.redshirtSeasonActive,
            tierPlayed: s.school.tier,
          };
          s.seasons.push(last);
        }
        last.role = roleFor(s.overall, s.school.tier);
        rollAmbientInjury(s, content, rng, injuryOf);
      }
      simulatePhaseProduction(s, content, rng);
      s.phaseSimulated = true;
      s.phaseFiredEventIds = [];
      s.phaseRandomDrawn = false;
    }

    const fixedEv = selectFixedEvent(s, content);
    if (fixedEv) {
      s.currentEventId = fixedEv.id;
      return;
    }

    if (s.phase === "postseason") settleRegularSeason(s, content, rng);

    const slot = RANDOM_SLOTS[s.phase];
    if (slot && !s.phaseRandomDrawn) {
      s.phaseRandomDrawn = true;
      // Bowl week gets a card about half the time, and only for a bowl team.
      const draw = s.phase !== "postseason" || (bowlTeam(s) && rngChance(rng, 0.5));
      const ev: GameEvent | null = draw ? selectRandomEvent(s, content, rng, slot) : null;
      if (ev) {
        (s.firedEventIds ??= []).push(ev.id);
        s.currentEventId = ev.id;
        return;
      }
    }

    if (s.phase === "postseason") {
      const season = s.seasons[s.seasons.length - 1];
      if (season && season.seasonIndex === s.seasonIndex && !season.bigGame) {
        setupBigGame(s, content, rng, injuryOf);
        if (s.currentEventId !== null) return;
      }
      runAwards(s, content, rng, injuryOf);
    }
    advancePhase(s);
    s.phaseSimulated = false;
    if (s.phase === "offseason") {
      enterOffseason(s, content, rng);
      if (s.currentEventId !== null || s.status !== "active") return;
    }
  }
}

// The regular season's record, played out once at the start of the postseason.
function settleRegularSeason(s: GameState, content: ContentBundle, rng: Rng): void {
  const season = s.seasons[s.seasons.length - 1];
  if (!season || season.seasonIndex !== s.seasonIndex || season.teamWins + season.teamLosses > 0) return;
  const role = season.role ?? roleFor(s.overall, s.school.tier);
  const record = simulateTeamRecord(s.overall, s.school.tier, role, content.postseason, rng);
  season.teamWins = record.wins;
  season.teamLosses = record.losses;
}

function bowlTeam(s: GameState): boolean {
  const season = s.seasons[s.seasons.length - 1];
  return !!season && season.seasonIndex === s.seasonIndex && season.teamWins >= 6;
}

function finalizeIfEnded(s: GameState, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.status === "active") return;
  flushPendingEffects(s, injuryOf);
  if (s.status === "declared") {
    s.draftResult = computeDraftResult(s, rng);
    s.status = "drafted";
  }
}
