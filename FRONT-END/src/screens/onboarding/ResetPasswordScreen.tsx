import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { authApi } from '../../api/auth';

export const ResetPasswordScreen: React.FC = () => {
  const { navigateTo, role, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const backScreen = role === 'caretaker' ? 'caretaker_auth' : 'patient_auth';

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('memogram_reset_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    setErrorMessage('');

    if (!cleanEmail) {
      setErrorMessage('Please provide your email address.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: cleanEmail,
        otp: cleanOtp,
        new_password: newPassword,
      });

      setIsSuccess(true);
      showToast('Password reset successfully! Please sign in.', 'success');
      sessionStorage.removeItem('memogram_reset_email');
    } catch (err: any) {
      const msg = err?.message || 'Verification failed. Please check the code and try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      <Header
        title="Reset Password"
        showBack
        onBack={() => navigateTo('forgot_password')}
      />

      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-stone-850 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              Create New Password
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Enter your 6-digit reset code and pick a new secure password.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-stone-800 dark:text-stone-200">
                <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold mb-1.5 text-base">
                  <CheckCircle2 size={20} />
                  <span>Password Reset Complete!</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  Your password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigateTo(backScreen)}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Go to Sign In</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => navigateTo('forgot_password')}
                    className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-center font-mono text-xl tracking-[0.3em] font-bold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
                />
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Check your inbox for the numeric 6-digit code. Valid for 10 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Resetting password...</span>
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
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
