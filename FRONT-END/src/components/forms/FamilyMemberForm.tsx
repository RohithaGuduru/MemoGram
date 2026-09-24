import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Trash2, Upload, RefreshCw, Users, User } from 'lucide-react';
import { FamilyMember } from '../../types';
import { processImageFile } from '../../utils/imageUtils';
import { useApp } from '../../context/AppContext';

export const RELATION_CATEGORIES = ['Parents', 'Spouse', 'Siblings', 'Child', 'Other'] as const;

export interface FamilyMemberFormProps {
  initialData?: FamilyMember | null;
  onSave: (data: Omit<FamilyMember, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
  isModal?: boolean;
  submitButtonText?: string;
}

export const FamilyMemberForm: React.FC<FamilyMemberFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isModal = false,
  submitButtonText,
}) => {
  const { t } = useApp();
  const [photoUrl, setPhotoUrl] = useState<string>(initialData?.photoUrl || '');
  const [category, setCategory] = useState<string>(initialData?.category || 'Child');
  const [name, setName] = useState<string>(initialData?.name || '');
  const [relationship, setRelationship] = useState<string>(initialData?.relationship || 'Son');
  const [phone, setPhone] = useState<string>(initialData?.phone || '');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setPhotoUrl(initialData.photoUrl || '');
      setCategory(initialData.category || 'Child');
      setName(initialData.name || '');
      setRelationship(initialData.relationship || 'Son');
      setPhone(initialData.phone || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    if (!name.trim()) {
      if (cat === 'Parents') setRelationship('Mother');
      else if (cat === 'Spouse') setRelationship('Wife');
      else if (cat === 'Siblings') setRelationship('Brother');
      else if (cat === 'Child') setRelationship('Son');
      else setRelationship('Family Member');
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Parents': return t('cat_parents');
      case 'Spouse': return t('cat_spouse');
      case 'Siblings': return t('cat_siblings');
      case 'Child': return t('cat_child');
      case 'Other': return t('cat_other');
      default: return cat;
    }
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
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      relationship: relationship.trim() || 'Family Member',
      category,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
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
        aria-label="Upload actual family member photo"
      />

      {/* 1. FAMILY PHOTO UPLOAD AREA */}
      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase mb-2 flex items-center gap-1.5">
          <Camera size={14} className="text-teal-600 dark:text-teal-400" />
          <span>{t('form_upload_photo')}</span>
        </label>

        {photoUrl ? (
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img
                src={photoUrl}
                alt="Uploaded family member"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-teal-500 shadow-xs"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Actual family photo attached
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} className={isProcessingImage ? 'animate-spin' : ''} />
                  <span>{t('form_upload_photo')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>{t('btn_cancel')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-teal-500 bg-white dark:bg-stone-850 text-center cursor-pointer transition-all hover:bg-teal-50/40 dark:hover:bg-teal-950/20 group"
          >
            <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
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
              Upload a real photo of the family member from your device.
            </p>
          </div>
        )}

        {imageError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
            {imageError}
          </p>
        )}
      </div>

      {/* 2. RELATION CATEGORY */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
          {t('form_family_category')}
        </label>
        <div className="grid grid-cols-5 gap-1">
          {RELATION_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`py-1.5 px-1 text-center rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                category === cat
                  ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                  : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-teal-300 bg-white dark:bg-stone-850'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. NAME & SPECIFIC RELATIONSHIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_family_full_name')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rohan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
            {t('form_family_relationship')} *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Son, Sister"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. PHONE NUMBER (OPTIONAL) */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
          {t('form_family_phone')}
        </label>
        <input
          type="tel"
          placeholder="+91 98765 00000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm font-medium focus:outline-none"
        />
      </div>

      {/* 5. MEMORIES NOTE (OPTIONAL) */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase mb-1">
          {t('form_family_notes')}
        </label>
        <input
          type="text"
          placeholder="e.g. Loves gardening, calls every morning"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium focus:outline-none"
        />
      </div>

      {/* 6. ACTIONS */}
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
          disabled={isProcessingImage || !name.trim()}
          className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <Plus size={15} />
          <span>{submitButtonText || (initialData ? t('btn_save') : t('btn_add_family_member'))}</span>
        </button>
      </div>
    </form>
  );
};
