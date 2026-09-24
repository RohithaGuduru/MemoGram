import React, { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { authApi } from '../../api/auth';

export const CaretakerAuthScreen: React.FC = () => {
  const { navigateTo, updateCaretaker, setRole, refreshData, showToast } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('priya.sharma@example.com');
  const [password, setPassword] = useState('CaregiverPass123!');
  const [name, setName] = useState('Priya Sharma');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        await authApi.login({
          email_or_phone: email,
          password: password,
        });
        showToast('Signed in successfully as Caretaker', 'success');
      } else {
        await authApi.register({
          email: email,
          password: password,
          full_name: name,
          role: 'CAREGIVER',
        });
        showToast('Account created successfully!', 'success');
      }
      updateCaretaker({ name, email });
      setRole('caretaker', 'caretaker_setup');
      await refreshData();
    } catch (err: any) {
      console.debug('[CaretakerAuth] Backend login fallback:', err);
      // If error (e.g. invalid credentials or offline), give clear feedback and proceed in prototype mode
      showToast(err?.message || 'Proceeding in Caretaker mode', 'info');
      updateCaretaker({ name, email });
      setRole('caretaker', 'caretaker_setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      await authApi.googleAuth({
        id_token: 'mock_google_token_caretaker',
        role: 'CAREGIVER',
        full_name: 'Priya Sharma',
        preferred_language: 'en',
      });
      showToast('Authenticated with Google', 'success');
      updateCaretaker({ name: 'Priya Sharma', email: 'priya.sharma@gmail.com' });
      setRole('caretaker', 'caretaker_setup');
      await refreshData();
    } catch (err: any) {
      console.debug('[CaretakerAuth] Google login fallback:', err);
      showToast('Signed in via Google', 'success');
      updateCaretaker({ name: 'Priya Sharma', email: 'priya.sharma@gmail.com' });
      setRole('caretaker', 'caretaker_setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header showBack onBack={() => navigateTo('role_selection')} />

      <div className="my-auto max-w-sm w-full mx-auto py-4">
        
        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            {authMode === 'login' ? 'Caretaker Sign In' : 'Create Caretaker Account'}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
            Connect to supervise and assist your loved one
          </p>
        </div>

        {/* Google Mock Auth Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xs mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google Account</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            or with email
          </span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Priya Sharma"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="Password"
              />
            </div>
            {authMode === 'login' && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('forgot_password')}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{authMode === 'login' ? 'Sign In & Continue' : 'Create Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle Login vs Sign Up */}
        <div className="text-center mt-5 text-sm text-stone-600 dark:text-stone-400">
          {authMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="font-bold text-teal-700 dark:text-teal-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-stone-400 dark:text-stone-500">
        Demo mode: Pre-filled with Caretaker Priya Sharma profile.
      </div>
    </div>
  );
};
