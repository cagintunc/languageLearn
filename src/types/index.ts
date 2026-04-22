export type WordCategory = 'verb' | 'phrasal-verb' | 'adjective' | 'adverb' | 'noun';

export interface Word {
  id: string;
  word: string;
  category: WordCategory;
  definition: string;
  example: string;
  translation?: string;
  pronunciation?: string;
}

export type GameType = 'flashcard' | 'multiple-choice' | 'fill-blank' | 'word-match' | 'spelling';

export interface GameScore {
  correct: number;
  total: number;
}

export const CATEGORY_LABELS: Record<WordCategory, string> = {
  verb: 'Verb',
  'phrasal-verb': 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  noun: 'Noun',
};

export const CATEGORY_COLORS: Record<WordCategory, string> = {
  verb: 'bg-blue-100 text-blue-800 border-blue-200',
  'phrasal-verb': 'bg-purple-100 text-purple-800 border-purple-200',
  adjective: 'bg-green-100 text-green-800 border-green-200',
  adverb: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  noun: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const CATEGORY_BG: Record<WordCategory, string> = {
  verb: 'from-blue-500 to-blue-700',
  'phrasal-verb': 'from-purple-500 to-purple-700',
  adjective: 'from-green-500 to-green-700',
  adverb: 'from-yellow-500 to-yellow-700',
  noun: 'from-rose-500 to-rose-700',
};
