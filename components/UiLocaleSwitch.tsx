'use client';

import type { UILocale } from '@/lib/format-api-error';

type UiLocaleSwitchProps = {
  value: UILocale;
  onChange: (locale: UILocale) => void;
  disabled?: boolean;
  label: string;
};

export function UiLocaleSwitch({ value, onChange, disabled, label }: UiLocaleSwitchProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm font-semibold text-gray-600">{label}</span>
      <div
        className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1"
        role="group"
        aria-label={label}
      >
        {(['es', 'en'] as const).map((loc) => (
          <button
            key={loc}
            type="button"
            disabled={disabled}
            onClick={() => onChange(loc)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
              value === loc
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loc === 'es' ? 'ES' : 'EN'}
          </button>
        ))}
      </div>
    </div>
  );
}
