import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  HeartHandshake, 
  Edit3, 
  Check, 
  Users, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';

export const CaretakerProfileScreen: React.FC = () => {
  const { caretaker, updateCaretaker, patient, familyMembers, showToast } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(caretaker.name);
  const [email, setEmail] = useState(caretaker.email);
  const [phone, setPhone] = useState(caretaker.phone);
  const [relationship, setRelationship] = useState(caretaker.relationshipToPatient);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCaretaker({ name, email, phone, relationshipToPatient: relationship });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title="Caretaker Profile" showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Caregiver Hero Card */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center relative">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Edit Profile"
          >
            <Edit3 size={18} />
          </button>

          <img
            src={caretaker.photoUrl}
            alt={caretaker.name}
            className="w-20 h-20 rounded-3xl object-cover ring-4 ring-teal-500/30 mx-auto mb-3"
          />

          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {caretaker.name}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Primary Caregiver ({caretaker.relationshipToPatient} of {patient.name})
          </p>

          <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck size={13} />
            <span>Verified Caregiver Account</span>
          </span>
        </div>

        {/* Profile Info / Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              Edit Details
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Relationship</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3 text-xs">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-500 mb-2">
              Caregiver Contact Info
            </h3>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-500">Email Address:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{caretaker.email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-500">Emergency Mobile:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{caretaker.phone}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-500">Supervising Patient:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">{patient.name} ({patient.age} yrs)</span>
            </div>
          </div>
        )}

        {/* Linked Patient Family Summary */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-2 text-xs">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-500 mb-1">
            Linked Family Network
          </h3>
          <p className="text-stone-600 dark:text-stone-400">
            {familyMembers.length} family members connected to {patient.name}'s daily companion memory stream.
          </p>
        </div>

      </div>

      <CaretakerNavbar />
    </div>
  );
};
