'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UILocale } from '@/lib/format-api-error';

interface DownloadButtonProps {
  onClick: () => void | Promise<void>;
  uiLocale: UILocale;
  disabled?: boolean;
}

export function DownloadButton({ onClick, uiLocale, disabled }: DownloadButtonProps) {
  const es = uiLocale === 'es';

  return (
    <Button onClick={onClick} disabled={disabled} className="bg-blue-600 hover:bg-blue-700">
      <Download className="w-4 h-4 mr-2" />
      {es ? 'Descargar PDF' : 'Download PDF'}
    </Button>
  );
}
