import { useState, useMemo, useEffect, useCallback } from 'react';
import { Word, WordCategory, CATEGORY_LABELS, CATEGORY_COLORS, GameType } from './types';
import { fetchWords, addWord, updateWord, deleteWord } from './data/firestore';
import { useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import Flashcard from './components/games/Flashcard';
import MultipleChoice from './components/games/MultipleChoice';
import FillBlank from './components/games/FillBlank';
import WordMatch from './components/games/WordMatch';
import Spelling from './components/games/Spelling';
import TimeAttack from './components/games/TimeAttack';
import ReverseChoice from './components/games/ReverseChoice';
import WordRain from './components/games/WordRain';
import WordBreaker from './components/games/WordBreaker';
import WordManager from './components/WordManager';
import {
  BookOpen, Zap, HelpCircle, Shuffle, PenLine,
  Layers, ChevronDown, LogOut, Loader2, Timer, BookMarked, CloudRain, Boxes,
} from 'lucide-react';

type View = 'home' | 'manage' | 'game';
type CategoryFilter = WordCategory | 'all';

const GAMES: { id: GameType; label: string; desc: string; icon: React.ReactNode; min: number }[] = [
  { id: 'flashcard', label: 'Flashcard', desc: 'Flip cards to reveal definitions and mark what you know', icon: <Layers size={22} />, min: 1 },
  { id: 'multiple-choice', label: 'Multiple Choice', desc: 'See a definition — pick the matching word from 4 options', icon: <HelpCircle size={22} />, min: 4 },
  { id: 'reverse-choice', label: 'Word to Definition', desc: 'See a word — pick the correct definition from 4 options', icon: <BookMarked size={22} />, min: 4 },
  { id: 'fill-blank', label: 'Fill in the Blank', desc: 'Complete sentences by typing the missing word', icon: <PenLine size={22} />, min: 1 },
  { id: 'word-match', label: 'Word Match', desc: 'Match words to their definitions by clicking pairs', icon: <Shuffle size={22} />, min: 2 },
  { id: 'spelling', label: 'Unscramble', desc: 'Rearrange scrambled letters to spell the correct word', icon: <Zap size={22} />, min: 1 },
  { id: 'time-attack',   label: 'Time Attack',   desc: 'Answer as many as possible in 60 seconds — build streaks for bonus points', icon: <Timer size={22} />,     min: 4 },
  { id: 'word-rain',    label: 'Word Rain',     desc: 'Words fall from the sky — click the right one before it hits the ground!',  icon: <CloudRain size={22} />, min: 4 },
  { id: 'word-breaker', label: 'Word Breaker',  desc: 'Break the gold brick with your ball — it\'s the word that matches the definition', icon: <Boxes size={22} />, min: 4 },
];

const CATEGORIES: WordCategory[] = ['verb', 'phrasal-verb', 'adjective', 'adverb', 'noun'];

function AppContent() {
  const { user, loading: authLoading, logOut } = useAuth();
  const [words, setWords] = useState<Word[]>([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [view, setView] = useState<View>('home');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const loadWords = useCallback(async () => {
    if (!user) return;
    setWordsLoading(true);
    try {
      const fetched = await fetchWords(user.uid);
      setWords(fetched);
    } finally {
      setWordsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadWords();
    else setWords([]);
  }, [user, loadWords]);

  const handleAdd = async (word: Omit<Word, 'id'>) => {
    if (!user) return;
    const added = await addWord(user.uid, word);
    setWords(prev => [...prev, added]);
  };

  const handleUpdate = async (word: Word) => {
    if (!user) return;
    await updateWord(user.uid, word);
    setWords(prev => prev.map(w => w.id === word.id ? word : w));
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteWord(user.uid, id);
    setWords(prev => prev.filter(w => w.id !== id));
  };

  const filteredWords = useMemo(() =>
    categoryFilter === 'all' ? words : words.filter(w => w.category === categoryFilter),
    [words, categoryFilter]
  );

  const startGame = (gameId: GameType) => {
    setActiveGame(gameId);
    setView('game');
  };

  const renderGame = () => {
    const props = { words: filteredWords };
    switch (activeGame) {
      case 'flashcard': return <Flashcard {...props} />;
      case 'multiple-choice': return <MultipleChoice {...props} />;
      case 'reverse-choice': return <ReverseChoice {...props} />;
      case 'fill-blank': return <FillBlank {...props} />;
      case 'word-match': return <WordMatch {...props} />;
      case 'spelling': return <Spelling {...props} />;
      case 'time-attack':   return <TimeAttack {...props} />;
      case 'word-rain':     return <WordRain {...props} />;
      case 'word-breaker':  return <WordBreaker {...props} />;
      default: return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const game = GAMES.find(g => g.id === activeGame);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2.5 font-bold text-lg text-indigo-700 hover:text-indigo-800 transition-colors"
          >
            <BookOpen size={22} />
            LinguaPlay
          </button>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setView('home')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'home' || view === 'game' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Games
            </button>
            <button
              onClick={() => setView('manage')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              My Words
            </button>

            {/* User avatar */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu(m => !m)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName ?? ''} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium hidden sm:block">
                  {user.displayName?.split(' ')[0] ?? 'Me'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logOut(); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* HOME */}
        {view === 'home' && (
          <div>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
                Welcome back, {user.displayName?.split(' ')[0] ?? 'there'}!
              </h1>
              <p className="text-gray-500 max-w-xl mx-auto">
                Add your own vocabulary, then practice with 9 interactive games. Filter by word type to focus your study.
              </p>
            </div>

            {wordsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                  {CATEGORIES.map(cat => {
                    const count = words.filter(w => w.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(f => f === cat ? 'all' : cat)}
                        className={`rounded-xl p-3 text-center border-2 transition-all ${
                          categoryFilter === cat
                            ? CATEGORY_COLORS[cat] + ' border-current shadow-sm'
                            : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs mt-0.5 font-medium">{CATEGORY_LABELS[cat]}</p>
                      </button>
                    );
                  })}
                </div>

                {categoryFilter !== 'all' && (
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-gray-500">Studying:</span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${CATEGORY_COLORS[categoryFilter]}`}>
                      {CATEGORY_LABELS[categoryFilter]}s
                    </span>
                    <button onClick={() => setCategoryFilter('all')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Clear filter
                    </button>
                  </div>
                )}

                {/* Game cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GAMES.map(g => {
                    const available = filteredWords.length >= g.min;
                    return (
                      <button
                        key={g.id}
                        onClick={() => available && startGame(g.id)}
                        disabled={!available}
                        className={`text-left p-6 rounded-2xl border-2 transition-all group ${
                          available
                            ? 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-lg cursor-pointer'
                            : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-100 transition-colors">
                          {g.icon}
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{g.label}</h3>
                        <p className="text-sm text-gray-500">{g.desc}</p>
                        {!available && (
                          <p className="text-xs text-amber-600 mt-2">Need at least {g.min} word{g.min > 1 ? 's' : ''}</p>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setView('manage')}
                    className="text-left p-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                      <BookOpen size={22} />
                    </div>
                    <h3 className="font-bold text-indigo-700 mb-1">Add More Words</h3>
                    <p className="text-sm text-indigo-500">Grow your vocabulary to unlock more games</p>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* GAME VIEW */}
        {view === 'game' && activeGame && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setView('home')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Games
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{game?.label}</span>
                {categoryFilter !== 'all' && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[categoryFilter]}`}>
                    {CATEGORY_LABELS[categoryFilter]}s only
                  </span>
                )}
              </div>

              <div className="ml-auto relative">
                <button
                  onClick={() => setShowCatDropdown(d => !d)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 bg-white"
                >
                  {categoryFilter === 'all' ? 'All words' : CATEGORY_LABELS[categoryFilter]}
                  <ChevronDown size={13} />
                </button>
                {showCatDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                    <button
                      onClick={() => { setCategoryFilter('all'); setShowCatDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${categoryFilter === 'all' ? 'font-semibold text-indigo-600' : ''}`}
                    >
                      All words
                    </button>
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => { setCategoryFilter(c); setShowCatDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${categoryFilter === c ? 'font-semibold text-indigo-600' : ''}`}
                      >
                        {CATEGORY_LABELS[c]}s
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {renderGame()}
          </div>
        )}

        {/* WORD MANAGER */}
        {view === 'manage' && (
          <WordManager
            words={words}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
