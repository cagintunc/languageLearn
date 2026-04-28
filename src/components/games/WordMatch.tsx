import { useState, useCallback, useEffect } from 'react';
import { Word, GameScore } from '../../types';
import { Trophy, RefreshCw } from 'lucide-react';
import { shuffle, selectWords } from '../../lib/wordUtils';

interface Props {
  words: Word[];
}

interface MatchItem {
  id: string;
  word: Word;
  type: 'word' | 'definition';
  text: string;
}

export default function WordMatch({ words }: Props) {
  const BATCH = 5;
  const [batch, setBatch] = useState<Word[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);
  const [selected, setSelected] = useState<MatchItem | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [score, setScore] = useState<GameScore>({ correct: 0, total: 0 });
  const [roundDone, setRoundDone] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [queue, setQueue] = useState<Word[]>([]);

  const loadBatch = useCallback((q: Word[], bi: number) => {
    const slice = q.slice(bi * BATCH, bi * BATCH + BATCH);
    setBatch(slice);
    const left: MatchItem[] = slice.map(w => ({ id: `w-${w.id}`, word: w, type: 'word', text: w.word }));
    const right: MatchItem[] = shuffle(slice.map(w => ({ id: `d-${w.id}`, word: w, type: 'definition', text: w.definition })));
    setLeftItems(left);
    setRightItems(right);
    setMatched(new Set());
    setWrong(new Set());
    setSelected(null);
    setRoundDone(false);
  }, []);

  const init = useCallback(() => {
    const q = selectWords(words);
    setQueue(q);
    setBatchIndex(0);
    setScore({ correct: 0, total: 0 });
    setAllDone(false);
    loadBatch(q, 0);
  }, [words, loadBatch]);

  useEffect(() => { init(); }, [init]);

  const handleSelect = (item: MatchItem) => {
    if (matched.has(item.word.id) || wrong.has(item.id)) return;

    if (!selected) {
      setSelected(item);
      return;
    }

    if (selected.id === item.id) {
      setSelected(null);
      return;
    }

    // Same type — swap selection
    if (selected.type === item.type) {
      setSelected(item);
      return;
    }

    // Check match
    const isMatch = selected.word.id === item.word.id;
    if (isMatch) {
      const newMatched = new Set([...matched, item.word.id]);
      setMatched(newMatched);
      setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
      setSelected(null);

      if (newMatched.size === batch.length) {
        setRoundDone(true);
        const nextBi = batchIndex + 1;
        if (nextBi * BATCH >= queue.length) {
          setAllDone(true);
        }
      }
    } else {
      const wrongSet = new Set([...wrong, selected.id, item.id]);
      setWrong(wrongSet);
      setScore(s => ({ correct: s.correct, total: s.total + 1 }));
      setSelected(null);
      setTimeout(() => {
        setWrong(prev => {
          const n = new Set(prev);
          n.delete(selected.id);
          n.delete(item.id);
          return n;
        });
      }, 800);
    }
  };

  const nextRound = () => {
    const nextBi = batchIndex + 1;
    setBatchIndex(nextBi);
    loadBatch(queue, nextBi);
  };

  if (words.length < 2) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">Add at least 2 words to play Word Match!</p>
      </div>
    );
  }

  if (allDone) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="max-w-md mx-auto text-center py-12 bounce-in">
        <Trophy size={56} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-2">All Matched!</h2>
        <p className="text-gray-500 mb-6">Accuracy: {pct}% ({score.correct}/{score.total})</p>
        <button onClick={init} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg">
          Play Again
        </button>
      </div>
    );
  }

  const getItemClass = (item: MatchItem): string => {
    const base = 'p-3 rounded-xl border-2 text-sm font-medium cursor-pointer transition-all duration-200 text-center ';
    if (matched.has(item.word.id)) return base + 'border-green-400 bg-green-50 text-green-700 opacity-40 cursor-default';
    if (wrong.has(item.id)) return base + 'border-red-400 bg-red-50 text-red-600 shake';
    if (selected?.id === item.id) return base + 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-105';
    return base + 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          Round {batchIndex + 1} · {matched.size}/{batch.length} matched
        </div>
        <button onClick={init} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <RefreshCw size={14} /> Restart
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-6 text-sm text-blue-700">
        Click a word, then click its matching definition.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Words</p>
          {leftItems.map(item => (
            <div key={item.id} onClick={() => handleSelect(item)} className={getItemClass(item)}>
              {item.text}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Definitions</p>
          {rightItems.map(item => (
            <div key={item.id} onClick={() => handleSelect(item)} className={getItemClass(item)}>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {roundDone && !allDone && (
        <div className="mt-8 text-center bounce-in">
          <p className="text-green-600 font-semibold mb-3">Round complete! 🎉</p>
          <button onClick={nextRound} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg">
            Next Round →
          </button>
        </div>
      )}
    </div>
  );
}
