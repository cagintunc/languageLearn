import { useState } from 'react';
import { Word, WordCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { Plus, Trash2, Edit3, Check, X, Search, BookOpen, Filter } from 'lucide-react';

interface Props {
  words: Word[];
  onAdd: (word: Omit<Word, 'id'>) => Promise<void>;
  onUpdate: (word: Word) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORIES: WordCategory[] = ['verb', 'phrasal-verb', 'adjective', 'adverb', 'noun'];

const emptyForm = (): Omit<Word, 'id'> => ({
  word: '',
  category: 'noun',
  definition: '',
  example: '',
  translation: '',
});

export default function WordManager({ words, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<WordCategory | 'all'>('all');
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Word, 'id'>, string>>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const validate = () => {
    const e: typeof errors = {};
    if (!form.word.trim()) e.word = 'Word is required';
    if (!form.definition.trim()) e.definition = 'Definition is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaveError('');
    setSaving(true);
    try {
      if (editId) {
        await onUpdate({ ...form, id: editId });
        setEditId(null);
      } else {
        await onAdd(form);
      }
      setForm(emptyForm());
      setShowForm(false);
    } catch (err) {
      setSaveError('Failed to save. Check Firestore is set up in Firebase Console.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (w: Word) => {
    setForm({ word: w.word, category: w.category, definition: w.definition, example: w.example, translation: w.translation ?? '' });
    setEditId(w.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
    setShowForm(false);
  };

  const filtered = words.filter(w => {
    const matchSearch = w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.definition.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || w.category === filterCat;
    return matchSearch && matchCat;
  });

  const grouped = CATEGORIES.reduce<Record<WordCategory, Word[]>>((acc, cat) => {
    acc[cat] = filtered.filter(w => w.category === cat);
    return acc;
  }, {} as Record<WordCategory, Word[]>);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Add/Edit Form Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Vocabulary</h2>
          <p className="text-sm text-gray-500">{words.length} word{words.length !== 1 ? 's' : ''} saved</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm()); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-md text-sm"
          >
            <Plus size={16} /> Add Word
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 bounce-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-500" />
              {editId ? 'Edit Word' : 'Add New Word'}
            </h3>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Word *</label>
                <input
                  type="text"
                  value={form.word}
                  onChange={e => setForm(f => ({ ...f, word: e.target.value }))}
                  placeholder="e.g. perseverance"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-sm ${errors.word ? 'border-red-400' : 'border-gray-200 focus:border-indigo-400'}`}
                />
                {errors.word && <p className="text-xs text-red-500 mt-1">{errors.word}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as WordCategory }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-colors text-sm bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Definition *</label>
              <textarea
                value={form.definition}
                onChange={e => setForm(f => ({ ...f, definition: e.target.value }))}
                placeholder="A clear, concise definition of the word"
                rows={2}
                className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-sm resize-none ${errors.definition ? 'border-red-400' : 'border-gray-200 focus:border-indigo-400'}`}
              />
              {errors.definition && <p className="text-xs text-red-500 mt-1">{errors.definition}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Example Sentence <span className="text-gray-400 font-normal">(include the word itself)</span>
              </label>
              <input
                type="text"
                value={form.example}
                onChange={e => setForm(f => ({ ...f, example: e.target.value }))}
                placeholder={`e.g. Her perseverance led to success.`}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Translation <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.translation}
                onChange={e => setForm(f => ({ ...f, translation: e.target.value }))}
                placeholder="Translation in your native language"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-colors text-sm"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-60"
              >
                <Check size={15} />
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Word'}
              </button>
              <button type="button" onClick={cancelEdit} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words or definitions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-colors text-sm"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value as WordCategory | 'all')}
            className="pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none transition-colors text-sm bg-white"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Word List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg">{words.length === 0 ? 'No words yet. Add your first word!' : 'No results found.'}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
            <div key={cat}>
              <h3 className={`inline-flex text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-3 ${CATEGORY_COLORS[cat]}`}>
                {CATEGORY_LABELS[cat]} ({grouped[cat].length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grouped[cat].map(w => (
                  <div key={w.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-800">{w.word}</p>
                        {w.translation && <p className="text-xs text-gray-400">{w.translation}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(w)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(w.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{w.definition}</p>
                    {w.example && <p className="text-xs text-gray-400 italic">"{w.example}"</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
