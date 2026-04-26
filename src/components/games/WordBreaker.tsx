import { useState, useEffect, useRef, useCallback } from 'react';
import { Word, CATEGORY_LABELS, CATEGORY_COLORS } from '../../types';
import { Heart, Trophy } from 'lucide-react';

// ─── Canvas constants ─────────────────────────────────────────────────────────
const W = 600, H = 440;
const BALL_R = 9;
const BALL_SPEED = 5;
const PADDLE_W = 110, PADDLE_H = 12, PADDLE_Y = H - 36;
const BRICK_W = 128, BRICK_H = 44, BRICK_GAP = 10;
const BRICK_Y = 55;
const NUM_BRICKS = 4; // 1 correct + 3 wrong
const BRICK_START_X = (W - (NUM_BRICKS * BRICK_W + (NUM_BRICKS - 1) * BRICK_GAP)) / 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Brick { x: number; y: number; word: Word; isCorrect: boolean; alive: boolean }
interface Ball  { x: number; y: number; vx: number; vy: number }
interface Paddle { x: number }

interface GameState {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  lives: number;
  score: number;
  phase: 'playing' | 'done';
  launched: boolean; // ball stuck to paddle until first click
}

function makeBricks(correct: Word, all: Word[]): Brick[] {
  const distractors = shuffle(all.filter(w => w.id !== correct.id)).slice(0, NUM_BRICKS - 1);
  const words = shuffle([correct, ...distractors]);
  return words.map((w, i) => ({
    x: BRICK_START_X + i * (BRICK_W + BRICK_GAP),
    y: BRICK_Y,
    word: w,
    isCorrect: w.id === correct.id,
    alive: true,
  }));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function draw(ctx: CanvasRenderingContext2D, gs: GameState, t: number) {
  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Bricks
  for (const b of gs.bricks) {
    if (!b.alive) continue;
    ctx.save();
    if (b.isCorrect) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.004);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20 * pulse;
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK_H);
      grad.addColorStop(0, '#fcd34d');
      grad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = grad;
    } else {
      ctx.shadowBlur = 0;
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + BRICK_H);
      grad.addColorStop(0, '#334155');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
    }
    roundRect(ctx, b.x, b.y, BRICK_W, BRICK_H, 8);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = b.isCorrect ? 'rgba(251,191,36,0.8)' : 'rgba(100,116,139,0.5)';
    ctx.lineWidth = b.isCorrect ? 2 : 1;
    ctx.stroke();

    // Word label
    ctx.fillStyle = b.isCorrect ? '#1c1917' : '#94a3b8';
    ctx.font = `bold ${b.word.word.length > 12 ? 12 : 14}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxW = BRICK_W - 16;
    ctx.fillText(b.word.word, b.x + BRICK_W / 2, b.y + BRICK_H / 2, maxW);
    ctx.restore();
  }

  // Danger zone line
  ctx.strokeStyle = 'rgba(239,68,68,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(0, H - 10); ctx.lineTo(W, H - 10); ctx.stroke();
  ctx.setLineDash([]);

  // Paddle
  const px = gs.paddle.x - PADDLE_W / 2;
  const paddleGrad = ctx.createLinearGradient(px, PADDLE_Y, px, PADDLE_Y + PADDLE_H);
  paddleGrad.addColorStop(0, '#818cf8');
  paddleGrad.addColorStop(1, '#4f46e5');
  ctx.save();
  ctx.shadowColor = '#6366f1';
  ctx.shadowBlur = 12;
  ctx.fillStyle = paddleGrad;
  roundRect(ctx, px, PADDLE_Y, PADDLE_W, PADDLE_H, 5);
  ctx.fill();
  ctx.restore();

  // Ball
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(gs.ball.x, gs.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // "Tap to launch" hint
  if (!gs.launched) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click / tap canvas to launch', W / 2, H / 2 + 40);
  }
}

function ballBrickCollision(ball: Ball, brick: Brick): boolean {
  const nx = Math.max(brick.x, Math.min(ball.x, brick.x + BRICK_W));
  const ny = Math.max(brick.y, Math.min(ball.y, brick.y + BRICK_H));
  const dx = ball.x - nx, dy = ball.y - ny;
  return dx * dx + dy * dy < BALL_R * BALL_R;
}

function resolveCollision(ball: Ball, brick: Brick) {
  const ol = (ball.x + BALL_R) - brick.x;
  const or_ = (brick.x + BRICK_W) - (ball.x - BALL_R);
  const ot = (ball.y + BALL_R) - brick.y;
  const ob = (brick.y + BRICK_H) - (ball.y - BALL_R);
  const min = Math.min(ol, or_, ot, ob);
  if (min === ot)       { ball.vy = -Math.abs(ball.vy); ball.y = brick.y - BALL_R; }
  else if (min === ob)  { ball.vy =  Math.abs(ball.vy); ball.y = brick.y + BRICK_H + BALL_R; }
  else if (min === ol)  { ball.vx = -Math.abs(ball.vx); ball.x = brick.x - BALL_R; }
  else                  { ball.vx =  Math.abs(ball.vx); ball.x = brick.x + BRICK_W + BALL_R; }
}

interface Props { words: Word[] }

export default function WordBreaker({ words }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const gsRef     = useRef<GameState | null>(null);
  const mouseXRef = useRef(W / 2);

  const [phase,     setPhase]     = useState<'idle' | 'playing' | 'done'>('idle');
  const [lives,     setLives]     = useState(3);
  const [score,     setScore]     = useState(0);
  const [qIndex,    setQIndex]    = useState(0);
  const [definition, setDef]      = useState('');
  const [category,  setCat]       = useState<Word['category']>('noun');
  const [flash,     setFlash]     = useState<'green' | 'red' | null>(null);

  const queueRef        = useRef<Word[]>([]);
  const qIndexRef       = useRef(0);
  const correctCountRef = useRef(0);
  const scoreRef        = useRef(0);

  function triggerFlash(color: 'green' | 'red') {
    setFlash(color);
    setTimeout(() => setFlash(null), 350);
  }

  function loadQuestion(qi: number) {
    const correct = queueRef.current[qi];
    gsRef.current!.bricks = makeBricks(correct, words);
    resetBall(gsRef.current!);
    setDef(correct.definition);
    setCat(correct.category);
    setQIndex(qi);
  }

  function resetBall(gs: GameState) {
    gs.ball = { x: W / 2, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0 };
    gs.launched = false;
  }

  const launch = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.launched || gs.phase !== 'playing') return;
    gs.launched = true;
    const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3);
    gs.ball.vx = Math.cos(angle) * BALL_SPEED;
    gs.ball.vy = Math.sin(angle) * BALL_SPEED;
  }, []);

  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = (ts: number) => {
      const gs = gsRef.current;
      if (!gs || gs.phase !== 'playing') return;

      // Paddle tracks mouse (smooth)
      gs.paddle.x += (mouseXRef.current - gs.paddle.x) * 0.2;
      gs.paddle.x = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, gs.paddle.x));

      if (gs.launched) {
        // Ball stuck to paddle until launched
        const b = gs.ball;
        b.x += b.vx;
        b.y += b.vy;

        // Wall bounces
        if (b.x - BALL_R <= 0)  { b.vx =  Math.abs(b.vx); b.x = BALL_R; }
        if (b.x + BALL_R >= W)  { b.vx = -Math.abs(b.vx); b.x = W - BALL_R; }
        if (b.y - BALL_R <= 0)  { b.vy =  Math.abs(b.vy); b.y = BALL_R; }

        // Paddle bounce
        if (
          b.y + BALL_R >= PADDLE_Y &&
          b.y - BALL_R <= PADDLE_Y + PADDLE_H &&
          b.x >= gs.paddle.x - PADDLE_W / 2 &&
          b.x <= gs.paddle.x + PADDLE_W / 2
        ) {
          b.vy = -Math.abs(b.vy);
          b.y = PADDLE_Y - BALL_R - 1;
          // Spin based on where ball hits
          const hit = (b.x - gs.paddle.x) / (PADDLE_W / 2);
          b.vx = hit * 4.5;
          const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          b.vx = (b.vx / spd) * BALL_SPEED;
          b.vy = (b.vy / spd) * BALL_SPEED;
        }

        // Brick collisions
        for (const brick of gs.bricks) {
          if (!brick.alive) continue;
          if (ballBrickCollision(b, brick)) {
            if (brick.isCorrect) {
              brick.alive = false;
              correctCountRef.current++;
              scoreRef.current += 15 * Math.max(1, Math.floor(correctCountRef.current / 3));
              setScore(scoreRef.current);
              triggerFlash('green');

              const nextQi = qIndexRef.current + 1;
              if (nextQi >= queueRef.current.length) {
                gs.phase = 'done';
                setPhase('done');
              } else {
                qIndexRef.current = nextQi;
                setTimeout(() => loadQuestion(nextQi), 400);
              }
            } else {
              // Wrong brick — bounce but don't break
              resolveCollision(b, brick);
            }
          }
        }
        // Correct brick resolved after the loop to avoid double-bounce
        for (const brick of gs.bricks) {
          if (!brick.alive) continue;
          if (ballBrickCollision(b, brick) && brick.isCorrect) {
            resolveCollision(b, brick);
          }
        }

        // Ball fell off bottom
        if (b.y - BALL_R > H) {
          gs.lives--;
          setLives(gs.lives);
          triggerFlash('red');
          if (gs.lives <= 0) {
            gs.phase = 'done';
            setPhase('done');
          } else {
            resetBall(gs);
          }
        }
      } else {
        // Ball glued to paddle
        gs.ball.x = gs.paddle.x;
        gs.ball.y = PADDLE_Y - BALL_R - 1;
      }

      draw(ctx, gs, ts);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    stopLoop();
    const q = shuffle(words).slice(0, 30);
    queueRef.current = q;
    qIndexRef.current = 0;
    correctCountRef.current = 0;
    scoreRef.current = 0;

    const correct = q[0];
    const gs: GameState = {
      ball: { x: W / 2, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0 },
      paddle: { x: W / 2 },
      bricks: makeBricks(correct, words),
      lives: 3,
      score: 0,
      phase: 'playing',
      launched: false,
    };
    gsRef.current = gs;

    setLives(3);
    setScore(0);
    setQIndex(0);
    setDef(correct.definition);
    setCat(correct.category);
    setPhase('playing');
    startLoop();
  }, [words, stopLoop, startLoop]);

  // Handle canvas mouse events
  const getCanvasX = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    return (clientX - rect.left) * scale;
  };

  const onMouseMove = (e: React.MouseEvent) => { mouseXRef.current = getCanvasX(e); };
  const onTouchMove = (e: React.TouchEvent) => { e.preventDefault(); mouseXRef.current = getCanvasX(e); };

  useEffect(() => () => stopLoop(), [stopLoop]);

  if (words.length < 4) {
    return <div className="text-center py-20 text-gray-400"><p className="text-lg">Add at least 4 words to play Word Breaker!</p></div>;
  }

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-16 bounce-in">
        <div className="text-6xl mb-6">🧱</div>
        <h2 className="text-3xl font-bold mb-3">Word Breaker</h2>
        <p className="text-gray-500 mb-2">The <strong className="text-yellow-500">gold brick</strong> is the correct word. Aim the ball at it!</p>
        <p className="text-gray-400 text-sm mb-8">Move your mouse to control the paddle. Gray bricks bounce the ball — only the gold one breaks. 3 lives.</p>
        <button onClick={start} className="px-10 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg">
          Start!
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">{lives > 0 ? 'All Done!' : 'Game Over!'}</h2>
        <p className="text-gray-500 mb-6">{correctCountRef.current} bricks broken correctly</p>
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
          <p className="text-5xl font-extrabold text-indigo-600 mb-1">{score}</p>
          <p className="text-gray-500 text-sm">points</p>
        </div>
        <button onClick={start} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg">
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* HUD */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} size={22} className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-200'} />
          ))}
        </div>
        <span className="text-sm text-gray-500">Word {qIndex + 1} / {Math.min(queueRef.current.length, 30)}</span>
        <span className="font-bold text-gray-800 tabular-nums">{score} pts</span>
      </div>

      {/* Canvas */}
      <div
        className={[
          'rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl mb-4',
          flash === 'green' ? 'flash-green' : flash === 'red' ? 'flash-red' : '',
        ].join(' ')}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={launch}
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
          onTouchStart={launch}
          style={{ width: '100%', display: 'block', cursor: 'none', touchAction: 'none' }}
        />
      </div>

      {/* Definition */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
        <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border mb-2 inline-block ${CATEGORY_COLORS[category]}`}>
          {CATEGORY_LABELS[category]}
        </span>
        <p className="text-xs text-gray-400 mb-1">Break the brick that means:</p>
        <p className="text-lg font-semibold text-gray-800">{definition}</p>
      </div>
    </div>
  );
}
