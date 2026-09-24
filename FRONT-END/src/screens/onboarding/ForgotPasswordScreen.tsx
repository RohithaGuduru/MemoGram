import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { authApi } from '../../api/auth';

export const ForgotPasswordScreen: React.FC = () => {
  const { navigateTo, role, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const backScreen = role === 'caretaker' ? 'caretaker_auth' : 'patient_auth';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authApi.forgotPassword({ email: cleanEmail });
      setStatusMessage(res.message || 'If an account exists for this email, a reset code has been sent.');
      setSubmitted(true);
      // Store email in session storage so ResetPasswordScreen can auto-fill it
      sessionStorage.setItem('memogram_reset_email', cleanEmail);
      showToast('Reset instructions sent to email', 'success');
    } catch (err: any) {
      // In case of unexpected connection error, show helpful message
      const msg = err?.message || 'Unable to process request right now. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      <Header
        title="Forgot Password"
        showBack
        onBack={() => navigateTo(backScreen)}
      />

      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-stone-850 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              Reset Password
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Enter your registered email address and we'll send you a 6-digit verification code.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-stone-800 dark:text-stone-200 text-sm">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold mb-1.5">
                  <CheckCircle2 size={18} />
                  <span>Request Processed</span>
                </div>
                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  {statusMessage}
                </p>
                <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                  Target: <span className="font-semibold text-stone-700 dark:text-stone-200">{email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('reset_password')}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Enter 6-Digit Code</span>
                <ArrowRight size={18} />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
                >
                  Didn't receive it? Try a different email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Sending code...</span>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('reset_password')}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Already have a reset code? Enter Code
                </button>
              </div>
            </form>
          )}

          <div className="border-t border-stone-200 dark:border-stone-800 mt-6 pt-4 text-center">
            <button
              type="button"
              onClick={() => navigateTo(backScreen)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-stone-400 dark:text-stone-500">
        MEMOGRAM Secure Account Protection
      </div>
    </div>
  );
};
