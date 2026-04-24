'use client';

import { Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UILocale } from '@/lib/format-api-error';
import { getUiCopy } from '@/lib/ui-copy';
import { OutputLanguage } from '@/types';

interface LanguageSelectorProps {
  value: OutputLanguage;
  onChange: (lang: OutputLanguage) => void;
  disabled?: boolean;
  uiLocale: UILocale;
}

export function LanguageSelector({ value, onChange, disabled, uiLocale }: LanguageSelectorProps) {
  const t = getUiCopy(uiLocale);

  return (
    <Card className="text-base">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
            2
          </span>
          <Globe className="w-5 h-5 shrink-0" />
          {t.step2Title}
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
              className={`flex-1 py-3.5 px-4 rounded-lg border-2 text-base font-semibold transition-all ${
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
