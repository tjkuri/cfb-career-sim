export interface Rng {
  next(): number;
  readonly cursor: number;
}

// Deterministic string -> 32-bit seed (xfnv1a).
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string, cursor = 0): Rng {
  const base = hashSeed(seed);
  const gen = mulberry32(base);
  // Fast-forward to the requested cursor so a career can resume mid-stream.
  for (let i = 0; i < cursor; i++) gen();
  let c = cursor;
  return {
    get cursor() {
      return c;
    },
    next() {
      c += 1;
      return gen();
    },
  };
}

export function rngInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) {
    throw new RangeError(`rngInt: max (${maxInclusive}) < min (${minInclusive})`);
  }
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rng.next() * span);
}

export function rngPick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("rngPick: empty array");
  return items[rngInt(rng, 0, items.length - 1)]!;
}

export function rngWeightedPick<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T {
  if (items.length === 0) throw new Error("rngWeightedPick: empty array");
  const weights = items.map((i) => Math.max(0, weightOf(i)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[0]!;
  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function rngChance(rng: Rng, probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return rng.next() < probability;
}
