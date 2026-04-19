import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl shadow-xl mb-6">
          <BookOpen size={36} className="text-white" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">LinguaPlay</h1>
        <p className="text-gray-500 mb-10 text-lg">Learn words through interactive games</p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { emoji: '🃏', label: 'Flashcards' },
            { emoji: '🧩', label: 'Word Match' },
            { emoji: '✏️', label: 'Fill Blanks' },
          ].map(f => (
            <div key={f.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl mb-1">{f.emoji}</div>
              <div className="text-xs text-gray-500 font-medium">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Sign in card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="font-bold text-gray-800 text-xl mb-2">Sign in to get started</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your vocabulary is saved to your account and synced across all devices.
          </p>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Your words are private and only visible to you.
        </p>
      </div>
    </div>
  );
}
