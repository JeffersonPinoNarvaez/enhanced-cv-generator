'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import type { UILocale } from '@/lib/format-api-error';

interface CVUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
  uiLocale: UILocale;
}

export function CVUploader({ onFileSelect, selectedFile, disabled, uiLocale }: CVUploaderProps) {
  const es = uiLocale === 'es';
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${selectedFile ? 'border-green-400 bg-green-50' : ''}
      `}
    >
      <input
        type="file"
        accept=".pdf"
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        onChange={handleFileInput}
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle className="w-10 h-10 text-green-500" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-base font-semibold text-green-700">{selectedFile.name}</span>
          </div>
          <span className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-10 h-10 text-gray-400" />
          <div>
            <p className="text-base font-semibold text-gray-700">
              {es ? 'Arrastra tu CV aquí o haz clic para elegir' : 'Drop your CV here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {es
                ? 'Solo PDF · Máx. 5 MB en este servidor · ATS, moderno o escaneado'
                : 'PDF only · Max 5 MB on this server · ATS, modern, or scanned'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
