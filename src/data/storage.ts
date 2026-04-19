import { Word } from '../types';

const STORAGE_KEY = 'linguaplay_words';

export const loadWords = (): Word[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDefaultWords();
  } catch {
    return getDefaultWords();
  }
};

export const saveWords = (words: Word[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
};

const getDefaultWords = (): Word[] => [
  {
    id: '1',
    word: 'run',
    category: 'verb',
    definition: 'To move swiftly on foot',
    example: 'She runs every morning to stay fit.',
    translation: '',
  },
  {
    id: '2',
    word: 'give up',
    category: 'phrasal-verb',
    definition: 'To stop trying; to quit',
    example: 'Never give up on your dreams.',
    translation: '',
  },
  {
    id: '3',
    word: 'beautiful',
    category: 'adjective',
    definition: 'Pleasing to the senses or mind aesthetically',
    example: 'The sunset was absolutely beautiful.',
    translation: '',
  },
  {
    id: '4',
    word: 'quickly',
    category: 'adverb',
    definition: 'At a fast speed; rapidly',
    example: 'He quickly finished his homework.',
    translation: '',
  },
  {
    id: '5',
    word: 'innovation',
    category: 'noun',
    definition: 'A new idea, method, or device; the introduction of something new',
    example: 'The innovation changed the way we communicate.',
    translation: '',
  },
  {
    id: '6',
    word: 'accomplish',
    category: 'verb',
    definition: 'To succeed in doing or achieving something',
    example: 'She accomplished all her goals this year.',
    translation: '',
  },
  {
    id: '7',
    word: 'look forward to',
    category: 'phrasal-verb',
    definition: 'To feel excited or pleased about something that is going to happen',
    example: 'I look forward to seeing you at the party.',
    translation: '',
  },
  {
    id: '8',
    word: 'brilliant',
    category: 'adjective',
    definition: 'Exceptionally clever or talented',
    example: 'The brilliant scientist solved the equation in minutes.',
    translation: '',
  },
  {
    id: '9',
    word: 'gradually',
    category: 'adverb',
    definition: 'In a slow or cautious manner; by degrees',
    example: 'The situation gradually improved over time.',
    translation: '',
  },
  {
    id: '10',
    word: 'perseverance',
    category: 'noun',
    definition: 'Continued effort despite difficulty or delay in achieving success',
    example: 'His perseverance eventually led to success.',
    translation: '',
  },
];
