import Anthropic from '@anthropic-ai/sdk';
import OpenAI, { APIError } from 'openai';

/** Error del proveedor LLM con código HTTP para las rutas API. */
export class LlmHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'LlmHttpError';
    this.status = status;
  }
}

/**
 * Convierte errores del SDK OpenAI (OpenAI y Groq comparten el mismo tipo) en LlmHttpError.
 */
function mapOpenAiCompatibleApiError(err: unknown, brand: 'OpenAI' | 'Groq'): never {
  if (err instanceof APIError) {
    if (err.status === 401) {
      throw new LlmHttpError(401, `La clave de API de ${brand} no es válida o ha sido revocada.`);
    }
    if (err.status === 429) {
      const code = err.code;
      const quotaHint =
        code === 'insufficient_quota' ||
        err.type === 'insufficient_quota' ||
        (err.message && err.message.toLowerCase().includes('quota'));
      if (quotaHint) {
        throw new LlmHttpError(
          503,
          brand === 'OpenAI'
            ? 'OpenAI devolvió cuota insuficiente o sin facturación activa. Revisa facturación en https://platform.openai.com/account/billing o cambia LLM_PROVIDER (p. ej. groq o claude).'
            : 'Groq devolvió cuota o límite de uso agotado. Revisa tu plan en console.groq.com o cambia LLM_PROVIDER.'
        );
      }
      throw new LlmHttpError(
        429,
        `Demasiadas solicitudes a ${brand}. Espera un momento e inténtalo de nuevo.`
      );
    }
    if (err.status === 400) {
      throw new LlmHttpError(400, err.message || `Solicitud inválida a ${brand}.`);
    }
    throw new LlmHttpError(typeof err.status === 'number' ? err.status : 502, err.message || `Error de ${brand}.`);
  }
  throw err;
}

export type LlmProvider = 'claude' | 'groq' | 'openai';

/**
 * Proveedor activo:
 * - `claude` — Anthropic (por defecto)
 * - `groq` — Groq (API compatible OpenAI)
 * - `openai` — OpenAI Platform (GPT-4o, etc.)
 *
 * Variable: LLM_PROVIDER=claude | groq | openai
 */
export function getLlmProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER ?? 'claude').toLowerCase().trim();
  if (p === 'groq') return 'groq';
  if (p === 'openai') return 'openai';
  return 'claude';
}

/** Metadatos no sensibles para UI (etiqueta del modelo activo). */
export interface LlmClientMeta {
  provider: LlmProvider;
  model: string;
  /** Texto corto para mensajes de progreso, p. ej. "Claude Sonnet", "GPT-4o". */
  label: string;
}

function anthropicModelLabel(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 'Claude Opus';
  if (m.includes('haiku')) return 'Claude Haiku';
  if (m.includes('sonnet')) return 'Claude Sonnet';
  return `Claude (${model})`;
}

export function getLlmClientMeta(): LlmClientMeta {
  const provider = getLlmProvider();
  if (provider === 'groq') {
    const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
    return { provider, model, label: `Groq · ${model}` };
  }
  if (provider === 'openai') {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
    return { provider, model, label: `OpenAI · ${model}` };
  }
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
  return { provider, model, label: anthropicModelLabel(model) };
}

export function validateLlmEnv():
  | { ok: true }
  | { ok: false; message: string } {
  const provider = getLlmProvider();
  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY?.trim()) {
      return {
        ok: false,
        message: 'Falta GROQ_API_KEY en la configuración del servidor.',
      };
    }
    return { ok: true };
  }
  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        ok: false,
        message: 'Falta OPENAI_API_KEY en la configuración del servidor.',
      };
    }
    return { ok: true };
  }
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return {
      ok: false,
      message: 'Falta ANTHROPIC_API_KEY en la configuración del servidor.',
    };
  }
  return { ok: true };
}

async function completeWithClaude(prompt: string, maxTokens: number): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Respuesta inesperada del modelo (no es texto)');
  }
  return block.text;
}

async function completeWithGroq(prompt: string, maxTokens: number): Promise<string> {
  try {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.2,
    });
    const text = completion.choices[0]?.message?.content;
    if (text == null || text === '') {
      throw new Error('Respuesta vacía de Groq');
    }
    return text;
  } catch (err) {
    mapOpenAiCompatibleApiError(err, 'Groq');
  }
}

/**
 * OpenAI Chat Completions (mismo flujo que Claude: un prompt usuario → texto/JSON).
 * Usa `json_object` para reducir salidas con markdown; los prompts ya piden JSON.
 */
async function completeWithOpenAI(prompt: string, maxTokens: number): Promise<string> {
  try {
    const useJsonObject = (process.env.OPENAI_JSON_MODE ?? 'true').toLowerCase() !== 'false';
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o';

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.2,
      ...(useJsonObject ? { response_format: { type: 'json_object' as const } } : {}),
    });

    const text = completion.choices[0]?.message?.content;
    if (text == null || text === '') {
      throw new Error('Respuesta vacía de OpenAI');
    }
    return text;
  } catch (err) {
    mapOpenAiCompatibleApiError(err, 'OpenAI');
  }
}

/**
 * Una sola llamada de completado según LLM_PROVIDER.
 */
export async function completeLLM(prompt: string, maxTokens: number): Promise<string> {
  const provider = getLlmProvider();
  if (provider === 'groq') {
    return completeWithGroq(prompt, maxTokens);
  }
  if (provider === 'openai') {
    return completeWithOpenAI(prompt, maxTokens);
  }
  return completeWithClaude(prompt, maxTokens);
}
