'use client';

import { useState } from 'react';
import { CVUploader } from '@/components/CVUploader';
import { JobOfferInput } from '@/components/JobOfferInput';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DownloadButton } from '@/components/DownloadButton';
import { ResultPreview } from '@/components/ResultPreview';
import { AppState, GeneratedATSCV, CVData, OutputLanguage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Sparkles, Globe, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [state, setState] = useState<AppState>({
    step: 'input',
    jobOffer: '',
    outputLanguage: 'es',
    cvFile: null,
    extractedCV: null,
    generatedCV: null,
    error: null,
    progress: 0,
    progressMessage: '',
  });

  const isReadyToProcess = state.jobOffer.trim().length > 50 && state.cvFile !== null;

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleProcess = async () => {
    if (!state.cvFile || !state.jobOffer.trim()) return;

    updateState({ step: 'processing', error: null, progress: 10, progressMessage: 'Leyendo tu CV...' });

    try {
      const formData = new FormData();
      formData.append('cv', state.cvFile);

      const extractRes = await fetch('/api/extract-cv', { method: 'POST', body: formData });
      const extractData = await extractRes.json();

      if (!extractRes.ok) throw new Error(extractData.error);

      const cvData: CVData = extractData.cvData;
      updateState({ extractedCV: cvData, progress: 45, progressMessage: 'Analizando la oferta laboral...' });

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobOfferText: state.jobOffer,
          outputLanguage: state.outputLanguage,
        }),
      });
      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      const generatedCV: GeneratedATSCV = analyzeData.generatedCV;
      updateState({ generatedCV, step: 'result', progress: 100, progressMessage: '¡Listo!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      updateState({ step: 'input', error: message, progress: 0 });
    }
  };

  const handleDownloadPDF = async () => {
    if (!state.generatedCV) return;

    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generatedCV: state.generatedCV }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(typeof data.error === 'string' ? data.error : 'Error generating PDF');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_ATS_${state.generatedCV.personalInfo.fullName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setState({
      step: 'input',
      jobOffer: '',
      outputLanguage: 'es',
      cvFile: null,
      extractedCV: null,
      generatedCV: null,
      error: null,
      progress: 0,
      progressMessage: '',
    });
  };

  const es = state.outputLanguage === 'es';

  return (
    <main className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CV Craft ATS</h1>
            <p className="text-xs text-gray-500">Job-Aligned Resume Generator</p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {state.step === 'result' && state.generatedCV ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {es ? '✅ CV ATS Generado' : '✅ ATS CV Generated'}
                </h2>
                <p className="text-sm text-gray-500">
                  {es ? 'Tu CV ha sido optimizado para la oferta laboral' : 'Your CV has been optimized for the job offer'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset}>
                  {es ? 'Nuevo CV' : 'New CV'}
                </Button>
                <DownloadButton onClick={handleDownloadPDF} outputLanguage={state.outputLanguage} />
              </div>
            </div>
            <ResultPreview generatedCV={state.generatedCV} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    {es ? 'Oferta Laboral' : 'Job Offer'}
                  </CardTitle>
                  <CardDescription>
                    {es
                      ? 'Pega aquí el texto completo de la oferta laboral (inglés o español)'
                      : 'Paste the complete job offer text here (English or Spanish)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <JobOfferInput
                    value={state.jobOffer}
                    onChange={(jobOffer) => updateState({ jobOffer })}
                    disabled={state.step === 'processing'}
                    outputLanguage={state.outputLanguage}
                  />
                </CardContent>
              </Card>

              <LanguageSelector
                value={state.outputLanguage}
                onChange={(outputLanguage: OutputLanguage) => updateState({ outputLanguage })}
                disabled={state.step === 'processing'}
              />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    {es ? 'Tu CV Actual (PDF)' : 'Your Current CV (PDF)'}
                  </CardTitle>
                  <CardDescription>
                    {es
                      ? 'Sube tu CV en PDF. Cualquier formato: ATS, moderno, con imágenes, escaneado.'
                      : 'Upload your CV in PDF. Any format: ATS, modern, with images, scanned.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CVUploader
                    onFileSelect={(file) => updateState({ cvFile: file })}
                    selectedFile={state.cvFile}
                    disabled={state.step === 'processing'}
                  />
                </CardContent>
              </Card>

              {state.error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Error</p>
                    <p className="text-sm text-red-600">{state.error}</p>
                  </div>
                </div>
              )}

              {state.step === 'processing' && (
                <Card className="border-blue-100 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-700">{state.progressMessage}</span>
                      </div>
                      <Progress value={state.progress} className="h-2" />
                      <p className="text-xs text-blue-500 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {es
                          ? 'Claude está analizando y optimizando tu CV...'
                          : 'Claude is analyzing and optimizing your CV...'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleProcess}
                disabled={!isReadyToProcess || state.step === 'processing'}
                className="w-full py-6 text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
              >
                {state.step === 'processing' ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    {es ? 'Generando CV ATS...' : 'Generating ATS CV...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {es ? 'Generar mi CV ATS' : 'Generate my ATS CV'}
                  </>
                )}
              </Button>

              {!isReadyToProcess && state.step === 'input' && (
                <p className="text-xs text-center text-gray-400">
                  {es
                    ? 'Completa la oferta laboral y sube tu CV para continuar'
                    : 'Complete the job offer and upload your CV to continue'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
