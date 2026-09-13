import type { LogEntry, Resolved, UiState } from "./types";
import type { GameState } from "../../engine/index";

const PREFIX = "cfb-career-sim:v1:";
const CURRENT_KEY = `${PREFIX}current`;
const LOG_KEY = `${PREFIX}log`;
const SCHEMA = 1;
export const LOG_CAP = 50;

interface CurrentSave {
  schema: number;
  state: GameState;
  resolved: Resolved | null;
}

interface LogSave {
  schema: number;
  entries: LogEntry[];
}

// Every read is defensive. localStorage can be unavailable (private mode,
// blocked site data), hold a save from an older schema, or hold something
// another tab half-wrote. In all of those cases the right move is to behave
// like a first visit, never to throw on the way to first paint.
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
    // Quota or blocked storage. The game stays playable in memory.
  }
}

export function saveCurrent(state: GameState, resolved: Resolved | null): void {
  const payload: CurrentSave = { schema: SCHEMA, state, resolved };
  write(CURRENT_KEY, payload);
}

export function clearCurrent(): void {
  try {
    localStorage.removeItem(CURRENT_KEY);
  } catch {
    /* nothing to do */
  }
}

export function loadCurrent(): { state: GameState; resolved: Resolved | null } | null {
  const saved = read<CurrentSave>(CURRENT_KEY);
  if (!saved || saved.schema !== SCHEMA || !saved.state) return null;
  return { state: saved.state, resolved: saved.resolved ?? null };
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
  // Newest first, capped, so storage cannot grow without bound.
  return [entry, ...entries].slice(0, LOG_CAP);
}

export function hydrate(base: UiState): UiState {
  const log = loadLog();
  const current = loadCurrent();
  if (!current) return { ...base, log };
  return {
    ...base,
    log,
    screen: current.state.status === "active" ? "career" : "summary",
    setup: current.state.setup,
    seed: current.state.seed,
    state: current.state,
    resolved: current.resolved,
  };
}
