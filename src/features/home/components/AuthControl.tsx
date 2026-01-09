import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

interface AuthControlProps {
  onOpenSettings?: () => void;
}

const AuthControl = ({ onOpenSettings }: AuthControlProps) => {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Enter email and password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: authError } = mode === 'sign_in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setOpen(false);
    setPassword('');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="h-8 w-16 rounded-full bg-gray-100" />;
  }

  if (user) {
    const userInitial = (user.email?.trim()?.[0] || '?').toUpperCase();
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="h-8 w-8 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center"
        >
          {userInitial}
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] font-bold text-gray-500 mb-3 truncate">
                {user.email}
              </p>
              {onOpenSettings && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onOpenSettings();
                  }}
                  className="mb-2 w-full rounded-xl border border-gray-100 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black"
                >
                  Settings
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2 text-[10px] font-bold uppercase tracking-widest text-white"
              >
                Logout <LogOut size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black"
      >
        Login
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-full bg-gray-50 p-1">
                <button
                  onClick={() => setMode('sign_in')}
                  className={`flex-1 rounded-full py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'sign_in' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode('sign_up')}
                  className={`flex-1 rounded-full py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${mode === 'sign_up' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                >
                  Register
                </button>
              </div>
              <input
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-black/5"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-black/5"
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-black py-2 text-[10px] font-bold uppercase tracking-widest text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : (mode === 'sign_in' ? 'Sign in' : 'Sign up')}
              </button>
              {error && <p className="text-[10px] font-semibold text-rose-500">{error}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthControl;
