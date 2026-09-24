import React, { useState } from 'react';
import { 
  User, 
  Globe, 
  Type, 
  Mail, 
  KeyRound, 
  Pill, 
  Plus, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Trash2, 
  Sparkles,
  Droplets,
  Calendar,
  Clock,
  Stethoscope,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LANGUAGE_LIST, isTTSAvailable } from '../../services/languageCapabilities';
import { FontSizeSetting, Medication, FamilyMember } from '../../types';
import { relationshipsApi, patientsApi } from '../../api';
import { MedicationForm } from '../../components/forms/MedicationForm';
import { FamilyMemberForm } from '../../components/forms/FamilyMemberForm';

type SetupStep = 'account' | 'patient' | 'medicines' | 'hydration' | 'family' | 'appointment' | 'complete';

const RELATION_CATEGORIES = ['Parents', 'Spouse', 'Siblings', 'Child', 'Other'];

export const CaretakerSetupScreen: React.FC = () => {
  const { 
    caretaker, 
    patient, 
    updatePatient, 
    selectPatient,
    caretakerLanguage, 
    setCaretakerLanguage, 
    caretakerFontSize, 
    setCaretakerFontSize, 
    medications, 
    addMedication,
    updateMedication,
    deleteMedication,
    hydrationSettings,
    updateHydrationSettings,
    familyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    appointments,
    addAppointment,
    deleteAppointment,
    setRole,
    showToast,
    goBack,
    t
  } = useApp();

  const [currentStep, setCurrentStep] = useState<SetupStep>('account');

  // Step 2: Patient & OTP state
  const [patientName, setPatientName] = useState(patient.name || 'Arun');
  const [patientEmail, setPatientEmail] = useState(patient.email || 'arun.sharma72@example.com');
  const [relationshipId, setRelationshipId] = useState<string>('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 3: Medicine entry state
  const [editingMedicine, setEditingMedicine] = useState<Medication | null>(null);

  // Step 4: Hydration state
  const [hydrationGoal, setHydrationGoal] = useState<number>(hydrationSettings.dailyGoalGlasses || 8);
  const [hydrationUnit, setHydrationUnit] = useState<'glasses' | 'litres'>(hydrationSettings.unit || 'glasses');
  const [hydrationStartTime, setHydrationStartTime] = useState<string>(hydrationSettings.startTime || '08:00 AM');
  const [hydrationEndTime, setHydrationEndTime] = useState<string>(hydrationSettings.endTime || '08:00 PM');
  const [hydrationInterval, setHydrationInterval] = useState<number>(hydrationSettings.reminderIntervalMinutes || 60);

  // Step 5: Family member state
  const [editingFamily, setEditingFamily] = useState<FamilyMember | null>(null);

  // Step 6: Appointment state
  const [aptHospital, setAptHospital] = useState('');
  const [aptDoctor, setAptDoctor] = useState('');
  const [aptDate, setAptDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [aptTime, setAptTime] = useState('10:30 AM');
  const [aptNotes, setAptNotes] = useState('');

  const stepsList: { id: SetupStep; label: string }[] = [
    { id: 'account', label: t('step_account') },
    { id: 'patient', label: t('step_patient') },
    { id: 'medicines', label: t('step_medicines') },
    { id: 'hydration', label: t('step_hydration') },
    { id: 'family', label: t('step_family') },
    { id: 'appointment', label: t('step_appointment') },
    { id: 'complete', label: t('step_complete') },
  ];

  const getStepIndex = (step: SetupStep) => stepsList.findIndex((s) => s.id === step);

  const handleBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepsList[currentIndex - 1].id);
    } else {
      goBack();
    }
  };

  const handleSendOtp = async () => {
    if (!patientEmail) {
      showToast('Please enter patient email', 'warning');
      return;
    }
    try {
      const res = await relationshipsApi.invitePatient({
        patient_email_or_phone: patientEmail,
        relation_type: 'Caregiver / Daughter',
      });
      setRelationshipId(res.relationship_id);
      setOtpSent(true);
      const code = res.test_otp_code || '123456';
      setOtpCode(code);
      showToast(`Verification code sent! (OTP: ${code})`, 'info', 'OTP Generated');
    } catch (err: any) {
      console.debug('[CaretakerSetup] Invite fallback:', err);
      setOtpSent(true);
      setOtpCode('123456');
      showToast('Verification code generated: 123456', 'info', 'Verification Code');
    }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
      if (relationshipId) {
        const verifyRes = await relationshipsApi.verifyOTP({
          relationship_id: relationshipId,
          otp_code: otpCode,
        });
        if (verifyRes?.patient_id) {
          await updatePatient({ id: verifyRes.patient_id, name: patientName, email: patientEmail });
          await selectPatient(verifyRes.patient_id);
        }
      }
      setOtpVerified(true);
      showToast('Patient relationship verified successfully!', 'success');
      setTimeout(() => {
        setCurrentStep('medicines');
      }, 500);
    } catch (err: any) {
      console.debug('[CaretakerSetup] Verify OTP fallback:', err);
      try {
        const newPatient = await patientsApi.createPatient({
          full_name: patientName,
          email: patientEmail,
          primary_language: 'as',
          preferred_language: 'as',
          font_size: 'normal',
        });
        if (newPatient?.id) {
          await updatePatient({ id: newPatient.id, name: patientName, email: patientEmail });
          await selectPatient(newPatient.id);
        }
      } catch (createErr) {
        console.debug('[CaretakerSetup] Create patient fallback:', createErr);
        updatePatient({ name: patientName, email: patientEmail });
      }
      setOtpVerified(true);
      showToast('Patient profile ready!', 'success');
      setTimeout(() => {
        setCurrentStep('medicines');
      }, 500);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3 Medicine Handlers
  const handleFinishMedicines = () => {
    setEditingMedicine(null);
    setCurrentStep('hydration');
  };

  // Step 4 Hydration Handlers
  const handleFinishHydration = () => {
    updateHydrationSettings({
      dailyGoalGlasses: hydrationGoal,
      unit: hydrationUnit,
      startTime: hydrationStartTime,
      endTime: hydrationEndTime,
      reminderIntervalMinutes: hydrationInterval,
      enabled: true,
    });
    setCurrentStep('family');
  };

  // Step 5 Family Handlers
  const handleFinishFamily = () => {
    setEditingFamily(null);
    setCurrentStep('appointment');
  };

  // Step 6 Appointment Handlers
  const handleAddAppointment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aptHospital.trim() || !aptDoctor.trim()) {
      showToast('Please enter hospital and doctor name', 'warning');
      return;
    }

    addAppointment({
      hospitalName: aptHospital.trim(),
      doctorName: aptDoctor.trim(),
      date: aptDate,
      time: aptTime,
      notes: aptNotes.trim() || 'Medical checkup & review',
    });

    setAptHospital('');
    setAptDoctor('');
    setAptNotes('');
  };

  const handleFinishAppointment = () => {
    if (aptHospital.trim() && aptDoctor.trim()) {
      handleAddAppointment();
    }
    setCurrentStep('complete');
  };

  const handleEnterDashboard = () => {
    setRole('caretaker');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 min-h-screen">
      
      {/* Top Header & Multi-Step Progress Indicator */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all active:scale-95 flex items-center justify-center min-w-[38px] min-h-[38px] border border-stone-200/60 dark:border-stone-700/60 cursor-pointer"
              aria-label={t('btn_back') || 'Go Back'}
              title={t('btn_back') || 'Go Back'}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                M
              </div>
              <span className="font-extrabold text-base tracking-tight text-teal-900 dark:text-teal-200">
                {t('caretaker_setup_title')}
              </span>
            </div>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
            {t('setup_step_count', { current: getStepIndex(currentStep) + 1, total: stepsList.length })}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-6">
          {stepsList.map((s, idx) => {
            const isCompleted = getStepIndex(currentStep) > idx;
            const isCurrent = currentStep === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-full h-2 rounded-full transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500' 
                    : isCurrent 
                    ? 'bg-teal-600 animate-pulse' 
                    : 'bg-stone-200 dark:bg-stone-800'
                }`} />
                <span className={`text-[9px] sm:text-[10px] mt-1 font-semibold truncate ${
                  isCurrent ? 'text-teal-700 dark:text-teal-300 font-bold' : 'text-stone-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Account (Hello, [User Name], Language & Font Size) */}
      {currentStep === 'account' && (
        <div className="my-auto py-2 space-y-5 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_account')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('caretaker_hello', { name: caretaker.name || 'Priya' })} 👋
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('caretaker_tailor_pref')}
            </p>
          </div>

          {/* Language Selection (All 8 languages) */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Globe size={15} className="text-teal-600" />
              <span>{t('select_primary_lang')}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {LANGUAGE_LIST.map((l) => {
                const isSelected = caretakerLanguage === l.code;
                const tts = isTTSAvailable(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setCaretakerLanguage(l.code)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected 
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-bold' 
                        : 'border-stone-200 dark:border-stone-700 hover:border-teal-300 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{l.name}</span>
                      {isSelected && <CheckCircle2 size={15} className="text-teal-600" />}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400">
                      <span>{l.nativeName}</span>
                      <span className={`px-1.5 py-0.2 rounded ${tts ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                        {tts ? t('voice_ready') : t('text_ready')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Selection */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Type size={15} className="text-teal-600" />
              <span>{t('font_size_preference')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'extra-large'] as FontSizeSetting[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCaretakerFontSize(f)}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    caretakerFontSize === f
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-bold shadow-xs'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-teal-300'
                  }`}
                >
                  <span className={`block font-semibold ${
                    f === 'normal' ? 'text-sm' : f === 'large' ? 'text-base' : 'text-lg'
                  }`}>
                    {f === 'normal' ? t('font_normal') : f === 'large' ? t('font_large') : t('font_extralarge')}
                  </span>
                  <span className="text-[10px] text-stone-400">Aa</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep('patient')}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>{t('continue_add_patient')}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STEP 2: Add Patient (Name, Email, Get OTP, Verify OTP) */}
      {currentStep === 'patient' && (
        <div className="my-auto py-2 space-y-5 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_patient')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('add_patient_title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('add_patient_desc')}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-850 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {t('patient_full_name')}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Arun"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {t('patient_email_addr')}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="arun@example.com"
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <KeyRound size={16} />
                <span>{t('btn_get_otp')}</span>
              </button>
            ) : (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                    {t('enter_otp_code')}
                  </label>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Code: {otpCode || '4826'} (Demo)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-widest text-2xl font-black py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border-2 border-teal-500 text-teal-900 dark:text-teal-100 focus:outline-none"
                    placeholder="4826"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifying}
                    className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm whitespace-nowrap shadow-sm"
                  >
                    {t('btn_verify_otp')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="py-3.5 px-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>{t('btn_back')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updatePatient({ name: patientName, email: patientEmail });
                setCurrentStep('medicines');
              }}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('continue_med_setup')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* STEP 3: Medication Setup (Photo, Dosage, Freq, Time)    */}
      {/* ======================================================= */}
      {currentStep === 'medicines' && (
        <div className="my-auto py-2 space-y-4 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_medicines')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('enter_med_details')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('med_setup_desc', { name: patientName || 'Arun' })}
            </p>
          </div>

          {/* New / Edit Medicine Form */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <MedicationForm
              initialData={editingMedicine}
              onSave={(data) => {
                if (editingMedicine) {
                  updateMedication(editingMedicine.id, data);
                  setEditingMedicine(null);
                } else {
                  addMedication(data);
                }
              }}
              onCancel={editingMedicine ? () => setEditingMedicine(null) : undefined}
              submitButtonText={editingMedicine ? t('btn_save') : '+ ' + t('btn_add')}
            />
          </div>

          {/* Current List of configured medicines */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t('configured_meds', { count: medications.length })}
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {medications.map((m) => (
                <div key={m.id} className="p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-teal-500/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                        <Pill size={18} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-stone-800 dark:text-stone-100 truncate">{m.name} ({m.dosage})</p>
                      <p className="text-stone-500 text-[11px] truncate">
                        {m.medicineType ? `${m.medicineType} • ` : ''}
                        {m.frequency ? `${m.frequency} • ` : ''}
                        {m.scheduledTimes && m.scheduledTimes.length > 1 
                          ? m.scheduledTimes.join(', ') 
                          : m.scheduleTime} 
                        {' • '}{t('in_stock', { count: m.remainingQuantity })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingMedicine(m)}
                      className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                      aria-label="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingMedicine?.id === m.id) setEditingMedicine(null);
                        deleteMedication(m.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons: Back, Skip, Finish */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-3.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm cursor-pointer"
              aria-label={t('btn_back')}
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('hydration')}
              className="py-3 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-sm cursor-pointer transition-colors"
            >
              {t('btn_skip')}
            </button>

            <button
              type="button"
              onClick={handleFinishMedicines}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('finish_hydration')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* STEP 4: Hydration Setup (Goal, Window, Interval)        */}
      {/* ======================================================= */}
      {currentStep === 'hydration' && (
        <div className="my-auto py-2 space-y-4 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_hydration')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('daily_hydration_target')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('hydration_setup_desc', { name: patientName || 'Arun' })}
            </p>
          </div>

          <div className="bg-white dark:bg-stone-850 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            
            {/* Daily Goal Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets size={16} className="text-sky-500" />
                  <span>{t('daily_goal')}</span>
                </label>
                <div className="flex bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setHydrationUnit('glasses')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${hydrationUnit === 'glasses' ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-500'}`}
                  >
                    {t('unit_glasses')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHydrationUnit('litres')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${hydrationUnit === 'litres' ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-500'}`}
                  >
                    {t('unit_litres')}
                  </button>
                </div>
              </div>

              {/* Stepper Display */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                <button
                  type="button"
                  onClick={() => setHydrationGoal((prev) => Math.max(2, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-lg font-black text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-3xl font-black text-sky-900 dark:text-sky-200">
                    {hydrationGoal}
                  </span>
                  <span className="block text-xs font-semibold text-stone-500 capitalize">
                    {hydrationUnit === 'glasses' ? t('unit_glasses') : t('unit_litres')} {hydrationUnit === 'glasses' ? `(~${(hydrationGoal * 0.25).toFixed(1)} L)` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHydrationGoal((prev) => Math.min(20, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-lg font-black text-stone-700 dark:text-stone-300 flex items-center justify-center cursor-pointer active:scale-95 shadow-xs"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Chips */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[6, 8, 10, 12].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setHydrationGoal(g)}
                    className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                      hydrationGoal === g
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-sky-300'
                    }`}
                  >
                    {g} {hydrationUnit === 'glasses' ? t('unit_glasses') : 'L'}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminder Window: Start Time & End Time */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {t('start_time')}
                </label>
                <select
                  value={hydrationStartTime}
                  onChange={(e) => setHydrationStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
                >
                  <option value="07:00 AM">07:00 AM</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                  {t('end_time')}
                </label>
                <select
                  value={hydrationEndTime}
                  onChange={(e) => setHydrationEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
                >
                  <option value="06:00 PM">06:00 PM</option>
                  <option value="07:00 PM">07:00 PM</option>
                  <option value="08:00 PM">08:00 PM</option>
                  <option value="09:00 PM">09:00 PM</option>
                  <option value="10:00 PM">10:00 PM</option>
                </select>
              </div>
            </div>

            {/* Reminder Interval Options */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                {t('reminder_interval')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { minutes: 30, label: '30 mins', desc: 'Frequent' },
                  { minutes: 60, label: '1 hour', desc: 'Standard' },
                  { minutes: 120, label: '2 hours', desc: 'Relaxed' },
                ].map((item) => (
                  <button
                    key={item.minutes}
                    type="button"
                    onClick={() => setHydrationInterval(item.minutes)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      hydrationInterval === item.minutes
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-100 font-bold shadow-xs'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-sky-300'
                    }`}
                  >
                    <span className="block text-sm font-bold">{item.label}</span>
                    <span className="text-[10px] text-stone-400 font-medium">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Navigation Buttons: Back, Skip, Finish */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-3.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm cursor-pointer"
              aria-label={t('btn_back')}
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('family')}
              className="py-3 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-sm cursor-pointer transition-colors"
            >
              {t('btn_skip')}
            </button>

            <button
              type="button"
              onClick={handleFinishHydration}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('finish_family')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* STEP 5: Family Details (Name, Relation, Phone, Photo)    */}
      {/* ======================================================= */}
      {currentStep === 'family' && (
        <div className="my-auto py-2 space-y-4 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_family')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('family_circle_title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('family_setup_desc', { name: patientName || 'Arun' })}
            </p>
          </div>

          {/* Add / Edit Member Form */}
          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <FamilyMemberForm
              initialData={editingFamily}
              onSave={(famData) => {
                if (editingFamily) {
                  updateFamilyMember(editingFamily.id, famData);
                  setEditingFamily(null);
                } else {
                  addFamilyMember(famData);
                }
              }}
              onCancel={editingFamily ? () => setEditingFamily(null) : undefined}
              submitButtonText={editingFamily ? t('btn_save') : '+ ' + t('btn_add')}
            />
          </div>

          {/* Current Family List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t('saved_family', { count: familyMembers.length })}
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {familyMembers.map((f) => (
                <div key={f.id} className="p-2.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {f.photoUrl ? (
                      <img
                        src={f.photoUrl}
                        alt={f.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-teal-500/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {f.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-stone-800 dark:text-stone-100 truncate">{f.name}</p>
                      <p className="text-stone-500 text-[11px] truncate">{f.relationship}{f.phone ? ` • ${f.phone}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingFamily(f)}
                      className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
                      aria-label="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingFamily?.id === f.id) setEditingFamily(null);
                        deleteFamilyMember(f.id);
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons: Back, Skip, Finish */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-3.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm cursor-pointer"
              aria-label={t('btn_back')}
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('appointment')}
              className="py-3 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-sm cursor-pointer transition-colors"
            >
              {t('btn_skip')}
            </button>

            <button
              type="button"
              onClick={handleFinishFamily}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('finish_appointments')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* STEP 6: Appointment Setup (Hospital, Doctor, Date, Time) */}
      {/* ======================================================= */}
      {currentStep === 'appointment' && (
        <div className="my-auto py-2 space-y-4 max-w-md mx-auto w-full">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
              {t('step_appointment')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              {t('clinical_schedule_title')}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
              {t('apt_setup_desc', { name: patientName || 'Arun' })}
            </p>
          </div>

          {/* Add Appointment Form */}
          <form onSubmit={handleAddAppointment} className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
            
            {/* Hospital Name */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                {t('hospital_name')} *
              </label>
              <div className="relative">
                <Stethoscope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" />
                <input
                  type="text"
                  placeholder="e.g. Apollo Multispeciality Hospital"
                  value={aptHospital}
                  onChange={(e) => setAptHospital(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Doctor Name */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                {t('doctor_name')} *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" />
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Sharma (Neurologist)"
                  value={aptDoctor}
                  onChange={(e) => setAptDoctor(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-teal-600" />
                  <span>{t('appointment_date')}</span>
                </label>
                <input
                  type="date"
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-teal-600" />
                  <span>{t('appointment_time')}</span>
                </label>
                <select
                  value={aptTime}
                  onChange={(e) => setAptTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>
            </div>

            {/* Consultation Notes */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
                {t('clinical_notes')}
              </label>
              <input
                type="text"
                placeholder="e.g. Routine cognitive follow-up & blood tests"
                value={aptNotes}
                onChange={(e) => setAptNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-teal-100 dark:bg-teal-950/70 hover:bg-teal-200 text-teal-900 dark:text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>{t('btn_add_appointment')}</span>
            </button>
          </form>

          {/* Configured Appointments List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              {t('scheduled_visits', { count: appointments.length })}
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {appointments.map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-lg">
                      <Stethoscope size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-100">{a.doctorName}</p>
                      <p className="text-stone-500 text-[11px]">{a.hospitalName} • {a.date} at {a.time}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAppointment(a.id)}
                    className="p-1 text-stone-400 hover:text-rose-500 cursor-pointer"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons: Back, Skip, Finish */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-3.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm cursor-pointer"
              aria-label={t('btn_back')}
            >
              <ArrowLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('complete')}
              className="py-3 px-4 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-sm cursor-pointer transition-colors"
            >
              {t('btn_skip')}
            </button>

            <button
              type="button"
              onClick={handleFinishAppointment}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t('finish_complete')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* STEP 7: Finish Setup / Complete Summary                 */}
      {/* ======================================================= */}
      {currentStep === 'complete' && (
        <div className="my-auto py-6 text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce shadow-md">
            <CheckCircle2 size={48} />
          </div>

          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 mb-2">
            {t('setup_complete_title')}
          </h1>

          <p className="text-sm text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
            {t('setup_complete_desc', { name: patientName })}
          </p>

          <div className="bg-white dark:bg-stone-850 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 text-left space-y-2.5 mb-6 text-xs text-stone-600 dark:text-stone-300 shadow-xs">
            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-teal-600" />
                <span>Patient Profile:</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{patientName}</span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Pill size={13} className="text-teal-600" />
                <span>Scheduled Medicines:</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{medications.length} items</span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Droplets size={13} className="text-sky-500" />
                <span>Daily Hydration:</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {hydrationGoal} {hydrationUnit} ({hydrationInterval === 60 ? '1h' : hydrationInterval === 30 ? '30m' : '2h'} interval)
              </span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-teal-600" />
                <span>Family Circle:</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{familyMembers.length} members</span>
            </div>

            <div className="flex justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={13} className="text-teal-600" />
                <span>Appointments:</span>
              </span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {appointments.length > 0 ? `${appointments.length} scheduled` : 'None'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterDashboard}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-lg shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{t('enter_caretaker_portal')}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      )}

      {/* Footer text */}
      <div className="text-center text-xs text-stone-400 dark:text-stone-500 pt-3">
        Memogram Setup Wizard • All records saved to patient profile
      </div>
    </div>
  );
};
