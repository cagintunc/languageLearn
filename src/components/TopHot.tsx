import { useMemo, useRef, useState } from 'react';
import { Word, WordCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { Flame, Share2, Download, Loader2 } from 'lucide-react';

interface Props {
  words: Word[];
  misses: Record<string, number>;
}

const CATEGORY_HEX: Record<WordCategory, string> = {
  verb: '#2563eb',
  'phrasal-verb': '#7c3aed',
  adjective: '#16a34a',
  adverb: '#ca8a04',
  noun: '#e11d48',
};

const CARD_W = 1080;
const MARGIN_X = 56;
const CARD_W_INNER = CARD_W - MARGIN_X * 2;
const ROW_H = 108;
const HEADER_H = 380;
const TABLE_HEAD_H = 56;
const CARD_PAD = 36;
const FOOTER_H = 96;

function wrapClamped(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    if (words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = last + '…';
  }
  return lines;
}

function renderChart(entries: { word: Word; count: number }[]): HTMLCanvasElement {
  const cardH = CARD_PAD + TABLE_HEAD_H + entries.length * ROW_H + CARD_PAD;
  const totalH = HEADER_H + cardH + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0b0b0f';
  ctx.fillRect(0, 0, CARD_W, totalH);

  // Logo
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 32px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('billboard', MARGIN_X, 84);

  // Title — layered Billboard-style effect: a colorful gradient echo offset
  // behind crisp white letters, so the type reads with pop/depth.
  const titleY = 210;
  ctx.font = '800 128px system-ui, sans-serif';
  const grad = ctx.createLinearGradient(MARGIN_X, titleY - 110, CARD_W - MARGIN_X, titleY + 10);
  grad.addColorStop(0, '#f472b6');
  grad.addColorStop(0.5, '#a78bfa');
  grad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = grad;
  ctx.fillText('HOT 10', MARGIN_X + 9, titleY + 9);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HOT 10', MARGIN_X, titleY);

  // Subtitle
  ctx.font = '500 26px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('My most-missed words this run', MARGIN_X, titleY + 46);

  // Card
  const cardY = HEADER_H;
  ctx.save();
  const r = 28;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X + r, cardY);
  ctx.arcTo(CARD_W - MARGIN_X, cardY, CARD_W - MARGIN_X, cardY + cardH, r);
  ctx.arcTo(CARD_W - MARGIN_X, cardY + cardH, MARGIN_X, cardY + cardH, r);
  ctx.arcTo(MARGIN_X, cardY + cardH, MARGIN_X, cardY, r);
  ctx.arcTo(MARGIN_X, cardY, CARD_W - MARGIN_X, cardY, r);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();

  const rankColW = 110;
  const wordColX = MARGIN_X + CARD_PAD + rankColW;
  const wordColW = CARD_W_INNER - CARD_PAD * 2 - rankColW - 170;
  const countColX = CARD_W - MARGIN_X - CARD_PAD - 150;

  // Table header
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText('WORD', wordColX, cardY + CARD_PAD + 32);
  ctx.fillText('MISSES', countColX, cardY + CARD_PAD + 32);

  // Divider under header
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X + CARD_PAD, cardY + CARD_PAD + TABLE_HEAD_H);
  ctx.lineTo(CARD_W - MARGIN_X - CARD_PAD, cardY + CARD_PAD + TABLE_HEAD_H);
  ctx.stroke();

  let rowY = cardY + CARD_PAD + TABLE_HEAD_H;
  entries.forEach((entry, i) => {
    const y0 = rowY;
    if (i % 2 === 1) {
      ctx.fillStyle = '#f8f8fa';
      ctx.fillRect(MARGIN_X, y0, CARD_W_INNER, ROW_H);
    }

    const midY = y0 + ROW_H / 2;

    // Rank
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillStyle = i < 3 ? '#111827' : '#9ca3af';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), MARGIN_X + CARD_PAD + 8, midY);

    // Dotted divider before word column
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(MARGIN_X + CARD_PAD + rankColW - 20, y0 + 14);
    ctx.lineTo(MARGIN_X + CARD_PAD + rankColW - 20, y0 + ROW_H - 14);
    ctx.stroke();
    ctx.restore();

    // Category dot + word
    ctx.beginPath();
    ctx.fillStyle = CATEGORY_HEX[entry.word.category];
    ctx.arc(wordColX + 6, midY - 16, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 26px system-ui, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(entry.word.word, wordColX + 22, midY - 16);

    // Meaning (translation preferred, fallback definition)
    const meaning = entry.word.translation?.trim() || entry.word.definition;
    ctx.font = '400 19px system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    const lines = wrapClamped(ctx, meaning, wordColW, 1);
    ctx.fillText(lines[0] ?? '', wordColX, midY + 20);

    // Miss count badge
    const badgeW = 118, badgeH = 44;
    const badgeX = countColX - 14, badgeY = midY - badgeH / 2;
    ctx.save();
    ctx.beginPath();
    const br = badgeH / 2;
    ctx.moveTo(badgeX + br, badgeY);
    ctx.arcTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + badgeH, br);
    ctx.arcTo(badgeX + badgeW, badgeY + badgeH, badgeX, badgeY + badgeH, br);
    ctx.arcTo(badgeX, badgeY + badgeH, badgeX, badgeY, br);
    ctx.arcTo(badgeX, badgeY, badgeX + badgeW, badgeY, br);
    ctx.closePath();
    ctx.fillStyle = '#fff1f0';
    ctx.fill();
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${entry.count}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    ctx.textAlign = 'left';
    ctx.restore();

    rowY += ROW_H;
  });

  ctx.restore(); // clip

  // Footer
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'right';
  ctx.fillText(`chart generated ${dateStr} · 🔥 LinguaPlay`, CARD_W - MARGIN_X, cardY + cardH + 56);
  ctx.textAlign = 'left';

  return canvas;
}

export default function TopHot({ words, misses }: Props) {
  const [generating, setGenerating] = useState<'share' | 'download' | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const entries = useMemo(() => {
    return words
      .map(word => ({ word, count: misses[word.id] ?? 0 }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count || a.word.word.localeCompare(b.word.word))
      .slice(0, 10);
  }, [words, misses]);

  const exportChart = async (kind: 'share' | 'download') => {
    if (entries.length === 0) return;
    setGenerating(kind);
    try {
      const canvas = renderChart(entries);
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      if (!blob) return;

      if (kind === 'share' && navigator.share) {
        const file = new File([blob], 'hot10.png', { type: 'image/png' });
        const canShareFiles = !navigator.canShare || navigator.canShare({ files: [file] });
        if (canShareFiles) {
          try {
            await navigator.share({ files: [file], title: 'My Hot 10 Words', text: 'The words I keep getting wrong 🔥' });
            return;
          } catch {
            // user cancelled the share sheet — fall through to download
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hot10.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold mb-4">
          <Flame size={15} />
          Hot 10
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Your most-missed words</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Ranked by how often you've gotten them wrong across every game. Share the chart to flex — or shame yourself into studying.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-4xl mb-3">🔥</p>
          <p className="text-gray-600 font-medium">No misses yet!</p>
          <p className="text-sm text-gray-400 mt-1">Play a few rounds and the words that trip you up will show up here.</p>
        </div>
      ) : (
        <>
          <div ref={previewRef} className="rounded-2xl overflow-hidden shadow-xl border border-gray-800 bg-[#0b0b0f]">
            <div className="px-6 pt-6 pb-4">
              <p className="text-white font-bold text-lg">billboard</p>
              <div className="relative inline-block mt-2" style={{ width: 'max-content' }}>
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 left-1.5 whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-violet-400 to-sky-400 font-extrabold text-5xl leading-tight select-none"
                >
                  HOT 10
                </span>
                <h2 className="relative whitespace-nowrap text-white font-extrabold text-5xl leading-tight">
                  HOT 10
                </h2>
              </div>
              <p className="text-white/60 text-sm mt-2">My most-missed words this run</p>
            </div>
            <div className="bg-white mx-4 mb-4 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                <span>Word</span>
                <span>Misses</span>
              </div>
              <div className="divide-y divide-gray-50">
                {entries.map((e, i) => (
                  <div key={e.word.id} className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 1 ? 'bg-gray-50/70' : ''}`}>
                    <span className={`w-6 text-xl font-extrabold shrink-0 ${i < 3 ? 'text-gray-900' : 'text-gray-300'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${CATEGORY_COLORS[e.word.category].split(' ')[0]}`} />
                        <span className="font-bold text-gray-900 truncate">{e.word.word}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">{CATEGORY_LABELS[e.word.category]}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{e.word.translation?.trim() || e.word.definition}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                      🔥 {e.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-4 text-right">
              <span className="text-white/40 text-xs">chart generated {new Date().toLocaleDateString()} · 🔥 LinguaPlay</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => exportChart('share')}
              disabled={generating !== null}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg"
            >
              {generating === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
              Share
            </button>
            <button
              onClick={() => exportChart('download')}
              disabled={generating !== null}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
            >
              {generating === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PNG
            </button>
          </div>
        </>
      )}
    </div>
  );
}
