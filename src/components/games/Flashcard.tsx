import { useState, useCallback } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BG } from '../../types';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';

interface Props {
  words: Word[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcard({ words }: Props) {
  const [deck, setDeck] = useState(() => shuffle(words).slice(0, 30));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());

  const current = deck[index];

  const next = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIndex(i => Math.min(i + 1, deck.length - 1)), 150);
  }, [deck.length]);

  const prev = useCallback(() => {
    setFlipped(false);
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150);
  }, []);

  const reshuffle = () => {
    setDeck(shuffle(words).slice(0, 30));
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
  };

  const markKnown = () => {
    setKnown(prev => new Set([...prev, current.id]));
    if (index < deck.length - 1) next();
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">No words yet. Add some words to start!</p>
      </div>
    );
  }

  const isKnown = known.has(current.id);
  const bgGradient = CATEGORY_BG[current.category];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          Card {index + 1} of {deck.length}
          {known.size > 0 && (
            <span className="ml-2 text-green-600 font-medium">· {known.size} known</span>
          )}
        </div>
        <button
          onClick={reshuffle}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Shuffle size={14} />
          Shuffle
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / deck.length) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="perspective-1000 cursor-pointer mb-8"
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`card-flip relative h-72 ${flipped ? 'flipped' : ''}`}>
          {/* Front */}
          <div className={`card-face absolute inset-0 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-2xl flex flex-col items-center justify-center p-8 text-white`}>
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 mb-6`}>
              {CATEGORY_LABELS[current.category]}
            </span>
            <h2 className="text-5xl font-bold text-center">{current.word}</h2>
            {current.translation && (
              <p className="mt-4 text-white/70 text-sm">{current.translation}</p>
            )}
            <p className="mt-8 text-white/60 text-xs">Click to reveal definition</p>
          </div>

          {/* Back */}
          <div className="card-back card-face absolute inset-0 rounded-2xl bg-white shadow-2xl flex flex-col items-center justify-center p-8 border border-gray-100">
            <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-5 ${CATEGORY_COLORS[current.category]}`}>
              {CATEGORY_LABELS[current.category]}
            </span>
            <p className="text-xl text-gray-800 text-center font-medium mb-4">{current.definition}</p>
            {current.example && (
              <p className="text-sm text-gray-500 italic text-center">"{current.example}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={markKnown}
          className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm ${
            isKnown
              ? 'bg-green-500 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300'
          }`}
        >
          {isKnown ? '✓ Known' : 'Mark as Known'}
        </button>

        <button
          onClick={() => { setFlipped(false); setIndex(0); setKnown(new Set()); }}
          className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
          title="Restart"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={next}
          disabled={index === deck.length - 1}
          className="p-3 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {known.size === deck.length && (
        <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center bounce-in">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold text-green-800">You know all the words!</p>
          <button onClick={reshuffle} className="mt-3 text-sm text-green-700 underline">Start again with a new order</button>
        </div>
      )}
    </div>
  );
}
