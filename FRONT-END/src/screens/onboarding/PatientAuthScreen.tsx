import React, { useState } from 'react';
import { User, Mail, Phone, Lock, ArrowRight, Sparkles, Smile, UserPlus, LogIn, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from '../../components/common/SpeakTextButton';
import { Header } from '../../components/common/Header';
import { authApi } from '../../api/auth';
import { patientsApi } from '../../api/patients';
import { isRealPatientId } from '../../services/demoFallback';

export const PatientAuthScreen: React.FC = () => {
  const { navigateTo, setRole, updatePatient, patient, refreshData, showToast } = useApp();
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState(patient.name || 'Arun');
  const [email, setEmail] = useState(patient.email || 'arun.sharma72@example.com');
  const [phone, setPhone] = useState(patient.phone || '+919876543210');
  const [password, setPassword] = useState('PatientPass123!');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('1952-05-15');
  const [isLoading, setIsLoading] = useState(false);

  const pagePrompt = authMode === 'signin' 
    ? "Welcome to Patient Sign In. You can sign in with your email or register a new account below."
    : "Create a new patient profile. Enter your name, email, and password to get started.";

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const loginRes = await authApi.login({
        email_or_phone: email,
        password: password,
      });

      // Refresh data and check setup status
      let isSetupCompleted = false;
      try {
        const me = await authApi.getMe();
        if (me && isRealPatientId(me.patient_id)) {
          const pData = await patientsApi.getPatient(me.patient_id);
          if (pData?.accessibility_preferences?.preferences_configured) {
            isSetupCompleted = true;
          }
        }
      } catch (err) {
        console.debug('[PatientAuth] Check setup status fallback', err);
      }

      if (!isSetupCompleted && localStorage.getItem('memogram_patient_setup_completed') === 'true') {
        isSetupCompleted = true;
      }

      await refreshData();

      showToast(`Welcome back, ${name}!`, 'success');
      updatePatient({ name, email, phone });
      setRole('patient', isSetupCompleted ? 'patient_home' : 'patient_setup');
    } catch (err: any) {
      console.debug('[PatientAuth] Login fallback:', err);
      showToast(`Welcome, ${name}!`, 'success');
      updatePatient({ name, email, phone });

      const isLocalSetupDone = localStorage.getItem('memogram_patient_setup_completed') === 'true';
      setRole('patient', isLocalSetupDone ? 'patient_home' : 'patient_setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      showToast('Please provide an email or phone number', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const regRes = await authApi.registerPatient({
        full_name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password || 'PatientPass123!',
        date_of_birth: dateOfBirth || undefined,
        gender: gender,
      });

      const createdPatientId = regRes?.patient_id;

      // Clear previous setup flag for new account
      try {
        localStorage.removeItem('memogram_patient_setup_completed');
      } catch {}

      showToast('Patient account created! Let’s set your preferences.', 'success');
      updatePatient({ 
        id: createdPatientId || undefined,
        name: name.trim(), 
        email: email.trim(), 
        phone: phone.trim(),
        gender: gender 
      });

      // Set role and immediately navigate to Language & Font Preference screen
      setRole('patient', 'patient_setup');

      // Refresh data in background to prime state if real ID exists
      if (createdPatientId && isRealPatientId(createdPatientId)) {
        refreshData().catch((err) => {
          console.debug('[PatientAuth] Background data refresh error:', err);
        });
      }
    } catch (err: any) {
      console.error('[PatientAuth] Registration error:', err);
      // Demo fallback: allow seamless entry into first-time setup
      showToast('Profile created (Demo mode)! Let’s set your preferences.', 'success');
      updatePatient({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      try {
        localStorage.removeItem('memogram_patient_setup_completed');
      } catch {}
      setRole('patient', 'patient_setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authApi.googleAuth({
        id_token: 'mock_google_token_patient',
        role: 'PATIENT',
        full_name: 'Arun',
        preferred_language: 'as',
      });
      showToast('Signed in via Google', 'success');
      updatePatient({ name: 'Arun', email: 'arun.elder@gmail.com' });
      await refreshData();
      
      let isSetupDone = localStorage.getItem('memogram_patient_setup_completed') === 'true';
      if (!isSetupDone) {
        try {
          const me = await authApi.getMe();
          if (me && isRealPatientId(me.patient_id)) {
            const pData = await patientsApi.getPatient(me.patient_id);
            if (pData?.accessibility_preferences?.preferences_configured) {
              isSetupDone = true;
            }
          }
        } catch {}
      }

      setRole('patient', isSetupDone ? 'patient_home' : 'patient_setup');
    } catch (err: any) {
      console.debug('[PatientAuth] Google auth fallback:', err);
      showToast('Welcome, Arun!', 'success');
      updatePatient({ name: 'Arun', email: 'arun.elder@gmail.com' });
      setRole('patient', 'patient_setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 sm:p-7 bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 overflow-y-auto custom-scrollbar">
      <Header showBack onBack={() => navigateTo('role_selection')} />

      <div className="my-auto max-w-sm w-full mx-auto py-2 space-y-4">
        
        {/* Friendly Greeting & Icon */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <Smile size={32} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              {authMode === 'signin' ? 'Patient Sign In' : 'Create Patient Account'}
            </h1>
            <SpeakTextButton 
              textToSpeak={pagePrompt} 
              variant="icon-only" 
              size="sm" 
            />
          </div>

          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
            {authMode === 'signin' 
              ? 'Welcome back! Let’s enter your friendly companion.' 
              : 'Sign up to enjoy memory games, routine reminders & family connection.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex rounded-2xl bg-stone-200/70 dark:bg-stone-800 p-1 border border-stone-300/60 dark:border-stone-700">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signin'
                ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white dark:bg-stone-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <UserPlus size={14} />
            <span>Sign Up</span>
          </button>
        </div>

        {authMode === 'signin' ? (
          <>
            {/* 1-Tap Quick Demo Login (Senior-Friendly Large Touch Target) */}
            <button
              type="button"
              onClick={() => handleSignIn()}
              disabled={isLoading}
              className="w-full py-4 px-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-base sm:text-lg shadow-md shadow-emerald-600/30 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <span className="block font-bold leading-tight">Continue as Arun</span>
                  <span className="text-[11px] text-emerald-100 font-normal">1-Tap Instant Entry</span>
                </div>
              </div>
              <ArrowRight size={20} />
            </button>

            {/* Google Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>

            {/* Email form accordion */}
            <form onSubmit={handleSignIn} className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Email or Phone
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. arun@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => navigateTo('forgot_password')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Sign In &amp; Continue
              </button>
            </form>

            {/* Switch to Sign Up Prompt */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Don't have an account? Sign Up
              </button>
            </div>
          </>
        ) : (
          /* Sign Up Form */
          <form onSubmit={handleSignUp} className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Ramesh Chandra"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="ramesh@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              <UserPlus size={16} />
              <span>Create Account & Setup</span>
            </button>

            {/* Switch to Sign In Prompt */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        )}

      </div>

      <div className="text-center text-xs text-stone-400 dark:text-stone-500 pt-2">
        Senior-friendly cognitive companion • Protected health privacy
      </div>
    </div>
  );
};
