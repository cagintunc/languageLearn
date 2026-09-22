const MISS_KEY = 'word_misses_v1';

export type MissMap = Record<string, number>;

export function loadMisses(): MissMap {
  try { return JSON.parse(localStorage.getItem(MISS_KEY) ?? '{}'); } catch { return {}; }
}

export function recordMiss(id: string): MissMap {
  const misses = loadMisses();
  misses[id] = (misses[id] ?? 0) + 1;
  localStorage.setItem(MISS_KEY, JSON.stringify(misses));
  return misses;
}
