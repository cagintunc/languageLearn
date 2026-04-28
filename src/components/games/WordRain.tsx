import { useState, useEffect, useRef, useCallback } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';
import { Heart, Trophy } from 'lucide-react';
import { shuffle, selectWords } from '../../lib/wordUtils';

const MAX_LIVES = 3;
const BASE_SPEED = 5.5; // seconds to cross the arena
const ARENA_PX = 400;   // arena height in px

// ─── Individual falling word ─────────────────────────────────────────────────

interface FallerProps {
  word: Word;
  isCorrect: boolean;
  x: number;       // % from left
  speed: number;   // seconds
  delay: number;   // seconds
  onCorrect: () => void;
  onMiss: () => void;
  onWrong: () => void;
}

function Faller({ word, isCorrect, x, speed, delay, onCorrect, onMiss, onWrong }: FallerProps) {
  const el = useRef<HTMLButtonElement>(null);
  const stateRef = useRef<'falling' | 'done'>('falling');
  const rafRef = useRef(0);
  const [ended, setEnded] = useState<'none' | 'correct' | 'wrong'>('none');

  useEffect(() => {
    let start: number | null = null;
    const totalMs = speed * 1000;

    const tick = (ts: number) => {
      if (start === null) start = ts + delay * 1000;
      if (ts < start) { rafRef.current = requestAnimationFrame(tick); return; }
      if (stateRef.current === 'done') return;

      const prog = Math.min((ts - start) / totalMs, 1);
      const top = -80 + prog * (ARENA_PX + 94); // -80px → ARENA_PX+14px

      if (el.current) el.current.style.top = `${top}px`;

      if (prog >= 1) {
        stateRef.current = 'done';
        if (isCorrect) onMiss();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = () => {
    if (stateRef.current === 'done') return;
    stateRef.current = 'done';
    cancelAnimationFrame(rafRef.current);

    if (isCorrect) {
      setEnded('correct');
      setTimeout(onCorrect, 380);
    } else {
      setEnded('wrong');
      setTimeout(onWrong, 380);
    }
  };

  return (
    <button
      ref={el}
      onClick={handleClick}
      style={{ position: 'absolute', left: `${x}%`, transform: 'translateX(-50%)', top: '-80px', width: '23%', textAlign: 'center' }}
      className={[
        'px-4 py-2.5 rounded-xl border-2 font-bold text-sm shadow-lg select-none',
        'transition-[transform,opacity] duration-350',
        ended === 'correct'
          ? 'scale-150 opacity-0 bg-green-400 border-green-500 text-white'
          : ended === 'wrong'
          ? 'scale-75 opacity-0 bg-red-300 border-red-400 text-red-900'
          : isCorrect
          ? 'bg-white border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-900 cursor-pointer'
          : 'bg-white border-gray-200 hover:border-gray-400 text-gray-700 cursor-pointer',
      ].join(' ')}
    >
      {word.word}
    </button>
  );
}

// ─── Parent game ─────────────────────────────────────────────────────────────

interface Props { words: Word[]; }

export default function WordRain({ words }: Props) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);

  // Mutable game state (refs avoid stale closures in callbacks)
  const livesRef = useRef(MAX_LIVES);
  const queueRef = useRef<Word[]>([]);
  const qIndexRef = useRef(0);
  const correctCountRef = useRef(0);
  const scoreRef = useRef(0);

  const [currentQ, setCurrentQ] = useState<{
    word: Word;
    options: { word: Word; x: number; speed: number; delay: number }[];
  } | null>(null);

  function buildQ(q: Word[], qi: number) {
    const correct = q[qi];
    const distractors = shuffle(words.filter(w => w.id !== correct.id)).slice(0, 3);
    const opts = shuffle([correct, ...distractors]);
    const xs = shuffle([12.5, 37.5, 62.5, 87.5]);
    const level = Math.floor(correctCountRef.current / 5) + 1;
    const baseSpd = Math.max(2.5, BASE_SPEED - (level - 1) * 0.4);
    // Longer word+definition → more seconds to fall so user has time to read
    const totalLen = correct.word.length + correct.definition.length;
    const lengthBonus = Math.min(4, Math.max(0, (totalLen - 20) / 25));
    const spd = baseSpd + lengthBonus;
    return {
      word: correct,
      options: opts.map((w, i) => ({
        word: w,
        x: xs[i],
        speed: spd + Math.random() * 0.5 - 0.25,
        delay: i * 0.18,
      })),
    };
  }

  function triggerFlash(color: 'green' | 'red') {
    setFlash(color);
    setTimeout(() => setFlash(null), 350);
  }

  function next(currentLives: number) {
    const ni = qIndexRef.current + 1;
    if (ni >= queueRef.current.length || currentLives <= 0) {
      setPhase('done');
      return;
    }
    qIndexRef.current = ni;
    setCurrentQ(buildQ(queueRef.current, ni));
    setRoundKey(k => k + 1);
  }

  const handleCorrect = useCallback(() => {
    correctCountRef.current++;
    const level = Math.floor(correctCountRef.current / 5) + 1;
    scoreRef.current += 10 * level;
    setScore(scoreRef.current);
    triggerFlash('green');
    next(livesRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMiss = useCallback(() => {
    livesRef.current--;
    setLives(livesRef.current);
    triggerFlash('red');
    next(livesRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWrong = useCallback(() => {
    livesRef.current--;
    setLives(livesRef.current);
    triggerFlash('red');
    if (livesRef.current <= 0) setPhase('done');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    const q = selectWords(words);
    queueRef.current = q;
    qIndexRef.current = 0;
    livesRef.current = MAX_LIVES;
    correctCountRef.current = 0;
    scoreRef.current = 0;
    setLives(MAX_LIVES);
    setScore(0);
    setPhase('playing');
    setCurrentQ(buildQ(q, 0));
    setRoundKey(k => k + 1);
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  if (words.length < 4) {
    return <div className="text-center py-20 text-gray-400"><p className="text-lg">Add at least 4 words to play Word Rain!</p></div>;
  }

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-16 bounce-in">
        <div className="text-6xl mb-6">🌧️</div>
        <h2 className="text-3xl font-bold mb-3">Word Rain</h2>
        <p className="text-gray-500 mb-2">Words fall from the sky. <strong>Click the correct one</strong> before it hits the ground!</p>
        <p className="text-gray-400 text-sm mb-8">Miss the right word or click the wrong one = lose a life. 3 lives total. Speed up every 5 correct.</p>
        <button onClick={start} className="px-10 py-4 bg-sky-500 text-white rounded-full font-bold text-lg hover:bg-sky-600 transition-colors shadow-lg">
          Start!
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
        <p className="text-gray-500 mb-6">{correctCountRef.current} words caught correctly</p>
        <div className="bg-sky-50 rounded-2xl p-6 mb-8 border border-sky-100">
          <p className="text-5xl font-extrabold text-sky-500 mb-1">{score}</p>
          <p className="text-gray-500 text-sm">points</p>
        </div>
        <button onClick={start} className="px-8 py-3 bg-sky-500 text-white rounded-full font-semibold hover:bg-sky-600 transition-colors shadow-lg">
          Play Again
        </button>
      </div>
    );
  }

  if (!currentQ) return null;
  const { word: current, options } = currentQ;
  const level = Math.floor(correctCountRef.current / 5) + 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i} size={22}
              className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Level {level}</span>
        <span className="font-bold text-gray-800 tabular-nums">{score} pts</span>
      </div>

      {/* Definition */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-3 text-center">
        <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-2 inline-block ${CATEGORY_COLORS[current.category]}`}>
          {CATEGORY_LABELS[current.category]}
        </span>
        <p className="text-xs text-gray-400 mb-1">Click the word that means:</p>
        <p className="text-lg font-semibold text-gray-800">{current.definition}</p>
      </div>

      {/* Arena */}
      <div
        className={[
          'relative w-full overflow-hidden rounded-2xl border-2 border-sky-200 select-none',
          flash === 'green' ? 'flash-green' : flash === 'red' ? 'flash-red' : '',
        ].join(' ')}
        style={{ height: `${ARENA_PX}px`, background: 'linear-gradient(to bottom, #e0f2fe, #bae6fd, #7dd3fc)' }}
      >
        {/* Cloud decorations */}
        {[12, 38, 62, 85].map((x, i) => (
          <span key={i} className="absolute text-2xl opacity-25 pointer-events-none" style={{ left: `${x}%`, top: `${8 + (i % 2) * 6}%` }}>☁️</span>
        ))}
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-sky-400 opacity-50 rounded-b-2xl" />

        {options.map(opt => (
          <Faller
            key={`${roundKey}-${opt.word.id}`}
            word={opt.word}
            isCorrect={opt.word.id === current.id}
            x={opt.x}
            speed={opt.speed}
            delay={opt.delay}
            onCorrect={handleCorrect}
            onMiss={handleMiss}
            onWrong={handleWrong}
          />
        ))}
      </div>
    </div>
  );
}
