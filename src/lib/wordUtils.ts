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

/**
 * Pick distractors for a multiple-choice question, preferring words that share
 * the correct word's category so every option is the same part of speech.
 * Falls back to other categories only if there aren't enough same-category words.
 */
export function sameCategoryDistractors(correct: Word, allWords: Word[], count = 3): Word[] {
  const pool = allWords.filter(w => w.id !== correct.id);
  const sameCategory = shuffle(pool.filter(w => w.category === correct.category));
  const otherCategory = shuffle(pool.filter(w => w.category !== correct.category));
  return [...sameCategory, ...otherCategory].slice(0, count);
}
