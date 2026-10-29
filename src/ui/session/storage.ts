import type { LogEntry, Resolved, SeasonRecap, UiState } from "./types";
import type { GameState } from "../../engine/index";

// v2: the season loop, the cards and the save shape all changed. A v1 save is
// left alone rather than migrated -- it describes a different game.
const PREFIX = "cfb-career-sim:v2:";
const CURRENT_KEY = `${PREFIX}current`;
const LOG_KEY = `${PREFIX}log`;
const SCHEMA = 2;
export const LOG_CAP = 50;

interface CurrentSave {
  schema: number;
  state: GameState;
  resolved: Resolved | null;
  recap: SeasonRecap | null;
}

interface LogSave {
  schema: number;
  entries: LogEntry[];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota: the game still plays, it just won't resume.
  }
}

export function saveCurrent(state: GameState, resolved: Resolved | null, recap: SeasonRecap | null): void {
  write(CURRENT_KEY, { schema: SCHEMA, state, resolved, recap } satisfies CurrentSave);
}

export function clearCurrent(): void {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch {
    /* nothing to do */
  }
}

export function loadCurrent(): Omit<CurrentSave, "schema"> | null {
  const saved = read<CurrentSave>(CURRENT_KEY);
  if (!saved || saved.schema !== SCHEMA || !saved.state) return null;
  return { state: saved.state, resolved: saved.resolved ?? null, recap: saved.recap ?? null };
}

export function loadLog(): LogEntry[] {
  const saved = read<LogSave>(LOG_KEY);
  if (!saved || saved.schema !== SCHEMA || !Array.isArray(saved.entries)) return [];
  return saved.entries;
}

export function saveLog(entries: LogEntry[]): void {
  write(LOG_KEY, { schema: SCHEMA, entries: entries.slice(0, LOG_CAP) } satisfies LogSave);
}

export function appendLog(entries: LogEntry[], entry: LogEntry): LogEntry[] {
  return [entry, ...entries].slice(0, LOG_CAP);
}

export function hydrate(base: UiState): UiState {
  const log = loadLog();
  const current = loadCurrent();
  if (!current) return { ...base, log };
  const live = current.state.status === "active" || current.resolved || current.recap;
  return {
    ...base,
    log,
    screen: live ? "career" : "summary",
    setup: current.state.setup,
    seed: current.state.seed,
    state: current.state,
    resolved: current.resolved,
    recap: current.recap,
  };
}
