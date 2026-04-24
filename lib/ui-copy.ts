import type { UILocale } from '@/lib/format-api-error';

export function getUiCopy(ui: UILocale) {
  const es = ui === 'es';
  return {
    appTitle: 'CV Craft ATS',
    appSubtitle: es ? 'Generador de CV alineado a ofertas laborales' : 'Job-aligned resume generator',
    uiLangLabel: es ? 'Idioma de la app' : 'App language',
    disclaimerLink: es ? 'Aviso legal' : 'Legal notice',
    step1Title: es ? 'Oferta laboral' : 'Job offer',
    step1Desc: es
      ? 'Pega aquí el texto completo de la oferta laboral (inglés o español).'
      : 'Paste the complete job offer text here (English or Spanish).',
    step2Title: es ? 'Idioma del CV de salida' : 'Output CV language',
    step3Title: es ? 'Tu CV actual (PDF)' : 'Your current CV (PDF)',
    step3Desc: es
      ? 'Sube tu CV en PDF. Cualquier formato: ATS, moderno, con imágenes, escaneado.'
      : 'Upload your CV in PDF. Any format: ATS, modern, with images, scanned.',
    generateCta: es ? 'Generar mi CV ATS' : 'Generate my ATS CV',
    generatingCta: es ? 'Generando CV ATS…' : 'Generating ATS CV…',
    completeHint: es
      ? 'Completa la oferta laboral y sube tu CV para continuar'
      : 'Complete the job offer and upload your CV to continue',
    resultTitle: es ? 'CV ATS generado' : 'ATS CV generated',
    resultSubtitle: es
      ? 'Tu CV ha sido optimizado para la oferta laboral'
      : 'Your CV has been optimized for the job offer',
    newCv: es ? 'Nuevo CV' : 'New CV',
    progressReading: es ? 'Leyendo tu CV…' : 'Reading your CV…',
    progressAnalyzing: es ? 'Analizando la oferta laboral…' : 'Analyzing the job offer…',
    progressDone: es ? '¡Listo!' : 'Done!',
    analyzingFooter: (modelLabel: string) =>
      es
        ? `${modelLabel} está analizando y optimizando tu CV…`
        : `${modelLabel} is analyzing and optimizing your CV…`,
    disclaimerTitle: es ? 'Aviso importante' : 'Important notice',
    disclaimerIntro: es
      ? 'Esta aplicación es una herramienta de demostración y apoyo.'
      : 'This application is a demonstration and support tool.',
    disclaimerP1: es
      ? 'No sustituye asesoría profesional de carrera, reclutamiento ni revisión legal de contratos.'
      : 'It does not replace professional career advice, recruitment, or legal contract review.',
    disclaimerP2: es
      ? 'No garantizamos entrevistas, ofertas de trabajo ni resultados en sistemas ATS concretos. El contenido generado depende del PDF, de la oferta y del modelo de IA; revísalo siempre antes de enviarlo.'
      : 'We do not guarantee interviews, job offers, or results in any specific ATS. Generated content depends on your PDF, the job posting, and the AI model—always review it before sending.',
    disclaimerP3: es
      ? 'Trata los datos personales con cuidado: en esta demo no diseñamos almacenamiento persistente de tus archivos más allá de lo necesario para procesar la solicitud en el servidor; en despliegues propios, revisa tu política de privacidad.'
      : 'Handle personal data carefully: this demo is not designed for long-term storage of your files beyond what is needed to process the request on the server; if you self-host, define your own privacy policy.',
    disclaimerClose: es ? 'Entendido' : 'I understand',
    toastPdfFail: es ? 'No se pudo generar el PDF' : 'Could not generate PDF',
  };
}
