'use client';

import { Textarea } from '@/components/ui/textarea';
import type { UILocale } from '@/lib/format-api-error';

interface JobOfferInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  uiLocale: UILocale;
}

export function JobOfferInput({
  value,
  onChange,
  disabled,
  uiLocale,
}: JobOfferInputProps) {
  const es = uiLocale === 'es';

  return (
    <>
      <Textarea
        placeholder={
          es ? 'Pega aquí la oferta laboral completa...' : 'Paste the complete job offer here...'
        }
        className="min-h-[220px] resize-none font-mono text-[15px] leading-relaxed"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-sm text-gray-500 mt-2">
        {value.length} {es ? 'caracteres' : 'characters'}
      </p>
    </>
  );
}
