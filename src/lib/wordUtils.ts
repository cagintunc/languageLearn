import { Word } from '../types';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle words and pick up to 30, ensuring no two entries share the same word text. */
export function selectWords(words: Word[], limit = 30): Word[] {
  const seen = new Set<string>();
  const result: Word[] = [];
  for (const w of shuffle(words)) {
    if (!seen.has(w.word)) {
      seen.add(w.word);
      result.push(w);
      if (result.length === limit) break;
    }
  }
  return result;
}
