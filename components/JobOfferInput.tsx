'use client';

import { Textarea } from '@/components/ui/textarea';
import { OutputLanguage } from '@/types';

interface JobOfferInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  outputLanguage: OutputLanguage;
}

export function JobOfferInput({
  value,
  onChange,
  disabled,
  outputLanguage,
}: JobOfferInputProps) {
  const es = outputLanguage === 'es';

  return (
    <>
      <Textarea
        placeholder={
          es ? 'Pega aquí la oferta laboral completa...' : 'Paste the complete job offer here...'
        }
        className="min-h-[200px] resize-none font-mono text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-400 mt-1">{value.length} characters</p>
    </>
  );
}
