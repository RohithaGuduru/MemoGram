import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  Users, 
  Edit3, 
  Check, 
  ShieldAlert,
  Globe,
  Plus,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { getLanguageInfo } from '../../services/languageCapabilities';

export const CaretakerPatientScreen: React.FC = () => {
  const { 
    patient, 
    updatePatient, 
    familyMembers, 
    addFamilyMember, 
    deleteFamilyMember,
    showToast 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(patient.name);
  const [email, setEmail] = useState(patient.email);
  const [phone, setPhone] = useState(patient.phone);
  const [gender, setGender] = useState(patient.gender);
  const [age, setAge] = useState(patient.age);
  const [emergName, setEmergName] = useState(patient.emergencyContact.name);
  const [emergPhone, setEmergPhone] = useState(patient.emergencyContact.phone);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatient({
      name,
      email,
      phone,
      gender,
      age: Number(age),
      emergencyContact: {
        name: emergName,
        relationship: 'Daughter (Caregiver)',
        phone: emergPhone,
      }
    });
    setIsEditing(false);
  };

  const langInfo = getLanguageInfo(patient.primaryLanguage);

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title="Patient Profile & Circle" showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Patient Hero Card */}
        <div className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft text-center relative">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Edit details"
          >
            <Edit3 size={18} />
          </button>

          <div className="relative inline-block mx-auto mb-3">
            <img
              src={patient.photoUrl}
              alt={patient.name}
              className="w-20 h-20 rounded-3xl object-cover ring-4 ring-teal-500/30 mx-auto"
            />
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full ring-2 ring-white">
              <Check size={12} strokeWidth={3} />
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {patient.name}
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            {patient.gender} • {patient.age} years old • Care ID: {patient.id}
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
              <Globe size={13} />
              <span>Language: {langInfo.name} ({langInfo.nativeName})</span>
            </span>
          </div>
        </div>

        {/* Profile Info / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-850 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-2">
              Edit Patient Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-xs font-bold uppercase mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>
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

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <label className="block text-xs font-bold uppercase mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergPhone}
                onChange={(e) => setEmergPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
              />
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
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3 text-xs">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-stone-500 mb-2">
              Contact & Emergency
            </h3>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <Mail size={16} className="text-teal-600" />
                <span>Email:</span>
              </div>
              <span className="font-bold text-stone-900 dark:text-stone-100">{patient.email}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60">
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <Phone size={16} className="text-teal-600" />
                <span>Phone:</span>
              </div>
              <span className="font-bold text-stone-900 dark:text-stone-100">{patient.phone}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
              <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200">
                <ShieldAlert size={16} className="text-rose-600" />
                <span>SOS Alert Contact:</span>
              </div>
              <span className="font-bold text-rose-900 dark:text-rose-100">
                {patient.emergencyContact.name} ({patient.emergencyContact.phone})
              </span>
            </div>
          </div>
        )}

        {/* Family Information & Circle */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-100 text-teal-700">
                <Users size={16} />
              </div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Family Circle ({familyMembers.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {familyMembers.map((fam) => (
              <div key={fam.id} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={fam.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={fam.name}
                    className="w-10 h-10 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="font-bold text-stone-900 dark:text-stone-100">{fam.name}</p>
                    <p className="text-stone-500">{fam.relationship} • {fam.phone}</p>
                    {fam.notes && <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">"{fam.notes}"</p>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteFamilyMember(fam.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <CaretakerNavbar />
    </div>
  );
};
