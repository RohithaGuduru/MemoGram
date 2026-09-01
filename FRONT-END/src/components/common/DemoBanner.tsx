import React, { useState } from 'react';
import { Info, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { DEMO_DATA_DISCLAIMER } from '../../services/mockData';

interface DemoBannerProps {
  compact?: boolean;
  className?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ compact = false, className = '' }) => {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs font-semibold tracking-wide ${className}`}>
        <Sparkles size={13} className="text-amber-600 dark:text-amber-400" />
        <span>{DEMO_DATA_DISCLAIMER.label}</span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-stone-900 border border-amber-200/90 dark:border-amber-800/40 rounded-2xl p-3 sm:p-3.5 shadow-sm text-stone-800 dark:text-stone-200 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 mt-0.5 flex-shrink-0">
            <Info size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-md">
                {DEMO_DATA_DISCLAIMER.label}
              </span>
              <span className="text-xs text-amber-900/75 dark:text-amber-300/80 font-medium">
                Prototype Mock Values
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
              {DEMO_DATA_DISCLAIMER.notice}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded"
          aria-label="Toggle disclaimer detail"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
          <p>{DEMO_DATA_DISCLAIMER.nonDiagnosticDisclaimer}</p>
          <p className="mt-1 text-teal-700 dark:text-teal-400 font-medium">
            → REST API readiness: Backend models & mock stores are 1:1 typed with expected cloud endpoints.
          </p>
        </div>
      )}
    </div>
  );
};
