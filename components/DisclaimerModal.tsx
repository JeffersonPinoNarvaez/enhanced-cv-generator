'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UILocale } from '@/lib/format-api-error';
import { getUiCopy } from '@/lib/ui-copy';

type DisclaimerModalProps = {
  open: boolean;
  onClose: () => void;
  uiLocale: UILocale;
};

export function DisclaimerModal({ open, onClose, uiLocale }: DisclaimerModalProps) {
  if (!open) return null;
  const t = getUiCopy(uiLocale);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={uiLocale === 'es' ? 'Cerrar' : 'Close'}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          aria-label={uiLocale === 'es' ? 'Cerrar' : 'Close'}
        >
          <X className="h-5 w-5" />
        </button>
        <h2 id="disclaimer-title" className="pr-10 text-xl font-bold text-gray-900">
          {t.disclaimerTitle}
        </h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-700">
          <p>{t.disclaimerIntro}</p>
          <p>{t.disclaimerP1}</p>
          <p>{t.disclaimerP2}</p>
          <p>{t.disclaimerP3}</p>
        </div>
        <div className="mt-8 flex justify-end">
          <Button type="button" onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            {t.disclaimerClose}
          </Button>
        </div>
      </div>
    </div>
  );
}
