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

export const CaretakerMedicationsScreen: React.FC = () => {
  const { 
    medications, 
    addMedication, 
    updateMedication, 
    deleteMedication, 
    patient, 
    showToast 
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formTime, setFormTime] = useState('9:00 AM');
  const [formQty, setFormQty] = useState(30);
  const [formInstructions, setFormInstructions] = useState('');

  const openAddModal = () => {
    setEditingMed(null);
    setFormName('');
    setFormDosage('');
    setFormTime('9:00 AM');
    setFormQty(30);
    setFormInstructions('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setFormName(med.name);
    setFormDosage(med.dosage);
    setFormTime(med.scheduleTime);
    setFormQty(med.remainingQuantity);
    setFormInstructions(med.instructions);
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDosage) {
      showToast('Please provide medicine name and dosage', 'warning');
      return;
    }

    if (editingMed) {
      updateMedication(editingMed.id, {
        name: formName,
        dosage: formDosage,
        scheduleTime: formTime,
        remainingQuantity: formQty,
        instructions: formInstructions,
      });
    } else {
      addMedication({
        name: formName,
        dosage: formDosage,
        scheduleTime: formTime,
        timeCategory: formTime.includes('AM') ? 'morning' : 'evening',
        remainingQuantity: formQty,
        totalQuantity: formQty,
        takenStatus: 'pending',
        instructions: formInstructions || 'Take with water as directed.',
        photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'
      });
    }

    setIsAddModalOpen(false);
  };

  const handleRefill = (id: string, current: number) => {
    updateMedication(id, { remainingQuantity: current + 30 });
    showToast('Refilled +30 pills in stock', 'success');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-warm-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100">
      <Header title="Medication Management" showBack />

      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">
        
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {patient.name}'s Schedule
            </h2>
            <p className="text-xs text-stone-500">
              {medications.length} active prescriptions monitored
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add Medicine</span>
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
                    <img
                      src={med.photoUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'}
                      alt={med.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-stone-100 dark:ring-stone-700"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                          {med.name}
                        </h3>
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
                          </strong> pills left
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
                      <span>Low stock — Refill +30</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
              <h3 className="text-lg font-bold">
                {editingMed ? 'Edit Medication' : 'Add New Prescription'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Donepezil"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    placeholder="e.g. 1 tablet (5mg)"
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Schedule Time</label>
                <select
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                >
                  <option value="8:00 AM">8:00 AM (Morning)</option>
                  <option value="9:00 AM">9:00 AM (Morning)</option>
                  <option value="1:00 PM">1:00 PM (Afternoon)</option>
                  <option value="8:00 PM">8:00 PM (Evening)</option>
                  <option value="9:00 PM">9:00 PM (Night)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Special Instructions</label>
                <input
                  type="text"
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  placeholder="e.g. Take right after breakfast with water"
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-sm"
                >
                  {editingMed ? 'Update Medication' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CaretakerNavbar />
    </div>
  );
};
