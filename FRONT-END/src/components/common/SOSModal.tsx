import React, { useState } from 'react';
import { PhoneCall, AlertTriangle, X, CheckCircle, ShieldAlert, HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpeakTextButton } from './SpeakTextButton';

export const SOSModal: React.FC = () => {
  const { 
    isSosModalOpen, 
    closeSosModal, 
    triggerSosAlert, 
    sosAlertSent, 
    patient, 
    caretaker 
  } = useApp();

  const [simulatedCountdown, setSimulatedCountdown] = useState<number | null>(null);

  if (!isSosModalOpen) return null;

  const handleSendAlert = () => {
    setSimulatedCountdown(3);
    const interval = setInterval(() => {
      setSimulatedCountdown((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          triggerSosAlert();
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 800);
  };

  const questionPrompt = "Do you need help? We can send an immediate notification to your caregiver Priya Sharma.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-4 border-rose-400 dark:border-rose-600 text-stone-900 dark:text-stone-100 relative">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={closeSosModal}
          className="absolute top-4 right-4 p-2.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Close SOS Dialog"
        >
          <X size={24} />
        </button>

        {!sosAlertSent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ShieldAlert size={38} />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400">
                Do you need help?
              </h2>
              <SpeakTextButton 
                textToSpeak={questionPrompt} 
                variant="icon-only" 
                size="md" 
              />
            </div>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-medium mb-6">
              We can alert your daughter <strong className="text-stone-900 dark:text-stone-100">{patient.emergencyContact.name || caretaker.name}</strong> right away.
            </p>

            {simulatedCountdown !== null ? (
              <div className="py-4 my-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200">
                <p className="font-semibold text-lg animate-pulse">
                  Sending alert in {simulatedCountdown}...
                </p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  (Simulated emergency dispatch)
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSendAlert}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-lg sm:text-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-3 transition-all"
                >
                  <PhoneCall size={24} />
                  <span>Contact Caregiver / Send Alert</span>
                </button>

                <button
                  type="button"
                  onClick={closeSosModal}
                  className="w-full py-3.5 px-6 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-base transition-colors"
                >
                  Cancel — I am okay
                </button>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-400 flex items-center justify-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Prototype demo mode: Does not call emergency services.</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} />
            </div>

            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              Caregiver Alerted
            </h2>

            <p className="text-base text-stone-600 dark:text-stone-300 mb-4">
              A high-priority notification was dispatched to <strong>{patient.emergencyContact.name || 'Priya Sharma'}</strong> ({patient.emergencyContact.phone}).
            </p>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-6 text-left text-sm text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2 font-semibold mb-1">
                <HeartHandshake size={18} className="text-emerald-600" />
                <span>What happens next?</span>
              </div>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                Priya will receive an immediate push alert and SMS. Stay seated comfortably, breathe gently, and wait for her response.
              </p>
            </div>

            <button
              type="button"
              onClick={closeSosModal}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base transition-colors shadow-md"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
