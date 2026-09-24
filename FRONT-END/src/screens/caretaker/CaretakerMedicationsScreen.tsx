import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  X,
  Package,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/common/Header';
import { CaretakerNavbar } from '../../components/layout/CaretakerNavbar';
import { Medication } from '../../types';
import { MedicationForm } from '../../components/forms/MedicationForm';

export const CaretakerMedicationsScreen: React.FC = () => {
  const { 
    medications, 
    addMedication, 
    updateMedication, 
    deleteMedication, 
    patient, 
    showToast,
    t 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  const openAddModal = () => {
    setEditingMed(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setIsAddModalOpen(true);
  };

  const handleSaveMedication = async (data: Omit<Medication, 'id'>) => {
    if (editingMed) {
      await updateMedication(editingMed.id, data);
      showToast('Prescription updated successfully', 'success', 'Medications');
    } else {
      await addMedication(data);
      showToast('Prescription added successfully', 'success', 'Medications');
    }
    setIsAddModalOpen(false);
    setEditingMed(null);
  };

  const handleRefill = (id: string, current: number) => {
    updateMedication(id, { remainingQuantity: current + 30 });
    showToast('Refilled +30 pills in stock', 'success');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title={t('nav_meds')} showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {patient.name}'s Schedule
            </h2>
            <p className="text-xs text-stone-500">
              {t('active_prescriptions', { count: medications.length })}
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>{t('btn_add_prescription')}</span>
          </button>
        </div>

        {/* Medicines List */}
        <div className="space-y-3">
          {medications.map((med) => {
            const isLow = med.remainingQuantity < 10;

            return (
              <div 
                key={med.id}
                className="p-4 rounded-3xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-soft hover:shadow-soft-lg transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {med.photoUrl ? (
                      <img
                        src={med.photoUrl}
                        alt={med.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-stone-100 dark:ring-stone-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
                        <Pill size={26} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {med.name}
                        </h3>
                        {med.medicineType && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                            {med.medicineType}
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {med.dosage}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-300">
                          <Clock size={13} />
                          {med.scheduleTime}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Package size={13} />
                          <strong className={isLow ? 'text-amber-600 font-bold' : 'text-stone-800 dark:text-stone-200'}>
                            {med.remainingQuantity}
                          </strong> {t('in_stock', { count: med.remainingQuantity })}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 italic bg-stone-50 dark:bg-stone-800/60 p-2 rounded-xl border border-stone-100 dark:border-stone-700/60">
                        "{med.instructions}"
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(med)}
                      className="p-2 text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                      aria-label="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMedication(med.id)}
                      className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Status & Quick Refill Bar */}
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      med.takenStatus === 'taken' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                      Today: {med.takenStatus === 'taken' ? `Taken (${med.takenAt || '9:05 AM'})` : 'Pending'}
                    </span>
                  </div>

                  {isLow && (
                    <button
                      type="button"
                      onClick={() => handleRefill(med.id, med.remainingQuantity)}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>{t('btn_refill_stock')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <MedicationForm
          isModal={true}
          initialData={editingMed}
          onSave={handleSaveMedication}
          onCancel={() => {
            setIsAddModalOpen(false);
            setEditingMed(null);
          }}
          submitButtonText={editingMed ? 'Update Medication' : 'Save Prescription'}
        />
      )}

      <CaretakerNavbar />
    </div>
  );
};
