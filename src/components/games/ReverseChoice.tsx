import { useState, useEffect, useCallback } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS, GameScore } from '../../types';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

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

function getDefOptions(correct: Word, allWords: Word[]): Word[] {
  const pool = shuffle(allWords.filter(w => w.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...pool]);
}

export default function ReverseChoice({ words }: Props) {
  const [queue, setQueue] = useState<Word[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [options, setOptions] = useState<Word[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState<GameScore>({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState<string | null>(null);

  const init = useCallback(() => {
    const q = shuffle(words).slice(0, 30);
    setQueue(q);
    setQIndex(0);
    setSelected(null);
    setScore({ correct: 0, total: 0 });
    setFinished(false);
    if (q.length > 0 && words.length >= 4) {
      setOptions(getDefOptions(q[0], words));
    }
  }, [words]);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (queue.length > 0 && qIndex < queue.length) {
      setOptions(getDefOptions(queue[qIndex], words));
    }
  }, [qIndex, queue, words]);

  if (words.length < 4) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">Add at least 4 words to play Word to Definition!</p>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">Round Complete!</h2>
        <p className="text-gray-500 mb-6">You scored {score.correct} out of {score.total}</p>
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{pct}%</span>
          </div>
        </div>
        <button
          onClick={init}
          className="px-8 py-3 bg-teal-600 text-white rounded-full font-semibold hover:bg-teal-700 transition-colors shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  const current = queue[qIndex];
  if (!current) return null;

  const handleSelect = (opt: Word) => {
    if (selected !== null) return;
    setSelected(opt.id);
    const isCorrect = opt.id === current.id;
    if (!isCorrect) {
      setShake(opt.id);
      setTimeout(() => setShake(null), 500);
    }
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setTimeout(() => {
      if (qIndex + 1 >= queue.length) {
        setFinished(true);
      } else {
        setQIndex(i => i + 1);
        setSelected(null);
      }
    }, 1400);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">Question {qIndex + 1} / {queue.length}</div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={14} className="text-green-500" />
          <span className="text-green-600 font-medium">{score.correct}</span>
          <XCircle size={14} className="text-red-400 ml-2" />
          <span className="text-red-500 font-medium">{score.total - score.correct}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(qIndex / queue.length) * 100}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
        <div className="mb-3">
          <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${CATEGORY_COLORS[current.category]}`}>
            {CATEGORY_LABELS[current.category]}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-3">Which definition matches this word?</p>
        <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{current.word}</p>
        {current.pronunciation && (
          <p className="mt-2 text-sm text-gray-400 italic">{current.pronunciation}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === current.id;
          let cls = 'p-4 rounded-xl border-2 text-left transition-all duration-200 ';
          if (selected === null) {
            cls += 'bg-white border-gray-200 hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm cursor-pointer';
          } else if (isCorrect) {
            cls += 'bg-green-50 border-green-400 text-green-800';
          } else if (isSelected && !isCorrect) {
            cls += 'bg-red-50 border-red-400 text-red-800';
          } else {
            cls += 'bg-white border-gray-200 opacity-50 cursor-default';
          }

          const labels = ['A', 'B', 'C', 'D'];

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className={`${cls} ${shake === opt.id ? 'shake' : ''} flex items-start gap-3`}
            >
              <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                selected === null ? 'bg-gray-100 text-gray-500' :
                isCorrect ? 'bg-green-200 text-green-700' :
                isSelected ? 'bg-red-200 text-red-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {labels[i]}
              </span>
              <span className="text-sm leading-relaxed">{opt.definition}</span>
              {selected !== null && isCorrect && <CheckCircle size={16} className="flex-shrink-0 ml-auto mt-0.5 text-green-500" />}
              {selected !== null && isSelected && !isCorrect && <XCircle size={16} className="flex-shrink-0 ml-auto mt-0.5 text-red-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
