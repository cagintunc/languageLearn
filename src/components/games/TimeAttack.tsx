import { useState, useEffect, useCallback, useRef } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';
import { CheckCircle, XCircle, Trophy, Zap, Timer } from 'lucide-react';

interface Props {
  words: Word[];
}

const GAME_DURATION = 60;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestion(words: Word[]): { current: Word; options: Word[] } {
  const current = shuffle(words)[0];
  const pool = shuffle(words.filter(w => w.id !== current.id)).slice(0, 3);
  return { current, options: shuffle([current, ...pool]) };
}

export default function TimeAttack({ words }: Props) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [current, setCurrent] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poolRef = useRef<Word[]>([]);

  const loadNext = useCallback(() => {
    const q = pickQuestion(poolRef.current);
    setCurrent(q.current);
    setOptions(q.options);
    setSelected(null);
  }, []);

  const start = useCallback(() => {
    poolRef.current = shuffle(words).slice(0, 30);
    setPhase('playing');
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStreak(0);
    setTotal(0);
    setCorrect(0);
    loadNext();
  }, [words, loadNext]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  const handleSelect = (opt: Word) => {
    if (selected !== null || phase !== 'playing' || !current) return;
    setSelected(opt.id);
    const isCorrect = opt.id === current.id;
    setTotal(t => t + 1);
    if (isCorrect) {
      setStreak(s => {
        const newStreak = s + 1;
        const multiplier = Math.min(newStreak, 3);
        setScore(pts => pts + 10 * multiplier);
        return newStreak;
      });
      setCorrect(c => c + 1);
      setFlash('correct');
    } else {
      setStreak(0);
      setFlash('wrong');
    }
    setTimeout(() => {
      setFlash(null);
      loadNext();
    }, 500);
  };

  if (words.length < 4) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">Add at least 4 words to play Time Attack!</p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-16 bounce-in">
        <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 mx-auto mb-6">
          <Timer size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-3">Time Attack</h2>
        <p className="text-gray-500 mb-2">Answer as many as you can in <strong>60 seconds</strong>.</p>
        <p className="text-gray-400 text-sm mb-8">Build a streak for bonus points — up to <strong>3× multiplier</strong>!</p>
        <button
          onClick={start}
          className="px-10 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
        >
          Start!
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
        <p className="text-gray-500 mb-6">{correct} correct out of {total} ({pct}%)</p>
        <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-100">
          <p className="text-5xl font-extrabold text-orange-500 mb-1">{score}</p>
          <p className="text-gray-500 text-sm">points</p>
        </div>
        <button
          onClick={start}
          className="px-8 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  if (!current) return null;

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft > 20 ? '#f97316' : '#ef4444';
  const multiplier = Math.min(streak + 1, 3);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={16} className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-orange-400'} />
          <span className={`text-2xl font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-800'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="text-xs font-bold px-2 py-1 bg-orange-100 text-orange-600 rounded-full flex items-center gap-1">
              <Zap size={11} /> {multiplier}× streak
            </span>
          )}
          <span className="text-xl font-bold text-gray-800">{score} pts</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="h-2 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
        />
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border-2 p-8 mb-6 text-center transition-colors duration-150 ${
        flash === 'correct' ? 'border-green-400 bg-green-50' :
        flash === 'wrong' ? 'border-red-400 bg-red-50' :
        'border-gray-100'
      }`}>
        <div className="mb-3">
          <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border ${CATEGORY_COLORS[current.category]}`}>
            {CATEGORY_LABELS[current.category]}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-2">Which word matches this definition?</p>
        <p className="text-xl font-semibold text-gray-800">{current.definition}</p>
        {flash === 'correct' && <p className="mt-3 text-green-600 font-medium flex items-center justify-center gap-1"><CheckCircle size={15} /> Correct!</p>}
        {flash === 'wrong' && <p className="mt-3 text-red-500 font-medium flex items-center justify-center gap-1"><XCircle size={15} /> {current.word}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(opt => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === current.id;
          let cls = 'p-4 rounded-xl border-2 font-semibold text-lg text-center transition-all duration-150 ';
          if (selected === null) {
            cls += 'bg-white border-gray-200 hover:border-orange-400 hover:bg-orange-50 hover:shadow-sm cursor-pointer';
          } else if (isCorrect) {
            cls += 'bg-green-50 border-green-400 text-green-700 cursor-default';
          } else if (isSelected && !isCorrect) {
            cls += 'bg-red-50 border-red-400 text-red-700 cursor-default';
          } else {
            cls += 'bg-white border-gray-200 opacity-40 cursor-default';
          }
          return (
            <button key={opt.id} onClick={() => handleSelect(opt)} className={cls}>
              {opt.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
