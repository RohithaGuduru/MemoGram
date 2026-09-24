import React, { useState, useRef, useEffect } from 'react';
import { Camera, Clock, Plus, Trash2, Upload, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { Medication } from '../../types';
import { processImageFile } from '../../utils/imageUtils';
import { useApp } from '../../context/AppContext';

export const MEDICINE_TYPES = ['Capsules', 'Tablets', 'Syrup / Tonic'] as const;
export const FREQUENCY_OPTIONS = ['Once', 'Twice', 'Thrice', 'Daily', 'As needed'] as const;

export interface MedicationFormProps {
  initialData?: Medication | null;
  onSave: (data: Omit<Medication, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  isModal?: boolean;
  submitButtonText?: string;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isModal = false,
  submitButtonText,
}) => {
  const { t } = useApp();
  const [photoUrl, setPhotoUrl] = useState<string>(initialData?.photoUrl || '');
  const [medicineType, setMedicineType] = useState<string>(initialData?.medicineType || 'Tablets');
  const [name, setName] = useState<string>(initialData?.name || '');
  const [dosage, setDosage] = useState<string>(initialData?.dosage || '');
  const [frequency, setFrequency] = useState<string>(initialData?.frequency || 'Daily');
  const [times, setTimes] = useState<string[]>(
    initialData?.scheduledTimes && initialData.scheduledTimes.length > 0
      ? initialData.scheduledTimes
      : [initialData?.scheduleTime || '8:00 AM']
  );
  const [instructions, setInstructions] = useState<string>(initialData?.instructions || '');
  const [stockQty, setStockQty] = useState<number>(
    initialData?.remainingQuantity !== undefined ? initialData.remainingQuantity : 30
  );
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setPhotoUrl(initialData.photoUrl || '');
      setMedicineType(initialData.medicineType || 'Tablets');
      setName(initialData.name || '');
      setDosage(initialData.dosage || '');
      setFrequency(initialData.frequency || 'Daily');
      setTimes(
        initialData.scheduledTimes && initialData.scheduledTimes.length > 0
          ? initialData.scheduledTimes
          : [initialData.scheduleTime || '8:00 AM']
      );
      setInstructions(initialData.instructions || '');
      setStockQty(initialData.remainingQuantity !== undefined ? initialData.remainingQuantity : 30);
    }
  }, [initialData]);

  const handleFrequencySelect = (f: string) => {
    setFrequency(f);
    if (f === 'Once') setTimes(['8:00 AM']);
    else if (f === 'Twice') setTimes(['8:00 AM', '8:00 PM']);
    else if (f === 'Thrice') setTimes(['8:00 AM', '1:00 PM', '8:00 PM']);
    else if (f === 'Daily') setTimes(['9:00 AM']);
    else if (f === 'As needed') setTimes(['When required']);
  };

  const handleAddTimeSlot = () => {
    setTimes((prev) => [...prev, '8:00 PM']);
  };

  const handleRemoveTimeSlot = (idx: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTimeSlotChange = (idx: number, val: string) => {
    setTimes((prev) => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setImageError(null);
    try {
      const compressedDataUrl = await processImageFile(file, 500, 0.85);
      setPhotoUrl(compressedDataUrl);
    } catch (err: any) {
      setImageError(err.message || 'Failed to process image');
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    const primaryTime = times[0] || '8:00 AM';
    const isMorning = primaryTime.toLowerCase().includes('am') && !primaryTime.includes('12:');
    const isAfternoon = primaryTime.includes('12:') || primaryTime.includes('1:') || primaryTime.includes('2:') || primaryTime.includes('3:');
    const isEvening = primaryTime.includes('4:') || primaryTime.includes('5:') || primaryTime.includes('6:') || primaryTime.includes('7:') || primaryTime.includes('8:');

    let timeCategory: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    if (isMorning) timeCategory = 'morning';
    else if (isAfternoon) timeCategory = 'afternoon';
    else if (isEvening) timeCategory = 'evening';
    else timeCategory = 'night';

    onSave({
      name: name.trim(),
      dosage: dosage.trim(),
      scheduleTime: primaryTime,
      medicineType,
      frequency,
      scheduledTimes: times,
      timeCategory,
      remainingQuantity: Number(stockQty) || 30,
      totalQuantity: Number(stockQty) || 30,
      takenStatus: initialData?.takenStatus || 'pending',
      instructions: instructions.trim() || 'Take as directed.',
      photoUrl: photoUrl.trim() || undefined,
      prescribedBy: initialData?.prescribedBy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Hidden native file input for actual photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload actual medicine photo"
      />

      {/* 1. MEDICINE PHOTO UPLOAD AREA */}
      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase mb-2 flex items-center gap-1.5">
          <Camera size={14} className="text-teal-600 dark:text-teal-400" />
          <span>Medicine Photo</span>
        </label>

        {photoUrl ? (
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img
                src={photoUrl}
                alt="Uploaded medicine"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-500 shadow-xs"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Actual medicine photo attached
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isProcessingImage ? 'animate-spin' : ''} />
                  <span>Change Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-teal-500 bg-white dark:bg-stone-850 text-center cursor-pointer transition-all hover:bg-teal-50/40 dark:hover:bg-teal-950/20 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload size={18} />
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-colors pointer-events-none"
            >
              <Camera size={14} />
              <span>{t('form_upload_photo')}</span>
            </button>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 font-medium">
              Upload the actual medicine photo for easy recognition.
            </p>
          </div>
        )}

        {imageError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
            {imageError}
          </p>
        )}
      </div>

      {/* 2. MEDICINE TYPE SELECTION */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
          {t('form_medicine_type')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MEDICINE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMedicineType(type)}
              className={`py-2 px-2 text-center rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                medicineType === type
                  ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-teal-300 bg-white dark:bg-stone-850'
              }`}
            >
              {type === 'Tablets' ? t('type_tablets') : type === 'Capsules' ? t('type_capsules') : t('type_syrup')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MEDICINE NAME & DOSAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_med_name')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Donepezil"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_dosage')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 1 tablet (5mg)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. FREQUENCY SELECTION */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
          {t('form_frequency')}
        </label>
        <div className="grid grid-cols-5 gap-1">
          {FREQUENCY_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleFrequencySelect(f)}
              className={`py-1.5 px-1 text-center rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                frequency === f
                  ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-teal-300 bg-white dark:bg-stone-850'
              }`}
            >
              {f === 'Daily' ? t('freq_daily') : f === 'Once' ? t('freq_once') : f === 'Twice' ? t('freq_twice') : f === 'Thrice' ? t('freq_thrice') : t('freq_as_needed')}
            </button>
          ))}
        </div>
      </div>

      {/* 5. SCHEDULED TIMES */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase flex items-center gap-1">
            <Clock size={12} className="text-teal-600" />
            <span>{t('form_scheduled_times')} ({times.length})</span>
          </label>
          <button
            type="button"
            onClick={handleAddTimeSlot}
            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Plus size={12} />
            <span>Add Time</span>
          </button>
        </div>

        <div className="space-y-1.5">
          {times.map((timeVal, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={timeVal}
                onChange={(e) => handleTimeSlotChange(idx, e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold focus:outline-none"
              >
                <option value="7:00 AM">7:00 AM (Early Morning)</option>
                <option value="8:00 AM">8:00 AM (Morning - Breakfast)</option>
                <option value="9:00 AM">9:00 AM (Morning)</option>
                <option value="12:00 PM">12:00 PM (Noon)</option>
                <option value="1:00 PM">1:00 PM (Afternoon - Lunch)</option>
                <option value="4:00 PM">4:00 PM (Late Afternoon)</option>
                <option value="7:00 PM">7:00 PM (Evening)</option>
                <option value="8:00 PM">8:00 PM (Dinner)</option>
                <option value="9:00 PM">9:00 PM (Bedtime)</option>
                <option value="When required">When required (As needed)</option>
              </select>
              {times.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTimeSlot(idx)}
                  className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg cursor-pointer"
                  aria-label="Remove time"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. SPECIAL INSTRUCTIONS & PILLS IN STOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_instructions')}
          </label>
          <input
            type="text"
            placeholder="e.g. Take right after breakfast with water"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_stock_quantity')}
          </label>
          <input
            type="number"
            value={stockQty}
            onChange={(e) => setStockQty(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
          />
        </div>
      </div>

      {/* 7. ACTIONS */}
      <div className="flex gap-2.5 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {t('btn_cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isProcessingImage || !name.trim() || !dosage.trim()}
          className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <Plus size={15} />
          <span>{submitButtonText || (initialData ? t('btn_save') : t('btn_add'))}</span>
        </button>
      </div>
    </form>
  );
};
