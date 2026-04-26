import { useState, useEffect, useCallback, useRef } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS, GameScore } from '../../types';
import { Trophy, CheckCircle, XCircle, Volume2 } from 'lucide-react';

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

function scramble(word: string): string {
  if (word.length <= 2) return word;
  const letters = word.split('');
  let result: string;
  let attempts = 0;
  do {
    result = shuffle(letters).join('');
    attempts++;
  } while (result === word && attempts < 20);
  return result;
}

export default function Spelling({ words }: Props) {
  const [queue, setQueue] = useState<Word[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState<GameScore>({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);
  const [scrambled, setScrambled] = useState('');
  const [letterBoxes, setLetterBoxes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const init = useCallback(() => {
    const q = shuffle(words).slice(0, 30);
    setQueue(q);
    setQIndex(0);
    setInput('');
    setStatus('idle');
    setScore({ correct: 0, total: 0 });
    setFinished(false);
    if (q.length > 0) {
      const s = scramble(q[0].word);
      setScrambled(s);
      setLetterBoxes(s.split('').map(() => ''));
    }
  }, [words]);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (queue.length > 0 && qIndex < queue.length) {
      const s = scramble(queue[qIndex].word);
      setScrambled(s);
      setLetterBoxes(s.split('').map(() => ''));
    }
  }, [qIndex, queue]);

  const advance = useCallback(() => {
    const next = qIndex + 1;
    if (next >= queue.length) {
      setFinished(true);
    } else {
      setQIndex(next);
      setInput('');
      setStatus('idle');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [qIndex, queue.length]);

  const submit = () => {
    if (status !== 'idle' || !input.trim()) return;
    const current = queue[qIndex];
    const correct = input.trim().toLowerCase() === current.word.toLowerCase();
    setStatus(correct ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setTimeout(advance, correct ? 1000 : 2000);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.8;
      window.speechSynthesis.speak(utt);
    }
  };

  if (words.length === 0) {
    return <div className="text-center py-20 text-gray-400"><p className="text-lg">Add some words to play!</p></div>;
  }

  if (finished) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">Finished!</h2>
        <p className="text-gray-500 mb-6">Score: {score.correct} / {score.total} ({pct}%)</p>
        <button onClick={init} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg">
          Play Again
        </button>
      </div>
    );
  }

  const current = queue[qIndex];
  if (!current) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">Word {qIndex + 1} / {queue.length}</div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-green-600 font-medium">{score.correct}</span>
          <XCircle size={14} className="text-red-400 ml-2" />
          <span className="text-red-500 font-medium">{score.total - score.correct}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(qIndex / queue.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${CATEGORY_COLORS[current.category]}`}>
            {CATEGORY_LABELS[current.category]}
          </span>
          <button
            onClick={() => speak(current.word)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            title="Listen"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-2">Unscramble the letters to form the word:</p>
        <p className="text-gray-700 text-sm mb-4 italic">{current.definition}</p>

        {/* Scrambled letters */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {scrambled.split('').map((letter, i) => (
            <span
              key={`${letter}-${i}`}
              className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-lg font-bold uppercase border border-indigo-200"
            >
              {letter}
            </span>
          ))}
        </div>

        {current.example && (
          <p className="text-xs text-gray-400 italic text-center">"{current.example}"</p>
        )}
      </div>

      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Type the correct word..."
          disabled={status !== 'idle'}
          autoFocus
          className={`flex-1 px-5 py-3.5 rounded-xl border-2 text-lg font-medium outline-none transition-all ${
            status === 'correct' ? 'border-green-400 bg-green-50 text-green-700' :
            status === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' :
            'border-gray-200 focus:border-indigo-400'
          }`}
        />
        <button
          onClick={submit}
          disabled={status !== 'idle' || !input.trim()}
          className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
      </div>

      {status === 'correct' && (
        <p className="mt-3 text-green-600 font-medium flex items-center gap-1.5">
          <CheckCircle size={16} /> Correct! 🎉
        </p>
      )}
      {status === 'wrong' && (
        <p className="mt-3 text-red-600 font-medium flex items-center gap-1.5">
          <XCircle size={16} /> The answer was: <strong>{current.word}</strong>
        </p>
      )}
    </div>
  );
}
