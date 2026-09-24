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
  Trash2,
  Clock,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { getLanguageInfo } from '../../services/languageCapabilities';
import { Appointment, FamilyMember } from '../../types';
import { FamilyMemberForm } from '../../components/forms/FamilyMemberForm';

export const CaretakerPatientScreen: React.FC = () => {
  const { 
    patient, 
    updatePatient, 
    familyMembers, 
    addFamilyMember, 
    updateFamilyMember,
    deleteFamilyMember,
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    showToast,
    t 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(patient.name);
  const [email, setEmail] = useState(patient.email);
  const [phone, setPhone] = useState(patient.phone);
  const [gender, setGender] = useState(patient.gender);
  const [age, setAge] = useState(patient.age);
  const [emergName, setEmergName] = useState(patient.emergencyContact.name);
  const [emergPhone, setEmergPhone] = useState(patient.emergencyContact.phone);

  // Appointment modal & action state
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [deletingApt, setDeletingApt] = useState<Appointment | null>(null);

  // Family modal state
  const [isFamModalOpen, setIsFamModalOpen] = useState(false);
  const [editingFam, setEditingFam] = useState<FamilyMember | null>(null);

  const handleOpenAddFam = () => {
    setEditingFam(null);
    setIsFamModalOpen(true);
  };

  const handleOpenEditFam = (fam: FamilyMember) => {
    setEditingFam(fam);
    setIsFamModalOpen(true);
  };

  const handleSaveFamilyMember = async (data: Omit<FamilyMember, 'id'>) => {
    if (editingFam) {
      await updateFamilyMember(editingFam.id, data);
      showToast('Family member updated successfully', 'success', 'Family Circle');
    } else {
      await addFamilyMember(data);
      showToast('Family member added successfully', 'success', 'Family Circle');
    }
    setIsFamModalOpen(false);
    setEditingFam(null);
  };

  const handleOpenAddApt = () => {
    setEditingAptId(null);
    setHospitalName('');
    setDoctorName('');
    setAptDate(new Date().toISOString().split('T')[0]);
    setAptTime('10:00 AM');
    setIsAptModalOpen(true);
  };

  const handleOpenEditApt = (apt: Appointment) => {
    setEditingAptId(apt.id);
    setHospitalName(apt.hospitalName);
    setDoctorName(apt.doctorName);
    setAptDate(apt.date);
    setAptTime(apt.time);
    setIsAptModalOpen(true);
  };

  const handleCloseAptModal = () => {
    setIsAptModalOpen(false);
    setEditingAptId(null);
  };

  const handleSaveApt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName.trim() || !doctorName.trim() || !aptDate.trim() || !aptTime.trim()) {
      showToast('Please fill in all appointment fields', 'error');
      return;
    }

    if (editingAptId) {
      await updateAppointment(editingAptId, {
        hospitalName: hospitalName.trim(),
        doctorName: doctorName.trim(),
        date: aptDate.trim(),
        time: aptTime.trim(),
      });
    } else {
      await addAppointment({
        hospitalName: hospitalName.trim(),
        doctorName: doctorName.trim(),
        date: aptDate.trim(),
        time: aptTime.trim(),
      });
    }
    handleCloseAptModal();
  };

  const handleConfirmDeleteApt = async () => {
    if (deletingApt) {
      await deleteAppointment(deletingApt.id);
      setDeletingApt(null);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return { day: '--', month: '---', year: '----' };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return {
        day: isNaN(day) ? parts[2] : String(day).padStart(2, '0'),
        month: months[monthIdx] || parts[1],
        year: year
      };
    }
    return { day: '15', month: 'SEP', year: '2026' };
  };

  const formatDisplayTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const trimmed = timeStr.trim();
    if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
      return trimmed;
    }
    const [hStr, mStr] = trimmed.split(':');
    let h = parseInt(hStr, 10) || 0;
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

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
      <Header title={t('patient_mgmt_title') || t('nav_patient')} showBack />

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

        {/* Appointments Section */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Calendar size={16} />
              </div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {t('scheduled_visits', { count: appointments.length })}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddApt}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('btn_add_appointment')}</span>
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
              <Calendar size={28} className="mx-auto text-stone-400 mb-2 opacity-60" />
              <p className="font-semibold text-stone-700 dark:text-stone-300">No scheduled appointments</p>
              <p className="mt-0.5 text-stone-500">Tap "+ Add Appointment" above to schedule a hospital visit.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {appointments.map((apt) => {
                const dateObj = formatDisplayDate(apt.date);
                const timeFormatted = formatDisplayTime(apt.time);

                return (
                  <div
                    key={apt.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-teal-300 dark:hover:border-teal-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 min-w-[56px] text-center flex-shrink-0">
                        <span className="text-base sm:text-lg font-black text-teal-900 dark:text-teal-200 leading-tight">
                          {dateObj.day}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 leading-none">
                          {dateObj.month}
                        </span>
                        <span className="text-[9px] font-semibold text-stone-400 dark:text-stone-500 leading-tight mt-0.5">
                          {dateObj.year}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {apt.hospitalName}
                        </p>
                        <p className="text-stone-600 dark:text-stone-300 font-medium truncate mt-0.5">
                          {apt.doctorName}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                          <Clock size={12} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                          <span>{timeFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditApt(apt)}
                        className="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-stone-200/70 dark:hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        aria-label="Edit Appointment"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingApt(apt)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        aria-label="Delete Appointment"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Family Information & Circle */}
        <div className="bg-white dark:bg-stone-850 p-4 sm:p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <Users size={16} />
              </div>
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {t('saved_family', { count: familyMembers.length })}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddFam}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>{t('btn_add_family_member')}</span>
            </button>
          </div>

          <div className="space-y-2">
            {familyMembers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500">
                <Users size={28} className="mx-auto text-stone-400 mb-2 opacity-60" />
                <p className="font-semibold text-stone-700 dark:text-stone-300">No family members added</p>
                <p className="mt-0.5 text-stone-500">Tap "+ Add Member" above to add family memories and photos.</p>
              </div>
            ) : (
              familyMembers.map((fam) => {
                const initials = fam.name
                  ? fam.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'FM';

                return (
                  <div key={fam.id} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {fam.photoUrl ? (
                        <img
                          src={fam.photoUrl}
                          alt={fam.name}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-black text-sm flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{fam.name}</p>
                          {fam.category && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                              {fam.category}
                            </span>
                          )}
                        </div>
                        <p className="text-stone-500 truncate">{fam.relationship} • {fam.phone}</p>
                        {fam.notes && <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5 truncate">"{fam.notes}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFam(fam)}
                        className="p-1.5 text-stone-500 hover:text-teal-700 hover:bg-stone-200/70 dark:hover:bg-stone-700 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        aria-label="Edit Member"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFamilyMember(fam.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        aria-label="Delete Member"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Add / Edit Appointment Modal */}
      {isAptModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-stone-850 rounded-3xl p-5 sm:p-6 w-full max-w-md border border-stone-200 dark:border-stone-750 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apt-modal-title"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                  <Calendar size={18} />
                </div>
                <h3 id="apt-modal-title" className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                  {editingAptId ? 'Edit Appointment' : 'Add Appointment'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseAptModal}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveApt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apollo Multispeciality Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Sharma (Neurologist)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM"
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleCloseAptModal}
                  className="px-4 py-2.5 rounded-2xl text-stone-600 dark:text-stone-300 font-bold text-xs sm:text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingAptId ? 'Save Changes' : 'Add Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingApt && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-stone-850 rounded-3xl p-5 sm:p-6 w-full max-w-sm border border-stone-200 dark:border-stone-750 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 id="delete-modal-title" className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                Delete Appointment?
              </h3>
              <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Are you sure you want to remove the appointment with <span className="font-bold text-stone-800 dark:text-stone-200">{deletingApt.doctorName}</span> at <span className="font-bold text-stone-800 dark:text-stone-200">{deletingApt.hospitalName}</span>?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingApt(null)}
                className="flex-1 py-2.5 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 font-bold text-xs sm:text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteApt}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Family Member Modal */}
      {isFamModalOpen && (
        <FamilyMemberForm
          isModal={true}
          initialData={editingFam}
          onSave={handleSaveFamilyMember}
          onCancel={() => {
            setIsFamModalOpen(false);
            setEditingFam(null);
          }}
          submitButtonText={editingFam ? 'Update Family Member' : 'Save Family Member'}
        />
      )}

      <CaretakerNavbar />
    </div>
  );
};
