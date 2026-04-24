export type UILocale = 'es' | 'en';

/** When the server returned HTML or non-JSON (proxy error, crash page, wrong host, etc.). */
export function formatNonJsonResponseError(
  status: number,
  contentType: string | null,
  bodyPreview: string,
  uiEs: boolean,
  step: 'extract' | 'analyze'
): { title: string; description: string } {
  const stepHint =
    step === 'extract'
      ? uiEs
        ? 'al leer y extraer tu PDF'
        : 'while reading and extracting your PDF'
      : uiEs
        ? 'al analizar la oferta y generar el CV'
        : 'while analyzing the job and generating your CV';

  const techHint = uiEs
    ? 'Suele pasar cuando la ruta /api no llega a Next (sitio estático mal desplegado), el servidor devuelve una página HTML de error (502/504), falta configuración (variables de entorno, Redis, tiempo máximo de función), o un proxy delante devuelve HTML en lugar del JSON de la API.'
    : 'This usually means /api never reached your Next server (e.g. static export or wrong deploy), the platform returned an HTML error page (502/504), server config is missing (env vars, Redis, function timeout), or a proxy returned HTML instead of the API JSON.';

  const preview =
    bodyPreview.length > 0
      ? uiEs
        ? `Respuesta recibida (recorte): ${bodyPreview}`
        : `Response preview: ${bodyPreview}`
      : '';

  return {
    title: uiEs ? 'El servidor no devolvió JSON' : 'The server did not return JSON',
    description: uiEs
      ? `Ocurrió un problema ${stepHint}. HTTP ${status}${contentType ? ` · ${contentType}` : ''}. ${techHint}${preview ? ` ${preview}` : ''}`
      : `Something went wrong ${stepHint}. HTTP ${status}${contentType ? ` · ${contentType}` : ''}. ${techHint}${preview ? ` ${preview}` : ''}`,
  };
}


type ApiErrorBody = {
  error?: string;
  message?: string;
};

export function formatApiError(
  status: number,
  data: ApiErrorBody,
  uiEs: boolean
): { title: string; description: string } {
  const errCode = typeof data.error === 'string' ? data.error : '';
  const serverMessage = typeof data.message === 'string' ? data.message.trim() : '';

  if (errCode === 'rate_limit_exceeded' || status === 429) {
    const enBody =
      'Only a limited number of CV generations per day are allowed from the same connection, to prevent abuse and keep the service stable. This is not your fault—it is a site-wide cap. Please try again tomorrow. If you self-host, you can raise the limit with the RATE_LIMIT_IP_PER_DAY environment variable.';
    const esBody =
      'Solo se permiten unas pocas generaciones de CV al día desde la misma conexión, para evitar abusos y mantener el servicio estable. No es un fallo tuyo: es un tope del sitio. Vuelve a intentarlo mañana o, si administras esta instancia, puedes subir el cupo en la variable RATE_LIMIT_IP_PER_DAY.';
    if (uiEs) {
      return {
        title: 'Has llegado al límite de uso por hoy',
        description: serverMessage || esBody,
      };
    }
    return {
      title: "You've reached today's usage limit",
      description: enBody,
    };
  }

  if (errCode === 'service_unavailable' && status === 503) {
    return {
      title: uiEs ? 'Servicio temporalmente no disponible' : 'Service temporarily unavailable',
      description:
        serverMessage ||
        (uiEs
          ? 'El servicio no puede atender más solicitudes en este momento. Inténtalo más tarde.'
          : 'The service cannot take more requests right now. Please try again later.'),
    };
  }

  const raw =
    serverMessage ||
    (typeof data.error === 'string' && data.error !== 'rate_limit_exceeded' ? data.error : '');

  if (status === 400) {
    if (raw.includes('No CV file') || raw.toLowerCase().includes('no cv')) {
      return {
        title: uiEs ? 'Falta el archivo' : 'Missing file',
        description: uiEs ? 'Selecciona un PDF de CV antes de continuar.' : 'Select a CV PDF before continuing.',
      };
    }
    if (raw.toLowerCase().includes('pdf')) {
      return {
        title: uiEs ? 'Formato no válido' : 'Invalid format',
        description: uiEs ? 'El archivo debe ser un PDF.' : 'The file must be a PDF.',
      };
    }
  }

  if (status === 422 && raw.length > 0) {
    return {
      title: uiEs ? 'No pudimos leer el PDF' : "We couldn't read the PDF",
      description: raw,
    };
  }

  return {
    title: uiEs ? 'Algo salió mal' : 'Something went wrong',
    description:
      raw ||
      (uiEs
        ? 'Inténtalo de nuevo en unos minutos. Si el problema continúa, revisa la configuración del servidor (API keys, cuotas).'
        : 'Please try again in a few minutes. If it persists, check server configuration (API keys, quotas).'),
  };
}
