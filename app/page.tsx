'use client';

import { useState, useEffect, useMemo } from 'react';
import { CVUploader } from '@/components/CVUploader';
import { JobOfferInput } from '@/components/JobOfferInput';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DownloadButton } from '@/components/DownloadButton';
import { ResultPreview } from '@/components/ResultPreview';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { UiLocaleSwitch } from '@/components/UiLocaleSwitch';
import { AppState, GeneratedATSCV, CVData, OutputLanguage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Sparkles, Globe, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { formatApiError } from '@/lib/format-api-error';
import type { UILocale } from '@/lib/format-api-error';
import { getUiCopy } from '@/lib/ui-copy';

type ExtractSuccess = { cvData: CVData };

export default function Home() {
  const [uiLocale, setUiLocale] = useState<UILocale>('es');
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [llmLabel, setLlmLabel] = useState('Claude');

  const t = useMemo(() => getUiCopy(uiLocale), [uiLocale]);

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

  useEffect(() => {
    document.documentElement.lang = uiLocale === 'es' ? 'es' : 'en';
  }, [uiLocale]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/llm-meta')
      .then((r) => r.json())
      .then((d: { label?: string }) => {
        if (!cancelled && typeof d.label === 'string' && d.label.trim()) {
          setLlmLabel(d.label.trim());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isReadyToProcess = state.jobOffer.trim().length > 50 && state.cvFile !== null;

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleProcess = async () => {
    if (!state.cvFile || !state.jobOffer.trim()) return;
    const uiEs = uiLocale === 'es';

    updateState({ step: 'processing', error: null, progress: 10, progressMessage: t.progressReading });

    try {
      const formData = new FormData();
      formData.append('cv', state.cvFile);

      const extractRes = await fetch('/api/extract-cv', { method: 'POST', body: formData });
      const extractJson = await extractRes.json();

      if (!extractRes.ok) {
        updateState({
          step: 'input',
          error: formatApiError(
            extractRes.status,
            extractJson as { error?: string; message?: string },
            uiEs
          ),
          progress: 0,
          progressMessage: '',
        });
        return;
      }

      const cvData = (extractJson as ExtractSuccess).cvData;
      updateState({ extractedCV: cvData, progress: 45, progressMessage: t.progressAnalyzing });

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobOfferText: state.jobOffer,
          outputLanguage: state.outputLanguage,
        }),
      });
      const analyzeJson = await analyzeRes.json();

      if (!analyzeRes.ok) {
        updateState({
          step: 'input',
          error: formatApiError(
            analyzeRes.status,
            analyzeJson as { error?: string; message?: string },
            uiEs
          ),
          progress: 0,
          progressMessage: '',
        });
        return;
      }

      const generatedCV: GeneratedATSCV = analyzeJson.generatedCV;
      updateState({ generatedCV, step: 'result', progress: 100, progressMessage: t.progressDone });
    } catch (err: unknown) {
      const desc =
        err instanceof Error
          ? err.message
          : uiEs
            ? 'Inténtalo de nuevo en un momento.'
            : 'Please try again in a moment.';
      updateState({
        step: 'input',
        error: {
          title: uiEs ? 'Error inesperado' : 'Unexpected error',
          description: desc,
        },
        progress: 0,
        progressMessage: '',
      });
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
      toast.error(typeof data.error === 'string' ? data.error : t.toastPdfFail);
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

  return (
    <main className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />
      <DisclaimerModal open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} uiLocale={uiLocale} />

      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-[min(90rem,calc(100vw-1.5rem))] mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-600 p-2.5 rounded-xl shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.appTitle}</h1>
              <p className="text-base text-gray-600 mt-0.5">{t.appSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 lg:justify-end">
            <UiLocaleSwitch
              label={t.uiLangLabel}
              value={uiLocale}
              onChange={setUiLocale}
              disabled={state.step === 'processing'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-base font-semibold border-gray-300"
              onClick={() => setDisclaimerOpen(true)}
            >
              <Info className="w-4 h-4 mr-2 shrink-0" />
              {t.disclaimerLink}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[min(90rem,calc(100vw-1.5rem))] mx-auto px-4 sm:px-6 py-8">
        {state.step === 'result' && state.generatedCV ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t.resultTitle}</h2>
                <p className="text-base text-gray-600 mt-1">{t.resultSubtitle}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="text-base font-semibold" onClick={handleReset}>
                  {t.newCv}
                </Button>
                <DownloadButton onClick={handleDownloadPDF} uiLocale={uiLocale} />
              </div>
            </div>
            <ResultPreview generatedCV={state.generatedCV} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-8">
              <Card className="text-base shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                      1
                    </span>
                    {t.step1Title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">{t.step1Desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <JobOfferInput
                    value={state.jobOffer}
                    onChange={(jobOffer) => updateState({ jobOffer })}
                    disabled={state.step === 'processing'}
                    uiLocale={uiLocale}
                  />
                </CardContent>
              </Card>

              <LanguageSelector
                value={state.outputLanguage}
                onChange={(outputLanguage: OutputLanguage) => updateState({ outputLanguage })}
                disabled={state.step === 'processing'}
                uiLocale={uiLocale}
              />
            </div>

            <div className="space-y-8">
              <Card className="text-base shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
                      3
                    </span>
                    {t.step3Title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">{t.step3Desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CVUploader
                    onFileSelect={(file) => updateState({ cvFile: file })}
                    selectedFile={state.cvFile}
                    disabled={state.step === 'processing'}
                    uiLocale={uiLocale}
                  />
                </CardContent>
              </Card>

              {state.error && (
                <div
                  className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm"
                  role="alert"
                >
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 min-w-0">
                    <p className="text-lg font-bold text-red-900">{state.error.title}</p>
                    <p className="text-base text-red-800 leading-relaxed">{state.error.description}</p>
                  </div>
                </div>
              )}

              {state.step === 'processing' && (
                <Card className="border-blue-100 bg-blue-50 text-base shadow-sm">
                  <CardContent className="pt-6 pb-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                        <span className="text-base font-semibold text-blue-900">{state.progressMessage}</span>
                      </div>
                      <Progress value={state.progress} className="h-2.5" />
                      <p className="text-sm sm:text-base text-blue-800 flex items-start gap-2 leading-relaxed">
                        <Globe className="w-5 h-5 shrink-0 mt-0.5" />
                        {t.analyzingFooter(llmLabel)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleProcess}
                disabled={!isReadyToProcess || state.step === 'processing'}
                className="w-full py-7 text-lg font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
              >
                {state.step === 'processing' ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    {t.generatingCta}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t.generateCta}
                  </>
                )}
              </Button>

              {!isReadyToProcess && state.step === 'input' && (
                <p className="text-sm sm:text-base text-center text-gray-500">{t.completeHint}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
