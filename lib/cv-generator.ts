/**
 * Helpers for Claude JSON responses and ATS CV generation flow.
 * Main orchestration lives in API routes; this module holds shared parsing utilities.
 */

export function parseModelJson<T>(text: string): T {
  let trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '');
  }
  return JSON.parse(trimmed) as T;
}
