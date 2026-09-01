import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />,
          warning: <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />,
          error: <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" />,
          info: <Info size={20} className="text-teal-500 flex-shrink-0 mt-0.5" />
        };

        const bgStyles = {
          success: 'bg-white dark:bg-stone-900 border-emerald-300 dark:border-emerald-800 text-stone-800 dark:text-stone-100',
          warning: 'bg-amber-50 dark:bg-stone-900 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100',
          error: 'bg-rose-50 dark:bg-stone-900 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100',
          info: 'bg-white dark:bg-stone-900 border-teal-300 dark:border-teal-800 text-stone-800 dark:text-stone-100'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-md animate-fade-in ${bgStyles[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-left">
              {toast.title && (
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="text-sm font-medium leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
