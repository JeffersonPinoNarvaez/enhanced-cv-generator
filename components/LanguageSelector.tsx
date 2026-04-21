'use client';

import { Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutputLanguage } from '@/types';

interface LanguageSelectorProps {
  value: OutputLanguage;
  onChange: (lang: OutputLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  const es = value === 'es';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            2
          </span>
          <Globe className="w-4 h-4" />
          {es ? 'Idioma del CV de salida' : 'Output CV Language'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {(['es', 'en'] as OutputLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onChange(lang)}
              disabled={disabled}
              className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-semibold transition-all ${
                value === lang
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
