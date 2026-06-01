import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register' | 'reset';

const AuthPage: React.FC = () => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(email, password, firstName, lastName);
      } else {
        await resetPassword(email);
        setInfo('Password reset email sent — check your inbox.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
            <Zap size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">ZenCycle</h1>
            <p className="text-sm text-slate-400">Wellness in Motion</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
          </h2>

          <form onSubmit={handle} className="space-y-4">
            {mode === 'register' && (
              <div className="flex gap-3">
                <input
                  type="text" required placeholder="First name" value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="flex-1 p-3 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 ring-emerald-500"
                />
                <input
                  type="text" placeholder="Last name" value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="flex-1 p-3 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 ring-emerald-500"
                />
              </div>
            )}

            <input
              type="email" required placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 ring-emerald-500"
            />

            {mode !== 'reset' && (
              <input
                type="password" required placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-50 text-sm focus:outline-none focus:ring-2 ring-emerald-500"
              />
            )}

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            {info  && <p className="text-emerald-600 text-xs font-medium">{info}</p>}

            <button
              type="submit" disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95"
            >
              {busy ? '...' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset email'}
            </button>
          </form>

          {/* Mode switchers */}
          <div className="space-y-2 text-center text-xs text-slate-400">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('reset')} className="underline block w-full">Forgot password?</button>
                <button onClick={() => setMode('register')} className="underline block w-full">No account? Sign up</button>
              </>
            )}
            {mode === 'register' && (
              <button onClick={() => setMode('login')} className="underline">Already have an account? Sign in</button>
            )}
            {mode === 'reset' && (
              <button onClick={() => setMode('login')} className="underline">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
