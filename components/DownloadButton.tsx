'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OutputLanguage } from '@/types';

interface DownloadButtonProps {
  onClick: () => void | Promise<void>;
  outputLanguage: OutputLanguage;
  disabled?: boolean;
}

export function DownloadButton({ onClick, outputLanguage, disabled }: DownloadButtonProps) {
  const es = outputLanguage === 'es';

  return (
    <Button onClick={onClick} disabled={disabled} className="bg-blue-600 hover:bg-blue-700">
      <Download className="w-4 h-4 mr-2" />
      {es ? 'Descargar PDF' : 'Download PDF'}
    </Button>
  );
}
