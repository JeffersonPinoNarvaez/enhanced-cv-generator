import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type LlmProvider = 'claude' | 'groq';

/**
 * Proveedor activo: `claude` (Anthropic, de pago) o `groq` (tier gratuito con límites).
 * Variable: LLM_PROVIDER=claude | groq (por defecto: claude).
 */
export function getLlmProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER ?? 'claude').toLowerCase().trim();
  return p === 'groq' ? 'groq' : 'claude';
}

export function validateLlmEnv():
  | { ok: true }
  | { ok: false; message: string } {
  if (getLlmProvider() === 'groq') {
    if (!process.env.GROQ_API_KEY?.trim()) {
      return {
        ok: false,
        message: 'Falta GROQ_API_KEY en la configuración del servidor.',
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
}

/**
 * Una sola llamada de completado según LLM_PROVIDER.
 */
export async function completeLLM(prompt: string, maxTokens: number): Promise<string> {
  if (getLlmProvider() === 'groq') {
    return completeWithGroq(prompt, maxTokens);
  }
  return completeWithClaude(prompt, maxTokens);
}
